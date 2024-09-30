import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
// import config from 'config';
// import moment from 'moment';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import xlsx from 'xlsx';
// const { PDFDocument } = require('pdf-lib');
import { generateDriverToken, verifyToken, imageUpload } from '../helpers/util';
import { comparePassword, encrypt } from '../helpers/encryption';
import asyncHandler from '../middlewares/asyncHandler';
import CustomError from '../middlewares/customError';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/admin';
import { driver } from '../middlewares/driver';
const router = Router();

import {
  DriverModel,
  ZoneModel,
  OrderModel,
  OrderDetailModel,
  DriverStatusModel,
  ProductVariantModel,
  ProductInventoryModel,
  ProductInventoryHistoryModel,
  UserTransactionModel,
} from '../model/models';
import { RegisterBody, UpdateBody, LoginBody, DriverLoginBody, Driver } from '../types/driver';
import Order from '../model/lib/order';

interface ILoginRes {
  statusCode: number;
  message: string;
  userType: string;
}

// Multer Upload Storage
/* const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseUrl = path.dirname(__dirname);
    cb(null, baseUrl + '/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage }); */

/**
 * Create new Driver
 * Master table for DriverModel
 */
router.post(
  '/',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RegisterBody;
    const { error } = DriverModel().validateRegistration(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await DriverModel()
      .where({ email: body.email, softDelete: false })
      .or({ phone: body.phone, softDelete: false })
      .findOne();

    if (isExist) {
      throw new CustomError(
        body.email + ' or ' + body.phone + ' already exists.',
        HttpStatusCode.Conflict,
      );
    }

    for (const zone of body.zoneId) {
      const existZone = await ZoneModel().where({ id: zone, softDelete: false }).findOne();
      if (!existZone) throw new CustomError('Invalid Zone', HttpStatusCode.NotFound);
    }

    let encryptedPassword = encrypt(body.password);
    let transaction = await DriverModel().createOne({
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: encryptedPassword,
      address: body.address,
      landmark: body.landmark,
      panNo: body.panNo,
      aadharNo: body.aadharNo,
      licenseNo: body.licenseNo,
      zoneId: body.zoneId,

      createdBy: (req as any).user.id,
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'New record created successfully.',
      data: transaction,
    });
  }),
);

/**
 * Login Driver
 */
router.post('/login/', async (req: Request, res: Response) => {
  const body = req.body as DriverLoginBody;
  const transactionClient = await DriverModel().getClient();

  try {
    const { error } = DriverModel().validateDriverLogin(body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });
    //console.log(typeof body.phone);
    const driver = await DriverModel()
      .select('id, email, password, phone, name, address, panNo, isActive')
      .where({ phone: body.phone, driverStatus: true })
      .findOne();
    if (!driver)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'Driver does not exist' });

    const isPasswordValid = comparePassword(body.password, driver.password as string);
    console.log(isPasswordValid);
    if (!isPasswordValid)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: 'Invalid Credentials.' });

    let resBody: ILoginRes = {
      statusCode: HttpStatusCode.Ok,
      message: 'Login Successful',
      userType: 'Driver',
    };
    transactionClient.query('BEGIN');

    const token = await generateDriverToken(driver as Driver);
    // console.log(token);
    // return;
    res.header('Authorization', token);

    transactionClient.query('COMMIT');
    res.status(HttpStatusCode.Ok).send(resBody);
  } catch (error: any) {
    await transactionClient.query('ROLLBACK');
    console.log('🛑 Error =>', error.message);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send({ statusCode: HttpStatusCode.InternalServerError, message: error.message });
  } finally {
    transactionClient.release();
  }
}); /**
 * Get all records
 */
