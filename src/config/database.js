// File: database Config.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  'mysql://' +
    process.env.DB_USER +
    ':' +
    process.env.DB_PASS +
    '@' +
    process.env.DB_HOST +
    ':' +
    process.env.DB_PORT +
    '/' +
    process.env.DB_NAME,
);

// Error handling .
const connectToDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Successfully connected to the database.');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};
//connectToDatabase();
module.exports = { sequelize, connectToDatabase };

/* Here is an improvement for a secure database connection that has been enhanced using a complete connection string, which includes both the port and the database name.
 Additionally, the database connection is simulated as a demo, and in the future, a real connection to MySQL will be used. 
 Furthermore, I have also included error handling for any potential issues that may arise during the database connection. */
