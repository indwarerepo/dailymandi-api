import { PoolClient, QueryResult } from 'pg';
import Model from '../query-builder';
import joi from 'joi';
import {
  RegisterBody,
  LoginBody,
  OtpBody,
  UpdateBody,
  GoogleAuthBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  ChangePasswordBody,
  CustomerLoginBody,
  CustomerRegisterBody,
  CustomerOtpBody,
  CustomerUpdateBody,
} from '../../types/user';

class Users extends Model {
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
        )
        .required(),
      referredBy: joi.string().allow('', null),
      userType: joi.string().allow(''),
    });
    return schema.validate(body);
  }
  //{ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'in'] } }
  validateLogin(body: LoginBody) {
    const schema = joi.object({
      email: joi.string().email().required(),
      password: joi
        .string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/)
        .message(
          'Password Should be between 6-12 characters and consist uppercase, lowercase, number and special characters',
        )
        .required(),
      referredBy: joi.string().allow(''),
    });
    return schema.validate(body);
  }

  validateOtp(body: OtpBody) {
    const schema = joi.object({
      email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'in'] } })
        .required(),
      otp: joi.number().required(),
    });
    return schema.validate(body);
  }

  googleAuthBody(body: GoogleAuthBody) {
    const schema = joi.object({
      name: joi.string().max(50).required(),
      email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'in'] } })
        .required(),
      googleId: joi.string().required(),
      image: joi.string().allow(null),
      referredBy: joi.string().allow(''),
    });
    return schema.validate(body);
  }

  validateUpdate(body: UpdateBody) {
    const schema = joi.object({
      name: joi.string().max(50).allow(''),
      phone: joi.string().max(50).allow(''),
      language: joi.string().max(50).allow(''),
      dateFormat: joi.string().max(50).allow(''),
      gmtOffset: joi.string().max(50).allow(''),
      image: joi.string().allow(''),
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

  validateCustomerRegister(body: CustomerRegisterBody) {
    const schema = joi.object({
      name: joi.string().max(50).required(),
      referredBy: joi.string().allow(''),
      phone: joi
        .string()
        .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .message('Invalid phone number format')
        .required(),
    });
    return schema.validate(body);
  }
  validateCustomerLogin(body: CustomerLoginBody) {
    const schema = joi.object({
      phone: joi
        .string()
        .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .message('Invalid phone number format')
        .required(),
    });
    return schema.validate(body);
  }
  validateCustomerOtp(body: CustomerOtpBody) {
    const schema = joi.object({
      phone: joi
        .string()
        .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .message('Invalid phone number format')
        .required(),
      otp: joi.number().integer().required(),
    });
    return schema.validate(body);
  }
  validateCustomerUpdate(body: CustomerUpdateBody) {
    const schema = joi.object({
      name: joi.string().max(50),
      email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'in'] } }),
    });
    return schema.validate(body);
  }
}

export default Users;
