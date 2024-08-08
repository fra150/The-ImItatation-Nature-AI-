const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'user',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(255), // Maximum length of 255 characters
      allowNull: false,
      unique: true, // Ensures unique usernames
      validate: {
        notEmpty: true, // Does not allow empty strings
        notNull: true,
      },
    },
    password: {
      type: DataTypes.STRING(255), // Maximum length of 255 characters (consider hashing passwords)
      allowNull: false,
      validate: {
        notEmpty: true,
        notNull: true,
      },
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user', // Default role: 'user'
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users', // Table name in the database (optional, Sequelize infers it from the model name)
  },
);

module.exports = User;

/* In this code, I have created a data model for the user using Sequelize, a powerful ORM (Object-Relational Mapping) for Node.js. Sequelize simplifies database interaction and allows us to define, create, and manage tables and models declaratively.
1. I imported the data types and the Sequelize model from 'sequelize' and the database configuration from '../config/database'.
2. I defined a data model for the user using the `sequelize.define()` method. The first parameter is the model name, which is 'user'. The second parameter is an object that defines the columns of the 'users' table in the database.
3. I defined four columns for the 'users' table: 'id', 'username', 'password', and 'role'.
   - The 'id' column is an auto-incrementing integer that serves as the primary key. It is mandatory and cannot be null.
   - The 'username' column is a string with a maximum length of 255 characters. It is mandatory, unique, and cannot be null or an empty string.
   - The 'password' column is a string with a maximum length of 255 characters. It is mandatory and cannot be null or an empty string.
   - The 'role' column is an enumerator that can be 'user' or 'admin'. It is mandatory and has a default value of 'user'.
4. I configured some additional options for the model, such as the model name ('User') and the table name in the database ('users').
5. Finally, I exported the 'User' model so it can be used in other parts of the application.
In summary, I created a data model for the user with Sequelize, defined the necessary columns for the 'users' table in the database, configured some additional options, and exported the model for use in other parts of the application. */
