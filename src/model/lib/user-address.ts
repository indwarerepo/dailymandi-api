import { PoolClient, QueryResult } from 'pg';
import Model from '../query-builder';
import joi from 'joi';
import { IAddUserAddress, IUpdateUserAddress } from '../../types/user-address';

class Drivers extends Model {
  validateAddUserAddress(body: IAddUserAddress) {
    const schema = joi.object({
      company: joi.string().allow('', null).optional(),
      firstName: joi.string().required(),
      lastName: joi.string().allow('', null).optional(),
      addressOne: joi.string().required(),
      addressTwo: joi.string().allow('', null).optional(),
      addressTitle: joi.string().required(),
      city: joi.string().allow('', null).optional(),
      state: joi.string().allow('', null).optional(),
      country: joi.string().allow('', null).optional(),
      phone: joi
        .string()
        .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .message('Invalid phone number format')
        .required(),
    });
    return schema.validate(body, { allowUnknown: true });
  }

  validateUpdateUserAddress(body: IUpdateUserAddress) {
    const schema = joi.object({
      pincode: joi.string().max(50).required(),
      company: joi.string().allow('', null).optional(),
      firstName: joi.string().required(),
      lastName: joi.string().allow('', null).optional(),
      addressOne: joi.string().required(),
      addressTwo: joi.string().allow('', null).optional(),
      addressTitle: joi.string().required(),
      city: joi.string().allow('', null).optional(),
      state: joi.string().allow('', null).optional(),
      country: joi.string().allow('', null).optional(),
      phone: joi
        .string()
        .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .message('Invalid phone number format')
        .required(),
    });
    return schema.validate(body, { allowUnknown: true });
  }
}

export default Drivers;
