export interface TaxMaster {
  id: string;
  taxHead: string;
  slab: string;
  percentage: number;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
}

export type IAddTaxMaster = Pick<TaxMaster, 'taxHead' | 'slab' | 'percentage'>;
export type IUpdateTaxMaster = Pick<TaxMaster, 'taxHead' | 'slab' | 'percentage'>;
