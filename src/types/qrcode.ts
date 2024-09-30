export interface QrCode {
  id: string;
  name: string;
  image: string;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export type IAddQrCode = Pick<QrCode, 'name' | 'image'>;
export type IUpdateQrCode = Pick<QrCode, 'name' | 'image'>;
