import { Response, NextFunction } from 'express';
import { HttpStatusCode } from '../helpers/http-status-codes';
import { verifyToken } from '../helpers/util';
import { ICustomRequest } from '../types/common';

/**
 * Middleware function for user
 * check user valid or not
 * with jwt signing token from header
 */
export function auth(req: ICustomRequest, res: Response, next: NextFunction) {
  if (!req.header('Authorization') || req.header('Authorization') == 'undefined')
    return res.status(401).send({
      statusCode: HttpStatusCode.Unauthorized,
      message: 'Access denied. No token provided',
    });

  // const token = req.header('Authorization')?.replace('Bearer ', '');
  const token = req.header('Authorization')?.split(' ')[1]; // Authorization: 'Bearer TOKEN'
  const workspaceId = req.header('Ws-Scope-Id');

  if (!token)
    return res.status(401).send({
      statusCode: HttpStatusCode.Unauthorized,
      message: 'Access denied. No token provided',
    });

  try {
    const verified = verifyToken(token);
    req.user = { ...(verified as any), workspaceId };

    if (!req.user?.status)
      return res.status(401).send({
        statusCode: HttpStatusCode.Unauthorized,
        message: 'Account Inactive, Contact Support !',
      });
    next();
  } catch (ex) {
    res.status(401).send({ statusCode: HttpStatusCode.Unauthorized, message: 'Invalid token.' });
  }
}
