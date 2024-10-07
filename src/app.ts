import express from 'express';
import routes from './startup/routes';
import configureResponse from './startup/prod';
import logger, { uncaughtException, unhandledRejection } from './startup/logging';
import './helpers/cron-jobs';
// import { InitSocket } from './socket';
// import { mongoCon } from './helpers/connection';
const app = express();
const PORT = process.env.PORT || 3000;

// mongoCon();
logger();
uncaughtException();
routes(app);
configureResponse(app);

// const design = `AoneMart Server Running...`;
// console.log(design);

const server = app.listen(PORT, () => {
  console.log(`Dailymandi Server running on port ${PORT}`);
});

unhandledRejection(server);
// InitSocket(server);
