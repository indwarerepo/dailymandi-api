import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddUserTransaction, IUpdateUserTransaction } from '../../types/user-transaction';

class UserTransaction extends Model {
  /**
   *UserTransaction Add
   */
  addUserTransaction = (body: IAddUserTransaction) => {
    const schema = joi.object({
      remarks: joi.string().allow('').optional(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
  /**
   *UserTransaction Update
   */
  updateUserTransaction = (body: IUpdateUserTransaction) => {
    const schema = joi.object({
      remarks: joi.string().allow('').optional(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
}

export default UserTransaction;
