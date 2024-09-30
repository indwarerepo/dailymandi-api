import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddCouponMaster, IUpdateCouponMaster } from '../../types/couponMasster';

class CouponMaster extends Model {
  /**
   *CouponMaster Add
   */
  addCouponMaster = (body: IAddCouponMaster) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      couponCode: joi.string().max(255).required(),
      minOrderAmount: joi.number().required(),
      offerPercentage: joi.number().required(),
      couponValidity: joi.number().required(),
      useLimit: joi.number().required(),
      startDate: joi.date().required(),
      expiredDate: joi.date().required(),
      policy: joi.string().required(),
      description: joi.string().required(),
    });
    return schema.validate(body);
  };
  /**
   *CouponMaster Update
   */
  updateCouponMaster = (body: IUpdateCouponMaster) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      couponCode: joi.string().max(255).required(),
      minOrderAmount: joi.number().required(),
      offerPercentage: joi.number().required(),
      couponValidity: joi.number().required(),
      useLimit: joi.number().required(),
      startDate: joi.date().required(),
      expiredDate: joi.date().required(),
      policy: joi.string().required(),
      description: joi.string().required(),
    });
    return schema.validate(body);
  };
}

export default CouponMaster;
