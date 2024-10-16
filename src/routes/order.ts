import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
import config from 'config';
import moment from 'moment';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import xlsx from 'xlsx';
// const { PDFDocument } = require('pdf-lib');
import asyncHandler from '../middlewares/asyncHandler';
import CustomError from '../middlewares/customError';
import { auth } from '../middlewares/auth';
import { customer } from '../middlewares/customer';
import { isAdmin } from '../middlewares/admin';
const router = Router();

import {
  CartMasterModel,
  CouponMasterModel,
  OrderDetailModel,
  OrderModel,
  OrderStatusModel,
  ProductVariantModel,
  UserAddressModel,
  UserModel,
  MisChargeModel,
  UserTransactionModel,
  DriverModel,
  ProductInventoryModel,
  ProductInventoryHistoryModel,
  PincodeModel,
  ZoneModel,
  UserWalletModel,
} from '../model/models';
import { IAddOrder } from '../types/order';
import CouponMaster from '../model/lib/couponMaster';

/**
 * Get Delivery Amount by Customer Zone
 */

router.get(
  '/get-deliveryamount/:id',
  [auth, customer],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    // Check if address id exists

    let addressId = req.params.id;
    // console.log(addressId);
    // return;

    const isExistAddress = await UserAddressModel()
      .where({ id: addressId, softDelete: false })
      .populate('pincode', 'id, pincode')
      .findOne();
    if (!isExistAddress)
      throw new CustomError('Address not exists with this id.', HttpStatusCode.NotFound);

    // Check Delivery Charge from Customer Pincode
    const checkPincode = await PincodeModel()
      .select('id')
      .where({ id: isExistAddress.pincode.id, softDelete: false })
      .populate('zone', 'id, deliveryCharge')
      .findOne();

    let deliveryAmount = checkPincode.zone.deliveryCharge;

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: {
        deliveryAmount,
      },
    });
  }),
);

/**
 * Create new Model
 * Master table for OrderModel
 */
