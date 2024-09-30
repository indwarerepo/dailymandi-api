import { NextFunction, Request, Response } from 'express';
import { ICustomRequest } from '../types/common';

export function isAdmin(req: ICustomRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin || req.user?.userType !== 'Admin')
    return res.status(403).send({ message: 'Access Denied' });
  next();
}
