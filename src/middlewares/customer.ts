import { NextFunction, Request, Response } from 'express';
import { ICustomRequest } from '../types/common';

export function customer(req: ICustomRequest, res: Response, next: NextFunction) {
  if (req.user?.userType !== 'Customer') return res.status(403).send({ message: 'Access Denied' });
  next();
}
