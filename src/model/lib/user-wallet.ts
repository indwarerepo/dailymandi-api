import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddUserWallet, IUpdateUserWallet } from '../../types/user-wallet';

class UserWallet extends Model {
  /**
   *UserWallet Add
   */
  addUserWallet = (body: IAddUserWallet) => {
    const schema = joi.object({
      upiId: joi.string().allow('').optional(),
      accountNumber: joi.string().allow('').optional(),
      panNumber: joi.string().length(10).allow('').optional(),
      ifscCode: joi.string().length(11).allow('').optional(),
      bankName: joi.string().allow('').optional(),
      bankBranch: joi.string().allow('').optional(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
  /**
   *UserWallet Update
   */
  updateUserWallet = (body: IUpdateUserWallet) => {
    const schema = joi.object({
      upiId: joi.string().allow('').optional(),
      accountNumber: joi.string().allow('').optional(),
      panNumber: joi.string().length(10).allow('').optional(),
      ifscCode: joi.string().length(11).allow('').optional(),
      bankName: joi.string().allow('').optional(),
      bankBranch: joi.string().allow('').optional(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
}

export default UserWallet;