router.post(
  '/',
  [auth, customer],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IAddOrder;

    // Validate the order using the addOrder method
    const { error } = OrderModel().addOrder(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    // Generate order number using current date and random string
    var today = new Date();
    var finYr = getCurrentFinancialYear();
    var month = today.toLocaleString('default', { month: '2-digit' });
    let orderNo = finYr + '/' + month + '/' + Math.random().toString(36).slice(2, 8).toUpperCase();

    // Check if customer id exists
    const isExistUser = await UserModel()
      .where({ id: (req as any).user.id, softDelete: false })
      .findOne();
    if (!isExistUser)
      throw new CustomError('Customer not exists with this id.', HttpStatusCode.NotFound);

    // Check if address id exists
    const isExistAddress = await UserAddressModel()
      .where({ id: body.addressId, softDelete: false })
      .populate('pincode', 'id, pincode')
      .findOne();
    if (!isExistAddress)
      throw new CustomError('Address not exists with this id.', HttpStatusCode.NotFound);

    // Check Delivery Charge from Customer Pincode
    const checkPincode = await PincodeModel()
      .where({ id: isExistAddress.pincode.id, softDelete: false })
      .populate('zone', 'id, deliveryCharge')
      .findOne();
    // console.log(checkPincode.zone.deliveryCharge);
    // return;

    let obj: any = {}; // Define an empty object
    let offerPercentage = 0;

    // Apply coupon if couponId is present
    if (body.couponId != '') {
      const isExistCoupon = await CouponMasterModel()
        .where({ id: body.couponId, softDelete: false })
        .findOne();
      if (!isExistCoupon)
        throw new CustomError('Coupon not exists with this id.', HttpStatusCode.NotFound);

      offerPercentage = isExistCoupon.offerPercentage;
      obj = {
        isCouponApplied: true,
        couponId: isExistCoupon.id,
      };
    }

    // Fetch default order status
    let defaultStatus = await OrderStatusModel().where({ statusTitle: 'Pending' }).findOne();
    // Default value for misclenious charges
    //const misc = await MisChargeModel().findOne();

    // Initialize totals
    let totalPrice = 0.0;
    let totalPriceinclusiveTax = 0.0;
    let totalproductActualPrice = 0.0;

    // Process cart list and calculate totals
    const carts = await Promise.all(
      body.cartList.map(async (cart: any) => {
        let c = await CartMasterModel().where({ id: cart }).findOne();
        let prod = await ProductVariantModel()
          .where({ id: c.productId })
          .populate('tax_master', 'percentage')
          .findOne();
        totalPrice = totalPrice + prod.sellingPrice * c.cartProdQnt;
        const inclusiveTax =
          (prod.sellingPrice * prod.tax_master.percentage) / (100 + prod.tax_master.percentage);
        const productActualPrice = prod.sellingPrice - inclusiveTax;
        totalPriceinclusiveTax = totalPriceinclusiveTax + inclusiveTax;
        totalproductActualPrice = totalproductActualPrice + productActualPrice;

        return prod;
      }),
    );

    // Calculate discounts and total
    // Delivery Default Values
    let deliveryAmount = checkPincode.zone.deliveryCharge;

    // Wallet Deduction Rate
    // let walletDeductionRate = misc.walletDeductionRateOnOrder;

    // Discount calculation
    const discountAmount = (offerPercentage / 100) * totalPrice;
    const discountedPrice = totalPrice - discountAmount;

    // Total Order Price
    const orderTotal = discountedPrice + Number(deliveryAmount);

    let amountDeductionFromWallet = 0;
    // Payable amount after wallet transaction
    const customerWalletBalance = await UserWalletModel()
      .where({ userId: (req as any).user.id })
      .select('walletAmount')
      .findOne();

    if (body.isWalletUsed) {
      if (customerWalletBalance.walletAmount > orderTotal) {
        amountDeductionFromWallet = orderTotal;
      } else if (customerWalletBalance.walletAmount == orderTotal) {
        amountDeductionFromWallet = orderTotal;
      } else {
        amountDeductionFromWallet = customerWalletBalance.walletAmount;
      }
    }

    const payableAmount = orderTotal - amountDeductionFromWallet;

    // Add to order object
    obj = {
      ...obj,
      customerId: (req as any).user.id,
      orderNumber: orderNo,
      deliverySlotId: body.deliverySlotId,
      discountedPrice: discountAmount,
      subtotalPrice: discountedPrice,
      taxAmt: totalPriceinclusiveTax,
      deliveryAmt: deliveryAmount,
      orderTotal: orderTotal,
      orderTotalInWord: orderTotalInToWords(orderTotal),
      isWalletUsed: body.isWalletUsed,
      amountDeductionFromWallet: amountDeductionFromWallet,
      payableAmount: payableAmount,
      paidAmount: amountDeductionFromWallet,
      dueAmount: payableAmount,

      orderStatusId: defaultStatus.id,
      deliveryAddress: isExistAddress.addressOne,
      deliveryPincode: isExistAddress.pincode.pincode,
      deliveryState: isExistAddress.state,
      deliveryCity: isExistAddress.city,
      finYear: getCurrentFinancialYear(),
      paymentStatus: false,
      paymentMethod: 'COD',
      createdBy: (req as any).user.id,
    };

    // Create the order in the database
    let newOrder = await OrderModel()
      .select('id, orderNumber, orderTotal, paymentMethod, createdAt')
      .createOne(obj);
    if (body.isWalletUsed) {
      let updatedWalletAmount = customerWalletBalance.walletAmount - amountDeductionFromWallet;
      await UserWalletModel()
        .where({ userId: (req as any).user.id })
        .updateOne({
          walletAmount: updatedWalletAmount,
        });
      await UserModel()
        .where({ id: (req as any).user.id })
        .updateOne({
          walletValue: updatedWalletAmount,
        });
      if (amountDeductionFromWallet > 0) {
        await UserTransactionModel().createOne({
          userId: (req as any).user.id,
          transactionType: false,
          amount: amountDeductionFromWallet,
          remarks: `Used for Order ${newOrder.orderNumber}`,
        });
      }
    }
    // Add product in order table
    const details = await Promise.all(
      body.cartList.map(async (cart: any) => {
        let c = await CartMasterModel().where({ id: cart }).findOne();
        let prod = await ProductVariantModel()
          .where({ id: c.productId })
          .populate('tax_master', 'percentage')
          .populate('variant_master', 'variantName')
          .findOne();
        const inclusiveTax =
          (prod.sellingPrice * prod.tax_master.percentage) / (100 + prod.tax_master.percentage);
        const productActualPrice = prod.sellingPrice - inclusiveTax;

        await OrderDetailModel().createOne({
          orderId: newOrder.id,
          productId: c.productId,
          quantity: c.cartProdQnt,
          orderPrice: prod.sellingPrice,
          originalPrice: productActualPrice,
          taxAmt: inclusiveTax,
          totalAmt: prod.sellingPrice,
          productDetailsId: prod.productId,
          productTaxId: prod.taxId,
          varient_name: prod.variant_master.variantName,
          createdBy: (req as any).user.id,
        });

        // delete cart
        await CartMasterModel().where({ id: cart }).permanentDelete();

        return prod;
      }),
    );

    // Send response
    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'New record created successfully.',
      data: {
        orderId: newOrder.id,
        orderNo: newOrder.orderNumber,
        orderTotal: newOrder.orderTotal,
        orderPaymentMethod: newOrder.paymentMethod,
        orderDate: newOrder.createdAt,
      },
    });
  }),
);

