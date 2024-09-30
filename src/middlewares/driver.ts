import { NextFunction, Request, Response } from 'express';
import { ICustomRequest } from '../types/common';

export function driver(req: ICustomRequest, res: Response, next: NextFunction) {
  if (req.user?.userType !== 'Driver') return res.status(403).send({ message: 'Access Denied' });
  next();
}
