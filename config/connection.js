const { Sequelize } = require('sequelize');
require('dotenv').config();

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
  }
);

module.exports = sequelize;
