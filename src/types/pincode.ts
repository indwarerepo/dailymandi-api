export interface Pincode {
  id: string;
  zoneId: string;
  pincode: number;
  area: string;
  district: string;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
}

export type IAddPincode = Pick<Pincode, 'zoneId' | 'pincode' | 'area' | 'district'>;
export type IUpdatePincode = Pick<Pincode, 'zoneId' | 'pincode' | 'area' | 'district'>;