router.get(
  '/order-list/',
  [auth, driver],
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;
    console.log((req as any).user.id);

    const whereClause = { softDelete: false, driverId: (req as any).user.id };
    const records = await OrderModel()
      .select(
        'id, orderNumber, discountedPrice, subtotalPrice, taxAmt, deliveryAmt, orderTotal, orderTotalInWord, amountDeductionFromWallet, payableAmount, paidAmount, dueAmount, paymentStatus, paymentMethod, deliveryAddress, deliveryPincode, deliveryState, deliveryCity, createdAt',
      )
      .populate('order_status', 'id, statusTitle')
      .populate('users', 'id, name, email, phone, image')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    // const recordWithDetails = await Promise.all(
    //   records.map(async (record) => {
    //     const orderDetails = await OrderDetailModel()
    //       .select('id, quantity, orderPrice, originalPrice, taxAmt, varient_name')
    //       .where({ orderId: record.id, softDelete: false })
    //       .populate('product', 'id, name, productImage')
    //       .populate('product_variant', 'id, productVariantImage')
    //       .populate('tax_master', 'id, slab, percentage')
    //       .find();

    //     return {
    //       ...record,
    //       orderDetails,
    //     };
    //   }),
    // );
    const count = await OrderModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: records,
    });
  }),
);

/**
 * FOR Driver API
 * Get record from OrderModel By Id
 */
router.get(
  '/order-details/:id',
  [auth, driver],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const whereClause: any = { id: req.params.id, softDelete: false };

    const record = await OrderModel()
      .select(
        'id, orderNumber, discountedPrice, subtotalPrice, taxAmt, deliveryAmt, orderTotal, orderTotalInWord, amountDeductionFromWallet, payableAmount, paidAmount, dueAmount, paymentStatus, paymentMethod, deliveryAddress, deliveryPincode, deliveryState, deliveryCity, createdAt',
      )
      .where(whereClause)
      .populate('order_status', 'id, statusTitle')
      .populate('users', 'id, name, email, phone, image')
      .findOne();
    if (!record) throw new CustomError('Order not exists with this id.', HttpStatusCode.NotFound);

    const orderDetails = await OrderDetailModel()
      .select('id, quantity, orderPrice, originalPrice, taxAmt, varient_name')
      .where({ orderId: record.id, softDelete: false })
      .populate('product', 'id, name, productImage')
      .populate('product_variant', 'id, productVariantImage')
      .populate('tax_master', 'id, slab, percentage')
      .find();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: {
        ...record,
        orderDetails,
      },
    });
  }),
);

/**
 * Accept / Reject Order from Driver
 */
router.put(
  '/accept-order/v1/:id',
  [auth, driver],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const driverId = (req as any).user.id;
    const orderId = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await OrderModel().where({ id: orderId }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this Id.', HttpStatusCode.NotFound);

    if (isExist.driverId != driverId)
      throw new CustomError('Login from a assigned drivers account', HttpStatusCode.NotFound);

    if (isExist.isCancelled == true) {
      throw new CustomError(
        'Status of a Cancelled order cannot be changed !',
        HttpStatusCode.BadRequest,
      );
    }

    let statusId = '';
    let deriverAccept = false;
    if (req.body.actionType == 1) {
      deriverAccept = true;
      await OrderModel().select('id,orderStatusId').where({ id: req.params.id }).updateOne({
        driverAccepted: deriverAccept,
        acceptedAt: new Date(),
        orderStatusId: 'c7481bdc-a3c0-4000-8df8-a4c84ff0ff6d',
      });
    } else {
      //console.log('test');

      const currentDate = new Date();

      // Set the time of the current date object to 00:00:00
      currentDate.setHours(0, 0, 0, 0);

      // Create a new date object for the end of the current date (23:59:59)
      const endDate = new Date(currentDate.getTime() + 86400000 - 1);

      const rejectCount = await DriverStatusModel().rawSql(
        `SELECT COUNT(*) FROM driver_order_status WHERE "driverId" = $1 AND "createdAt" BETWEEN $2 AND $3`,
        [driverId, currentDate, endDate],
      );
      let driverStatusCount = rejectCount.rows[0].count;
      //console.log(driverStatusCount);
      if (driverStatusCount > 3) {
        throw new CustomError(
          'You already cancelled three order in a day',
          HttpStatusCode.BadRequest,
        );
      }

      const orderCount = await DriverStatusModel().rawSql(
        `SELECT COUNT(*) FROM driver_order_status WHERE "driverId" = $1 AND "orderId" = $2`,
        [driverId, orderId],
      );
      let driverorderCount = orderCount.rows[0].count;
      if (driverorderCount > 0) {
        throw new CustomError('You already Rejected this Order', HttpStatusCode.BadRequest);
      }

      await DriverStatusModel().createOne({
        driverId: driverId,
        orderId: orderId,
        remarks: 'Order Cancelled by Driver',
      });

      await OrderModel().where({ id: orderId }).updateOne({
        driverAccepted: false,
        driverId: null,
        orderStatusId: 'a4f5a8be-2dad-4a74-ada2-15972f5b0d8c',
      });
    }
    let orders = await OrderModel()
      .select('id,orderStatusId')
      .where({ id: req.params.id })
      .findOne();

    if (orders.orderStatusId == '4e5850bc-1abb-4c8d-be2d-4fbfd4f6c78b') {
      if (req.body.currStatus == 'Arrived') {
        const dropdownOptions2 = 'Picked up';
        let orderStatusId = 'c7481bdc-a3c0-4000-8df8-a4c84ff0ff6d';
        await OrderModel().select('id,orderStatusId').where({ id: req.params.id }).updateOne({
          orderStatusId: orderStatusId,
        });

        return res.send({ data: dropdownOptions2 });
      }
    }
    if (req.body.currStatus == 'Picked up') {
      let orderUpdate = await OrderModel()
        .select('id,orderStatusId')
        .where({ id: req.params.id })
        .updateOne({
          orderStatusId: '7858e9cd-c52a-44d2-9cb4-96d1bfd33d20',
        });
      if (orderUpdate) {
        const dropdownOptions3 = 'Reached';
        //}
        return res.send({ data: dropdownOptions3 });
      }
    }

    if (req.body.currStatus == 'Reached') {
      if (orders.orderStatusId == '7858e9cd-c52a-44d2-9cb4-96d1bfd33d20') {
        let orderUpdate1 = await OrderModel()
          .select('id,orderStatusId')
          .where({ id: req.params.id })
          .updateOne({
            orderStatusId: '30994c9d-ec00-4d55-b78c-c03361056c24',
          });
        if (orderUpdate1) {
          return res.send({ data: 'Order status changed to reached.' });
        }
      } else if (orders.orderStatusId != '7858e9cd-c52a-44d2-9cb4-96d1bfd33d20') {
        return res.send({ data: 'Order status not changed to dispatch by admin.' });
      }
    }
    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed Status.' });
  }),
);

