import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
import asyncHandler from '../middlewares/asyncHandler';
import CustomError from '../middlewares/customError';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/admin';
const router = Router();
import moment from 'moment';
import { CouponMasterModel, OrderModel } from '../model/models';
import { IAddCouponMaster, IUpdateCouponMaster } from '../types/couponMasster';

/* ****************************WEB API********************************* */
/**
 * Get all records for dropdown
 */
router.get(
  '/dropdown/list',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { isActive: true, softDelete: false };
    const records = await CouponMasterModel()
      .select('id, name, couponCode, description, policy')
      .where(whereClause)
      .find();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

/**
 * Get coupon detail for checkout
 */
router.post(
  '/web/checkavailability/',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const couponId = req.body.couponId;
    const orderAmount = req.body.orderAmount;
    const isExist = await CouponMasterModel()
      .where({ id: couponId, isActive: true, softDelete: false })
      .findOne();
    if (!isExist)
      throw new CustomError('Record not available with this Code.', HttpStatusCode.NotFound);

    if (orderAmount < isExist.minOrderAmount)
      throw new CustomError('Amount is not Sufficient', HttpStatusCode.NotAcceptable);

    const expiredDate = moment(isExist.expiredDate); // Convert expiryDate to a moment object
    const todayDate = moment(); // Get the current date

    // Compare the dates
    if (expiredDate.isBefore(todayDate)) {
      throw new CustomError('Coupon code expired', HttpStatusCode.NotAcceptable);
    }

    const whereClause: any = {
      customerId: (req as any).user.id,
      couponId: couponId,
      softDelete: false,
    };
    const count = await OrderModel().where(whereClause).countDocuments();
    if (count > 1) {
      // Check Coupon Limit Customer Wise
      if (count > isExist.useLimit) {
        throw new CustomError('You have Use Max Limit', HttpStatusCode.NotAcceptable);
      }
    }

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Coupon Applied',
      data: null,
    });
  }),
);

/* **************************************ADMIN API******************************************** */
/**
 * Create new Model
 * Master table for CouponMasterModel
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IAddCouponMaster;
    const { error } = CouponMasterModel().addCouponMaster(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await CouponMasterModel()
      .where({ name: body.name, softDelete: false })
      .findOne();
    if (isExist) throw new CustomError(body.name + ' already exists.', HttpStatusCode.Conflict);

    let transaction = await CouponMasterModel().createOne({
      name: body.name,
      couponCode: body.couponCode,
      minOrderAmount: body.minOrderAmount,
      offerPercentage: body.offerPercentage,
      couponValidity: body.couponValidity,
      useLimit: body.useLimit,
      startDate: body.startDate,
      expiredDate: body.expiredDate,
      description: body.description,
      policy: body.policy,
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
    const records = await CouponMasterModel()
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await CouponMasterModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
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
    const isExist = await CouponMasterModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await CouponMasterModel()
      .where({ id: req.params.id, softDelete: false })
      .findOne();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

/**
 * Update model by id
 */
router.put(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IUpdateCouponMaster;
    const { error } = CouponMasterModel().updateCouponMaster(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await CouponMasterModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    let transaction = await CouponMasterModel()
      .where({ id: req.params.id })
      .select('id, name')
      .updateOne({
        name: body.name,
        couponCode: body.couponCode,
        minOrderAmount: body.minOrderAmount,
        offerPercentage: body.offerPercentage,
        couponValidity: body.couponValidity,
        useLimit: body.useLimit,
        startDate: body.startDate,
        expiredDate: body.expiredDate,
        description: body.description,
        policy: body.policy,
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
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await CouponMasterModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await CouponMasterModel()
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
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const delId = await CouponMasterModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
  }),
);

export default router;
