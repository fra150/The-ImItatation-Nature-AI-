// Import the Google Earth Engine library
const ee = require('@google/earthengine');

// Define an asynchronous function to train an unsupervised clusterer
const trainUnsupervisedClusterer = async (image, region, numClusters = 15, numPixels = 5000) => {
  // Sample the input image for training
  const training = image.sample({
    region: region,
    scale: 30,
    numPixels: numPixels,
  });

  // Train the clusterer with the sampled data
  const clusterer = ee.Clusterer.wekaKMeans(numClusters).train(training);

  // Cluster the input image using the trained clusterer
  const result = image.cluster(clusterer);

  // Return the clustered result
  return result;
};

// Load a pre-computed composite of Landsat for the input
const input = ee.Image('LANDSAT/LE7_TOA_1YEAR/2024'); // example

// Define a region to generate a sample of the input
const region = ee.Geometry.Rectangle(29.7, 30, 32.5, 31.7);

// Display the sampling region
Map.setCenter(31.5, 31.0, 8);
Map.addLayer(ee.Image().paint(region, 0, 2), {}, 'region');

// Create the training dataset
const training = input.sample({
  region: region,
  scale: 30,
  numPixels: 5000,
});

// Instantiate the clusterer and train it
const clusterer = ee.Clusterer.wekaKMeans(15).train(training);

// Cluster the input using the trained clusterer
const result = input.cluster(clusterer);

// Display the clusters with random colors
Map.addLayer(result.randomVisualizer(), {}, 'clusters');

// Export the trainUnsupervisedClusterer function
module.exports = {
  trainUnsupervisedClusterer,
};

/* To view the documentation used you can view the module accuracyEvaluation.js                                                                                                Using the Google Earth Engine (EE) library to perform unsupervised clustering on satellite imagery. The `trainUnsupervisedClusterer` function takes an image, a region, the number of clusters, and the number of pixels as input parameters. It uses these parameters to sample the image and train a K-means clustering algorithm. The function then clusters the input image using the trained algorithm and returns the result.
In the main part of the code, I load a pre-computed composite of Landsat satellite imagery for the input. I define a region within which to sample the input and visualize the sampling region on a map. I then create a training dataset by sampling the input image within the defined region.
Next, I instantiate a K-means clusterer and train it using the training dataset. I then cluster the input image using the trained clusterer and visualize the clusters on the map using random colors.
Finally, I export the `trainUnsupervisedClusterer` function so that it can be used in other parts of the application.*/
