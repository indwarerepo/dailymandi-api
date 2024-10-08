import { Express, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import express from 'express';
import CustomError from '../middlewares/customError';
import errorHandler from '../middlewares/error';
import asyncHandler from '../middlewares/asyncHandler';
import auditMiddleware from '../middlewares/audit';

import userRoutes from '../routes/user';
import productCategoryRoutes from '../routes/product-category';
import productBrandRoutes from '../routes/product-brand';
import zoneRoutes from '../routes/zone';
import pincodeRoutes from '../routes/pincode';
import cmsRoutes from '../routes/cms';
import bannerRoutes from '../routes/banner';
import taxMasterRoutes from '../routes/tax-master';
import variantMasterRoutes from '../routes/variant-master';
import couponMasterRoutes from '../routes/coupon-master';
import productRoutes from '../routes/product';
import driverRoutes from '../routes/driver';
import customerRoutes from '../routes/customer';
import userAddressRoutes from '../routes/user-address';
import cartRoutes from '../routes/cart';
import qrCodeRoutes from '../routes/qrcode';
import orderStatusRoutes from '../routes/order-status';
import orderRoutes from '../routes/order';
import mischargeRoutes from '../routes/mischarges';
import deliverySlotRoutes from '../routes/delivery-slot';

export default function (app: Express) {
  const allowedOrigins = [
    'http://localhost:7002', //local admin npm run dev
    'http://localhost:7003', //local admin npm run start
    'http://localhost:8002', //local web npm run dev
    'http://localhost:8003', //local web npm run start
    'http://localhost:7012',
    'http://localhost:8082/',
    'http://148.113.12.204:8086',
    'https://admin.dailymandi.com',
  ];
  app.use(function (req: Request, res: Response, next: NextFunction) {
    const requestOrigin = req.headers.origin || '';
    if (allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Ws-Scope-Id',
    );
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Cache-Control', 'no-cache');
    next();
  });

  // app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, '../', 'uploads')));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // log only 4xx and 5xx responses to console
  app.use(
    morgan('dev', {
      skip: function (req: Request, res: Response) {
        return res.statusCode < 400;
      },
    }),
  );

  app.use(
    '/api/healthcheck',
    asyncHandler(async (req: Request, res: Response) => {
      res.status(200).send({ statusCode: 200, message: 'Yaa! Dailymandi have good health.' });
    }),
  );
  // app.use(auditMiddleware);

  app.use('/api/user/', userRoutes);
  app.use('/api/product-category/', productCategoryRoutes);
  app.use('/api/product-brand/', productBrandRoutes);
  app.use('/api/zone/', zoneRoutes);
  app.use('/api/pincode/', pincodeRoutes);
  app.use('/api/cms/', cmsRoutes);
  app.use('/api/banner/', bannerRoutes);
  app.use('/api/tax-master/', taxMasterRoutes);
  app.use('/api/variant-master/', variantMasterRoutes);
  app.use('/api/coupon-master/', couponMasterRoutes);
  app.use('/api/product/', productRoutes);
  app.use('/api/driver/', driverRoutes);
  app.use('/api/customer/', customerRoutes);
  app.use('/api/user-address/', userAddressRoutes);
  app.use('/api/cart/', cartRoutes);
  app.use('/api/wishlist/', cartRoutes);
  app.use('/api/qrcode/', qrCodeRoutes);
  app.use('/api/order-status/', orderStatusRoutes);
  app.use('/api/order/', orderRoutes);
  app.use('/api/mischagres/', mischargeRoutes);
  app.use('/api/delivery-slot/', deliverySlotRoutes);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const err = new CustomError(
      `You're lost, check your route ! Can't find ${req.method} : ${req.originalUrl} on the server`,
      404,
    );
    next(err);
    // res.json("You're lost, check your route !");
  });
  app.use(errorHandler);
}
