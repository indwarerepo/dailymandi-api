import { NextFunction } from 'express';
import { ICustomRequest } from '../types/common';
import { AuditModel } from '../model/models';

const auditMiddleware = (req: ICustomRequest, res: any, next: NextFunction) => {
  const startTime = Date.now();
  const oldWrite = res.write;
  const oldEnd = res.end;

  const chunks: Buffer[] = [];

  res.write = (...args: any[]) => {
    chunks.push(Buffer.from(args[0]));
    oldWrite.apply(res, args);
  };

  res.end = (...args: any[]) => {
    if (args[0]) {
      chunks.push(Buffer.from(args[0]));
    }

    // Check if the response contains binary data
    let body = '';
    try {
      body = Buffer.concat(chunks).toString('utf8');
    } catch (error) {
      body = JSON.stringify({ body: '[Binary data]' });
    }

    // Avoid logging binary content by replacing it with a placeholder
    if (body.includes('\u0000')) {
      body = JSON.stringify({ body: '[Binary data]' });
    }

    res.body = body; // Optional: Attach the body to res for easier access
    oldEnd.apply(res, args);
  };

  res.on('finish', async () => {
    const duration = Date.now() - startTime;

    // hide password from audit log
    if (req.body.password) {
      req.body = { ...req.body, password: '**********' };
    }

    if (req.method === 'OPTIONS') return;

    const auditLog = {
      userId: req.user ? req.user.id : null, // Assumes you have user information in req.user
      // workspaceId: req.user ? req.user.workspaceId : null,
      method: req.method,
      path: req.originalUrl,
      body: req.body || {},
      query: req.query,
      headers: req.headers,
      responseStatus: res.statusCode,
      responseBody: res.body || {},
      duration: duration,
    };

    // Log audit data asynchronously without waiting
    setImmediate(async () => {
      try {
        await AuditModel().createOne(auditLog);
      } catch (err) {
        console.error('Error saving audit log:', err);
      }
    });
  });

  next();
};

export default auditMiddleware;
