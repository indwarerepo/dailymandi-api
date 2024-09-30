export interface UserTransaction {
  id: string;
  userId: string;
  orderId?: string;
  transactionType: boolean;
  amount?: DoubleRange;
  remarks?: string;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
}

export type IAddUserTransaction = Pick<
  UserTransaction,
  'userId' | 'transactionType' | 'orderId' | 'amount' | 'remarks'
>;
export type IUpdateUserTransaction = Pick<
  UserTransaction,
  'userId' | 'transactionType' | 'amount' | 'remarks'
>;
