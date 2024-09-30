import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import CustomError from './customError';

// Error handlers for additional PostgreSQL error types

const handleUniqueViolationError = (err: any): CustomError => {
  const constraintName = err.constraint;
  const msg = `Unique constraint violation: Constraint '${constraintName}' violated`;
  return new CustomError(msg, 400);
};

const handleTypeCastError = (err: any): CustomError => {
  const msg = `Invalid data type for column: ${err.column}`;
  return new CustomError(msg, 400);
};

const handleForeignKeyViolationError = (err: any): CustomError => {
  const constraintName = err.constraint;
  const msg = `Foreign key constraint violation: Constraint '${constraintName}' violated`;
  return new CustomError(msg, 400);
};

const handleUndefinedColumnError = (err: any): CustomError => {
  const column = err.column;
  const msg = `Undefined column: '${column}'`;
  return new CustomError(msg, 400);
};

const handleUndefinedTableError = (err: any): CustomError => {
  const table = err.table;
  const msg = `Undefined table: '${table}'`;
  return new CustomError(msg, 400);
};

const handleSyntaxError = (err: any): CustomError => {
  // const position = err.position;
  const msg = `Code: ${err.code}, Syntax error or invalid SQL statement`;
  return new CustomError(msg, 400);
};

const handleInsufficientPrivilegesError = (err: any): CustomError => {
  const msg = 'Insufficient privileges';
  return new CustomError(msg, 403);
};

const handleConnectionError = (err: any): CustomError => {
  const msg = 'Database connection error';
  return new CustomError(msg, 500);
};

const handleClientConnectionClosedError = (err: any): CustomError => {
  const msg = 'Client connection closed unexpectedly';
  return new CustomError(msg, 500);
};

const handleDeadlockDetectedError = (err: any): CustomError => {
  const msg = 'Deadlock detected';
  return new CustomError(msg, 500);
};

const handleDataSerializationFailureError = (err: any): CustomError => {
  const msg = 'Data serialization failure';
  return new CustomError(msg, 500);
};

const devErrors = (res: Response, err: CustomError) => {
  res.status(err.statusCode).send({
    status: err.statusCode,
    message: err.message,
    stackTrace: err.stack,
    error: err,
  });
};

const prodErrors = (res: Response, err: CustomError) => {
  if (err.isOperational) {
    res.status(err.statusCode).send({
      status: err.statusCode,
      message: err.message,
    });
  } else {
    res.status(err.statusCode).send({
      status: err.statusCode,
      message: 'Something Went Wrong',
      error: err.stack,
    });
  }
};

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  winston.error(err);

  switch (err.code) {
    case '23505':
      // PostgreSQL unique violation error code
      err = handleUniqueViolationError(err);
      break;
    case '22P02':
    case '23502':
      // PostgreSQL type cast error code or not-null violation error code
      err = handleTypeCastError(err);
      break;
    case '23503':
      // PostgreSQL foreign key violation error code
      err = handleForeignKeyViolationError(err);
      break;
    case '42703':
      // PostgreSQL undefined column error code
      err = handleUndefinedColumnError(err);
      break;
    case '42P01':
      // PostgreSQL undefined table error code
      err = handleUndefinedTableError(err);
      break;
    case '42601':
    case '42000':
      // PostgreSQL syntax error or invalid SQL statement error code
      err = handleSyntaxError(err);
      break;
    case '42501':
      // PostgreSQL insufficient privileges error code
      err = handleInsufficientPrivilegesError(err);
      break;
    case '08006':
    case '08001':
      // PostgreSQL connection errors
      err = handleConnectionError(err);
      break;
    case '57P01':
      // PostgreSQL client connection closed unexpectedly error code
      err = handleClientConnectionClosedError(err);
      break;
    case '40P01':
      // PostgreSQL deadlock detected error code
      err = handleDeadlockDetectedError(err);
      break;
    case '40001':
      // PostgreSQL data serialization failure error code
      err = handleDataSerializationFailureError(err);
      break;
    default:
      err = err;
      break;
  }

  process.env.tr_node_env === 'development' ? devErrors(res, err) : prodErrors(res, err);
};

export default errorHandler;
