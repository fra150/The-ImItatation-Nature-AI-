// File: database config — dialect configurabile.
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Default: SQLite (file locale, zero setup, reale e testabile subito).
// In produzione imposta DB_DIALECT=mysql + DB_HOST/DB_USER/DB_PASS/DB_NAME.
const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;
if (dialect === 'sqlite') {
  const storage =
    process.env.DB_STORAGE ||
    (process.env.NODE_ENV === 'test'
      ? ':memory:'
      : path.join(__dirname, '..', '..', 'database.sqlite'));
  sequelize = new Sequelize({ dialect: 'sqlite', storage, logging: false });
} else {
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect,
    logging: false,
  });
}

// Error handling.
const connectToDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Successfully connected to the database.');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};

module.exports = { sequelize, connectToDatabase };
