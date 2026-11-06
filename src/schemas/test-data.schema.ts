import { z } from "zod";

const userIdSchema = z.string().min(1);
const amountSchema = z.number().positive();

export const testDataSchema = z.strictObject({
  password: z.string().min(1),
  userIds: z.strictObject({
    SU: userIdSchema,
    BM: userIdSchema,
    BS: userIdSchema,
    BO: userIdSchema,
    E: userIdSchema,
    L: userIdSchema,
    LM: userIdSchema,
    MG: userIdSchema,
    T: userIdSchema,
  }),
  customers: z.strictObject({
    valid: z.strictObject({
      id: z.string().min(1),
      name: z.string().min(1),
      balance: z.number(),
    }),
    corporate: z.strictObject({
      id: z.string().min(1),
      name: z.string().min(1),
      balance: z.number(),
    }),
    invalid: z.strictObject({
      id: z.string().min(1),
    }),
  }),
  generatedCustomerFlow: z.strictObject({
    name: z.string().min(1),
    type: z.enum(["Retail", "Business"]),
    openingBalance: z.number().nonnegative(),
    depositAmount: amountSchema,
    depositReason: z.string().min(1),
    withdrawalAmount: amountSchema,
    withdrawalReason: z.string().min(1),
  }),
  transactions: z.strictObject({
    deposit: z.strictObject({
      amount: amountSchema,
      expectedBalance: z.number(),
      reason: z.string().min(1),
      reasons: z.array(z.string().min(1)).min(1),
      decimalAmount: amountSchema,
      databaseType: z.string().min(1),
    }),
    withdraw: z.strictObject({
      amount: amountSchema,
      expectedBalance: z.number(),
      reason: z.string().min(1),
      reasons: z.array(z.string().min(1)).min(1),
      overBalanceIncrement: amountSchema,
      databaseType: z.string().min(1),
    }),
    overdraft: z.strictObject({
      amount: amountSchema,
    }),
    invalidAmounts: z.array(z.number().nonpositive()).min(1),
    unselectedCustomerAmount: amountSchema,
  }),
  loginNegative: z.strictObject({
    wrongPassword: z.strictObject({
      password: z.string().min(1),
    }),
  }),
  expectedMessages: z.strictObject({
    invalidPassword: z.string().min(1),
    transactionSuccess: z.string().min(1),
    customerNotFound: z.string().min(1),
    customerRequired: z.string().min(1),
    invalidAmount: z.string().min(1),
    insufficientFunds: z.string().min(1),
    tellerRequired: z.string().min(1),
  }),
});

export type TestData = z.infer<typeof testDataSchema>;
