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

import { TaxMasterModel } from '../model/models';
import { IAddTaxMaster, IUpdateTaxMaster } from '../types/taxMaster';

// Multer Upload Storage
/* const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseUrl = path.dirname(__dirname);
    cb(null, baseUrl + '/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage }); */

/**
 * Create new Model
 * Master table for TaxMasterModel
 */
router.post(
  '/',
  [auth],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IAddTaxMaster;
    const { error } = TaxMasterModel().addTaxMaster(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await TaxMasterModel().where({ slab: body.slab, softDelete: false }).findOne();
    if (isExist) throw new CustomError(body.slab + ' already exists.', HttpStatusCode.Conflict);

    let transaction = await TaxMasterModel().createOne({
      taxHead: body.taxHead,
      slab: body.slab,
      percentage: body.percentage,

      createdBy: (req as any).user.id,
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'New record created successfully.',
      data: transaction,
    });
  }),
);

/**
 * Bulk Business Partner
 */
/* router.post(
  '/bulk-upload',
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
    const transactionClient = await TaxMasterModel().getClient();
    try {
      await transactionClient.query('BEGIN');
      for (const data of jsonData) {
        const isExist = await TaxMasterModel()
          .select('id, name, businessPartnerType, description')
          .where({ name: data.Name })
          .findOne();

        if (isExist) {
          return res.status(HttpStatusCode.Conflict).send({
            statusCode: HttpStatusCode.Conflict,
            message: `${isExist.name} Business Partner already exists.`,
          });
        }

        const validBusinessPartnerTypes = [
          'customer',
          'employee',
          'supplier',
          'logistics',
          'contractor',
        ];
        if (!validBusinessPartnerTypes.includes(data.BusinessPartnerType)) {
          return res.status(HttpStatusCode.Conflict).send({
            statusCode: HttpStatusCode.Conflict,
            message: `${data.BusinessPartnerType} invalid BusinessPartnerType. Must be one of: customer, employee, supplier, logistics, contractor.`,
          });
        }

        const payload: any = {
          name: data.Name,
          businessPartnerType: data.BusinessPartnerType,
          description: data.Description,
          workspaceId: req.body.workspaceId,
        };

        let bpm = await TaxMasterModel()
          .select('id, name, businessPartnerType, description, isActive')
          .createOne(payload, transactionClient);
      }

      await transactionClient.query('COMMIT');

      res.status(HttpStatusCode.Created).send({
        statusCode: HttpStatusCode.Created,
        message: 'Successfully inserted record.',
        data: null,
      });
    } catch (error: any) {
      console.log('🛑 Error =>', error.message);
      res
        .status(HttpStatusCode.InternalServerError)
        .send({ statusCode: HttpStatusCode.InternalServerError, message: error.message });
    }
  },
); */

/*
 * Export with excel
 */
/* router.get(
  '/export/excel',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Fetch data from PostgreSQL
      const whereClause = { softDelete: false };
      const data = await TaxMasterModel()
        .select('id, name, businessPartnerType, description, createdAt')
        .where(whereClause)
        .find();
      if (!data) throw new CustomError('No records found.', HttpStatusCode.NotFound);

      // Convert JSON data to a worksheet
      const ws = xlsx.utils.json_to_sheet(data);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

      // Save the workbook to a temporary file
      const filePath = path.join(__dirname, 'exported_data.xlsx');
      const baseurl = path.dirname(__dirname) + '/uploads/exported_data.xlsx';
      xlsx.writeFile(wb, baseurl);
      console.log(baseurl);

      // Send the file as a response
      res.download(baseurl, 'exported_data.xlsx', (err) => {
        // if (err) {
        //   console.error('Error during file download:', err);
        // }
        // Delete the file after download
        fs.unlinkSync(baseurl);
      });
    } catch (error) {
      res.status(500).send('Error exporting data');
    }
  }),
); */

/*
 * Export with PDF
 */
/* router.get(
  '/export/pdf',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Fetch data from PostgreSQL
      const whereClause = { softDelete: false };
      const data = await TaxMasterModel()
        .select('id, name, businessPartnerType, description, createdAt')
        .where(whereClause)
        .find();
      if (!data) throw new CustomError('No records found.', HttpStatusCode.NotFound);

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      page.drawText('Exported Data:', { x: 50, y: 750 });

      data.forEach((item, index) => {
        page.drawText(`${item.name}, businessPartnerType: ${item.businessPartnerType}`, {
          x: 50,
          y: 720 - index * 20,
        });
      });

      const pdfBytes = await pdfDoc.save();

      res.setHeader('Content-Disposition', 'attachment; filename="exported_data.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      res.status(500).send('Error exporting data');
    }
  }),
); */

/**
 * Get all records
 */
router.get(
  '/',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { softDelete: false };
    const records = await TaxMasterModel()
      .select('id, taxHead,slab, percentage, isActive, createdAt')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await TaxMasterModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: records,
    });
  }),
);

/**
 * Get all records for dropdown
 */
router.get(
  '/drop-down/',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { softDelete: false };
    const records = await TaxMasterModel()
      .select('id, taxHead,slab, percentage')
      .where(whereClause)
      .find();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

/**
 * Get records by id
 */
router.get(
  '/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const isExist = await TaxMasterModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await TaxMasterModel()
      .select('id, taxHead,slab, percentage, isActive, createdAt')
      .where({ id: req.params.id, softDelete: false })
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
 * Update model by id
 */
router.put(
  '/:id',
  [auth],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IUpdateTaxMaster;
    const { error } = TaxMasterModel().updateTaxMaster(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await TaxMasterModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    let transaction = await TaxMasterModel()
      .where({ id: req.params.id })
      .select('id, slab')
      .updateOne({
        taxHead: body.taxHead,
        slab: body.slab,
        percentage: body.percentage,

        updatedBy: (req as any).user.id,
        updatedAt: new Date(),
      });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Successfully updated record.',
      data: transaction,
    });
  }),
);

/**
 * Change status of model by id
 * Active/Inactive
 */
router.put(
  '/status/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await TaxMasterModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await TaxMasterModel()
      .where({ id: req.params.id })
      .updateOne({
        isActive: isExist.isActive == true ? false : true,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed status.' });
  }),
);

/**
 * Delete model by id (soft delete)
 */
router.delete(
  '/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const delId = await TaxMasterModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
  }),
);

export default router;
