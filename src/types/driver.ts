export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  zoneId: string[];
  driverStatus: boolean;
  address?: string;
  landmark?: string;
  panNo?: string;
  aadharNo?: string;
  licenseNo?: string;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export type RegisterBody = Pick<
  Driver,
  | 'name'
  | 'email'
  | 'phone'
  | 'password'
  | 'address'
  | 'landmark'
  | 'panNo'
  | 'aadharNo'
  | 'licenseNo'
  | 'zoneId'
>;
export type UpdateBody = Pick<
  Driver,
  'name' | 'phone' | 'address' | 'landmark' | 'panNo' | 'aadharNo' | 'licenseNo' | 'zoneId'
>;
export type LoginBody = Pick<Driver, 'email' | 'password'>;
export type ForgotPasswordBody = Pick<Driver, 'email'>;
export type ResetPasswordBody = Pick<Driver, 'email' | 'password'>;
export type ChangePasswordBody = Pick<Driver, 'password'>;
export type DriverLoginBody = Pick<Driver, 'phone' | 'password'>;
