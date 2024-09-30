import db from '../helpers/connection';
import { Pool } from 'pg';

class Base {
  protected pool: Pool;
  protected tableName: string;
  protected selectFields: string[];
  protected populateSelect: string[];
  protected populateTables: string[];
  protected whereClause: string;
  protected likeClause: string;
  protected conditionValues: any[];
  protected orClause: string;
  protected inArrayClause: string;
  protected pageLimit: number;
  protected offset: number;
  protected sortBy: string;
  protected sortOrder: string;

  constructor(tableName: string) {
    this.pool = db;
    this.tableName = tableName;
    this.selectFields = [];
    this.populateSelect = [];
    this.populateTables = [];
    this.whereClause = '';
    this.likeClause = '';
    this.conditionValues = [];
    this.orClause = '';
    this.inArrayClause = '';
    this.pageLimit = 0;
    this.offset = 0;
    this.sortBy = '';
    this.sortOrder = '';
  }

  /**
   * for client
   */
  async getClient() {
    return await this.pool.connect();
  }

  /**
   * select column for select query
   */
  select(fields: string): this {
    this.selectFields = fields.split(',').map((field) => `${this.tableName}."${field.trim()}"`);
    return this;
  }

  /**
   * use condition for select query
   */
  where(conditions: { [key: string]: any }): this {
    const conditionsKeys = Object.keys(conditions);
    this.conditionValues = Object.values(conditions);
    this.whereClause = conditionsKeys
      .map((key, index) => `${this.tableName}."${key}" = $${index + 1}`)
      .join(' AND ');
    return this;
  }

  /**
   * Use IN condition for select query
   */
  whereIn(column: string, values: any[]): this {
    if (values.length === 0) {
      throw new Error('Values array cannot be empty for whereIn clause');
    }

    // Add all the array values to conditionValues
    this.conditionValues.push(...values);

    // Create placeholders for the IN clause (e.g., $1, $2, $3)
    const placeholders = values
      .map((_, index) => `$${this.conditionValues.length - values.length + index + 1}`)
      .join(', ');

    // Add the IN clause to whereClause
    this.whereClause = `${this.tableName}."${column}" IN (${placeholders})`;

    return this;
  }

  whereRaw(rawQuery: string, params: any[] = []): this {
    // Assuming you're using a query builder like Knex or similar
    this.whereClause = `${rawQuery}`; // Storing the raw query as the WHERE clause
    this.conditionValues = params; // Storing the parameter values to be used
    return this;
  }

  /**
   * use condition for select query
   */
  or(conditions: { [key: string]: any }): this {
    const conditionsKeys = Object.keys(conditions);
    this.orClause = conditionsKeys
      .map(
        (key, index) => `${this.tableName}."${key}" = $${this.conditionValues.length + index + 1}`,
      )
      .join(' AND ');
    this.conditionValues = [...this.conditionValues, ...Object.values(conditions)];
    return this;
  }

  /**
   * filters condition for select query
   */
  filter(conditions: { [key: string]: any }): this {
    const conditionsKeys = Object.keys(conditions);
    this.likeClause = conditionsKeys
      .map(
        (key, index) =>
          `${this.tableName}."${key}" LIKE $${this.conditionValues.length + index + 1}`,
      )
      .join(' AND ');
    this.conditionValues = [...this.conditionValues, ...Object.values(conditions)];
    return this;
  }

  /**
   * relation with others table
   * with foreign key
   * for select query
   */
  populate(relatedTableName: string, relatedFields: string): this {
    this.populateTables.push(relatedTableName);
    const rField = relatedFields
      .split(',')
      .map(
        (field) => `${relatedTableName}."${field.trim()}" AS "${relatedTableName}_${field.trim()}"`,
      );
    this.populateSelect.push(rField.join(','));

    return this;
  }

  /**
   * Use this for sorting
   * parameter must be string
   * sortOrder == '1' => ASC | '-1' => DESC
   */
  sort(sortBy = 'id', sortOrder = '1'): this {
    sortBy = sortBy.split('.').join('_');
    this.sortBy = `"${sortBy}"`;
    this.sortOrder = sortOrder === '1' ? 'ASC' : 'DESC';
    return this;
  }

  /**
   * Use this for limit
   * parameter must be number
   */
  limit(pageSize: number): this {
    this.pageLimit = pageSize;
    return this;
  }

  /**
   * Use this for Offset
   * parameter must be number
   */
  skip(skip: number): this {
    this.offset = skip;
    return this;
  }

  /**
   * Use this for pagination
   * limit and skip both functionalities
   * parameter must be number
   */
  pagination(pageIndex = 0, pageSize = 10): this {
    let x = pageIndex * pageSize;
    this.offset = x;
    this.pageLimit = pageSize;
    return this;
  }

  /**
   * populate function
   */
  private async getPopulate(): Promise<string> {
    const joinClauseArr = [];
    for (const relate of this.populateTables) {
      const foreignKey = await this.detectForeignKey(relate);
      if (!foreignKey) {
        throw new Error(
          `Foreign key relationship between ${this.tableName} and ${relate} not found.`,
        );
      }

      const joinClause = `LEFT JOIN ${relate} ON ${relate}.id = ${this.tableName}.${foreignKey}`;
      joinClauseArr.push(joinClause);
    }
    return joinClauseArr.join(' ');
  }

  /**
   * find function
   */
  protected async getFindQuery(): Promise<string> {
    const selectFieldsStr = this.selectFields.length ? this.selectFields.join(', ') : '*';
    const populateFieldsStr = this.populateSelect.length
      ? `, ${this.populateSelect.join(', ')}`
      : '';
    let query = `SELECT ${selectFieldsStr} ${populateFieldsStr} FROM ${this.tableName} `;
    if (this.populateTables.length) query += await this.getPopulate();

    if (this.inArrayClause || this.whereClause || this.likeClause) query += ` WHERE`;

    if (this.inArrayClause) {
      query += ` ${this.inArrayClause}`;
      if (this.whereClause || this.likeClause) query += ` AND`;
    }

    if (this.whereClause) {
      query += ` ${this.whereClause}`;
      if (this.likeClause) query += ` AND`;
    }

    if (this.likeClause) query += ` ${this.likeClause}`;

    if (this.orClause) {
      query += ` OR ${this.orClause}`;
    }

    if (this.sortBy && this.sortOrder) {
      query += ` ORDER BY ${this.sortBy} ${this.sortOrder}`;
    }
    if (this.pageLimit > 0) {
      query += ` LIMIT ${this.pageLimit}`;
    }
    if (this.offset > 0) {
      query += ` OFFSET ${this.offset}`;
    }
    return query;
  }

  /**
   * foreign key detection
   */
  private async detectForeignKey(relatedTableName: string): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      const query = `
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = '${this.tableName}'::regclass
      AND confrelid = '${relatedTableName}'::regclass
      AND contype = 'f'
    `;

      const { rows } = await client.query(query);

      // Extract the foreign key column from the constraint definition
      const foreignKeyConstraint = rows[0]?.pg_get_constraintdef;
      const foreignKey = foreignKeyConstraint?.match(/\(([^)]+)\)/)?.[1];

      return foreignKey;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
}

export default Base;
