import { Server } from 'http';
import config from 'config';
import winston, { createLogger, format } from 'winston';
const { combine, printf } = format;

/**
 * for log
 */
export default function () {
  winston.exceptions.handle(new winston.transports.File({ filename: 'uncaughtExceptions.log' }));
  winston.exceptions.handle(new winston.transports.Console());

  const customLogFormat = printf(({ level, message }) => {
    return `[${level}] : ${message}`;
  });
  const logger = createLogger({
    level: 'debug',
    format: combine(format.colorize(), customLogFormat),
    transports: [
      new winston.transports.File({ filename: 'logfile.log' }),
      new winston.transports.Console(),
    ],
  });

  winston.add(logger);
}

export const uncaughtException = () => {
  process.on('uncaughtException', (err: Error) => {
    winston.error(`${err.name}: ${err.message}`);

    if (['development', 'dev'].includes(config.get('node_env'))) {
      const stackTrace: any = err.stack || err.message || err;
      const stackLines = stackTrace.split('\n');
      let fileRouteLine = '';
      for (const line of stackLines) {
        if (line.includes(__dirname)) {
          fileRouteLine = line.trim();
          break;
        }
      }
      winston.error(`File path: ${fileRouteLine}`);
      winston.error('Uncaught exception occurred! Shutting down...');
      process.exit(1);
    } else {
      winston.error('Uncaught exception occurred');
    }
  });
};

export const unhandledRejection = (server: Server) => {
  process.on('unhandledRejection', (err: Error) => {
    winston.error(`${err.name}: ${err.message}`);

    if (['development', 'dev'].includes(config.get('node_env'))) {
      const stackTrace: any = err.stack || err.message || '';
      const stackLines = stackTrace.split('\n');
      let fileRouteLine = '';
      for (const line of stackLines) {
        if (line.includes(__dirname)) {
          fileRouteLine = line.trim();
          break;
        }
      }
      winston.error(`File path: ${fileRouteLine}`);
      winston.error('Unhandled rejection occurred! Shutting down...');
      server.close(() => {
        process.exit(1);
      });
    } else {
      winston.error('Unhandled rejection occurred!');
    }
  });
};
