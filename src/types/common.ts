import { Request } from 'express';

export interface DataObject {
  [key: string]: any;
}
export interface ICreate {
  data: DataObject;
  select?: string;
}

export interface IUpdate {
  id: string;
  newData: DataObject;
  select?: string;
}

export interface IUpdateMany {
  [key: string]: any; // Allows other dynamic keys with any type
  where: {
    [key: string]: any; // Dynamic keys with string values in 'where' object
  };
}

export interface IFind {
  [key: string]: any;
  select?: string;
}
export interface IEmailOtp {
  EmailData: string;
  Otp: number;
}
export interface IToken {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
}

export interface ICustomRequest extends Request {
  user?: {
    id: string;
    name: string;
    status: boolean;
    isAdmin: boolean;
    userType: 'Customer' | 'Employee' | 'Admin' | 'Driver';
    // workspaceId?: string;
  };
  query: any;
}

export interface IActiveDelete {
  isActive: boolean;
  softDelete: boolean;
}
