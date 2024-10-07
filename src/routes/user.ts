import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
import config from 'config';
import moment from 'moment';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import {
  generateEmailVerificationLink,
  generateToken,
  generateUserToken,
  generateDriverToken,
  verifyToken,
  imageUpload,
} from '../helpers/util';
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
import { isAdmin } from '../middlewares/admin';
const router = Router();

import {
  UserModel,
  UserWalletModel,
  UserTransactionModel,
  OrderModel,
  DriverModel,
} from '../model/models';
import {
  RegisterBody,
  LoginBody,
  OtpBody,
  UpdateBody,
  GoogleAuthBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  User,
} from '../types/user';
import { DriverLoginBody, Driver } from '../types/driver';
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
  userType: string;
  otp?: number;
}
/**
 * Admin registration
 */

router.post('/admin-register', async (req: Request, res: Response) => {
  const body = req.body as RegisterBody;
  const transactionClient = await UserModel().getClient();

  try {
    const { error } = UserModel().validateRegistration(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    const isExist = await UserModel()
      .select('id, email, verificationTimeout, emailVerified')
      .where({ email: body.email })
      .findOne();

    if (isExist && isExist.emailVerified)
      throw new CustomError('User already exists. Please Login', HttpStatusCode.Conflict);

    if (isExist && !isExist.emailVerified && isExist.verificationTimeout > new Date())
      throw new CustomError(
        'Verification Link Already Sent, Please Check Your Email',
        HttpStatusCode.BadRequest,
      );

    const password = encrypt(body.password);
    const timeLimit = 1;
    const tokenTimeout = moment().add(timeLimit, 'day').toDate();
    const payload: any = {
      name: body.name,
      email: body.email,
      password: password,
      verificationTimeout: tokenTimeout,
      userType: body.userType,
      isAdmin: true,
      emailVerified: true,
      image: `${config.get('azure_storage_url')}/defaulimagetcontainer/default-user.png`,
    };

    transactionClient.query('BEGIN');
    let user;
    if (isExist) {
      delete payload.email;
      user = await UserModel()
        .select('id, name, email, isAdmin, isActive')
        .where({ email: body.email })
        .updateOne(payload, transactionClient);
    } else
      user = await UserModel()
        .select('id, name, email, isAdmin, isActive')
        .createOne(payload, transactionClient);

    transactionClient.query('COMMIT');
  } catch (error: any) {
    await transactionClient.query('ROLLBACK');
    console.log('🛑 Error =>', error.message);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send({ statusCode: HttpStatusCode.InternalServerError, message: error.message });
  } finally {
    transactionClient.release();
  }
  res
    .status(HttpStatusCode.Created)
    .send({ statusCode: HttpStatusCode.Created, message: 'Registration Successful' });
});

/**
 * New registration with email
 */
router.post('/register', [auth], async (req: Request, res: Response) => {
  const body = req.body as RegisterBody;
  const transactionClient = await UserModel().getClient();

  try {
    const { error } = UserModel().validateRegistration(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    const isExist = await UserModel()
      .select('id, email, verificationTimeout, emailVerified')
      .where({ email: body.email, userType: body.userType, softDelete: false })
      .findOne();

    if (isExist && isExist.emailVerified)
      throw new CustomError('User already exists. Please Login', HttpStatusCode.Conflict);

    if (isExist && !isExist.emailVerified && isExist.verificationTimeout > new Date())
      throw new CustomError(
        'Verification Link Already Sent, Please Check Your Email',
        HttpStatusCode.BadRequest,
      );

    const password = encrypt(body.password);
    const timeLimit = 1;
    const tokenTimeout = moment().add(timeLimit, 'day').toDate();
    const payload: any = {
      name: body.name,
      email: body.email,
      password: password,
      verificationTimeout: tokenTimeout,
      userType: body.userType,
      image: `${config.get('azure_storage_url')}/defaulimagetcontainer/default-user.png`,
    };

    transactionClient.query('BEGIN');
    let user;
    if (isExist) {
      delete payload.email;
      user = await UserModel()
        .select('id, name, email, isAdmin, isActive')
        .where({ email: body.email })
        .updateOne(payload, transactionClient);
    } else
      user = await UserModel()
        .select('id, name, email, isAdmin, isActive')
        .createOne(payload, transactionClient);

    transactionClient.query('COMMIT');
  } catch (error: any) {
    await transactionClient.query('ROLLBACK');
    console.log('🛑 Error =>', error.message);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send({ statusCode: HttpStatusCode.InternalServerError, message: error.message });
  } finally {
    transactionClient.release();
  }
  res
    .status(HttpStatusCode.Created)
    .send({ statusCode: HttpStatusCode.Created, message: 'Registration Successful' });
});

/**
 * Email signin for user
 */
router.post('/login/v1', async (req: Request, res: Response) => {
  const body = req.body as LoginBody;
  const transactionClient = await UserModel().getClient();

  try {
    const { error } = UserModel().validateLogin(body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

    const user = await UserModel()
      .select('id, email, password, userType, name, isAdmin, isActive')
      .where({ email: body.email, emailVerified: true })
      .findOne();
    if (!user)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist' });

    const isPasswordValid = comparePassword(body.password, user.password as string);
    if (!isPasswordValid)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: 'Invalid Credentials.' });

    let resBody: ILoginRes = {
      statusCode: HttpStatusCode.Ok,
      message: 'Login Successful',
      // isTwoFAuth: user.isUseTwoFA,
      userType: user.userType,
    };
    transactionClient.query('BEGIN');
    // console.log(user.isUseTwoFA);return;
    if (user.isUseTwoFA) {
      const otp = generateOtp();
      await UserModel().where({ id: user.id }).updateOne({ otp: otp }, transactionClient);

      let mailBody = otpEmailTemplate(user.name, user.email, otp);
      emailGateway(body.email, mailBody.subject, mailBody.body);
      resBody = { ...resBody, otp };
    } else {
      const token = await generateUserToken(user as User);
      res.header('Authorization', token);
    }

    transactionClient.query('COMMIT');
    res.status(HttpStatusCode.Ok).send(resBody);
  } catch (error: any) {
    await transactionClient.query('ROLLBACK');
    console.log('🛑 Error =>', error.message);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send({ statusCode: HttpStatusCode.InternalServerError, message: error.message });
  } finally {
    transactionClient.release();
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const body = req.body as LoginBody;
  const transactionClient = await UserModel().getClient();

  try {
    const { error } = UserModel().validateLogin(body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

    const user = await UserModel()
      .select('id, email, password, userType, name, isAdmin, isActive')
      .where({ email: body.email })
      .findOne();
    let userType = '';
    let driver;

    if (!user) {
      driver = await DriverModel()
        .select(
          'id, email, name, phone, password, address, landmark, panNo, aadharNo, licenseNo, isActive,driverStatus',
        )
        .where({ email: body.email, softDelete: false, isActive: true, driverStatus: true })
        .findOne();

      if (!driver) {
        return res
          .status(HttpStatusCode.NotFound)
          .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist' });
      } else {
        // console.log(driver);
        const isPasswordValid = comparePassword(body.password, driver.password as string);
        //console.log(isPasswordValid);
        userType = 'Driver';
        if (!isPasswordValid)
          return res
            .status(HttpStatusCode.BadRequest)
            .send({ statusCode: HttpStatusCode.BadRequest, message: 'Invalid Credentials.' });
      }
    } else {
      userType = 'Admin';
      const isPasswordValid = comparePassword(body.password, user.password as string);
      //console.log(user);
      //console.log(isPasswordValid);
      if (!isPasswordValid)
        return res
          .status(HttpStatusCode.BadRequest)
          .send({ statusCode: HttpStatusCode.BadRequest, message: 'Invalid Credentials.' });
    }
    let resBody: ILoginRes = {
      statusCode: HttpStatusCode.Ok,
      message: 'Login Successful',
      userType: userType,
    };
    // console.log(userType);
    // transactionClient.query('BEGIN');
    // console.log(user.isUseTwoFA);return;
    if (userType == 'Driver') {
      console.log('driver');
      // const otp = generateOtp();
      // await UserModel().where({ id: user.id }).updateOne({ otp: otp }, transactionClient);
      // let mailBody = otpEmailTemplate(user.name, user.email, otp);
      // emailGateway(body.email, mailBody.subject, mailBody.body);
      // resBody = { ...resBody, otp };
      const token = await generateDriverToken(driver as Driver);
      //console.log(token);
      res.header('Authorization', token);
    } else {
      // console.log('admin');
      const token = await generateUserToken(user as User);
      //console.log(token);
      res.header('Authorization', token);
    }

    // transactionClient.query('COMMIT');
    res.status(HttpStatusCode.Ok).send(resBody);
  } catch (error: any) {
    // await transactionClient.query('ROLLBACK');
    console.log('🛑 Error =>', error.message);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send({ statusCode: HttpStatusCode.InternalServerError, message: error.message });
  }
  // finally {
  //   transactionClient.release();
  // }
});

/**
 * Email account verification through url
 */
router.post('/verify-account', async (req: Request, res: Response) => {
  const body = req.body as { token: string };

  const userPayload = verifyToken(body.token) as { id: string; email: string };

  const transactionClient = await UserModel().getClient();
  try {
    const user = await UserModel()
      .select('id, name, isAdmin, isActive, verificationTimeout')
      .where({ email: userPayload.email })
      .findOne();

    if (!user)
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });

    if (new Date() > user.verificationTimeout)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: 'Verification Link Expired' });

    await transactionClient.query('BEGIN');

    // Invalidate Verification link
    await UserModel()
      .where({ id: user.id })
      .updateOne({ verificationTimeout: new Date(), emailVerified: true }, transactionClient);

    await transactionClient.query('COMMIT');

    const token = await generateUserToken(user as User);
    res.header('Authorization', token).status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Account Verified Successfully',
    });
  } catch (error: any) {
    await transactionClient.query('ROLLBACK');
    console.log('🛑 Error =>', error.message);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send({ statusCode: HttpStatusCode.InternalServerError, message: error.message });
  } finally {
    transactionClient.release();
  }
});

