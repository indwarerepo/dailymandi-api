/**
 * Reset database
 */
(async () => {
  // Set environment to change connection to postgres db, cannot delete a connected db
  process.env.tr_db_name = 'postgres';
  const pool = require('./connection').default;

  const dbName = 'ecommerce_dev';
  try {
    // Terminate connections to the database
    await pool.query(
      `SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid();`,
      [dbName],
    );

    // Drop the database
    await pool.query(`DROP DATABASE IF EXISTS ${dbName}`);

    // Create the database
    await pool.query(`CREATE DATABASE ${dbName}`);

    console.log(`Database ${dbName} recreated successfully.`);
  } catch (error) {
    console.error('Error recreating the database:', error);
  } finally {
    await pool.end();
  }
})();
