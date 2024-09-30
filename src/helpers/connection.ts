import { Pool, PoolConfig } from 'pg';
import config from 'config';
// import mongoose from 'mongoose';

/**
 * PostGre Database connection configuration
 */
const connObj: PoolConfig = {
  host: config.get('db_host') as string,
  user: config.get('db_user') as string,
  password: config.get('db_password') as string,
  database: config.get('db_name') as string,
  port: 5432,
  max: 100,
  min: 0,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 2000,
  // ssl: !['development', 'dev'].includes(config.get('node_env')),
  ssl: false,
};
const db = new Pool(connObj);
db.on('error', (err) => console.error('Error connecting to PostgreSQL database:', err));

/* const chatDb = `mongodb+srv://${config.get<string>('mongo_db_user')}:${config.get<string>('mongo_db_password')}@worksync.cmmjozd.mongodb.net/worksync`;
const mongoCon = async (): Promise<void> => {
  try {
    await mongoose.connect(chatDb, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
    });
    console.log('MongoDB connection established');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
};
export { chatDb, mongoCon }; */

export default db;
