import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
import config from 'config';
import moment from 'moment';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import { generateCustomerToken, verifyToken, imageUpload } from '../helpers/util';
import {
  otpEmailTemplate,
  emailVerificationTemplate,
  welcomeEmailTemplateWithPassword,
} from '../helpers/mail-templates';
import { comparePassword, encrypt } from '../helpers/encryption';
import { emailGateway } from '../helpers/notification';
import asyncHandler from '../middlewares/asyncHandler';
import CustomError from '../middlewares/customError';
import { auth } from '../middlewares/auth';
import { customer } from '../middlewares/customer';
const router = Router();
import { UserModel, UserWalletModel, UserTransactionModel, OrderModel } from '../model/models';

import {
  CustomerRegisterBody,
  CustomerLoginBody,
  CustomerOtpBody,
  CustomerUpdateBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  User,
} from '../types/user';

import { IUpdateUserWallet, IAddUserWallet } from '../types/user-wallet';

// Multer Upload Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseUrl = path.dirname(__dirname);
    cb(null, baseUrl + '/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

interface ILoginRes {
  statusCode: number;
  message: string;
  otp: number;
}

/**
 * New registration with phone
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CustomerRegisterBody;
    const { error } = UserModel().validateCustomerRegister(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    const isExist = await UserModel()
      .select('id, name, email, isAdmin, userType')
      .where({ phone: body.phone, userType: 'Customer', softDelete: false })
      .findOne();

    if (isExist) {
      throw new CustomError('User already exists. Please Login', HttpStatusCode.Conflict);
    }

    const otp = generateOtp();
    const referralCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    let transaction = await UserModel()
      .select('id, name, phone, otp')
      .createOne({
        name: body.name,
        phone: body.phone,
        userType: 'Customer',
        referralCode: referralCode,
        referredBy: body.referredBy,
        otp: otp,
        image: `${config.get('azure_storage_url')}/customercontainer/user.jpg`,
      });

    if (req.body.referredBy != '') {
      const codeExist = await UserModel().where({ referralCode: req.body.referredBy }).findOne();
      if (!codeExist) throw new CustomError('Invalid refferel code!', HttpStatusCode.NotFound);
      let refFrequency = parseInt(codeExist.referredFreq) + 1;
      let transaction = await UserModel()
        .where({ referralCode: req.body.referredBy })
        .select('id, name')
        .updateOne({
          referredFreq: refFrequency,
        });
    }
    const customerId = transaction.id;
    let customerAccount = await UserWalletModel().createOne({
      userId: customerId,
      walletAmount: 0,
      createdBy: customerId,
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Registration Successful',
      data: transaction,
      otp: transaction.otp,
    });
  }),
);

/**
 * phone signin for customer
 */
router.post(
  '/login/get-otp',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CustomerLoginBody;
    const { error } = UserModel().validateCustomerLogin(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await UserModel()
      .select('id, name, phone, email, otp, userType')
      .where({ phone: body.phone, softDelete: false, userType: 'Customer' })
      .findOne();

    if (!isExist)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist' });

    const otp = generateOtp();
    const transaction = await UserModel()
      .select('id, name, phone, otp, userType')
      .where({ id: isExist.id })
      .updateOne({ otp: otp });

    let resBody: ILoginRes = {
      statusCode: HttpStatusCode.Ok,
      message: 'Otp sent to your phone successfully',
      otp: transaction.otp,
    };

    res.status(HttpStatusCode.Ok).send(resBody);
  }),
);

/**
 * Complete login with otp
 */
router.post(
  '/login/verify-otp',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CustomerOtpBody;

    const { error } = UserModel().validateCustomerOtp(body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

    const user = await UserModel()
      .select('id, otp, name, userType, referralCode, isAdmin, isActive')
      .where({ phone: body.phone, softDelete: false, userType: 'Customer' })
      .findOne();

    if (!user) {
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });
    }

    const isOtpValid = body.otp === user.otp;
    if (!isOtpValid) {
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: 'Invalid Otp.' });
    } else {
      const token = await generateCustomerToken(user);
      res.header('Authorization', token).status(HttpStatusCode.Ok).send({
        statusCode: HttpStatusCode.Ok,
        message: 'Login successful',
      });
    }
  }),
);

/**
 * Get user profile data
 */
router.get(
  '/myprofile',
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    const user = await UserModel()
      .select('id, name, phone, email, referralCode, referredBy, walletValue')
      .where({ id: (req as any).user.id, softDelete: false, userType: 'Customer' })
      .findOne();

    if (!user)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });

    let referralName = await UserModel().where({ referralCode: user.referredBy }).findOne();
    let refName = '';
    if (referralName) {
      refName = referralName.name;
    }
    let details = {
      ...user,
      referName: refName,
    };

    res
      .status(HttpStatusCode.Ok)
      .send({ statusCode: HttpStatusCode.Ok, message: 'Successfully get data.', data: details });
  }),
);

/**
 * Get records by id of Customers
 */
