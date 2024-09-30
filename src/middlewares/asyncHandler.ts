import { Request, Response, NextFunction } from 'express';

const asyncHandler = (handler: (req: Request, res: Response) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res);
    } catch (error) {
      // Sending error to error handler middleware
      next(error);
    }
  };
};

export default asyncHandler;
