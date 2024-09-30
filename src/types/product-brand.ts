export interface ProductBrand {
  id: string;
  name: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
}

export type IAddProductBrand = Pick<
  ProductBrand,
  'name' | 'description' | 'metaTitle' | 'metaDescription'
>;
export type IUpdateProductBrand = Pick<
  ProductBrand,
  'name' | 'description' | 'metaTitle' | 'metaDescription'
>;
