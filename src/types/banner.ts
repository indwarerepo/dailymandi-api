export interface Banner {
  id: string;
  name: string;
  subTitle: string;
  categoryId: string;
  image: string;
  remarks: string;
  //isHead: boolean;
  displayOrder: BigInteger;
  bannerType: bannerCategory;
  bannerDisplay: bannerPosition;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
}

export type bannerCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type bannerPosition = 'M' | 'W';

export type IAddBanner = Pick<
  Banner,
  'name' | 'subTitle' | 'categoryId' | 'remarks' | 'image' | 'bannerType' | 'bannerDisplay'
>;
export type IUpdateBanner = Pick<
  Banner,
  'name' | 'subTitle' | 'categoryId' | 'remarks' | 'image' | 'bannerType' | 'bannerDisplay'
>;
