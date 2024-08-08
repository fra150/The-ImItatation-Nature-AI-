// Import the Google Earth Engine library
const ee = require('@google/earthengine');

// Define a region of interest.
const roi = ee.Geometry.BBox(-122.93, 36.99, -121.2, 38.16);

// Create a surface reflectance composite of Landsat 8 without clouds.
const input = ee
  .ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(roi)
  .filterDate('', '') // here you have to insert a date of your choice
  .map(prepSrL8)
  .median()
  .setDefaultProjection('EPSG:4326', null, 30)
  .select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7']);

// Use the MODIS land cover for training.
const modis = ee.Image('MODIS/006/MCD12Q1/2020_01_01').select('LC_Type1');

// Sample the input image to get a FeatureCollection of training data.
const training = input.addBands(modis).sample({
  region: roi,
  numPixels: 5000,
  seed: 0,
});

// Create a Random Forest classifier and train it.
const classifier = ee.Classifier.smileRandomForest(10).train({
  features: training,
  classProperty: 'LC_Type1',
  inputProperties: ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'],
});

// Classify the input image.
const classified = input.classify(classifier);

// Get a confusion matrix that represents the resubstitution accuracy.
const trainAccuracy = classifier.confusionMatrix();
print('Resubstitution error matrix: ', trainAccuracy);
print('Training overall accuracy: ', trainAccuracy.accuracy());

// Sample the input with a different seed to get validation data.
const validation = input
  .addBands(modis)
  .sample({
    region: roi,
    numPixels: 5000,
    seed: 1,
  })
  .filter(ee.Filter.notNull(input.bandNames()));

// Classify the validation data.
const validated = validation.classify(classifier);

// Get a confusion matrix that represents the predicted accuracy.
const testAccuracy = validated.errorMatrix('LC_Type1', 'classification');
print('Validation error matrix: ', testAccuracy);
print('Validation overall accuracy: ', testAccuracy.accuracy());

const evaluateAccuracy = async (classifier, image, label, bands, region, numPixels = 5000) => {
  const training = image.addBands(label).sample({
    region: region,
    numPixels: numPixels,
    seed: 0,
  });

  const validated = training.classify(classifier);
  const testAccuracy = validated.errorMatrix(label, 'classification');

  return {
    errorMatrix: testAccuracy.array(),
    accuracy: testAccuracy.accuracy().getInfo(),
  };
};



module.exports = {
  evaluateAccuracy,
};

/*It should be emphasized that everything is purely demonstrative, for  order to prove my theory.    
This designed to work with Google Earth Engine in this site and documentation https://developers.google.com/earth-engine/guides/classification.  Cloud-based platform for analyzing and visualizing large-scale geospatial data. The main purpose of this code is to classify land cover types using Landsat 8 satellite imagery and MODIS land cover data.
Here's a breakdown of the code.
I've imported the necessary module at the beginning. Google Earth Engine is required to perform geospatial analysis.
I've defined a region of interest (ROI) using the 'Geometry.BBox' method, which creates a bounding box geometry from the given coordinates. In this case, the ROI is a rectangle in California.
I've created a surface reflectance composite of Landsat 8 without clouds using the 'ImageCollection' method, which retrieves a collection of images that match the given criteria. In this case, the criteria are the image collection name, the ROI, and a date range. The 'map' method is used to apply a function to each image in the collection, and the 'median' method is used to compute the median pixel value for each band across all images in the collection. The 'setDefaultProjection' method is used to set the default projection for the image.
I've used the MODIS land cover data for training. The 'Image' method is used to retrieve a single image that matches the given criteria.
I've sampled the input image to get a FeatureCollection of training data using the 'sample' method, which generates a random sample of pixels from the input image. The 'addBands' method is used to add the MODIS land cover data to the input image.
I've created a Random Forest classifier and trained it using the 'Classifier.smileRandomForest' method, which creates a Random Forest classifier with the given number of trees. The 'train' method is used to train the classifier using the training data.
I've classified the input image using the trained classifier using the 'classify' method.
I've calculated the resubstitution accuracy using the 'confusionMatrix' method, which generates a confusion matrix that represents the accuracy of the classifier on the training data.
I've sampled the input image with a different seed to get validation data and classified the validation data using the trained classifier.
I've calculated the predicted accuracy using the 'errorMatrix' method, which generates a confusion matrix that represents the accuracy of the classifier on the validation data.
I've defined a function called 'evaluateAccuracy' that takes a classifier, an image, a label, a list of bands, a region, and a number of pixels as input and returns the error matrix and accuracy of the classifier on the input data.
Finally, I've exported the 'evaluateAccuracy' function so that it can be used in other parts of the application. */
