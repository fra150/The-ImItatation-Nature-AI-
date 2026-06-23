// models/sensor.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

const Sensor = sequelize.define(
  'Sensor', 
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'thermal',
        'smoke',
        'gas',
        'lidar',
        'motion',
        'light',
        'proximity',
        'vibration',
        'position',
        'biometric',
        'level',
        'seismic',
        'magnetic',
      ),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firmwareVersion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hardwareVersion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    softwareVersion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.JSON, // {latitude, longitude} — compatibile SQLite + MySQL
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'error'),
      allowNull: false,
      defaultValue: 'active',
    },
    AreaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Areas',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Sensor',
  },
);


module.exports = Sensor;

/* In this code, I created a model for a sensor using Sequelize, a powerful ORM (Object-Relational Mapping) for Node.js and JavaScript. The model is defined in a file called "sensor.js" located in the "models" folder.
I imported the necessary libraries for Sequelize, which are DataTypes and Model.
I imported the configured Sequelize instance from the file "../config/database".
I defined the Sensor model using the define method of Sequelize. The model's name is "Sensor".
Within the model definition, I specified the columns of the database table and their properties. For example, I defined the "id" column as an auto-incrementing integer, the "type" column as an enumerator with specific values, and the "location" column as a geometric data type POINT.
I specified the foreign key "AreaId" for the relationship with the areas table, if present.
Finally, I exported the Sensor model so that it can be used in other parts of the application.
In summary, I created a model for a sensor using Sequelize, specifying the columns of the database table and their properties, and exported the model so that it can be used in other parts of the application. */