router.get(
  '/detail',
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    //console.log(req.params.id);
    const isExist = await UserModel()
      .where({ id: (req as any).user.id })
      .findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await UserModel()
      .select('id, name, email, isActive, isAdmin, twoFAOption, createdAt')
      .where({ id: (req as any).user.id })
      .findOne();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    // const details = await Promise.all(

    let wallet = await UserWalletModel().where({ userId: records.id }).findOne();
    let details = {
      ...records,
    };
    if (wallet) {
      details = {
        ...records,
        upiId: wallet.upiId,
        walletAmount: wallet.walletAmount,
        accountNumber: wallet.accountNumber,
        ifscCode: wallet.ifscCode,
        panNumber: wallet.panNumber,
        bankName: wallet.bankName,
        bankBranch: wallet.bankBranch,
      };
    }
    // );

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: details,
    });
  }),
);

/* Get Customer Transaction */
router.get(
  '/transaction/',
  [auth, customer],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    //console.log(req.params.id);
    let pageIndex: number = parseInt(req.query.pageNo);
    let pageSize: number = parseInt(req.query.pageLimit);
    let sortBy: string = req.query.sortBy;
    let sortOrder: string = req.query.sortOrder;

    const whereClause = { softDelete: false, userId: (req as any).user.id };
    const records = await UserTransactionModel()
      .select('id, transactionType, amount, remarks, orderId, isActive, createdAt')
      .populate('orders', 'id,orderNumber')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    const count = await UserTransactionModel().where(whereClause).countDocuments();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: records,
    });
  }),
);

/**
 * Update user my profile
 */
router.put(
  '/myprofile',
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CustomerUpdateBody;
    const { error } = UserModel().validateCustomerUpdate(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    const user = await UserModel()
      .select('id, name, phone, email')
      .where({ id: (req as any).user.id })
      .findOne();

    if (!user) {
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });
    }

    let updated = await UserModel()
      .where({ id: user.id })
      .select('id, name, phone, email')
      .updateOne({
        name: body.name,
        email: body.email,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Profile Updated !', data: updated });
  }),
);

/**
 * Update user my profile
 */
router.put(
  '/update-kyc',
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IAddUserWallet;
    const { error } = UserWalletModel().addUserWallet(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    const user = await UserWalletModel()
      .select('id')
      .where({ userId: (req as any).user.id })
      .findOne();

    if (!user) {
      let updated = await UserWalletModel().createOne({
        upiId: body.upiId,
        accountNumber: body.accountNumber,
        panNumber: body.panNumber,
        ifscCode: body.ifscCode,
        bankName: body.bankName,
        bankBranch: body.bankBranch,
      });
      res
        .status(HttpStatusCode.Created)
        .send({ statusCode: HttpStatusCode.Created, message: 'Kyc Updated !' });
    } else {
      let updated = await UserWalletModel().where({ id: user.id }).updateOne({
        upiId: body.upiId,
        accountNumber: body.accountNumber,
        panNumber: body.panNumber,
        ifscCode: body.ifscCode,
        bankName: body.bankName,
        bankBranch: body.bankBranch,
      });
      res
        .status(HttpStatusCode.Created)
        .send({ statusCode: HttpStatusCode.Created, message: 'Kyc Updated !' });
    }
  }),
);

/**
 * Check email with otp for forgot password
 */
/* router.post(
  '/verify-otp',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as OtpBody;

    const { error } = UserModel().validateOtp(body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

    const user = await UserModel()
      .select('id, otp, name, isAdmin, isActive')
      .where({ email: body.email })
      .findOne();

    if (!user)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });

    const isOtpValid = body.otp === user.otp;
    if (!isOtpValid)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: 'Invalid Otp.' });

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Otp Matched. Now reset your password',
    });
  }),
); */

/**
 * Resend otp for forgot password
 */
router.post(
  '/resend-otp',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ForgotPasswordBody;

    const { error } = UserModel().validateForgotPassword(body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

    const isExist = await UserModel()
      .select('id,name,email')
      .where({ email: body.email })
      .findOne();

    if (!isExist)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User not exists.' });

    const otp = generateOtp();

    await UserModel().where({ id: isExist.id }).select('id, name').updateOne({
      otp: otp,
      // otplimit: 3,
      // otptimeout: new Date(moment().add(1, 'minutes')).getTime(),
    });

    let mailBody = otpEmailTemplate(isExist.name, isExist.email, otp);
    emailGateway(body.email, mailBody.subject, mailBody.body);

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Check your mail for OTP.',
    });
  }),
);

/**
 * Change profile password
 */
