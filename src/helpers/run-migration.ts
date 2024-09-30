// import fs from 'fs';
import path from 'path';
import pool from './connection';
import { readFileSync, readdirSync } from 'fs';

/**
 * Migration save in folder name
 */
const migrationFolder = path.join(__dirname, '..', 'migrations');

/**
 * Create New Schema and Set Schema
 * to run migration on new schema
 */
async function createAndSetSchema(schema: string) {
  // Create the schema
  const createSchemaSql = `CREATE SCHEMA IF NOT EXISTS ${schema};`;
  try {
    await pool.query(createSchemaSql);
    console.log(`Schema "${schema}" created successfully`);
  } catch (error) {
    console.error(`Error creating schema "${schema}"`, error);
    process.exit(1); // Exit with error code
  }

  // Set the search path
  const setSearchPathSql = `SET search_path TO ${schema}, public;`;
  try {
    await pool.query(setSearchPathSql);
    console.log(`Search path set to "${schema}"`);
  } catch (error) {
    console.error(`Error setting search path to "${schema}"`, error);
    process.exit(1); // Exit with error code
  }
}

/**
 * Run migrations
 */
async function migrate() {
  const schema = process.argv[2];
  if (schema) {
    await createAndSetSchema(schema);
  }

  const sqlMigration = `CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;

  try {
    await pool.query(sqlMigration);
  } catch (error) {
    console.error(`Error executing create migration table:`, error);
  }

  try {
    const result = await pool.query('SELECT migration_name FROM _migrations');
    const executedMigrations = new Set(result.rows.map((row: any) => row.migration_name));
    const files = readdirSync(migrationFolder);
    files.sort();
    let isMigrated = false;

    for (const file of files) {
      if (!executedMigrations.has(file)) {
        isMigrated = true;
        const filePath = path.join(migrationFolder, file);
        const sql = readFileSync(filePath).toString();

        try {
          await pool.query(sql);
          console.log(`Migration ${file} executed successfully`);
          await pool.query('INSERT INTO _migrations (migration_name) VALUES ($1)', [file]);
        } catch (queryErr) {
          console.error(`Error executing migration ${file}:`, queryErr);
          throw queryErr; // Rethrow the error to stop execution
        }
      }
    }

    if (!isMigrated) {
      console.log('Database up to date, please create a new migration');
    }

    pool.end();
  } catch (error) {
    console.error('Error retrieving executed migrations:', error);
    pool.end();
    return;
  }
}

migrate();
