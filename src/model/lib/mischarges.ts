import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddMisCharge, IUpdateMisCharge } from '../../types/mischarges';

class MisCharge extends Model {
  /**
   *MisCharge Add
   */
  addMisCharge = (body: IAddMisCharge) => {
    const schema = joi.object({
      defaultDiscountRate: joi.number().allow(null, '').optional(),
      specialDiscountRate: joi.number().allow(null, '').optional(),
      defaultTaxRate: joi.number().allow(null, '').optional(),
      specialTaxRate: joi.number().allow(null, '').optional(),
      defaultDeliveryCharge: joi.number().allow(null, '').optional(),
      specialDeliveryRate: joi.number().allow(null, '').optional(),
      welcomeWalletAmt: joi.number().allow(null, '').optional(),
      walletDeductionRateOnOrder: joi.number().allow(null, '').optional(),
      orderReturnCommRateOA: joi.number().allow(null, '').optional(),
      orderReturnCommRateNOA: joi.number().allow(null, '').optional(),
      refByAddCommRate: joi.number().allow(null, '').optional(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
  /**
   *MisCharge Update
   */
  updateMisCharge = (body: IUpdateMisCharge) => {
    const schema = joi.object({
      defaultDiscountRate: joi.number().allow(null, '').optional(),
      specialDiscountRate: joi.number().allow(null, '').optional(),
      defaultTaxRate: joi.number().allow(null, '').optional(),
      specialTaxRate: joi.number().allow(null, '').optional(),
      defaultDeliveryCharge: joi.number().allow(null, '').optional(),
      specialDeliveryRate: joi.number().allow(null, '').optional(),
      welcomeWalletAmt: joi.number().allow(null, '').optional(),
      walletDeductionRateOnOrder: joi.number().allow(null, '').optional(),
      orderReturnCommRateOA: joi.number().allow(null, '').optional(),
      orderReturnCommRateNOA: joi.number().allow(null, '').optional(),
      refByAddCommRate: joi.number().allow(null, '').optional(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
}

export default MisCharge;
