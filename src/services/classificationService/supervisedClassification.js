// Import the Google Earth Engine library
const ee = require('@google/earthengine');

const trainSupervisedClassifier = async (image, points, bands, label) => {
  // Overlay the points on the image to get the training data.
  const training = image.select(bands).sampleRegions({
    collection: points,
    properties: [label],
    scale: 30,
  });

  const trained = ee.Classifier.smileCart().train(training, label, bands);
  const classified = image.select(bands).classify(trained);
  return classified;
};

// Load the training points. The numerical 'class' property stores known labels.
const points = ee.FeatureCollection('GOOGLE/EE/DEMOS/demo_landcover_labels');
const label = 'landcover';

// Display the inputs and results.
Map.setCenter(-122.0877, 37.788, 11);
Map.addLayer(image, { bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0, max: 0.25 }, 'image');
Map.addLayer(
  classified,
  { min: 0, max: 2, palette: ['orange', 'green', 'blue'] },
  'classification',
);

module.exports = {
  trainSupervisedClassifier,
};

/*To view the documentation used you can view the module accuracyEvaluation.js. I've written a JavaScript function called `trainSupervisedClassifier` that uses Google Earth Engine to train a supervised classifier on an image using labeled points. Here's a breakdown of the code:
1. The function takes four parameters: `image`, `points`, `bands`, and `label`. `image` is the input image that we want to classify, `points` is a collection of labeled points that we'll use to train the classifier, `bands` is an array of band names to use for training, and `label` is the name of the property that stores the labels in the `points` collection.
2. Inside the function, we overlay the `points` collection on the `image` using the `sampleRegions` method. This creates a new feature collection called `training` that contains the pixel values from the `image` for each point, along with the corresponding label.
3. We then train a SmileCart classifier on the `training` data using the `train` method. This creates a new classifier object that can be used to classify new images.
4. Next, we classify the `image` using the trained classifier and the `classify` method. This creates a new image called `classified` that contains the predicted class labels for each pixel.
5. Finally, we return the `classified` image.
Outside of the function, we load a collection of labeled points from a demo dataset in Google Earth Engine. We also define the label property name and display the input image and classified image on a map using the `Map` object.
Finally, we export the `trainSupervisedClassifier` function so that it can be used in other parts of the codebase.*/
