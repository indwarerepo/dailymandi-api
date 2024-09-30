import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddQrCode, IUpdateQrCode } from '../../types/qrcode';

class QrCode extends Model {
  /**
   * QrCode Add
   */
  addQrCode = (body: IAddQrCode) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      image: joi.string().optional(),
    });
    return schema.validate(body);
  };
  /**
   * QrCode Update
   */
  updateQrCode = (body: IUpdateQrCode) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      image: joi.string().optional(),
    });
    return schema.validate(body);
  };
}

export default QrCode;
