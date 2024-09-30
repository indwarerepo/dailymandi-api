import { Express, Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';

const shouldCompress = (req: Request, res: Response) => {
  if (req.headers['x-no-compression']) {
    // Will not compress responses, if this header is present
    return false;
  }
  // Resort to standard compression
  return compression.filter(req, res);
};

export default function (app: Express) {
  app.use(helmet());
  app.use(
    compression({
      filter: shouldCompress,
      threshold: 0,
    }),
  );
}
