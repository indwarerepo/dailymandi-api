export interface UserWallet {
  id: string;
  userId: string;
  upiId?: string;
  walletAmount?: number;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  bankName?: string;
  bankBranch?: string;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export type IAddUserWallet = Pick<
  UserWallet,
  | 'userId'
  | 'upiId'
  | 'walletAmount'
  | 'accountNumber'
  | 'ifscCode'
  | 'panNumber'
  | 'bankName'
  | 'bankBranch'
>;
export type IUpdateUserWallet = Pick<
  UserWallet,
  | 'userId'
  | 'upiId'
  | 'walletAmount'
  | 'accountNumber'
  | 'ifscCode'
  | 'panNumber'
  | 'bankName'
  | 'bankBranch'
>;
