import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddDriverStatus, IUpdateDriverStatus } from '../../types/driver-status';

class DriverStatus extends Model {
  /**
   *IAddDriverStatus Add
   */
  addDriverStatus = (body: IAddDriverStatus) => {
    const schema = joi.object({
      remarks: joi.string(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
  /**
   *IUpdateDriverStatus Update
   */
  updateDriverStatus = (body: IUpdateDriverStatus) => {
    const schema = joi.object({
      remarks: joi.string(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
}

export default DriverStatus;
