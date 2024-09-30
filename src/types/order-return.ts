export interface OrderReturn {
  id: string; // uuid
  orderId: string; // uuid
  customerId: string; // uuid
  orderStatusId: string; // uuid
  orderStatusRecord: string[]; // uuid[] - array of UUIDs
  refundStatus?: boolean; // boolean (optional, default: false)
  isCancelled?: boolean; // boolean (optional, default: false)
  cancelledOn?: Date; // timestamp without time zone (optional)
  customerRemarks?: string; // character varying (optional)
  driverId?: string; // uuid (optional)
  driverAccepted?: boolean; // boolean (optional, default: false)
  acceptedOn?: Date; // timestamp without time zone (optional)
  isDelivered?: boolean; // boolean (optional, default: true)
  deliveredOn?: Date; // timestamp without time zone (optional)
  isReturn?: boolean; // boolean (optional, default: true)
  returnedOn?: Date; // timestamp without time zone (optional)
  deliveryOtp?: number;
  customerReturnRemarks?: string; // character varying (optional)
  createdAt?: Date; // timestamp without time zone (optional, default: CURRENT_TIMESTAMP)
  createdBy?: string; // uuid (optional)
  updatedAt?: Date; // timestamp without time zone (optional)
  updatedBy?: string; // uuid (optional)
  isActive?: boolean; // boolean (optional, default: true)
  softDelete?: boolean; // boolean (optional, default: false)
}

export type IAddOrderReturn = Pick<OrderReturn, 'orderId' | 'customerId'>;
