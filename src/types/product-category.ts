export interface ProductCategory {
  id: string;
  name: string;
  coverImage: string;
  coverVideo: string;
  description: string;
  displayOrder: number;
  isTopMenu: boolean;
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
}

export type IAddProductCategory = Pick<
  ProductCategory,
  | 'name'
  | 'coverImage'
  | 'coverVideo'
  | 'displayOrder'
  | 'description'
  | 'isFeatured'
  | 'isTopMenu'
  | 'metaTitle'
  | 'metaDescription'
>;
export type IUpdateProductCategory = Pick<
  ProductCategory,
  | 'name'
  | 'coverImage'
  | 'coverVideo'
  | 'displayOrder'
  | 'description'
  | 'isFeatured'
  | 'isTopMenu'
  | 'metaTitle'
  | 'metaDescription'
>;