router.put(
  '/accept-order/:id',
  [auth, driver],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const driverId = (req as any).user.id;
    const orderId = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await OrderModel().where({ id: orderId }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this Id.', HttpStatusCode.NotFound);

    if (isExist.driverId != driverId)
      throw new CustomError('Login from a assigned drivers account', HttpStatusCode.NotFound);

    if (isExist.isCancelled == true) {
      throw new CustomError(
        'Status of a Cancelled order cannot be changed !',
        HttpStatusCode.BadRequest,
      );
    }

    let statusId = '';
    let deriverAccept = false;
    if (req.body.actionType == 1) {
      deriverAccept = true;
      await OrderModel().select('id,orderStatusId').where({ id: req.params.id }).updateOne({
        driverAccepted: deriverAccept,
        acceptedAt: new Date(),
        orderStatusId: '695d01f1-3b85-472b-b5f3-a3ee9b32b9c5',
      });
    } else {
      //console.log('test');

      const currentDate = new Date();

      // Set the time of the current date object to 00:00:00
      currentDate.setHours(0, 0, 0, 0);

      // Create a new date object for the end of the current date (23:59:59)
      const endDate = new Date(currentDate.getTime() + 86400000 - 1);

      const rejectCount = await DriverStatusModel().rawSql(
        `SELECT COUNT(*) FROM driver_order_status WHERE "driverId" = $1 AND "createdAt" BETWEEN $2 AND $3`,
        [driverId, currentDate, endDate],
      );
      let driverStatusCount = rejectCount.rows[0].count;
      //console.log(driverStatusCount);
      if (driverStatusCount > 3) {
        throw new CustomError(
          'You already cancelled three order in a day',
          HttpStatusCode.BadRequest,
        );
      }

      const orderCount = await DriverStatusModel().rawSql(
        `SELECT COUNT(*) FROM driver_order_status WHERE "driverId" = $1 AND "orderId" = $2`,
        [driverId, orderId],
      );
      let driverorderCount = orderCount.rows[0].count;
      if (driverorderCount > 0) {
        throw new CustomError('You already Rejected this Order', HttpStatusCode.BadRequest);
      }

      await DriverStatusModel().createOne({
        driverId: driverId,
        orderId: orderId,
        remarks: 'Order Cancelled by Driver',
      });

      await OrderModel().where({ id: orderId }).updateOne({
        driverAccepted: false,
        driverId: null,
        orderStatusId: 'a4f5a8be-2dad-4a74-ada2-15972f5b0d8c',
      });
    }
    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed Status.' });
  }),
);

