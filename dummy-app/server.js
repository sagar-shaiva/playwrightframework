// Minimal zero-dependency static server for the dummy Banking Teller app.
// Used by Playwright's `webServer` so tests have a real target to run against.
const http = require("http");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { createCustomer, findCustomer, listCustomers, deleteCustomer, postTransaction } = require("./azureSqlDb");

const PORT = process.env.APP_PORT ? Number(process.env.APP_PORT) : 3100;
const ROOT = __dirname;
const USER_TYPES = ["SU", "BM", "BS", "BO", "E", "L", "LM", "MG", "T"];
const ENV_SUFFIXES = { qa: "QA", uat: "UAT", training: "TR" };
const CUSTOMERS = {
  1001: { name: "John Doe", balance: 5000 },
  1002: { name: "Jane Smith", balance: 12000 },
  1003: { name: "Acme Corporation", balance: 250000 },
};
const branchStates = new Map();
const branchTimers = new Map();
const TRANSACTION_REASONS = {
  deposit: [
    { code: "CASH_DEPOSIT", label: "Cash deposit" },
    { code: "CHEQUE_DEPOSIT", label: "Cheque deposit" },
    { code: "SALARY_CREDIT", label: "Salary credit" },
    { code: "TRANSFER_IN", label: "Transfer received" },
    { code: "REFUND", label: "Refund" },
  ],
  withdraw: [
    { code: "CASH_WITHDRAWAL", label: "Cash withdrawal" },
    { code: "BILL_PAYMENT", label: "Bill payment" },
    { code: "TRANSFER_OUT", label: "Transfer sent" },
    { code: "SERVICE_FEE", label: "Service fee" },
    { code: "LOAN_REPAYMENT", label: "Loan repayment" },
  ],
};

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function readSession(req) {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("teller_session="));

  if (!cookie) return null;

  try {
    return JSON.parse(Buffer.from(cookie.slice("teller_session=".length), "base64url").toString("utf8"));
  } catch (_error) {
    return null;
  }
}

function getRole(session) {
  return String(session?.userId || "")
    .toUpperCase()
    .split("_")[1];
}

function getBranchKey(environment, country) {
  return `${String(environment).toLowerCase()}:${String(country).toUpperCase()}`;
}

function getNextBranchCloseTime() {
  const now = new Date();
  const closeAt = new Date(now);
  closeAt.setHours(23, 0, 0, 0);
  if (closeAt <= now) closeAt.setDate(closeAt.getDate() + 1);
  return closeAt;
}

function scheduleBranchClose(environment, country, state) {
  const key = getBranchKey(environment, country);
  clearTimeout(branchTimers.get(key));
  branchTimers.set(
    key,
    setTimeout(
      () => {
        state.isOpen = false;
        state.autoCloseAt = null;
        branchTimers.delete(key);
      },
      Math.max(0, new Date(state.autoCloseAt).getTime() - Date.now()),
    ),
  );
}

function getBranchState(environment, country) {
  const key = getBranchKey(environment, country);
  if (!branchStates.has(key)) {
    const state = { isOpen: true, autoCloseAt: getNextBranchCloseTime().toISOString() };
    branchStates.set(key, state);
    scheduleBranchClose(environment, country, state);
  }
  return branchStates.get(key);
}

function openBranch(environment, country) {
  const state = getBranchState(environment, country);
  state.isOpen = true;
  state.autoCloseAt = getNextBranchCloseTime().toISOString();
  scheduleBranchClose(environment, country, state);
  return state;
}

function closeBranch(environment, country) {
  const key = getBranchKey(environment, country);
  const state = getBranchState(environment, country);
  clearTimeout(branchTimers.get(key));
  branchTimers.delete(key);
  state.isOpen = false;
  state.autoCloseAt = null;
  return state;
}

function mapDummyCustomer(customerId) {
  const customer = CUSTOMERS[customerId];
  return customer ? { customerId, name: customer.name, type: "Test", balance: customer.balance, source: "dummy" } : null;
}

function getDummyCustomers() {
  return Object.keys(CUSTOMERS).map(mapDummyCustomer);
}

