const forestService = require('../services/forestService');
const { trainSupervisedClassifier,} = require('../services/classificationService/supervisedClassification');
const {trainUnsupervisedClusterer,} = require('../services/classificationService/unsupervisedClassification');
const { createCompositeImage } = require('../services/classificationService/dataPreparation');
const { evaluateAccuracy } = require('../services/classificationService/accuracyEvaluation');

const classifyForestService = async (req, res) => {
  const { startDate, endDate, points, label } = req.body;
  const { image, bands } = createCompositeImage(startDate, endDate);

  try {
    const classifiedImage = await trainSupervisedClassifier(image, points, bands, label);
    const accuracy = await evaluateAccuracy(classifiedImage, image, label, bands, req.body.region);

    res.json({ classifiedImage, accuracy });
  } catch (error) {
    res.status(500).json({ message: 'Error in supervised classification', error });
  }
};

const clusterForestService = async (req, res) => {
  const { startDate, endDate, region } = req.body;
  const { image } = createCompositeImage(startDate, endDate);

  try {
    const clusteredImage = await trainUnsupervisedClusterer(image, region);
    res.json(clusteredImage);
  } catch (error) {
    res.status(500).json({ message: 'Error in unsupervised classification', error });
  }
};

const getForestData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await forestService.getForestChangeData(startDate, endDate);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving forest data', error });
  }
};

const insertForestData = async (req, res) => {
  try {
    const data = req.body;
    const newForestData = await forestService.insertForestData(data);
    res.status(201).json(newForestData);
  } catch (error) {
    res.status(500).json({ message: 'Error inserting forest data', error });
  }
};

module.exports = {
  getForestData,
  clusterForestService,
  classifyForestService,
  insertForestData,
};

/* First it is worth remembering this: that if you want to use these functions in Earth engineer you have to modify them in var , moreover these are just a detailed example following the google guidelines for the 'ee' library for the code to work. 
Into this code, I'm working with a forest service application that uses various classification methods to analyze forest data. I've imported several services and functions from different modules to handle different parts of the process.
The `classifyForestService` function is an asynchronous function that takes a request and response object. It extracts the start date, end date, points, and label from the request body. It then creates a composite image using the `createCompositeImage` function, which takes the start and end dates as arguments.
The function then attempts to train a supervised classifier using the `trainSupervisedClassifier` function, which takes the image, points, bands, and label as arguments. If this is successful, it evaluates the accuracy of the classification using the `evaluateAccuracy` function, which takes the classified image, original image, label, bands, and region as arguments. The function then sends a JSON response containing the classified image and its accuracy. If any errors occur during this process, it sends a 500 status code with an error message.
The `clusterForestService` function is similar, but it uses an unsupervised clustering method instead of a supervised classifier. It takes the start date, end date, and region from the request body, creates a composite image, and then attempts to train an unsupervised clusterer using the `trainUnsupervisedClusterer` function. If this is successful, it sends a JSON response containing the clustered image. If any errors occur, it sends a 500 status code with an error message.
The `getForestData` function retrieves forest change data from a service using the `getForestChangeData` function, which takes the start and end dates as arguments. If this is successful, it sends a JSON response containing the data. If any errors occur, it sends a 500 status code with an error message.
The `insertForestData` function inserts new forest data into a service using the `insertForestData` function, which takes the data as an argument. If this is successful, it sends a JSON response containing the new data. If any errors occur, it sends a 500 status code with an error message.
Finally, I've exported these functions so that they can be used by other parts of the application.*/ 