/**
 * Check if email is verified by user
 */
router.post(
  '/check-email-verification',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { email: string };

    const user = await UserModel()
      .select('id, name, isAdmin, isActive, emailVerified')
      .where({ email: body.email })
      .findOne();

    if (!user) throw new CustomError('User does not exist.', HttpStatusCode.NotFound);

    if (!user.emailVerified)
      throw new CustomError('Verification Pending', HttpStatusCode.BadRequest);

    const token = await generateUserToken(user as User);
    res.header('Authorization', token).status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Account Verified Successfully',
    });
  }),
);

/**
 * Signin/Signup with google
 */
router.post('/google-authentication', async (req: Request, res: Response) => {
  const body = req.body as GoogleAuthBody;

  const transactionClient = await UserModel().getClient();
  try {
    const { error } = UserModel().googleAuthBody(body);
    if (error)
      return res
        .status(HttpStatusCode.BadRequest)
        .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

    const user = await UserModel()
      .select('id, email, name, isAdmin, isActive, googleId')
      .where({ email: body.email })
      .findOne();

    transactionClient.query('BEGIN');
    let resBody = { status: 400, body: {} as any };
    if (user) {
      const isGoogleIdValid = body.googleId === (user.googleId as string);
      if (isGoogleIdValid) {
        const token = await generateUserToken(user as User);

        res.header('Authorization', token);
        resBody = {
          ...resBody,
          status: HttpStatusCode.Ok,
          body: { statusCode: HttpStatusCode.Ok, message: 'Login Successful' },
        };
      } else {
        resBody = {
          ...resBody,
          status: HttpStatusCode.BadRequest,
          body: { statusCode: HttpStatusCode.BadRequest, message: 'Invalid Google Id' },
        };
      }
    } else {
      const newUser = await UserModel()
        .select('id, name, email, isAdmin, isActive')
        .createOne(
          {
            name: body.name,
            email: body.email,
            isUseGoogleAuth: true,
            googleId: body.googleId,
            image: body.image || '',
            emailVerified: true,
          },
          transactionClient,
        );

      resBody = {
        ...resBody,
        status: HttpStatusCode.Created,
        body: {
          statusCode: HttpStatusCode.Created,
          message: 'Registration Successful',
          isTwoFAuth: false,
        },
      };

      const token = await generateUserToken(newUser as User);
      res.header('Authorization', token);
    }
    transactionClient.query('COMMIT');
    return res.status(resBody.status).send(resBody.body);
  } catch (error: any) {
    await transactionClient.query('ROLLBACK');
    console.log('🛑 Error =>', error);
    return res
      .status(HttpStatusCode.InternalServerError)
      .send({ statusCode: HttpStatusCode.InternalServerError, message: error.message });
  } finally {
    transactionClient.release();
  }
});

