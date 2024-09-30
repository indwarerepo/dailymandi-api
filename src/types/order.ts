export type Order = {
  id: string;
  customerId: string;
  orderNumber: string;
  orderPrice: string;
  isCouponApplied: boolean;
  isCancelled: boolean;
  couponId?: string;
  orderStatusId: DoubleRange;
  driverId?: string;
  deliverySlotId?: string;
  driverAccepted?: number;
  discountedPrice: DoubleRange;
  subtotalPrice: DoubleRange;
  taxAmt: DoubleRange;
  deliveryAmt: DoubleRange;
  orderTotal: DoubleRange;
  orderTotalInWord: string;
  finYear: string;
  isWalletUsed: boolean;
  amountDeductionFromWallet: DoubleRange;
  payableAmount: DoubleRange;
  paidAmount: DoubleRange;
  dueAmount: DoubleRange;
  paymentStatus: boolean;
  paymentMethod: string;
  paymentDate: Date;
  dueDate: Date;
  orderType: string;
  deliveryAddress: string;
  deliveryPincode: string;
  deliveryState: string;
  deliveryCity: string;
  isReturn: boolean;
  deliveryOtp?: number;
  commissionDistributed: boolean;
  acceptedAt?: Date; // timestamp without time zone (optional)
  deliveredAt?: Date; // timestamp without time zone (optional)
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
  addressId: string;
  cartList: string[];
  deliveryAmount: DoubleRange;
};

export type IAddOrder = Pick<
  Order,
  'addressId' | 'deliverySlotId' | 'couponId' | 'isWalletUsed' | 'cartList'
>;