function sendStatementPdf(req, res, requestUrl) {
  const session = readSession(req);
  const customerId = requestUrl.searchParams.get("customerId");
  const customer = CUSTOMERS[customerId];

  if (!session) return sendJson(res, 401, { message: "Not authenticated" });
  if (!customer) return sendJson(res, 404, { message: "Customer not found" });

  const disposition = requestUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
  const fileName = `statement-${customerId}.pdf`;
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `${disposition}; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });

  const document = new PDFDocument({ size: "A4", margin: 50 });
  document.pipe(res);
  document.fontSize(20).text("Pacific Teller Account Statement");
  document.moveDown();
  document.fontSize(11).text(`Environment: ${session.env.toUpperCase()}`);
  document.text(`Country: ${session.country}`);
  document.text(`Customer ID: ${customerId}`);
  document.text(`Customer: ${customer.name}`);
  document.text(`Current balance: ${customer.balance.toFixed(2)}`);
  document.moveDown();
  document.fontSize(14).text("Recent transactions");
  document.moveDown(0.5);
  document.fontSize(10).text("28-10-2026  Deposit                 500.00");
  document.text("27-10-2026  Withdrawal              200.00");
  document.text("26-10-2026  Opening balance        4700.00");
  document.end();
}

async function handleApi(req, res, requestUrl) {
  const urlPath = requestUrl.pathname;

  if (urlPath === "/api/branch") {
    const session = readSession(req);
    if (!session) {
      sendJson(res, 401, { message: "Not authenticated" });
      return true;
    }
    if (!["SU", "BM"].includes(getRole(session))) {
      sendJson(res, 403, { message: "Only SU and BM users can manage the branch" });
      return true;
    }

    if (req.method === "GET") {
      sendJson(res, 200, getBranchState(session.env, session.country));
      return true;
    }

    if (req.method === "POST") {
      const { action } = await readJson(req);
      if (action === "open") {
        sendJson(res, 200, { ...openBranch(session.env, session.country), message: "Branch opened" });
        return true;
      }
      if (action === "close") {
        sendJson(res, 200, { ...closeBranch(session.env, session.country), message: "Branch closed" });
        return true;
      }
      sendJson(res, 400, { message: "Branch action must be open or close" });
      return true;
    }
  }

  if (urlPath === "/api/customers") {
    const session = readSession(req);
    if (!session) {
      sendJson(res, 401, { message: "Not authenticated" });
      return true;
    }

    const customerId = requestUrl.searchParams.get("customerId")?.trim();

    try {
      if (req.method === "POST") {
        if (getRole(session) !== "SU") {
          sendJson(res, 403, { message: "Only SU users can create customers" });
          return true;
        }
        const customer = await readJson(req);
        const balance = Number(customer.balance);
        if (!customer.name?.trim() || !customer.type?.trim() || !Number.isFinite(balance) || balance < 0) {
          sendJson(res, 400, { message: "Customer name, type, and a valid balance are required" });
          return true;
        }

        const created = await createCustomer(session.env, session.country, {
          name: customer.name.trim(),
          type: customer.type.trim(),
          balance,
        });
        sendJson(res, 201, created);
        return true;
      }

      if (req.method === "GET") {
        if (!customerId && requestUrl.searchParams.has("page")) {
          const page = Math.max(1, Number.parseInt(requestUrl.searchParams.get("page"), 10) || 1);
          const pageSize = 20;
          const dummyCustomers = getDummyCustomers();
          const offset = (page - 1) * pageSize;
          const pageDummyCustomers = dummyCustomers.slice(offset, offset + pageSize);
          const databaseOffset = Math.max(0, offset - dummyCustomers.length);
          const databaseLimit = pageSize - pageDummyCustomers.length;
          const databaseResult = databaseLimit > 0 ? await listCustomers(session.env, session.country, databaseOffset, databaseLimit) : { total: 0, customers: [] };
          sendJson(res, 200, {
            customers: [...pageDummyCustomers, ...databaseResult.customers],
            page,
            pageSize,
            total: dummyCustomers.length + databaseResult.total,
            totalPages: Math.max(1, Math.ceil((dummyCustomers.length + databaseResult.total) / pageSize)),
          });
          return true;
        }
        if (!customerId) {
          sendJson(res, 400, { message: "Customer ID is required" });
          return true;
        }
        const dummyCustomer = mapDummyCustomer(customerId);
        const customer = dummyCustomer || (await findCustomer(session.env, session.country, customerId));
        sendJson(res, customer ? 200 : 404, customer || { message: "Customer not found" });
        return true;
      }

      if (req.method === "DELETE") {
        if (getRole(session) !== "SU") {
          sendJson(res, 403, { message: "Only SU users can delete customers" });
          return true;
        }
        if (!customerId) {
          sendJson(res, 400, { message: "Customer ID is required" });
          return true;
        }
        const deleted = await deleteCustomer(session.env, session.country, customerId);
        sendJson(res, deleted ? 200 : 404, deleted ? { message: "Customer deleted" } : { message: "Customer not found" });
        return true;
      }
    } catch (error) {
      if (error.number === 2627 || error.number === 2601) {
        sendJson(res, 409, { message: "Customer ID already exists" });
        return true;
      }
      if (req.method === "GET" && error.message.includes("is not configured")) {
        if (requestUrl.searchParams.has("page")) {
          const customers = getDummyCustomers();
          sendJson(res, 200, { customers, page: 1, pageSize: 20, total: customers.length, totalPages: 1 });
          return true;
        }
        sendJson(res, 404, { message: "Customer not found" });
        return true;
      }
      console.error("Azure SQL customer operation failed:", error.message);
      sendJson(res, 503, { message: "Azure SQL is unavailable" });
      return true;
    }
  }

  if (req.method === "GET" && urlPath === "/api/transaction-reasons") {
    if (!readSession(req)) {
      sendJson(res, 401, { message: "Not authenticated" });
      return true;
    }
    sendJson(res, 200, TRANSACTION_REASONS);
    return true;
  }

  if (req.method === "POST" && urlPath === "/api/transactions") {
    const session = readSession(req);
    if (!session) {
      sendJson(res, 401, { message: "Not authenticated" });
      return true;
    }
    if (getRole(session) !== "T") {
      sendJson(res, 403, { message: "Only Teller users can post transactions" });
      return true;
    }

    try {
      const transaction = await readJson(req);
      const customerId = transaction.customerId?.trim();
      const amount = Number(transaction.amount);
      if (!customerId || !TRANSACTION_REASONS[transaction.type] || !Number.isFinite(amount) || amount <= 0) {
        sendJson(res, 400, { message: "Customer ID, transaction type, and a valid amount are required" });
        return true;
      }
      const reason = TRANSACTION_REASONS[transaction.type].find((item) => item.code === transaction.reasonCode);
      if (!reason) {
        sendJson(res, 400, { message: "Select a valid reason for this transaction" });
        return true;
      }

      const dummyCustomer = CUSTOMERS[customerId];
      if (dummyCustomer) {
        if (transaction.type === "withdraw" && amount > dummyCustomer.balance) {
          sendJson(res, 400, { message: "Insufficient funds for this withdrawal" });
          return true;
        }
        const balance = dummyCustomer.balance + (transaction.type === "withdraw" ? -amount : amount);
        sendJson(res, 200, {
          message: "Transaction is successful",
          customer: { ...mapDummyCustomer(customerId), balance },
        });
        return true;
      }

      const posted = await postTransaction(session.env, session.country, customerId, {
        type: transaction.type,
        amount,
        reasonCode: reason.code,
        reason: reason.label,
        createdBy: session.userId,
      });
      sendJson(res, 200, { message: "Transaction is successful", ...posted });
      return true;
    } catch (error) {
      const status = error.message === "Customer not found" ? 404 : error.message === "Insufficient funds for this withdrawal" ? 400 : 503;
      if (status === 503) console.error("Azure SQL transaction failed:", error.message);
      sendJson(res, status, { message: status === 503 ? "Azure SQL is unavailable" : error.message });
      return true;
    }
  }

  if (req.method === "GET" && urlPath === "/api/statement.pdf") {
    sendStatementPdf(req, res, requestUrl);
    return true;
  }

  if (req.method === "POST" && urlPath === "/api/login") {
    const { userId = "", password = "", country = "", env = "" } = await readJson(req);
    const userParts = String(userId).toUpperCase().split("_");
    const envSuffix = ENV_SUFFIXES[String(env).toLowerCase()];
    const expectedBranch = envSuffix ? `BR${envSuffix}41` : "";

    if (!userId || !password) return sendJson(res, 400, { message: "Username and password are required" });
    if (password !== "Password1") return sendJson(res, 401, { message: "Invalid password" });
    if (userParts.length !== 3 || userParts[0] !== String(country).toUpperCase() || !USER_TYPES.includes(userParts[1]) || userParts[2] !== expectedBranch) {
      return sendJson(res, 401, { message: "Invalid username" });
    }
    if (!["SU", "BM"].includes(userParts[1]) && !getBranchState(env, country).isOpen) {
      return sendJson(res, 403, { message: "Branch not open" });
    }

    const session = Buffer.from(JSON.stringify({ userId, country, env })).toString("base64url");
    return sendJson(res, 200, { userId }, { "Set-Cookie": `teller_session=${session}; Path=/; HttpOnly; SameSite=Lax` });
  }

  if (req.method === "GET" && urlPath === "/api/session") {
    const session = readSession(req);
    return session ? sendJson(res, 200, session) : sendJson(res, 401, { message: "Not authenticated" });
  }

  if (req.method === "POST" && urlPath === "/api/logout") {
    return sendJson(res, 200, { success: true }, { "Set-Cookie": "teller_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" });
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let urlPath = decodeURIComponent(requestUrl.pathname);

  if (urlPath.startsWith("/api/")) {
    try {
      const handled = await handleApi(req, res, requestUrl);
      if (handled === false) sendJson(res, 404, { message: "Not found" });
    } catch (_error) {
      sendJson(res, 400, { message: "Invalid request" });
    }
    return;
  }

  const resource = path.basename(urlPath);

  if (urlPath === "/" || resource.startsWith("access-") || resource.startsWith("login-")) {
    urlPath = "/login.html";
  } else if (resource.startsWith("customer-")) {
    urlPath = "/customer.html";
  } else if (resource.startsWith("transaction-")) {
    urlPath = "/transaction.html";
  } else if (resource.startsWith("statement-")) {
    urlPath = "/statement.html";
  } else if (["styles.css", "site.js"].includes(resource)) {
    urlPath = `/${resource}`;
  }

  const filePath = path.normalize(path.join(ROOT, urlPath));
  // Prevent path traversal outside the app root.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Dummy Banking Teller app running at http://localhost:${PORT}`);
});
