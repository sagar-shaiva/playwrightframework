import { z } from "zod";

const text = z.string().min(1);
const transaction = z.strictObject({ amount: z.number().positive(), reason: text });

// Every collection is keyed by a readable name; features and tests refer to items by that key.
export const testDataSchema = z.strictObject({
  password: text,
  users: z.record(z.string(), text),

  customers: z.record(z.string(), z.strictObject({ id: text, name: text, balance: z.number() })),
  unknownCustomers: z.record(z.string(), z.strictObject({ id: text })),
  newCustomers: z.record(z.string(), z.strictObject({ name: text, type: z.enum(["Retail", "Business"]), openingBalance: z.number().nonnegative() })),

  deposits: z.record(z.string(), transaction),
  withdrawals: z.record(z.string(), transaction),
  amountsAboveBalance: z.record(z.string(), z.number().positive()),
  invalidAmounts: z.record(z.string(), z.number().nonpositive()),
  depositReasons: z.record(z.string(), text),
  withdrawalReasons: z.record(z.string(), text),

  // Values stored in the TransactionType column of dbo.Transactions.
  transactionTypes: z.strictObject({ deposit: text, withdrawal: text }),

  invalidPasswords: z.record(z.string(), text),
  messages: z.record(z.string(), text),
});

export type TestData = z.infer<typeof testDataSchema>;