/**
 * Bulk User Update
 */
router.post('/', [auth], upload.single('file'), async (req: ICustomRequest, res: Response) => {
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
});

/**
 * Get user profile data
 */
router.get('/myprofile', [auth], async (req: Request, res: Response) => {
  const user = await UserModel()
    .select('id, name, phone, image, email, dateFormat, gmtOffset, language, colors, isUseTwoFA')
    .where({ id: (req as any).user.id })
    .findOne();

  if (!user)
    return res
      .status(HttpStatusCode.NotFound)
      .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });

  res
    .status(HttpStatusCode.Ok)
    .send({ statusCode: HttpStatusCode.Ok, message: 'Successfully get data.', user: user });
});

/**
 * Update user my profile
 */
router.put('/myprofile', [auth], async (req: Request, res: Response) => {
  const body = req.body as UpdateBody;
  const { error } = UserModel().validateUpdate(body);
  if (error)
    return res
      .status(HttpStatusCode.BadRequest)
      .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

  const user = await UserModel()
    .select('id, name, image')
    .where({ id: (req as any).user.id })
    .findOne();

  let profileImg = user.image;

  if (!user)
    return res
      .status(HttpStatusCode.NotFound)
      .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });

  if (body.image) {
    //image upload to azure storage container from base64
    let imageUrl: string = '';
    let fileUpload = await imageUpload(body.image, `usercontainer`);
    if (fileUpload) {
      imageUrl = fileUpload;
    } else {
      return res.status(HttpStatusCode.UnsupportedMediaType).send({
        statusCode: HttpStatusCode.UnsupportedMediaType,
        message: 'Only png, jpg & jpeg filetype supported.',
      });
    }

    let updated = await UserModel()
      .where({ id: user.id })
      .select('name,language, image')
      .updateOne({
        name: body.name,
        phone: body.phone,
        image: imageUrl,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Profile Updated !', user: updated });
  } else {
    let updated = await UserModel()
      .where({ id: user.id })
      .select('name,language, image')
      .updateOne({
        name: body.name,
        phone: body.phone,
        image: profileImg,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Profile Updated !', user: updated });
  }
});

/**
 * Change profile password
 */
router.put('/change-password', [auth], async (req: Request, res: Response) => {
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
});

/**
 * Check current password correct or incorrect
 */
router.post('/check-password', [auth], async (req: Request, res: Response) => {
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
});

/**
 * Two factor authentication for user
 */
router.put('/two-factor-auth', [auth], async (req: Request, res: Response) => {
  const user = await UserModel()
    .select('id, isUseTwoFA')
    .where({ id: (req as any).user.id })
    .findOne();

  if (!user)
    return res
      .status(HttpStatusCode.NotFound)
      .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });

  await UserModel().where({ id: user.id }).select('name').updateOne({
    isUseTwoFA: !user.isUseTwoFA,
  });

  res
    .status(HttpStatusCode.Created)
    .send({ statusCode: HttpStatusCode.Created, message: '2FA Status Updated !' });
});

