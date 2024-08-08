// Import the necessary services
const weatherService = require('../services/weatherService');
const {trainSupervisedClassifier,} = require('../services/classificationService/supervisedClassification');
const {trainUnsupervisedClusterer,} = require('../services/classificationService/unsupervisedClassification');
const { createCompositeImage } = require('../services/classificationService/dataPreparation');
const { evaluateAccuracy } = require('../services/classificationService/accuracyEvaluation');


// Function to classify a fire event (These examples can be modified as needed)
const classifyweatherService = async (req, res) => {
  const { startDate, endDate, points, label } = req.body;
  const { image, bands } = createCompositeImage(startDate, endDate);

  const classifiedImage = await trainSupervisedClassifier(image, points, bands, label);
  const accuracy = await evaluateAccuracy(classifiedImage, image, label, bands, req.body.region);

  res.json({
    classifiedImage,
    accuracy,
  });
};

// Example of an endpoint that uses unsupervised classification (These examples can be modified as needed)
const clusterweatherService = async (req, res) => {
  const { startDate, endDate, region } = req.body;
  const { image } = createCompositeImage(startDate, endDate);

  const clusteredImage = await trainUnsupervisedClusterer(image, region);

  res.json(clusteredImage);
};
// Controller to get weather data
const getWeatherData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await weatherService.getERA5Data(startDate, endDate);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error getting weather data', error });
  }
};

// Controller to visualize data on the map
const visualizeWeatherData = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = weatherService.getERA5Data(startDate, endDate);
    weatherService.visualizeDataOnMap(data);
    res.status(200).send('Data visualized on map successfully');
  } catch (error) {
    res.status(500).json({ message: 'Error visualizing data on map', error });
  }
};

// Function to get weather data and apply GOES RGB visualization.
const getWeatherDataGoes = async (req, res) => {
  try {
    // Get weather data from weatherService
    const weatherData = await weatherService.getWeatherData();
    res.json(weatherData);

    // Apply scale and offset for GOES RGB visualization
    const image = applyScaleAndOffset(assetId);
    Map.setCenter(); // you might want to add numbers like -75, 37, 5;
    Map.addLayer(image, goesRgbViz);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Controller function to get wind speed data
const getWindSpeedData = async (req, res) => {
  try {
    const data = await weatherService.getWindSpeedData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving wind speed data' });
  }
};

// Exporting the controllers for use in other modules
module.exports = {
  getWeatherData,
  visualizeWeatherData,
  getWeatherDataGoes,
  getWindSpeedData,
  classifyweatherService,
  clusterweatherService,
};

/* In this code, I have created a controller to handle requests related to weather data. The controller is responsible for interacting with the weather service to obtain the requested data and return it to the client.
Firstly,I also inserted two classification  supervised and unsupervised examples both linked to service classificationService,they are just two incomplete examples.
I imported the necessary weather service to obtain the weather data. This service was created in a separate module and contains the logic to communicate with the ERA5 API to obtain the meteorological data.
I created four controller functions:
getWeatherData: This function is responsible for obtaining weather data based on the start and end dates provided in the request. It uses the weather service to obtain the data and returns it to the client in JSON format.
visualizeWeatherData: This function is responsible for visualizing weather data on a map. It uses the weather service to obtain the data and then visualizes it on the map using the visualizeDataOnMap function of the weather service.
getWeatherDataGoes: This function is responsible for obtaining meteorological data and applying the GOES RGB visualization. It uses the weather service to obtain the meteorological data and returns it to the client in JSON format. Then, it applies the scale and offset for the GOES RGB visualization using the applyScaleAndOffset function and adds the visualization to the map.
getWindSpeedData: This function is responsible for obtaining wind speed data. It uses the weather service to obtain the data and returns it to the client in JSON format.
Finally, I exported the controller functions so that they can be used in other modules of the application. */
