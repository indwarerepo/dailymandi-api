export interface Zone {
  id: string;
  zoneName: string;
  area: string;
  district: string;
  deliveryCharge: number;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
}

export type IAddZone = Pick<Zone, 'zoneName' | 'area' | 'district' | 'deliveryCharge'>;
export type IUpdateZone = Pick<Zone, 'zoneName' | 'area' | 'district' | 'deliveryCharge'>;