/**
 * Get all records
 */
router.get(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { softDelete: false };
    const records = await DriverModel()
      .select(
        'id, name, email, phone, zoneId, address, landmark, panNo, aadharNo, licenseNo, driverStatus, isActive, createdAt',
      )
      // .populate('zone', 'id, zoneName')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        let zoneIds: string[] = [];
        if (typeof record.zoneId === 'object' && record.zoneId !== null) {
          const zoneIdString = record.zoneId.toString(); // Convert object to string
          zoneIds = zoneIdString
            .replace(/[{}]/g, '') // Remove curly braces
            .split(',') // Split by comma
            .map((id: string) => id.trim()); // Trim any extra spaces
        }
        const zoneDetails = await ZoneModel().whereIn('id', zoneIds).select('id, zoneName').find();
        return {
          ...record,
          zoneDetails,
        };
      }),
    );

    const count = await DriverModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

/**
 * Get all records for dropdown
 */
router.get(
  '/drop-down/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { softDelete: false };
    const records = await DriverModel().select('id, name').where(whereClause).find();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

/**
 * Get records by id
 */
router.get(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    // Check if the driver exists
    const isExist = await DriverModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    // Fetch the driver record (assuming soft delete is handled)
    const driverRecord = await DriverModel()
      .select(
        'id, name, email, phone, zoneId, address, landmark, panNo, aadharNo, licenseNo, driverStatus, isActive, createdAt',
      )
      .where({ id: req.params.id, softDelete: false })
      .findOne();

    if (!driverRecord) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    let zoneIds: string[] = [];
    if (typeof driverRecord.zoneId === 'object' && driverRecord.zoneId !== null) {
      const zoneIdString = driverRecord.zoneId.toString(); // Convert object to string
      zoneIds = zoneIdString
        .replace(/[{}]/g, '') // Remove curly braces
        .split(',') // Split by comma
        .map((id: string) => id.trim()); // Trim any extra spaces
    }
    // console.log(zoneIds);
    // Fetch zone details for all zoneIds
    const zoneDetails = await ZoneModel().whereIn('id', zoneIds).select('id, zoneName').find();

    // Map the zone details into the driver's response
    const mappedRecord = {
      ...driverRecord,
      zones: zoneDetails, // Adding the zone details to the driver data
    };

    // Send the response with the driver record and its corresponding zones
    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: mappedRecord,
    });
  }),
);

/**
 * Update model by id
 */
