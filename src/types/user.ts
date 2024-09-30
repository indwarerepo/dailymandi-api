export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  image: string;
  otp: number;
  otpTimeOut: Date;
  isUseGoogleAuth: boolean;
  googleId: string;
  isUseTwoFA: boolean;
  isOnline: boolean;
  ipAddress: string;
  isAdmin: boolean;
  userType: userTypeOption;
  referredBy?: string;
  referredFreq?: number;
  referralCode?: string;

  walletValue?: number;
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export type userTypeOption = 'Customer' | 'Employee' | 'Admin';
export type LanguageOptions = 'en' | 'ch' | 'bn';

export type RegisterBody = Pick<User, 'name' | 'email' | 'password' | 'userType' | 'referredBy'> & {
  invitationId?: string;
};
export type LoginBody = Pick<User, 'email' | 'password'> & { invitationId?: string };
export type OtpBody = Pick<User, 'email' | 'otp'>;
export type UpdateBody = Pick<User, 'name' | 'phone' | 'image'>;
export type GoogleAuthBody = Pick<User, 'name' | 'email' | 'googleId' | 'image'> & {
  invitationId?: string;
};

export type CustomerRegisterBody = Pick<User, 'name' | 'phone' | 'referredBy'>;
export type CustomerLoginBody = Pick<User, 'phone'>;
export type CustomerOtpBody = Pick<User, 'phone' | 'otp'>;
export type CustomerUpdateBody = Pick<User, 'name' | 'email'>;

export type ForgotPasswordBody = Pick<User, 'email'>;
export type ResetPasswordBody = Pick<User, 'email' | 'password'>;
export type ChangePasswordBody = Pick<User, 'password'>;
