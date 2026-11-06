(function () {
  "use strict";

  var CUSTOMERS = {
    1001: { name: "John Doe", balance: 5000 },
    1002: { name: "Jane Smith", balance: 12000 },
    1003: { name: "Acme Corporation", balance: 250000 },
  };
  var pathParts = location.pathname.split("/").filter(Boolean);
  var env = (pathParts[0] || "qa").toLowerCase();
  var country = (pathParts[1] || "FJ").toUpperCase();
  var currentPage = document.body.dataset.page;
  var HOST_FAILURE_MESSAGE = "Host communication failure. Please try again.";

  window.addEventListener("teller:service-failure", function () {
    alert(HOST_FAILURE_MESSAGE);
  });

  function $(id) {
    return document.getElementById(id);
  }
  function pageUrl(page) {
    var token = Math.random().toString(36).slice(2, 10);
    return "/" + env + "/" + country + "/" + page + "-" + token;
  }
  function statementUrl(customerId, closeAfterPrint) {
    return pageUrl("statement") + "?customerId=" + encodeURIComponent(customerId) + "&print=1&closeAfterPrint=" + (closeAfterPrint ? "1" : "0");
  }
  function pdfUrl(customerId, download) {
    return "/api/statement.pdf?customerId=" + encodeURIComponent(customerId) + (download ? "&download=1" : "");
  }
  async function readAuth() {
    try {
      var response = await fetch("/api/session", { cache: "no-store" });
      return response.ok ? response.json() : null;
    } catch (_error) {
      return null;
    }
  }
  async function login() {
    var userId = $("username").value.trim();
    var password = $("password").value;
    $("loginError").classList.add("hidden");
    if (!userId || !password) return showError("Username and password are required");

    var response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId, password: password, country: country, env: env }),
    });

    if (!response.ok) {
      var error = await response.json();
      return showError(error.message);
    }

    location.href = pageUrl("customer");
  }
  function showError(message) {
    $("loginError").textContent = message;
    $("loginError").classList.remove("hidden");
    alert(message);
  }
  async function requireAuth() {
    var auth = await readAuth();
    if (!auth || auth.country !== country || auth.env !== env || !auth.userId) {
      location.replace(pageUrl("login"));
      return null;
    }
    return auth;
  }
  function initialiseShell(auth) {
    $("welcomeUser").textContent = "Welcome, " + auth.userId;
    $("envLabel").textContent = env.toUpperCase();
    $("countryLabel").textContent = country;
    $("navCustomer").href = pageUrl("customer");
    $("navTransaction").href = pageUrl("transaction");
    $("logoutBtn").addEventListener("click", async function () {
      await fetch("/api/logout", { method: "POST" });
      sessionStorage.removeItem("selectedCustomerId");
      location.href = pageUrl("login");
    });
  }
  function renderBranchState(state) {
    $("branchState").textContent = state.isOpen ? "Open" : "Closed";
    $("branchState").classList.toggle("open", state.isOpen);
    $("branchState").classList.toggle("closed", !state.isOpen);
    $("branchSchedule").textContent = state.isOpen && state.autoCloseAt ? "Automatic close: " + new Date(state.autoCloseAt).toLocaleString() : "Open the branch to allow other profiles to sign in.";
    $("openBranchBtn").disabled = state.isOpen;
    $("closeBranchBtn").disabled = !state.isOpen;
  }
  async function branchApi(action) {
    var response = await fetch("/api/branch", {
      method: action ? "POST" : "GET",
      headers: action ? { "Content-Type": "application/json" } : undefined,
      body: action ? JSON.stringify({ action: action }) : undefined,
    });
    var result = await response.json();
    if (!response.ok) throw new Error(result.message || "Branch operation failed");
    return result;
  }
  async function updateBranch(action) {
    try {
      var state = await branchApi(action);
      renderBranchState(state);
      if (state.message) {
        $("branchMessage").textContent = state.message;
        $("branchMessage").classList.remove("hidden", "error");
        $("branchMessage").classList.add("success");
        alert(state.message);
      }
    } catch (error) {
      $("branchMessage").textContent = error.message;
      $("branchMessage").classList.remove("hidden", "success");
      $("branchMessage").classList.add("error");
      alert(error.message);
    }
  }
  function initialiseBranch(auth) {
    var role = auth.userId.toUpperCase().split("_")[1];
    if (!["SU", "BM"].includes(role) || !$("branchPanel")) return;

    $("branchPanel").classList.remove("hidden");
    $("openBranchBtn").addEventListener("click", function () {
      updateBranch("open");
    });
    $("closeBranchBtn").addEventListener("click", function () {
      updateBranch("close");
    });
    updateBranch();
  }
  function showSummary(customer) {
    if (!customer) return;
    $("currentCustomer").textContent = customer.name;
    $("accountBalance").textContent = customer.balance.toFixed(2);
    $("accountSummary").classList.remove("hidden");
  }
  function showCustomerStatus(message, success) {
    $("customerStatus").textContent = message;
    $("customerStatus").classList.remove("hidden", "success", "error");
    $("customerStatus").classList.add(success ? "success" : "error");
  }
  async function customerApi(method, customerId, body) {
    var url = "/api/customers" + (customerId ? "?customerId=" + encodeURIComponent(customerId) : "");
    var response = await fetch(url, {
      method: method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    var result = await response.json();
    if (!response.ok) throw new Error(result.message || "Customer operation failed");
    return result;
  }
  var currentCustomerListPage = 1;
  async function loadCustomerList(page) {
    try {
      var response = await fetch("/api/customers?page=" + page, { cache: "no-store" });
      var result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to load customers");
      if (result.page > result.totalPages) return loadCustomerList(result.totalPages);

      currentCustomerListPage = result.page;
      $("customerTableBody").replaceChildren();
      result.customers.forEach(function (customer) {
        var row = document.createElement("tr");
        [customer.customerId, customer.name, customer.type].forEach(function (value) {
          var cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });
        $("customerTableBody").appendChild(row);
      });

      $("customerDirectory").classList.remove("hidden");
      $("customerTableEmpty").classList.toggle("hidden", result.customers.length > 0);
      $("customerCount").textContent = result.total + (result.total === 1 ? " customer" : " customers");
      $("customerPageInfo").textContent = "Page " + result.page + " of " + result.totalPages;
      $("previousCustomersBtn").disabled = result.page <= 1;
      $("nextCustomersBtn").disabled = result.page >= result.totalPages;
    } catch (error) {
      showCustomerStatus(error.message, false);
    }
  }
  function refreshCustomerList() {
    if (!$("customerDirectory").classList.contains("hidden")) loadCustomerList(currentCustomerListPage);
  }
  async function createCustomer() {
    try {
      var customer = await customerApi("POST", undefined, {
        name: $("customerNameInput").value.trim(),
        type: $("customerTypeInput").value,
        balance: $("customerBalanceInput").value,
      });
      $("customerId").value = customer.customerId;
      showFoundCustomer(customer);
      showCustomerStatus("Customer created: " + customer.customerId, true);
      refreshCustomerList();
    } catch (error) {
      showCustomerStatus(error.message, false);
    }
  }
  async function deleteCustomer() {
    try {
      var result = await customerApi("DELETE", $("customerId").value.trim());
      clearCustomerResult();
      showCustomerStatus(result.message, true);
      refreshCustomerList();
    } catch (error) {
      showCustomerStatus(error.message, false);
    }
  }
  function clearCustomerResult() {
    $("customerName").textContent = "";
    $("accountSummary").classList.add("hidden");
    $("statementActions").classList.add("hidden");
    sessionStorage.removeItem("selectedCustomerId");
  }
  function showFoundCustomer(customer) {
    sessionStorage.setItem("selectedCustomerId", customer.customerId);
    $("customerName").textContent = customer.name + " (ID: " + customer.customerId + ")";
    showSummary(customer);
    $("statementActions").classList.toggle("hidden", customer.source !== "dummy");
  }
  async function searchCustomer() {
    $("customerError").classList.add("hidden");
    try {
      var customer = await customerApi("GET", $("customerId").value.trim());
      showFoundCustomer(customer);
    } catch (error) {
      clearCustomerResult();
      $("customerError").textContent = error.message;
      $("customerError").classList.remove("hidden");
      alert(error.message);
    }
  }
  function initialiseCustomer(auth) {
    var selectedCustomerId;
    var role = auth.userId.toUpperCase().split("_")[1];

    if (role === "SU") {
      $("customerPageTitle").textContent = "Customer management";
      $("suCustomerFields").classList.remove("hidden");
      $("suCustomerActions").classList.remove("hidden");
      $("suDeleteAction").classList.remove("hidden");
      $("customerIdPurpose").classList.remove("hidden");
      $("createCustomerBtn").addEventListener("click", createCustomer);
      $("deleteCustomerBtn").addEventListener("click", deleteCustomer);
    }

    $("viewStatementBtn").addEventListener("click", function () {
      window.open(pdfUrl(selectedCustomerId, false), "_blank");
    });
    $("printToPdfBtn").addEventListener("click", function () {
      window.open(pdfUrl(selectedCustomerId, false), "_blank", "popup=yes,width=1200,height=900");
    });
    $("downloadPdfBtn").addEventListener("click", function () {
      var link = document.createElement("a");
      link.href = pdfUrl(selectedCustomerId, true);
      link.click();
    });
    $("printStatementBtn").addEventListener("click", function () {
      window.open(statementUrl(selectedCustomerId, true), "_blank", "popup=yes,width=1200,height=900");
    });
    $("printNoCloseBtn").addEventListener("click", function () {
      window.open(statementUrl(selectedCustomerId, false), "_blank", "popup=yes,width=1200,height=900");
    });

    $("searchCustomerBtn").addEventListener("click", async function () {
      await searchCustomer();
      selectedCustomerId = sessionStorage.getItem("selectedCustomerId");
    });
    $("searchAllCustomersBtn").addEventListener("click", function () {
      loadCustomerList(1);
    });
    $("previousCustomersBtn").addEventListener("click", function () {
      loadCustomerList(currentCustomerListPage - 1);
    });
    $("nextCustomersBtn").addEventListener("click", function () {
      loadCustomerList(currentCustomerListPage + 1);
    });
  }
  function initialiseStatement() {
    var params = new URLSearchParams(location.search);
    var customerId = params.get("customerId");
    var customer = CUSTOMERS[customerId];

    if (!customer) {
      location.replace(pageUrl("customer"));
      return;
    }

    $("statementCustomerId").textContent = customerId;
    $("statementCustomerName").textContent = customer.name;
    $("statementBalance").textContent = customer.balance.toFixed(2);

    if (params.get("print") === "1") {
      setTimeout(function () {
        if (params.get("closeAfterPrint") === "1") {
          window.addEventListener(
            "afterprint",
            function () {
              window.close();
            },
            { once: true },
          );
        }
        window.print();
      }, 0);
    }
  }
  function setStatus(message, success) {
    $("txnStatus").textContent = message;
    $("txnStatus").classList.remove("hidden");
    $("txnStatus").classList.toggle("success", success);
    $("txnStatus").classList.toggle("error", !success);
    alert(message);
  }
  async function initialiseTransaction(auth) {
    var role = auth.userId.toUpperCase().split("_")[1];
    if (role !== "T") {
      $("submitTxnBtn").disabled = true;
      return setStatus("Only Teller users can post transactions", false);
    }
    var customerId = sessionStorage.getItem("selectedCustomerId");
    var customer;
    var reasons = {};
    try {
      var reasonResponse = await fetch("/api/transaction-reasons", { cache: "no-store" });
      if (!reasonResponse.ok) throw new Error();
      reasons = await reasonResponse.json();
    } catch (_error) {
      return setStatus("Unable to load transaction reasons", false);
    }
    function renderReasons() {
      $("txnReason").replaceChildren();
      (reasons[$("txnType").value] || []).forEach(function (reason) {
        var option = document.createElement("option");
        option.value = reason.code;
        option.textContent = reason.label;
        $("txnReason").appendChild(option);
      });
    }
    renderReasons();
    $("txnType").addEventListener("change", renderReasons);
    if (customerId) {
      try {
        customer = await customerApi("GET", customerId);
        showSummary(customer);
      } catch (_error) {
        customer = null;
      }
    }
    $("submitTxnBtn").addEventListener("click", async function () {
      if (!customerId || !customer) return setStatus("Please search and select a customer first", false);
      var amount = parseFloat($("txnAmount").value);
      var type = $("txnType").value;
      if (isNaN(amount) || amount <= 0) return setStatus("Enter a valid amount greater than 0", false);
      try {
        $("txnReference").classList.add("hidden");
        var response = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId: customerId, type: type, amount: amount, reasonCode: $("txnReason").value }),
        });
        var result = await response.json();
        if (!response.ok) throw new Error(result.message);
        customer = result.customer;
        showSummary(customer);
        if (result.transactionId) {
          $("txnId").textContent = result.transactionId;
          $("txnReference").classList.remove("hidden");
        }
        setStatus(result.message, true);
      } catch (error) {
        setStatus(error.message || "Transaction failed", false);
      }
    });
    $("submitTxnBtn").disabled = false;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (currentPage === "login") {
      var existingAuth = await readAuth();
      if (existingAuth && existingAuth.country === country && existingAuth.env === env && existingAuth.userId) {
        location.replace(pageUrl("customer"));
        return;
      }
      $("loginCountry").textContent = country + " (" + env.toUpperCase() + ")";
      $("loginBtn").addEventListener("click", login);
      $("password").addEventListener("keydown", function (event) {
        if (event.key === "Enter") login();
      });
      return;
    }
    var auth = await requireAuth();
    if (!auth) return;
    initialiseShell(auth);
    initialiseBranch(auth);
    if (currentPage === "customer") initialiseCustomer(auth);
    if (currentPage === "transaction") initialiseTransaction(auth);
    if (currentPage === "statement") initialiseStatement();
  });
})();
