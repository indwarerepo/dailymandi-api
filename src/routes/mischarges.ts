import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
import asyncHandler from '../middlewares/asyncHandler';
import CustomError from '../middlewares/customError';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/admin';
const router = Router();
import moment from 'moment';
import { MisChargeModel } from '../model/models';
import { IAddMisCharge, IUpdateMisCharge } from '../types/mischarges';

/* ****************************WEB API********************************* */
/**
 * Get all records for dropdown
 */
router.get(
  '/list',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { isActive: true, softDelete: false };
    const records = await MisChargeModel().where(whereClause).find();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

/* **************************************ADMIN API******************************************** */
/**
 * Create new Model
 * Master table for MisChargeModel
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IAddMisCharge;
    const { error } = MisChargeModel().addMisCharge(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await MisChargeModel()
      .where({ defaultDiscountRate: body.defaultDiscountRate, softDelete: false })
      .findOne();
    if (isExist)
      throw new CustomError(body.defaultDiscountRate + ' already exists.', HttpStatusCode.Conflict);

    let transaction = await MisChargeModel().createOne({
      defaultDiscountRate: body.defaultDiscountRate,
      specialDiscountRate: body.specialDiscountRate,
      specialTaxRate: body.specialTaxRate,
      defaultDeliveryCharge: body.defaultDeliveryCharge,
      specialDeliveryRate: body.specialDeliveryRate,
      welcomeWalletAmt: body.welcomeWalletAmt,
      walletDeductionRateOnOrder: body.walletDeductionRateOnOrder,
      orderReturnCommRateOA: body.orderReturnCommRateOA,
      orderReturnCommRateNOA: body.orderReturnCommRateNOA,
      refByAddCommRate: body.refByAddCommRate,
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
    const records = await MisChargeModel()
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await MisChargeModel().where(whereClause).countDocuments();

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
    const isExist = await MisChargeModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await MisChargeModel()
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
    const body = req.body as IUpdateMisCharge;
    const { error } = MisChargeModel().updateMisCharge(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await MisChargeModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    let transaction = await MisChargeModel()
      .where({ id: req.params.id })
      .select('id')
      .updateOne({
        defaultDiscountRate: body.defaultDiscountRate,
        specialDiscountRate: body.specialDiscountRate,
        defaultTaxRate: body.defaultTaxRate,
        specialTaxRate: body.specialTaxRate,
        defaultDeliveryCharge: body.defaultDeliveryCharge,
        specialDeliveryRate: body.specialDeliveryRate,
        welcomeWalletAmt: body.welcomeWalletAmt,
        walletDeductionRateOnOrder: body.walletDeductionRateOnOrder,
        orderReturnCommRateOA: body.orderReturnCommRateOA,
        orderReturnCommRateNOA: body.orderReturnCommRateNOA,
        refByAddCommRate: body.refByAddCommRate,
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

export default router;
