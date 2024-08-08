const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

// Here we define the WeatherData model. Of course, the parameters can be changed based on your needs.
class WeatherData extends Model {}
WeatherData.init(
  {
     areaId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: 'Areas',
        key: 'id'
      } 
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mean_2m_air_temperature: {
      type: DataTypes.FLOAT,
    },
    total_precipitation: {
      type: DataTypes.FLOAT,
    },
    dewpoint_2m_temperature: {
      type: DataTypes.FLOAT,
    },
    mean_sea_level_pressure: {
      type: DataTypes.FLOAT,
    },
    surface_pressure: {
      type: DataTypes.FLOAT,
    },
    u_component_of_wind_10m: {
      type: DataTypes.FLOAT,
    },
  },
  {
    sequelize,
    modelName: 'WeatherData', // Model name (corresponds to the table name)
  },
);

// Function to insert weather data
async function insertWeatherData(weatherData) {
  try {
    const newWeatherData = await WeatherData.create(weatherData);
    return newWeatherData;
  } catch (error) {
    console.error('Error during data insertion:', error);
    throw error; // Re-throw the error to handle it elsewhere
  }
}

// Example of usage
const util = async () => {
  try {
    await sequelize.authenticate(); // Test the database connection
    console.log('Successfully connected to the database.');

    await WeatherData.sync(); // Synchronize the model with the database
    console.log('WeatherData model synchronized with the database.');

    const weatherData = {
      date: new Date(),
      mean_2m_air_temperature: Number, // number to insert, e.g. 15.5
      total_precipitation: Number, // number to insert, e.g. 2.3
      dewpoint_2m_temperature: Number, // number to insert, e.g. 12.0
      mean_sea_level_pressure: Number, // number to insert, e.g. 1013.25,
      surface_pressure: Number, // number to insert, e.g. 1015.0,
      u_component_of_wind_10m: Number, // number to insert, e.g. 3.2,
    };

    const newWeatherData = await insertWeatherData(weatherData);
    console.log('Data inserted successfully:', newWeatherData.toJSON());
  } catch (error) {
    console.error('Error:', error);
  }
};

// Export the model for use in other modules
module.exports = {
  WeatherData,
  insertWeatherData,
  util,
};

/* In this code, I have created a weather data model using Sequelize, a powerful ORM (Object-Relational Mapping) for Node.js. I have defined a model called `WeatherData` that represents the weather data I want to store in a database. The model has fields such as `date`, `mean_2m_air_temperature`, `total_precipitation`, `dewpoint_2m_temperature`, `mean_sea_level_pressure`, `surface_pressure`, and `u_component_of_wind_10m`.
I have also created a function called `insertWeatherData` that takes a `weatherData` object as a parameter and uses the `WeatherData` model to insert the data into the database. The function uses Sequelize's `create` method to create a new instance of the `WeatherData` model with the provided data and save it to the database.
Finally, I have created a function `utill` that serves as an example of using the `WeatherData` model and the `insertWeatherData` function. The `utill` function establishes a connection to the database using Sequelize, synchronizes the `WeatherData` model with the database, creates a `weatherData` object with some sample weather data, and uses the `insertWeatherData` function to insert the data into the database. If the insertion is successful, the function prints the inserted data.
In summary, I have created a weather data model using Sequelize, a function to insert data into the database, and a function example to use the model and the insertion function. */
