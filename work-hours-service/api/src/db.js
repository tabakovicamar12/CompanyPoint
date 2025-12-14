const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'workhours_user',
  password: process.env.DB_PASSWORD || 'workhours_password',
  database: process.env.DB_NAME || 'workhours_db',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};