/**
 * Email otp check for 2nd factor authentication
 */
router.post('/validate-otp', async (req: Request, res: Response) => {
  const body = req.body as OtpBody;

  const { error } = UserModel().validateOtp(body);
  if (error)
    return res.status(400).send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

  const user = await UserModel()
    .select('id,otp, name, isAdmin, isActive')
    .where({ email: body.email })
    .findOne();

  if (!user)
    return res
      .status(404)
      .send({ statusCode: HttpStatusCode.NotFound, message: 'User does not exist.' });

  const isOtpValid = body.otp === user.otp;
  if (!isOtpValid)
    return res.status(400).send({ statusCode: HttpStatusCode.BadRequest, message: 'Invalid Otp.' });

  const token = await generateUserToken(user as User);
  res.header('Authorization', token).status(200).send({
    statusCode: HttpStatusCode.Ok,
    message: 'Otp Matched. Login Successful',
  });
});

/**
 * Resend otp for two factor authentication
 */
router.post('/twofactorauth-resend-otp', async (req: Request, res: Response) => {
  const body = req.body as ForgotPasswordBody;

  const { error } = UserModel().validateForgotPassword(body);
  if (error)
    return res
      .status(HttpStatusCode.BadRequest)
      .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

  const isExist = await UserModel().select('id,name,email').where({ email: body.email }).findOne();

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
});

