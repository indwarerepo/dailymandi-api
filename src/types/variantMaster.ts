export interface VariantMaster {
  id: string;
  variantName: string;
  description: string;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
}

export type IAddVariantMaster = Pick<VariantMaster, 'variantName' | 'description'>;
export type IUpdateVariantMaster = Pick<VariantMaster, 'variantName' | 'description'>;