/**
 * FOR ADMIN API
 * Get all records from OrderModel
 */
router.get(
  '/admin/list',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    let pageIndex: number = parseInt(req.query.pageNo);
    let pageSize: number = parseInt(req.query.pageLimit);
    let sortBy: string = req.query.sortBy;
    let sortOrder: string = req.query.sortOrder;

    const whereClause: any = {
      softDelete: false,
    };

    const records = await OrderModel()
      .select(
        'id, orderNumber, discountedPrice, subtotalPrice, taxAmt, deliveryAmt, orderTotal, orderTotalInWord, amountDeductionFromWallet, payableAmount, paidAmount, dueAmount, paymentStatus, paymentMethod, deliveryAddress, deliveryPincode, deliveryState, deliveryCity,driverAccepted, createdAt',
      )
      .where(whereClause)
      .populate('order_status', 'id, statusTitle')
      .populate('driver', 'id, name')
      .populate('users', 'id, name, email, phone, image')
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();

    const recordWithDetails = await Promise.all(
      records.map(async (record) => {
        const additionalInfo = {
          driverStatus: '', // Example custom field
          // customField2: 'Custom Value 2', // Another example field
          // You can also retrieve data from other models here and add them
        };
        if (
          record.order_status.id == '7858e9cd-c52a-44d2-9cb4-96d1bfd33d20' &&
          record.driverAccepted == 0
        ) {
          additionalInfo.driverStatus = 'Waiting';
        } else if (record.driverAccepted == 1) {
          additionalInfo.driverStatus = 'Accepted';
        }
        // else if (record.driverAccepted == 0) {
        //   additionalInfo.driverStatus = 'Rejected';
        // }

        const pinCodeDetails = await PincodeModel()
          .select('id,zoneId')
          .where({ pincode: record.deliveryPincode })
          .populate('zone', 'id,zoneName')
          .findOne();

        const orderDetails = await OrderDetailModel()
          .select('id, quantity, orderPrice, originalPrice, taxAmt, varient_name')
          .where({ orderId: record.id, softDelete: false })
          .populate('product', 'id, name, productImage')
          .populate('product_variant', 'id, productVariantImage')
          .populate('tax_master', 'id, slab, percentage')
          .find();

        // const driverList = await DriverModel()
        //   .select('id, name,phone')
        //   .where({ isActive: true, softDelete: false })
        //   .find();
        return {
          ...record,
          ...additionalInfo,
          pinCodeDetails,
          orderDetails,
        };
      }),
    );

    const count = await OrderModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: recordWithDetails,
    });
  }),
);

/**
 * Get all driver dropdown
 */
