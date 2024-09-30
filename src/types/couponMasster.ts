export interface CouponMaster {
  id: string;
  name: string;
  couponCode: string;
  minOrderAmount: number;
  offerPercentage: number;
  couponValidity: number;
  useLimit: number;
  startDate: Date;
  expiredDate: Date;
  description: string;
  policy: string;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export type IAddCouponMaster = Pick<
  CouponMaster,
  | 'name'
  | 'couponCode'
  | 'minOrderAmount'
  | 'offerPercentage'
  | 'couponValidity'
  | 'useLimit'
  | 'startDate'
  | 'expiredDate'
  | 'description'
  | 'policy'
>;
export type IUpdateCouponMaster = Pick<
  CouponMaster,
  | 'name'
  | 'couponCode'
  | 'minOrderAmount'
  | 'offerPercentage'
  | 'couponValidity'
  | 'useLimit'
  | 'startDate'
  | 'expiredDate'
  | 'description'
  | 'policy'
>;
