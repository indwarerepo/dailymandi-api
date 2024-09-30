export interface DriverStatus {
  id: string;
  driverId?: string;
  orderId?: string;
  remarks?: string;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export type IAddDriverStatus = Pick<DriverStatus, 'driverId' | 'orderId' | 'remarks'>;
export type IUpdateDriverStatus = Pick<DriverStatus, 'driverId' | 'orderId' | 'remarks'>;
