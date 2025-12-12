const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'expenses_user',
  password: process.env.DB_PASSWORD || 'expenses_password',
  database: process.env.DB_NAME || 'expenses_db',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
