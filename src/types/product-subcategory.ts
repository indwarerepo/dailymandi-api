export interface ProductSubCategory {
  id: string;
  categoryId: string;
  name: string;
  coverImage: string;
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

export type IAddProductSubCategory = Pick<
  ProductSubCategory,
  'name' | 'categoryId' | 'coverImage' | 'description' | 'metaTitle' | 'metaDescription'
>;
export type IUpdateProductSubCategory = Pick<
  ProductSubCategory,
  'name' | 'categoryId' | 'coverImage' | 'description' | 'metaTitle' | 'metaDescription'
>;
