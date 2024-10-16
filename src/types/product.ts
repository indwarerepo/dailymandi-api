export type productVariant1 = {
  id: string;
  variantId: string;
  skuNo: string;
  purchaseCost: string;
  mrp: DoubleRange;
  sellingPrice: DoubleRange;
  offerPrice: DoubleRange;
  taxId: string;
  stock: number;
  isReturnable: boolean;
  returnDaysLimit: number;
  productImage: string;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
};
export type productInventory = {
  id: string;
  skuNo: string;
  totalStock: number;
  mrp: DoubleRange;
  costPrice: string;
  salesPrice: DoubleRange;
  batchNo: DoubleRange;
  manufacturingDate: Date;
  expiryDate: Date;
  methodFlag: boolean;
  availableQnt: number;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
};
export type productInventoryHistory = {
  id: string;
  batchId: string;
  previousStock: number;
  currentStock: number;
  changeStock: number;
  remarks: string;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
};
export type productV = {
  variantId: string;
  skuNo: string;
  taxId: string;
  offerPrice: DoubleRange;
  isReturnable: boolean;
  returnDaysLimit: number;
  productVariantImage: string[];
  qrCode: string;

  purchaseCost: DoubleRange;
  mrp: DoubleRange;
  sellingPrice: DoubleRange;
  stock: number;
  batchNo: string;
  manufacturingDate: Date;
  expiryDate: Date;
  remarks: string;
};
export interface Product {
  id: string;
  name: string;
  description: string;
  specification: string;
  manufacturer: number;
  productAttributes?: string;
  categoryId: string;
  subCategoryId: string;
  brandId: string;
  productVariant: productV[];
  productImage: string;
  isNewProduct: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  warrantyPolicy: string;
  paymentTerm: string;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: String;
}

export type IAddProduct = Pick<
  Product,
  | 'name'
  | 'description'
  | 'specification'
  | 'manufacturer'
  | 'categoryId'
  | 'subCategoryId'
  | 'brandId'
  | 'productImage'
  | 'isFeatured'
  | 'isNewProduct'
  | 'isBestSeller'
  | 'productVariant'
  | 'metaTitle'
  | 'metaDescription'
  | 'paymentTerm'
  | 'warrantyPolicy'
>;

export type productVariant = {
  productId: string;
  variantId: string;
  skuNo: string;
  taxId: string;
  offerPrice: DoubleRange;
  isReturnable: boolean;
  returnDaysLimit: number;
  commissionPercentage: number;
  productVariantImage: string[];
  qrCode: string;

  purchaseCost: DoubleRange;
  mrp: DoubleRange;
  sellingPrice: DoubleRange;
  stock: number;
  batchNo: string;
  manufacturingDate: Date;
  expiryDate: Date;
  remarks: string;
};
export type IAddProductVariant = Pick<
  productVariant,
  | 'productId'
  | 'variantId'
  | 'skuNo'
  | 'taxId'
  | 'offerPrice'
  | 'isReturnable'
  | 'returnDaysLimit'
  | 'productVariantImage'
  | 'qrCode'
  | 'purchaseCost'
  | 'mrp'
  | 'sellingPrice'
  | 'stock'
  | 'batchNo'
  | 'manufacturingDate'
  | 'expiryDate'
  | 'remarks'
>;
export type IUpdateProduct = Pick<
  Product,
  | 'name'
  | 'description'
  | 'specification'
  | 'manufacturer'
  | 'categoryId'
  | 'subCategoryId'
  | 'brandId'
  | 'productImage'
  | 'isFeatured'
  | 'isNewProduct'
  | 'isBestSeller'
  | 'productVariant'
  | 'metaTitle'
  | 'metaDescription'
  | 'paymentTerm'
  | 'warrantyPolicy'
>;
