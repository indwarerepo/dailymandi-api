export interface OrderStatus {
  id: string;
  statusTitle: string;
  remarks: string;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export type IAddOrderStatus = Pick<OrderStatus, 'statusTitle' | 'remarks'>;
export type IUpdateOrderStatus = Pick<OrderStatus, 'statusTitle' | 'remarks'>;
