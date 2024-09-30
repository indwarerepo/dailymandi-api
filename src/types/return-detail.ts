export interface ReturnDetail {
  id: string; // uuid
  returnId?: string; // uuid (optional)
  productId?: string; // uuid (optional)
  quantity?: number; // numeric (optional)
  orderPrice?: DoubleRange; // double precision (optional)
  subTotal?: DoubleRange; // double precision (optional)
  isTaxable?: boolean; // boolean (optional, default: false)
  taxRate?: DoubleRange; // double precision (optional)
  taxAmt?: DoubleRange; // double precision (optional)
  totalAmt?: DoubleRange; // double precision (optional)
  isSupplied?: boolean; // boolean (optional, default: false)
  isReturned?: boolean; // boolean (optional, default: false)
  returnedDateLimit?: Date; // timestamp without time zone (optional)
  returnedStatus?: boolean; // boolean (optional, default: false)
  returnedRemarks?: string; // character varying (optional)
  createdAt?: Date; // timestamp without time zone (optional, default: CURRENT_TIMESTAMP)
  createdBy: string; // uuid
  updatedAt?: Date; // timestamp without time zone (optional)
  updatedBy?: string; // uuid (optional)
  isActive?: boolean; // boolean (optional, default: true)
  softDelete?: boolean; // boolean (optional, default: false)
}

export type IAddReturnDetail = Pick<
  ReturnDetail,
  | 'returnId'
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
export type IUpdateReturnDetail = Pick<
  ReturnDetail,
  | 'returnId'
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
