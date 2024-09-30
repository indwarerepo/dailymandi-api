export interface UserAddress {
  id: string;
  userId: string;
  pincode: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  addressOne?: string;
  addressTwo?: string;
  city?: string;
  state?: string;
  addressTitle?: string;
  country?: string;
  phone?: string;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export type IAddUserAddress = Pick<
  UserAddress,
  | 'userId'
  | 'pincode'
  | 'company'
  | 'firstName'
  | 'lastName'
  | 'addressOne'
  | 'addressTwo'
  | 'city'
  | 'state'
  | 'addressTitle'
  | 'country'
  | 'phone'
>;
export type IUpdateUserAddress = Pick<
  UserAddress,
  | 'userId'
  | 'company'
  | 'firstName'
  | 'lastName'
  | 'addressOne'
  | 'addressTwo'
  | 'pincode'
  | 'city'
  | 'state'
  | 'addressTitle'
  | 'country'
  | 'phone'
>;
