const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const WeatherService = require('../services/weatherService');

class FireEvent extends Model {
  /**
   * Calculates the duration of the fire event in minutes.
   * @returns {number|null} Duration in minutes or null if the event is still ongoing.
   */
  getDuration() {
    if (!this.endTime) return null; // The fire is still ongoing
    const diffMs = this.endTime - this.startTime;
    return Math.round(((diffMs % 86400000) % 3600000) / 60000); // Converts the difference to minutes
  }
}

FireEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Adding the areaId field
    areaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Areas', // Name of the model to reference (presumably it exists)
        key: 'id',
      },
    },
    location: {
      type: DataTypes.STRING(255), // Limits length to 255 characters
      allowNull: false,
      validate: {
        notEmpty: true, // Does not allow empty strings
      },
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
    },
    // Adding the description field
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('detected', 'in_progress', 'extinguished'),
      allowNull: false,
      defaultValue: 'detected',
    },
    // Adding the detectedAt field
    detectedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'FireEvent',
    indexes: [
      {
        fields: ['location'], // Index on the location column for faster queries
      },
    ],
  },
);

// Defining the relationship with the sensor part.
FireEvent.belongsTo(Sensor, { foreignKey: 'detected_by_sensor_id' });
module.exports = FireEvent;

/* In this code, I have created a data model to represent a fire event in a system. The model is defined using Sequelize, a powerful ORM (Object-Relational Mapping) for Node.js and JavaScript.
1. I imported the necessary classes from Sequelize, which allow me to define the model and interact with the database.
2. I imported the Sensor model, as each fire event is detected by a sensor.
3. I defined a FireEvent class that extends the Model class of Sequelize. This class represents a table in the database and provides methods to interact with the data.
4. Within the FireEvent class, I defined the model's fields using Sequelize syntax. The fields include the event ID, the area ID where the fire occurred, the location, the start and end times, the severity, a description, the status, and the detection time.
5. I added a getDuration() function to the FireEvent class to calculate the duration of a fire event in minutes. The function returns null if the fire is still ongoing.
6. I defined the relationship between FireEvent and Sensor using the belongsTo() method of Sequelize. This allows me to access the sensor that detected the fire event.
7. Finally, I exported the FireEvent class so that it can be used in other parts of the code.
In summary, I created a data model to represent a fire event in a system, defined the model's fields, added a function to calculate the duration of a fire event, and defined the relationship with the sensor that detected it. */