/**
 * Email check for forgot password
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  const body = req.body as ForgotPasswordBody;

  const { error } = UserModel().validateForgotPassword(body);
  if (error)
    return res
      .status(HttpStatusCode.BadRequest)
      .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

  const isExist = await UserModel().select('id,name,email').where({ email: body.email }).findOne();

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
});

/**
 * Check email with otp for forgot password
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
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
});

/**
 * Resend otp for forgot password
 */
router.post('/resend-otp', async (req: Request, res: Response) => {
  const body = req.body as ForgotPasswordBody;

  const { error } = UserModel().validateForgotPassword(body);
  if (error)
    return res
      .status(HttpStatusCode.BadRequest)
      .send({ statusCode: HttpStatusCode.BadRequest, message: error.message });

  const isExist = await UserModel().select('id,name,email').where({ email: body.email }).findOne();

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
});

/**
 * Change your password after email checked
 */
router.put('/reset-password', async (req: Request, res: Response) => {
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
});

/**
 * Get all admin users
 */
router.get(
  '/list',
  [auth],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    // console.log('ok');return;
    let pageIndex: number = parseInt(req.query.pageNo);
    let pageSize: number = parseInt(req.query.pageLimit);
    let sortBy: string = req.query.sortBy;
    let sortOrder: string = req.query.sortOrder;

    const records = await UserModel()
      .select('id, name, email, phone, image, userType, isActive, isAdmin, twoFAOption, createdAt')
      .where({
        softDelete: false,
        userType: 'Admin',
      })
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();

    // console.log(records);return;
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);
    const count = await UserModel()
      .where({
        softDelete: false,
        userType: 'Admin',
      })
      .countDocuments();
    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
      count: count,
    });
  }),
);

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

    const records = await UserModel()
      .select(
        'id, name, email, phone, image, userType, referralCode, referredBy, walletValue, isActive, isAdmin, twoFAOption, createdAt',
      )
      .where({
        softDelete: false,
        userType: 'Customer',
      })
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);
    const count = await UserModel()
      .where({
        softDelete: false,
        userType: 'Customer',
      })
      .countDocuments();
    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
      count: count,
    });
  }),
);

/**
 * Get records by id of Customers
 */
router.get(
  '/customer/detail/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    //console.log(req.params.id);
    const isExist = await UserModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await UserModel()
      .select('id, name, email, isActive, isAdmin, twoFAOption, createdAt')
      .where({ id: req.params.id })
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
  '/customer-transaction/:id',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    //console.log(req.params.id);
    let pageIndex: number = parseInt(req.query.pageNo);
    let pageSize: number = parseInt(req.query.pageLimit);
    let sortBy: string = req.query.sortBy;
    let sortOrder: string = req.query.sortOrder;

    const whereClause = { softDelete: false, userId: req.params.id };
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
 * Get all driver
 */
router.get(
  '/driver-list',
  [auth],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    let pageIndex: number = parseInt(req.query.pageNo);
    let pageSize: number = parseInt(req.query.pageLimit);
    let sortBy: string = req.query.sortBy;
    let sortOrder: string = req.query.sortOrder;

    const records = await UserModel()
      .select('id, name, email, phone, image, userType, isActive, isAdmin, twoFAOption, createdAt')
      .where({
        softDelete: false,
        userType: 'Driver',
      })
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);
    const count = await UserModel()
      .where({
        softDelete: false,
        userType: 'Driver',
      })
      .countDocuments();
    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
      count: count,
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
      .select('id, name, email, isActive, isAdmin, twoFAOption, createdAt')
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
 * Private function
 * Randomly generated otp
 */
function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000);
}

export default router;