router.put(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateBody;
    const { error } = DriverModel().validateUpdate(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await DriverModel().where({ id: req.params.id }).findOne();
    if (!isExist) {
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);
    }

    //check for invalid zone ids
    for (const zone of body.zoneId) {
      const existZone = await ZoneModel().where({ id: zone, softDelete: false }).findOne();
      if (!existZone) throw new CustomError('Invalid Zone', HttpStatusCode.NotFound);
    }
    //check for other records with same name except current record
    if (isExist.name !== body.name) {
      const isExist2 = await DriverModel().where({ name: body.name, softDelete: false }).findOne();
      if (isExist2) {
        throw new CustomError('A record already exists with this name.', HttpStatusCode.BadRequest);
      }
    }
    //check for other records with same phone except current record
    if (isExist.phone !== body.phone) {
      const isExist2 = await DriverModel()
        .where({ phone: body.phone, softDelete: false })
        .findOne();
      if (isExist2) {
        throw new CustomError(
          'A record already exists with this phone.',
          HttpStatusCode.BadRequest,
        );
      }
    }
    //check for other records with same panNo except current record
    if (
      isExist.panNo &&
      isExist.panNo !== '' &&
      body.panNo &&
      body.panNo !== '' &&
      isExist.panNo !== body.panNo
    ) {
      const isExist2 = await DriverModel()
        .where({ panNo: body.panNo, softDelete: false })
        .findOne();
      if (isExist2) {
        throw new CustomError(
          'A record already exists with this pan No.',
          HttpStatusCode.BadRequest,
        );
      }
    }
    //check for other records with same aadharNo except current record
    if (
      isExist.aadharNo &&
      isExist.aadharNo !== '' &&
      body.aadharNo &&
      body.aadharNo !== '' &&
      isExist.aadharNo !== body.aadharNo
    ) {
      const isExist2 = await DriverModel()
        .where({ aadharNo: body.aadharNo, softDelete: false })
        .findOne();
      if (isExist2) {
        throw new CustomError(
          'A record already exists with this aadhar No.',
          HttpStatusCode.BadRequest,
        );
      }
    }
    //check for other records with same licenseNo except current record
    if (
      isExist.licenseNo &&
      isExist.licenseNo !== '' &&
      body.licenseNo &&
      body.licenseNo !== '' &&
      isExist.licenseNo !== body.licenseNo
    ) {
      const isExist2 = await DriverModel()
        .where({ licenseNo: body.licenseNo, softDelete: false })
        .findOne();
      if (isExist2) {
        throw new CustomError(
          'A record already exists with this license No.',
          HttpStatusCode.BadRequest,
        );
      }
    }

    let transaction = await DriverModel()
      .where({ id: req.params.id })
      .select('id, name')
      .updateOne({
        name: body.name,
        phone: body.phone,
        address: body.address,
        landmark: body.landmark,
        panNo: body.panNo,
        aadharNo: body.aadharNo,
        zoneId: body.zoneId,

        updatedBy: (req as any).user.id,
        updatedAt: new Date(),
      });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Successfully updated record.',
      data: transaction,
    });
  }),
);

/**
 * Change status of model by id
 * Active/Inactive
 */
router.put(
  '/status/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await DriverModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await DriverModel()
      .where({ id: req.params.id })
      .updateOne({
        isActive: isExist.isActive == true ? false : true,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed status.' });
  }),
);

/**
 * Delete model by id (soft delete)
 */
router.delete(
  '/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const delId = await DriverModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
  }),
);

router.put(
  '/accept-order/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    // return console.log(req.body.prodArr.orderType);
    var orderTypeSum = 0;
    const order = await OrderModel().select('productId').where({ id: req.params.id }).findOne();
    if (!order) return res.status(404).send({ message: 'order not found' });
    //console.log(orderDetail);
    for (var i = 0; i < req.body.prodArr.length; i++) {
      // console.log(req.body.prodArr[i].orderType);
      orderTypeSum += req.body.prodArr[i].orderType;
      if (req.body.prodArr[i].orderType) {
        //const order = await Order.findById(req.params.id)
        let productVariant = await ProductVariantModel()
          .select('id,stock')
          .where({ id: req.body.prodArr[i].prodId })
          .findOne();
        let preUpdateStock = productVariant.stock;
        let postUpdateStock = productVariant.stock - req.body.prodArr[i].orderQnt;

        let productVariantUpdate = await ProductVariantModel()
          .select('stock')
          .where({ id: productVariant.id })
          .updateOne({
            stock: postUpdateStock,
          });

        if (productVariantUpdate) {
          const UpdateInventory = await ProductInventoryModel()
            .select('batchNo')
            .where({
              inventoryStage: 'Running',
              productId: req.body.prodArr[i].prodId,
            })
            .updateOne({
              totalStock: postUpdateStock,
            });

          const updateHistory = await ProductInventoryHistoryModel()
            .where({
              batchId: UpdateInventory.batchNo,
              productVariantId: req.body.prodArr[i].prodId,
            })
            .updateOne({
              previousStock: productVariant.stock,
              currentStock: postUpdateStock,
              changeStock: req.body.prodArr[i].orderQnt,
              remarks: 'Update Stock',
            });
        }
        const orderDetail = await OrderDetailModel()
          .where({
            orderId: req.params.id,
            productId: req.body.prodArr[i].prodId,
          })
          .updateOne({
            order_status: '1',
          });
      } else {
        const orderDetail = await OrderDetailModel()
          .where({
            orderId: req.params.id,
            productId: req.body.prodArr[i].prodId,
          })
          .updateOne({
            order_status: '2',
          });

        let productVariant = await ProductVariantModel()
          .select('id,stock')
          .where(req.body.prodArr[i].prodId)
          .findOne();
        let stockUpdate = productVariant.stock + req.body.prodArr[i].orderQnt;

        let productVariantUpdate = await ProductVariantModel()
          .select('stock')
          .where({ id: productVariant.id })
          .updateOne({
            stock: stockUpdate,
          });
      }
    }
    if (orderTypeSum > 0) {
      const order = await OrderModel()
        .select('productId')
        .where({ id: req.params.id })
        .updateOne({
          deliveryAmt: req.body.deliveryAmt,
          orderTotal: req.body.orderTotal,
          orderTotalInWord: orderTotalInToWords(req.body.orderTotal),
        });

      res.send({ otp: order.deliveryOtp, message: 'OTP is:' + order.deliveryOtp });
    } else {
      return res.status(404).send({ message: 'Please select any one product.' });
    }
    // return console.log(orderTypeSum);
    //return;
  }),
);

