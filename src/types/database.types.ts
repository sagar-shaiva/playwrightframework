export type CustomerRow = {
  CustomerId: string;
  CustomerName: string;
  CustomerType: string;
  Balance: number;
};

export type CustomerBalanceRow = {
  Balance: number;
};

export type TransactionRow = {
  TransactionId: string;
  TransactionType: string;
  Amount: number;
  BalanceBefore: number;
  BalanceAfter: number;
  Reason: string;
  TransactionDateTime: Date;
  CreatedBy: string;
};
