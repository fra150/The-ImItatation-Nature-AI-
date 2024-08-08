const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ForestData extends Model {}

// Here we define the forestModel.js model. Of course, the parameters can be changed based on your needs.
ForestData.init(
  {
    treeCover2000: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    loss: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    gain: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    lossYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    firstB30: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    firstB40: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    firstB50: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    firstB70: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lastB30: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lastB40: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lastB50: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lastB70: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dataMask: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ForestData',
  },
);

module.exports = ForestData;

/* I've written a JavaScript class called `ForestData` that extends the `Model` class from the Sequelize library. This class is used to define a model for forest data in a database.
The `ForestData` model has several attributes, each representing a piece of data about the forest. These attributes include:
- `treeCover2000`: an integer representing the percentage of tree cover in the area in the year 2000.
- `loss`: a boolean value indicating whether there was a loss of forest cover in the area.
- `gain`: a boolean value indicating whether there was a gain of forest cover in the area.
- `lossYear`: an integer representing the year in which the loss of forest cover occurred.
- `firstB30`, `firstB40`, `firstB50`, `firstB70`: integers representing the values of different bands in the first image.
- `lastB30`, `lastB40`, `lastB50`, `lastB70`: integers representing the values of different bands in the last image.
- `dataMask`: an integer representing a mask for the data.
Each attribute is defined with a data type and a flag indicating whether it can be null or not. The `sequelize` instance and the model name are also provided.
Finally, the `ForestData` model is exported so that it can be used in other parts of the application. */