router.get(
  '/admin/drop-down-by-order-id/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause: any = { id: req.params.id, softDelete: false };

    const records = await OrderModel().select('id, deliveryPincode').where(whereClause).findOne();

    const pinCodeDetails = await PincodeModel()
      .select('id,zoneId')
      .where({ pincode: records.deliveryPincode })
      .findOne();

    console.log(pinCodeDetails.zoneId);
    const driverDetails = await DriverModel()
      .select('id, name')
      .whereRaw('$1 = ANY("zoneId")', [pinCodeDetails.zoneId])
      .find();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: driverDetails,
    });
  }),
);

/**
 * FOR ADMIN API
 * Get record from OrderModel By Id
 */
router.get(
  '/admin/:id',
  [auth, isAdmin],
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
      .select('id, quantity, orderPrice, originalPrice, taxAmt, varient_name,order_status')
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
 * Change Order Status From Admin
 */
router.put(
  '/status/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await OrderModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this Id.', HttpStatusCode.NotFound);

    if (isExist.isCancelled == true) {
      throw new CustomError(
        'Status of a Cancelled order cannot be changed !',
        HttpStatusCode.BadRequest,
      );
    }

    let statusId = '';
    let deliveryOtp = null;
    if (isExist.orderStatusId == '7858e9cd-c52a-44d2-9cb4-96d1bfd33d20') {
      statusId = 'e4b323d0-bee3-4609-bab5-64f7a2b147dd';
    } else if (isExist.orderStatusId == 'c2f959f4-8641-4b05-8289-df607b271e5e') {
      statusId = 'a4f5a8be-2dad-4a74-ada2-15972f5b0d8c';
      deliveryOtp = Math.floor(100000 + Math.random() * 900000);
      /* Update Inventory */
      let orderDetails = await OrderDetailModel()
        .select(
          'id, quantity,productId, orderPrice, originalPrice, taxAmt, varient_name,order_status',
        )
        .where({ orderId: isExist.id, softDelete: false })
        .find();
      const mappedRecords = await Promise.all(
        orderDetails.map(async (record: any) => {
          let productVariant = await ProductVariantModel()
            .select('id,stock,productId')
            .where({ id: record.productId, softDelete: false })
            .findOne();
          // console.log(parseInt(productVariant.stock) + '/' + parseInt(record.quantity));
          if (productVariant) {
            let productVariantUpadte = await ProductVariantModel()
              .select('id')
              .where({ id: productVariant.id })
              .updateOne({
                stock: parseInt(productVariant.stock) - parseInt(record.quantity),
              });
            //console.log(productVariant.id);
            let productInventory = await ProductInventoryModel().rawSql(
              `select "id","totalStock","batchNo" from product_inventory where "productVariantId"=$1 and "totalStock">$2 and "inventoryStage"=$3`,
              [productVariant.id, 0, 'Running'],
            );
            //console.log(productInventory['rows'][0].id + '/' + parseInt(record.quantity));
            if (productInventory) {
              // console.log(productInventory['rows'][0].id);
              let productInventoryUpadte = await ProductInventoryModel()
                .select('id,totalStock,batchNo')
                .where({ id: productInventory['rows'][0].id })
                .updateOne({
                  totalStock:
                    parseInt(productInventory['rows'][0].totalStock) - parseInt(record.quantity),
                });
              //console.log(productInventoryUpadte);
              if (productInventoryUpadte.totalStock == 0) {
                let productInventoryUpadte1 = await ProductInventoryModel()
                  .where({ id: productInventory['rows'][0].id })
                  .select('id,totalStock')
                  .updateOne({
                    inventoryStage: 'Completed',
                  });

                let productInventory1 = await ProductInventoryModel().rawSql(
                  `select "id","totalStock" from product_inventory where "productVariantId"=$1 and "totalStock">$2 and "inventoryStage"=$3 limit 0,1`,
                  [productVariant.id, 0, 'Queue'],
                );
                console.log(productInventory1['rows']);
                let productInventoryUpadte2 = await ProductInventoryModel()
                  .where({ id: productInventory1['rows'][0].id })
                  .select('id,totalStock')
                  .updateOne({
                    inventoryStage: 'Running',
                  });
              }

              let inventoryHistoryUpdate = await ProductInventoryHistoryModel()
                .select('id')
                .createOne({
                  productVariantId: productVariant.id,
                  productId: productVariant.productId,
                  batchId: productInventory['rows'][0].batchNo,
                  previousStock: productVariant.stock,
                  changeStock: parseInt(record.quantity),
                  currentStock: parseInt(productVariant.stock) - parseInt(record.quantity),
                  remarks: 'Order Placed',
                  createdBy: (req as any).user.id,
                });
            }
          }
        }),
      );
    } else {
      throw new CustomError(
        'Order status cannot be changed for this order!',
        HttpStatusCode.BadRequest,
      );
    }
    await OrderModel().where({ id: req.params.id }).updateOne({
      orderStatusId: statusId,
      deliveryOtp: deliveryOtp,
    });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed status.' });
  }),
);

