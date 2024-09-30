import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
// import config from 'config';
// import moment from 'moment';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import xlsx from 'xlsx';
// const { PDFDocument } = require('pdf-lib');
import asyncHandler from '../middlewares/asyncHandler';
import CustomError from '../middlewares/customError';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/admin';
const router = Router();

import { UserModel } from '../model/models';

/**
 * Get summary of an order
 */
router.get(
  '/',
  [auth],
  asyncHandler(async (req: ICustomRequest, res: Response) => {}),
);
