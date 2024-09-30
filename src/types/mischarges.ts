export interface MisCharge {
  id: string;
  defaultDiscountRate: number;
  specialDiscountRate?: number;
  defaultTaxRate?: number;
  specialTaxRate?: number;
  defaultDeliveryCharge?: number;
  specialDeliveryRate?: number;
  welcomeWalletAmt?: number;
  walletDeductionRateOnOrder?: number;
  orderReturnCommRateOA?: number;
  orderReturnCommRateNOA?: number;
  refByAddCommRate?: number;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export type IAddMisCharge = Pick<
  MisCharge,
  | 'defaultDiscountRate'
  | 'specialDiscountRate'
  | 'defaultTaxRate'
  | 'specialTaxRate'
  | 'defaultDeliveryCharge'
  | 'specialDeliveryRate'
  | 'welcomeWalletAmt'
  | 'walletDeductionRateOnOrder'
  | 'orderReturnCommRateOA'
  | 'orderReturnCommRateNOA'
  | 'refByAddCommRate'
>;
export type IUpdateMisCharge = Pick<
  MisCharge,
  | 'defaultDiscountRate'
  | 'specialDiscountRate'
  | 'defaultTaxRate'
  | 'specialTaxRate'
  | 'defaultDeliveryCharge'
  | 'specialDeliveryRate'
  | 'welcomeWalletAmt'
  | 'walletDeductionRateOnOrder'
  | 'orderReturnCommRateOA'
  | 'orderReturnCommRateNOA'
  | 'refByAddCommRate'
>;
