import { PoolClient, QueryResult } from 'pg';
import { transformResponse, transformResponseOne } from '../helpers/util';
import { DataObject, IUpdateMany } from '../types/common';
import Base from './base';
import CustomError from '../middlewares/customError';

class Model extends Base {
  constructor(tableName: string) {
    super(tableName);
  }

  /**
   * Execute Raw Query
   * pass query as a string in 1st parameter
   * pass params as array in 2nd parameter
   */
  async rawSql(sql: string, params: any[] = [], client?: PoolClient): Promise<any> {
    let ownClient = false;
    if (!client) {
      client = await this.getClient();
      ownClient = true;
    }

    // Check parameter match
    /* const matches = sql.match(/\$/g);
    const paramCount = matches ? matches.length : 0;
    if (params.length && params.length !== paramCount)
      throw new CustomError('Parameters mismatch', 400); */

    try {
      // Execute the query
      const result: QueryResult = await client.query(sql, params);
      return result;
    } catch (error) {
      throw error;
    } finally {
      if (ownClient) client.release();
    }
  }

  /**
   * Query function to insert new record
   */
  async createOne(data: DataObject, client?: PoolClient): Promise<any> {
    let ownClient = false;
    if (!client) {
      client = await this.getClient();
      ownClient = true;
    }
    // Extract column names and values from the data object
    const columns = Object.keys(data).map((key) => `"${key}"`);
    const values = Object.values(data);

    // Generate placeholders for the values ($1, $2, $3, ...)
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const selectFieldsStr = this.selectFields.length ? this.selectFields.join(', ') : 'id';

    // Construct the dynamic query
    const query = `INSERT INTO "${this.tableName}"  (${columns.join(', ')}) VALUES (${placeholders}) RETURNING ${selectFieldsStr}`;

    try {
      // Execute the query
      const { rows }: QueryResult = await client.query(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    } finally {
      if (ownClient) client.release();
    }
  }

  /**
   * Query function to insert many records
   */
  async createMany(dataArray: DataObject[], client?: PoolClient): Promise<any[]> {
    let ownClient = false;
    if (!client) {
      client = await this.getClient();
      ownClient = true;
    }

    try {
      const valuesArray = dataArray.map((data) => Object.values(data));

      const columns = Object.keys(dataArray[0]).map((key) => `"${key}"`);
      const placeholdersArray = dataArray.map(
        (_, index) =>
          `(${valuesArray[index].map((_, i) => `$${i + 1 + index * valuesArray[0].length}`).join(', ')})`,
      );

      const placeholders = placeholdersArray.join(', ');

      const selectFieldsStr = this.selectFields.length ? this.selectFields.join(', ') : 'id';
      const query = `INSERT INTO "${this.tableName}" (${columns.join(', ')}) VALUES ${placeholders} RETURNING ${selectFieldsStr}`;

      const values = new Array().concat(...valuesArray);

      const { rows }: QueryResult = await client.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    } finally {
      if (ownClient) client.release();
    }
  }

  /**
   * Query function to update one record
   */
  async updateOne(newData: DataObject, client?: PoolClient): Promise<DataObject> {
    let ownClient = false;
    if (!client) {
      client = await this.getClient();
      ownClient = true;
    }

    const whereLen = this.conditionValues.length;
    if (!whereLen) throw Error('Where clause required');

    // Extract column names and values from the newData object
    const columns = Object.keys(newData).map((key) => `"${key}"`);
    const values = Object.values(newData);

    // Generate SET clause dynamically
    const setClause = columns.map((col, index) => `${col} = $${index + whereLen + 1}`).join(', ');

    // Selecting input given by user
    const selectFieldsStr = this.selectFields.length ? this.selectFields.join(', ') : 'id';

    // Construct the dynamic query
    let query = `UPDATE "${this.tableName}" SET ${setClause}`;
    if (this.whereClause) query += ` WHERE ${this.whereClause}`;
    query += ` RETURNING ${selectFieldsStr}`;

    const queryValues = [...this.conditionValues, ...values];

    try {
      // Execute the query
      const { rows }: QueryResult = await client.query(query, queryValues);

      // Return the updated row or null if no rows were updated
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      if (ownClient) client.release();
    }
  }

  /**
   * Query function to update many records
   */
  async updateMany(dataArray: IUpdateMany[], client?: PoolClient): Promise<DataObject> {
    let ownClient = false;
    if (!client) {
      client = await this.getClient();
      ownClient = true;
    }

    try {
      const updatedRows = [];
      for (const data of dataArray) {
        const where = data.where; // where clause is mandatory
        if (!where) {
          throw new Error('Each data object must have an "where" property');
        }

        // Extract column names and values from the data object, excluding 'id'
        const columns = Object.keys(data).filter((key) => key !== 'where');
        const values = columns.map((key) => data[key]);

        this.where(where);

        // Generate SET clause dynamically
        const setClause = columns
          .map((col, index) => `"${col}" = $${index + this.conditionValues.length + 1}`)
          .join(', ');

        // Construct the query
        const query = `UPDATE "${this.tableName}" SET ${setClause} WHERE ${this.whereClause} RETURNING id`;

        const queryValues = [...this.conditionValues, ...values];

        // Execute the query
        const { rows } = await client.query(query, queryValues);
        if (rows.length > 0) {
          updatedRows.push(rows[0]);
        }
      }

      // Commit the transaction
      return updatedRows;
    } catch (error) {
      throw error;
    } finally {
      if (ownClient) client.release();
    }
  }

  /**
   * Query function to soft delete one record
   */
  async softDelete(client?: PoolClient): Promise<string> {
    let ownClient = false;
    if (!client) {
      client = await this.getClient();
      ownClient = true;
    }

    const whereLen = this.conditionValues.length;
    if (!whereLen) throw Error('Where clause required');

    // Extract column names and values from the newData object
    const values = [true];

    // Construct the dynamic query
    let query = `UPDATE "${this.tableName}" SET "softDelete" = $${whereLen + 1}`;
    if (this.whereClause) query += ` WHERE ${this.whereClause}`;
    query += ` RETURNING id`;

    const queryValues = [...this.conditionValues, ...values];

    try {
      // Execute the query
      const { rows }: QueryResult = await client.query(query, queryValues);

      // Return the updated row or null if no rows were updated
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      if (ownClient) client.release();
    }
  }

  /**
   * Query function to soft delete one record
   */
  async permanentDelete(client?: PoolClient): Promise<string> {
    let ownClient = false;
    if (!client) {
      client = await this.getClient();
      ownClient = true;
    }

    const whereLen = this.conditionValues.length;
    if (!whereLen) throw Error('Where clause required');

    // Construct the dynamic query
    let query = `DELETE FROM "${this.tableName}"`;
    if (this.whereClause) query += ` WHERE ${this.whereClause}`;
    query += ` RETURNING id`;

    const queryValues = [...this.conditionValues];

    try {
      // Execute the query
      const { rows }: QueryResult = await client.query(query, queryValues);

      // Return the updated row or null if no rows were updated
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      if (ownClient) client.release();
    }
  }

  /**
   * Query function to find all records
   */
  async find({ log = false }: { log?: boolean } = {}): Promise<any[]> {
    const query = await this.getFindQuery();
    const client = await this.pool.connect();

    if (log) {
      console.log('👉 ~ Model ~ query:', query);
      console.log('👉 ~ Model ~ this.conditionValues:', this.conditionValues);
    }

    try {
      const { rows }: QueryResult = await client.query(query, this.conditionValues);
      return this.populateTables.length ? transformResponse(rows, this.populateTables) : rows;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Query function to find one record
   */
  async findOne({ log = false }: { log?: boolean } = {}): Promise<any> {
    if (this.pageLimit > 0) {
      throw new CustomError('Cannot set limit in findOne query', 404);
    }
    let query = await this.getFindQuery();
    query += ' LIMIT 1';

    if (log) {
      console.log('👉 ~ Model ~ query:', query);
      console.log('👉 ~ Model ~ this.conditionValues:', this.conditionValues);
    }

    const client = await this.pool.connect();
    try {
      const { rows }: QueryResult = await client.query(query, this.conditionValues);
      return this.populateTables.length
        ? transformResponseOne(rows[0], this.populateTables)
        : rows[0];
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Query function to find record in array of records
   * e.g., find user where name = "John" OR name = "Jane"
   */
  async findIn(
    conditions: { [key: string]: any[] },
    { log = false }: { log?: boolean } = {},
  ): Promise<any[]> {
    const keys = Object.keys(conditions);
    if (keys.length !== 1) {
      throw new Error('Expected exactly one key in the conditions object');
    }
    const key = keys[0];

    this.inArrayClause = `${this.tableName}."${key}" IN (${conditions[key].map((v) => `'${v}'`).join(',')})`;

    const query = await this.getFindQuery();

    if (log) {
      console.log('👉 ~ Model ~ query:', query);
      console.log('👉 ~ Model ~ this.conditionValues:', this.conditionValues);
    }

    const client = await this.pool.connect();
    try {
      const { rows }: QueryResult = await client.query(query, this.conditionValues);
      return this.populateTables.length ? transformResponse(rows, this.populateTables) : rows;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async countDocuments({ log = false }: { log?: boolean } = {}): Promise<any> {
    let query = `SELECT COUNT(*) FROM ${this.tableName}`;

    if (this.whereClause) {
      query += ` WHERE ${this.whereClause}`;
    }

    if (this.likeClause) {
      query += ` AND ${this.likeClause};`;
    }

    if (log) {
      console.log('👉 ~ Model ~ query:', query);
      console.log('👉 ~ Model ~ this.conditionValues:', this.conditionValues);
    }

    const client = await this.pool.connect();
    try {
      const { rows }: QueryResult = await client.query(query, this.conditionValues);
      return rows[0] ? +rows[0].count : 0;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
}

export default Model;
