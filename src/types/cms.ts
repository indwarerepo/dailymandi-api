export interface Cms {
  id: string;
  name: string;
  cmsKey: string;
  description: string;
  url: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
}

export type IAddCms = Pick<
  Cms,
  'name' | 'cmsKey' | 'description' | 'url' | 'icon' | 'metaTitle' | 'metaDescription'
>;
export type IUpdateCms = Pick<
  Cms,
  'name' | 'cmsKey' | 'description' | 'url' | 'icon' | 'metaTitle' | 'metaDescription'
>;