router.put(
  '/delivery/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    // const { error } = validateDelivery(req.body);
    // if (error) return res.status(400).send({ message: error.details[0].message });

    let order = await OrderModel()
      .select('id,driverId,deliveryOtp,customerId')
      .where({ id: req.params.id })
      .findOne();
    if (!order)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'order not found' });
    //console.log(order.driverId);
    if (order.driverId != (req as any).user.id)
      return res.status(HttpStatusCode.BadRequest).send({
        statusCode: HttpStatusCode.BadRequest,
        message: "Login from a assigned driver's account",
      });
    if (order.driverAccepted == '0')
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ message: 'Order was not accepted. Please accept order to continue delivery.' });
    if (order.isDelivered == '1')
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: 'Order already delivered.' });

    let otp = req.body.otp;
    if (order.deliveryOtp != otp)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: 'Wrong otp' });

    let paymentStatus = '1';

    if (order.paymentMethod == '0') {
      let transaction = await UserTransactionModel().createOne({
        userId: order.customerId,
        orderId: order.id,
        amount: order.orderTotal,
        transactionType: '0',
        remarks: `Payment Received for orderNo- ${order.orderNo}`,
      });
      await transaction.save();
    }

    order = await OrderModel()
      .where({ id: req.params.id })
      .updateOne({
        isDelivered: '1',
        deliveredAt: new Date(),
        orderStatusId: '1924cb87-4f18-48c9-83f7-0b298d4e63a9',
        updatedBy: (req as any).user.id,
        updatedAt: new Date(),
        paymentStatus: '1',
      });
    if (!order)
      return res.status(HttpStatusCode.NotFound).send({
        statusCode: HttpStatusCode.NotFound,
        message: 'The Order with following id not found !',
      });

    // auditFunc({
    //   admin: req.user._id,
    //   title: 'Order Delivery Status Updated',
    //   description: obj,
    //   ip: req.ip,
    // });
    // res.send({ message: 'Order Delivery Status Updated Successfully' });
    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Order Delivery Status Updated Successfully',
    });
  }),
);

function orderTotalInToWords(num: number): string | undefined {
  const a: string[] = [
    '',
    'one ',
    'two ',
    'three ',
    'four ',
    'five ',
    'six ',
    'seven ',
    'eight ',
    'nine ',
    'ten ',
    'eleven ',
    'twelve ',
    'thirteen ',
    'fourteen ',
    'fifteen ',
    'sixteen ',
    'seventeen ',
    'eighteen ',
    'nineteen ',
  ];

  const b: string[] = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  // Ensure number is within limits for conversion
  if (num.toString().length > 9) return 'overflow';

  // Use a regex to capture number parts
  const n: RegExpMatchArray | null = ('000000000' + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);

  if (!n) return; // If match failed, return undefined

  let str = '';

  // Access the matched groups safely, converting strings to numbers
  str +=
    n[1] !== '00'
      ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'crore '
      : '';

  str +=
    n[2] !== '00'
      ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'lakh '
      : '';

  str +=
    n[3] !== '00'
      ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'thousand '
      : '';

  str +=
    n[4] !== '0'
      ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'hundred '
      : '';

  str +=
    n[5] !== '00'
      ? (str !== '' ? 'and ' : '') +
        (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) +
        'only '
      : '';

  return str;
}
export default router;
