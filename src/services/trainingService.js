const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const { sequelize } = require('../config/database');
const config = require('../config/trainingConfig');
const logger = require('../utils/logger');

const loadModel = async () => {
  try {
    const modelPath = path.join(__dirname, 'models', 'ai_model', 'model.json');
    const model = await tf.loadGraphModel(`file://${modelPath}`);
    return model;
  } catch (error) {
    console.error('Error loading the model:', error);
    throw error;
  }
};

// Function to train the model
const trainModel = async (trainingData, trainingLabels) => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 128, activation: 'relu', inputShape: [trainingData.shape[1]] }),
  );
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });
  await model.fit(trainingData, trainingLabels, {
    epochs: 10,
    batchSize: 32,
    validationSplit: 0.2,
  });

  // Save the trained model
  const savePath = path.join(__dirname, 'models', 'ai_model');
  await model.save(`file://${savePath}`);

  return model;
};

// Function to generate random training data for example
const generateTrainingData = () => {
  const data = tf.randomNormal([1000, 10]); // 1000 samples with 10 features each
  const labels = tf.randomUniform([1000], 0, 2, 'int32'); // 1000 binary labels
  return { data, labels };
};

const loadTrainAndSaveModel = async () => {
  try {
    // Load the model
    let model;
    if (config.modelPath) {
      model = await tf.loadGraphModel(config.modelPath);
      logger.info('Model loaded successfully');
    } else {
      const { data, labels } = generateTrainingData();
      model = await trainModel(data, labels);
      logger.info('Model trained successfully');
    }

    // Save the trained model
    await model.save(config.savePath);
    logger.info('Trained model saved successfully');
  } catch (error) {
    logger.error('Error during model training phase:', error);
    throw error; // Re-throw the error for external handling
  }
};

// Assuming you have a Model named 'Prediction' but , If you do not have a model called 'Prediction', you will need to create it or replace it with the name of the model you have in your database.
const Prediction = sequelize.models.Prediction;

// Function to insert prediction data into the database
const insertPredictionData = async (predictionData) => {
  try {
    const prediction = await Prediction.create(predictionData);
    console.log('Prediction data inserted successfully:', prediction.toJSON());
  } catch (error) {
    console.error('Error inserting prediction data:', error);
    throw error;
  }
};

module.exports = {
  loadModel,
  trainModel,
  loadTrainAndSaveModel,
  insertPredictionData,
  generateTrainingData,
};

/*The main purpose of this code is to handle machine learning tasks, such as loading an existing model, training a new model, generating random training data, and inserting prediction data into a database.
Here's a breakdown of the code: I've imported the necessary modules at the beginning. TensorFlow.js for Node.js is required to perform machine learning tasks, and the 'path' module is used to work with file and directory paths. I've also imported the 'sequelize' object from the '../config/database' 
The 'loadModel' function is defined to load an existing model from a JSON file. It constructs the file path using the 'path' module and then uses TensorFlow.js to load the model from that path. If there's an error during the loading process, it logs the error and throws it.
The 'trainModel' function is defined to train a new model using the provided training data and labels. It creates a sequential model and adds three dense layers to it. The first layer has 128 units, uses the 'relu' activation function, and expects input data with a shape that matches the number of features in the training data. The second layer has 64 units and also uses the 'relu' activation function. The final layer has 1 unit and uses the 'sigmoid' activation function, which is suitable for binary classification problems. The model is then compiled with the 'adam' optimizer, 'binaryCrossentropy' loss function, and 'accuracy' metric. After that, the model is trained using the 'fit' method with 10 epochs, a batch size of 32, and a validation split of 0.2. Finally, the trained model is saved to a file using the 'save' method.
The 'generateTrainingData' function is defined to generate random training data for example purposes. It creates a Tensor with 1000 samples and 10 features each, and another Tensor with 1000 binary labels.
The 'loadTrainAndSaveModel' function is defined to load, train, and save a model. It generates random training data using the 'generateTrainingData' function, trains a new model using the 'trainModel' function, and logs a success message if the model is trained and saved successfully. If there's an error during the training process, it logs the error.
I've assumed that there's a Model named 'Prediction' in the database, but if you don't have a model called 'Prediction', you'll need to create it or replace it with the name of the model you have in your databases. The 'insertPredictionData' function is defined to insert prediction data into the database using the 'create' method of the 'Prediction' model. If the data is inserted successfully, it logs a success message with the inserted data. If there's an error during the insertion process, it logs the error and throws it.
Finally, I've exported the 'loadModel', 'trainModel', 'loadTrainAndSaveModel', and 'insertPredictionData' functions so that they can be used in other parts of the application. */
