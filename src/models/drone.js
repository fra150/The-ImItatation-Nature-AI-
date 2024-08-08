// models/drone.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DroneData = sequelize.define(
  'DroneData',
  {
    droneId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    altitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    speed: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'drone_data',
    timestamps: false,
  },
);

const Drone = sequelize.define(
  'Drone',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('available', 'in_use', 'maintenance'),
      allowNull: false,
      defaultValue: 'available',
    },
    batteryLevel: {
      type: DataTypes.INTEGER, // We use INTEGER to represent the percentage
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 100,
      },
    },
    location: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: true, // Location can be null if the drone is not flying
    },
    action: {
      type: DataTypes.ENUM('patrol', 'extinguish', 'rescue', 'transport', 'survey'),
      allowNull: false,
      defaultValue: 'patrol',
    },
  },
  {
    sequelize,
    modelName: 'Drone',
  },
);

module.exports = {
  Drone,
  DroneData,
};
/* I have created a Sequelize database model to represent a drone. The model is defined in a JavaScript file called "drone.js".
1. I imported the data types and the Sequelize model from Sequelize, an ORM (Object-Relational Mapping) for Node.js.
2. I imported the Sequelize instance from my database configuration file.
3. I definined a Drone data and It is its classes such as latitude, longitude, altitude, speed, timestamp.
4. I defined a Drone class that extends the Sequelize Model class.
5. Within the Drone class, I defined the columns of my database model, each with its properties and validations. The columns are:
   - `id`: an auto-incrementing integer that serves as the primary key.
   - `model`: a string representing the model of the drone.
   - `status`: an enumerator that can be 'available', 'in_use', or 'maintenance'. The default value is 'available'.
   - `batteryLevel`: an integer representing the battery level of the drone as a percentage. The default value is 100 and it must be between 0 and 100.
   - `location`: a geographic point representing the location of the drone. It can be null if the drone is not in flight.
   - `fireEventId`: a foreign key for the relationship with FireEvent. I am not sure if I should include it since I am importing FireEvent documents separately.
5. I exported the Drone class so that it can be used in other parts of the application.
In summary, I have created a Sequelize database model to represent a drone with its properties and validations. The model is defined in JavaScript and can be used to interact with the database. */
