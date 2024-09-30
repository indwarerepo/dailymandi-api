export interface OrderDetail {
  id: string; // uuid
  orderId: string; // uuid
  productId: string; // uuid
  quantity?: number; // numeric (optional)
  orderPrice?: DoubleRange; // double precision (optional)
  taxRate?: DoubleRange; // double precision (optional)
  taxAmt?: DoubleRange; // double precision (optional)
  totalAmt?: DoubleRange; // double precision (optional)
  isReturned?: boolean; // boolean (optional, default: false)
  isSupplied?: boolean; // boolean (optional, default: true)
  returnedStatus?: boolean; // boolean (optional, default: false)
  returnedRemarks?: string; // character varying (optional)
  returnedDateLimit?: Date; // timestamp without time zone (optional)
  createdAt?: Date; // timestamp without time zone (optional, default: CURRENT_TIMESTAMP)
  createdBy: string; // uuid
  updatedAt?: Date; // timestamp without time zone (optional)
  updatedBy?: string; // uuid (optional)
  isActive?: boolean; // boolean (optional, default: true)
  softDelete?: boolean; // boolean (optional, default: false)
}

export type IAddOrderDetail = Pick<
  OrderDetail,
  | 'orderId'
  | 'productId'
  | 'quantity'
  | 'orderPrice'
  | 'taxRate'
  | 'taxAmt'
  | 'totalAmt'
  | 'isReturned'
  | 'isSupplied'
  | 'returnedStatus'
  | 'returnedRemarks'
  | 'returnedDateLimit'
>;
export type IUpdateOrderDetail = Pick<
  OrderDetail,
  | 'orderId'
  | 'productId'
  | 'quantity'
  | 'orderPrice'
  | 'taxRate'
  | 'taxAmt'
  | 'totalAmt'
  | 'isReturned'
  | 'isSupplied'
  | 'returnedStatus'
  | 'returnedRemarks'
  | 'returnedDateLimit'
>;
