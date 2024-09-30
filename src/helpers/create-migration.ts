import fs, { readdirSync } from 'fs';
import path from 'path';

interface IPayload {
  sql: string;
  migrationName: string;
}

/**
 * Migration save in folder name
 */
const migrationFolder = path.join(__dirname, '..', 'migrations');

/**
 * Checking migration
 */
function checkMigration(migrationName: string) {
  const files = readdirSync(migrationFolder);
  const filenames = files.map((f) => {
    const matchResult = f.match(/^[0-9]+_(.+)\.sql$/);
    return matchResult ? matchResult[1] : null;
  });

  return filenames.includes(migrationName);
}

/**
 * New migration
 */
function createMigration({ sql, migrationName }: IPayload): void {
  if (checkMigration(migrationName)) {
    console.log('Migration already present, change name and sql');
    return;
  }
  // Get the current datetime in the format YYYYMMDDHHmmss
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];

  // Construct the filename with timestamp and migration name
  const filename = `${timestamp}_${migrationName}.sql`;

  // Define the path to the migration folder
  const migrationFolderPath = path.join(__dirname, '..', 'migrations');

  // Create the migration folder if it doesn't exist
  if (!fs.existsSync(migrationFolderPath)) {
    fs.mkdirSync(migrationFolderPath);
  }

  // Write the SQL code to the migration file
  const migrationFilePath = path.join(migrationFolderPath, filename);
  fs.writeFileSync(migrationFilePath, sql);

  console.log(`Migration file ${filename} created successfully.`);
}

/**
 * Example usage
 * migrationName: enter new unique name
 * sql: add your new sql
 */
const payload = {
  migrationName: 'create_product_brand_type',
  sql: `CREATE TABLE product_brand
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying(50),
    description character varying(255),
    "metaTitle" character varying(255),
    "metaDescription" character varying(255),
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "createdBy" uuid NOT NULL,
    "updatedBy" uuid,
    PRIMARY KEY (id)
);`,
};

createMigration(payload);