/**
 * Assign Driver to Order in Admin
 */
router.put(
  '/assign-driver/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await OrderModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this Id.', HttpStatusCode.NotFound);

    await OrderModel().where({ id: req.params.id }).updateOne({
      driverId: req.body.driverId,
      orderStatusId: '4e5850bc-1abb-4c8d-be2d-4fbfd4f6c78b',
    });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully Assign Driver.' });
  }),
);

/**
 * Get all records from OrderModel
 */
router.get(
  '/',
  [auth, customer],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    let pageIndex: number = parseInt(req.query.pageNo);
    let pageSize: number = parseInt(req.query.pageLimit);
    let sortBy: string = req.query.sortBy;
    let sortOrder: string = req.query.sortOrder;

    const whereClause: any = {
      customerId: (req as any).user.id,
      softDelete: false,
    };

    const records = await OrderModel()
      .select(
        'id, orderNumber, discountedPrice, subtotalPrice, taxAmt, deliveryAmt, orderTotal, orderTotalInWord, amountDeductionFromWallet, payableAmount, paidAmount, dueAmount, paymentStatus, paymentMethod, deliveryAddress, deliveryPincode, deliveryState, deliveryCity, createdAt, deliveryOtp',
      )
      .where(whereClause)
      .populate('order_status', 'id, statusTitle')
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();

    const recordWithDetails = await Promise.all(
      records.map(async (record) => {
        const orderDetails = await OrderDetailModel()
          .select('id, quantity, orderPrice, originalPrice, taxAmt, varient_name,order_status')
          .where({ orderId: record.id, softDelete: false })
          .populate('product', 'id, name, productImage')
          .populate('product_variant', 'id, productVariantImage')
          .populate('tax_master', 'id, slab, percentage')
          .find();

        return {
          ...record,
          orderDetails,
        };
      }),
    );

    const count = await OrderModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: recordWithDetails,
    });
  }),
);

/**
 * Get record from OrderModel By Id
 */
router.get(
  '/:id',
  [auth, customer],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const whereClause: any = { id: req.params.id, softDelete: false };

    const record = await OrderModel()
      .select(
        'id, orderNumber, discountedPrice, subtotalPrice, taxAmt, deliveryAmt, orderTotal, orderTotalInWord, amountDeductionFromWallet, payableAmount, paidAmount, dueAmount, paymentStatus, paymentMethod, deliveryAddress, deliveryPincode, deliveryState, deliveryCity, createdAt,deliveryOtp',
      )
      .where(whereClause)
      .populate('order_status', 'id, statusTitle')
      .populate('users', 'id, name, email, phone, image')
      .findOne();
    if (!record) throw new CustomError('Order not exists with this id.', HttpStatusCode.NotFound);

    const orderDetails = await OrderDetailModel()
      .select('id, quantity, orderPrice, originalPrice, taxAmt, varient_name, order_status')
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

// Get Amount in Words
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

// Get Financial Year
function getCurrentFinancialYear() {
  var fiscalyear = '';
  var today = new Date();
  if (today.getMonth() + 1 <= 3) {
    fiscalyear = today.getFullYear() - 1 + '-' + today.getFullYear();
  } else {
    fiscalyear = today.getFullYear() + '-' + (today.getFullYear() + 1);
  }
  return fiscalyear;
}

export default router;