/* router.put(
  '/change-password',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const { error } = UserModel().validateChangePassword(req.body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

    const user = await UserModel()
      .select('id, name, password')
      .where({ id: (req as any).user.id, isActive: true, softDelete: false })
      .findOne();
    if (!user)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist' });

    if (!user?.password)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User password does not exist' });

    const isPasswordValid = comparePassword(currentPassword, user.password as string);
    if (!isPasswordValid)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: 'Current password not matched.' });

    const isNewCnfMatched = newPassword === confirmPassword;
    if (!isNewCnfMatched)
      return res.status(HttpStatusCode.BadRequest).send({
        statusCode: HttpStatusCode.BadRequest,
        message: 'New password and confirm password not matched.',
      });

    const password = encrypt(newPassword);

    await UserModel().where({ id: user.id }).select('name').updateOne({
      password: password,
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Password changed successfully',
    });
  }),
); */

/**
 * Check current password correct or incorrect
 */
/* router.post(
  '/check-password',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const user = await UserModel()
      .select('id, name, password')
      .where({ id: (req as any).user.id })
      .findOne();

    if (!user)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });

    if (!user?.password)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User password does not exist' });

    const isPasswordValid = comparePassword(req.body.currentPassword, user.password as string);
    if (!isPasswordValid)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'Current password not matched.' });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Password matched' });
  }),
); */

/**
 * Email check for forgot password
 */
/* router.post(
  '/forgot-password',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ForgotPasswordBody;

    const { error } = UserModel().validateForgotPassword(body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

    const isExist = await UserModel()
      .select('id,name,email')
      .where({ email: body.email })
      .findOne();

    if (!isExist)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User not exists.' });

    const otp = generateOtp();

    await UserModel().where({ id: isExist.id }).select('id, name').updateOne({
      otp: otp,
      // otplimit: 3,
      // otptimeout: new Date(moment().add(1, 'minutes')).getTime(),
    });

    let mailBody = otpEmailTemplate(isExist.name, isExist.email, otp);
    emailGateway(body.email, mailBody.subject, mailBody.body);

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Check Your Mail for Password Reset OTP',
      data: otp,
    });
  }),
); */

/**
 * Change your password after email checked
 */
/* router.put(
  '/reset-password',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ResetPasswordBody;

    const { error } = UserModel().validateResetPassword(body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

    const user = await UserModel()
      .select('id, name, isAdmin, isActive')
      .where({ email: body.email })
      .findOne();
    if (!user)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist' });

    const password = encrypt(body.password);

    await UserModel().where({ id: user.id }).select('name').updateOne({
      password: password,
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Password changed successfully',
    });
  }),
); */

///////////////////////////// admin apis ////////////////////////////////

/**
 * Get all customer
 */
router.get(
  '/customer-list',
  [auth],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    let pageIndex: number = parseInt(req.query.pageNo);
    let pageSize: number = parseInt(req.query.pageLimit);
    let sortBy: string = req.query.sortBy;
    let sortOrder: string = req.query.sortOrder;

    const whereClause = { softDelete: false, userType: 'Customer' };
    const records = await UserModel()
      .select('id, name, email, phone, userType, isActive, createdAt')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();

    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);
    const count = await UserModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count: count,
      data: records,
    });
  }),
);

/**
 * Get records by id of Users
 */
router.get(
  '/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    //console.log(req.params.id);
    const isExist = await UserModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await UserModel()
      .select('id, name, email, phone, isActive, createdAt')
      .where({ id: req.params.id })
      .findOne();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

/**
 * Bulk User Update
 */
/* router.post(
  '/bulk-update',
  [auth],
  upload.single('file'),
  async (req: ICustomRequest, res: Response) => {
    if (!req.file) {
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet);

    fs.unlinkSync(filePath);
    const transactionClient = await UserModel().getClient();

    try {
      await transactionClient.query('BEGIN');

      for (const data of jsonData) {
        const isExist = await UserModel()
          .select('id, email, verificationTimeout, emailVerified')
          .where({ email: data.Email })
          .findOne();

        if (isExist) {
          return res.status(HttpStatusCode.Conflict).send({
            statusCode: HttpStatusCode.Conflict,
            message: `${isExist.email} User already exists.`,
          });
        }

        const password = encrypt(data.Password);
        const payload: any = {
          name: data.Name,
          email: data.Email,
          password: password,
          image: `${config.get('azure_storage_url')}/defaulimagetcontainer/default-user.png`,
        };

        let user = await UserModel()
          .select('id, name, email, isAdmin, isActive')
          .createOne(payload, transactionClient);

        if (user) {
          let mailBody = welcomeEmailTemplateWithPassword(user.name, data.Password);
          emailGateway(user.email, mailBody.subject, mailBody.body);
        }
      }

      await transactionClient.query('COMMIT');

      res.status(HttpStatusCode.Created).send({
        statusCode: HttpStatusCode.Created,
        message: 'Successfully inserted record.',
        data: null,
      });
    } catch (error: any) {
      await transactionClient.query('ROLLBACK');
      console.log('🛑 Error =>', error.message);
      res
        .status(HttpStatusCode.InternalServerError)
        .send({ statusCode: HttpStatusCode.InternalServerError, message: error.message });
    } finally {
      transactionClient.release();
    }
  },
); */

/**
 * Private function
 * Randomly generated otp
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

export default router;
