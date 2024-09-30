import { PoolClient, QueryResult } from 'pg';
import Model from '../query-builder';
import joi from 'joi';
import {
  RegisterBody,
  LoginBody,
  UpdateBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  ChangePasswordBody,
  DriverLoginBody,
} from '../../types/driver';

class Drivers extends Model {
  validateRegistration(body: RegisterBody) {
    const schema = joi.object({
      name: joi.string().max(50).required(),
      email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'in'] } })
        .required(),
      password: joi
        .string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/)
        .message(
          'Password Should be between 6-12 characters and consist uppercase, lowercase, number and special characters',
        ),
      phone: joi
        .string()
        .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .message('Invalid phone number format'),
      zoneId: joi.array().items(joi.string()).min(1).unique().required().messages({
        'array.base': 'Field must be an array',
        'array.min': 'Array must contain at least one item',
        'array.unique': 'All items in the array must be unique',
      }),
      address: joi.string().allow(''),
      landmark: joi.string().allow(''),
      panNo: joi.string().allow(''),
      aadharNo: joi.string().allow(''),
      licenseNo: joi.string().allow(''),
    });
    return schema.validate(body);
  }

  validateLogin(body: LoginBody) {
    const schema = joi.object({
      email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'in'] } })
        .required(),
      password: joi
        .string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/)
        .message(
          'Password Should be between 6-12 characters and consist uppercase, lowercase, number and special characters',
        )
        .required(),
      invitationId: joi.string().allow(''),
    });
    return schema.validate(body);
  }

  validateDriverLogin(body: DriverLoginBody) {
    const schema = joi.object({
      phone: joi
        .string()
        .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .message('Invalid phone number format'),
      password: joi
        .string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/)
        .message(
          'Password Should be between 6-12 characters and consist uppercase, lowercase, number and special characters',
        )
        .required(),
      invitationId: joi.string().allow(''),
    });
    return schema.validate(body);
  }

  validateUpdate(body: UpdateBody) {
    const schema = joi.object({
      name: joi.string().max(50).required(),
      phone: joi
        .string()
        .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .message('Invalid phone number format'),
      zoneId: joi.array().items(joi.string()).min(1).unique().required().messages({
        'array.base': 'Field must be an array',
        'array.min': 'Array must contain at least one item',
        'array.unique': 'All items in the array must be unique',
      }),
      address: joi.string().allow(''),
      landmark: joi.string().allow(''),
      panNo: joi.string().allow(''),
      aadharNo: joi.string().allow(''),
      licenseNo: joi.string().allow(''),
    });
    return schema.validate(body);
  }

  validateForgotPassword(body: ForgotPasswordBody) {
    const schema = joi.object({
      email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'in'] } })
        .required(),
    });
    return schema.validate(body);
  }

  validateResetPassword(body: ResetPasswordBody) {
    const schema = joi.object({
      email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'in'] } })
        .required(),
      password: joi
        .string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/)
        .message(
          'Password Should be between 6-12 characters and consist uppercase, lowercase, number and special characters',
        )
        .required(),
    });
    return schema.validate(body);
  }

  validateChangePassword(body: ChangePasswordBody) {
    const schema = joi.object({
      currentPassword: joi
        .string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/)
        .message(
          'Password Should be between 6-12 characters and consist uppercase, lowercase, number and special characters',
        )
        .required(),
      newPassword: joi
        .string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/)
        .message(
          'Password Should be between 6-12 characters and consist uppercase, lowercase, number and special characters',
        )
        .required(),
      confirmPassword: joi.string().min(6).max(12).required(),
    });
    return schema.validate(body);
  }
}

export default Drivers;
