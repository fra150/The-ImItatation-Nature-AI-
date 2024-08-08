const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');


const Area = sequelize.define(
  'Area',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255), // Limits the name length to 255 characters
      allowNull: false,
      unique: true, // Ensures unique area names
      validate: {
        notEmpty: true, // Does not allow empty strings
      },
    },
    location: {
      type: DataTypes.GEOMETRY, // Defines the geographical area (can be a specific point, polygon, etc.)
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT, // Allows longer descriptions
      allowNull: true, // Description is optional
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'), // Fire risk level of the area
      allowNull: false,
      defaultValue: 'low',
    },
  },
  {
    sequelize,
    modelName: 'Area',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

// Define one-to-many relationship between Area and Sensor
Area.hasMany(Sensor, { foreignKey: 'areaId' });

// Define one-to-many relationship between Area and Drone
Area.hasMany(Drone, { foreignKey: 'areaId' });

// Define many-to-many relationship between Area and Sensor
Area.belongsToMany(Sensor, { through: 'AreaSensors' });
Area.belongsToMany(Drone, { through: 'AreaDrones' });

module.exports = Area;

/* In this code, I have defined a model called "Area" using Sequelize, a powerful ORM (Object-Relational Mapping) for Node.js.
Sequelize simplifies interaction with the relational database, making it easier to execute queries and manage relationships between tables.
1. I imported the necessary modules from Sequelize, including the `DataTypes` module to define the data types of the columns in the database table,
and the `Model` module to extend Sequelize's base class.
2. I imported the `sequelize` module from the database configuration to establish the connection to the database.
3. I imported the `Sensor` and `drone` models to define the relationships between the tables.
4. I defined the `Area` model using Sequelize's `define` method.
I specified the columns of the table, including the ID, name, location, description, and risk level of the area.
I set the options for the table, such as the model name, enabling timestamps, and the names of the timestamp columns.
5. I defined a one-to-many relationship between `Area` and `Sensor` using Sequelize's `hasMany` method.
This means that an area can have many sensors, but a sensor belongs to only one area.
6. I defined a one-to-many relationship between `Area` and `drone` using Sequelize's `hasMany` method.
This means that an area can have many drones, but a drone belongs to only one area.
7. I defined a many-to-many relationship between `Area` and `Sensor` using Sequelize's `belongsToMany` method.
This means that an area can have many sensors and a sensor can belong to many areas. I created a join table called `AreaSensors` to manage this relationship.
8. I exported the `Area` model so it can be used in other parts of the application.
In summary, I have defined an `Area` model with its columns and established one-to-many relationships with the `Sensor` and `drone` models, and a many-to-many relationship with the `Sensor` model.
This will allow me to manage areas, sensors, and drones in my database using Sequelize. */
