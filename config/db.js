const { Pool } = require('pg');

// Uses DATABASE_URL if set, otherwise the standard PGHOST/PGUSER/PGPASSWORD/PGDATABASE variables.
const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {});
pool.on('error', (err) => console.error('Unexpected PostgreSQL error', err));

module.exports = pool;
