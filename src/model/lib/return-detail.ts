import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddReturnDetail, IUpdateReturnDetail } from '../../types/return-detail';

class ReturnDetail extends Model {
  /**
   *ReturnDetail Add
   */
  addReturnDetail = (body: IAddReturnDetail) => {
    const schema = joi.object({
      returnedRemarks: joi.string(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
  /**
   *IAddReturnDetail Update
   */
  updateReturnDetail = (body: IUpdateReturnDetail) => {
    const schema = joi.object({
      returnedRemarks: joi.string(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
}

export default ReturnDetail;
