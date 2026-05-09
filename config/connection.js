const { Sequelize } = require('sequelize');
require('dotenv').config({ override: false });

// Neon / managed Postgres: set DB_SSL=true in production hosting only.
// Local Postgres: omit DB_SSL or set DB_SSL=false — keeps existing dev workflow.
const useSsl = process.env.DB_SSL === 'true';

// Sequelize instance lives here — imported by models directly
// This breaks the circular dependency where models imported from index.js
// which was also importing models
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    ...(useSsl ? { dialectOptions: { ssl: { require: true } } } : {}),
  }
);

module.exports = sequelize;
