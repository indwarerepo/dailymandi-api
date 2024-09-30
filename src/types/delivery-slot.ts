export interface DeliverySlot {
  id: string;
  timeFrom?: number;
  timeTo?: string;
  displayContent?: string;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export type IAddDeliverySlot = Pick<DeliverySlot, 'timeFrom' | 'timeTo' | 'displayContent'>;
export type IUpdateDeliverySlot = Pick<DeliverySlot, 'timeFrom' | 'timeTo' | 'displayContent'>;
