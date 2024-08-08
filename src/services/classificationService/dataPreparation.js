// Import the Google Earth Engine library
const ee = require('@google/earthengine');

// Function to preprocess Landsat 8 surface reflectance images
const prepSrL8 = (image) => {
  // Create masks for unwanted pixels (fill, cloud, cloud shadow)
  const qaMask = image.select('QA_PIXEL').bitwiseAnd(parseInt('11111', 2)).eq(0);
  const saturationMask = image.select('QA_RADSAT').eq(0);

  // Function to get scale factors for the bands
  const getFactorImg = (factorNames) => {
    const factorList = image.toDictionary().select(factorNames).values();
    return ee.Image.constant(factorList);
  };

  // Apply scale factors to the bands
  const scaleImg = getFactorImg(['REFLECTANCE_MULT_BAND_.|TEMPERATURE_MULT_BAND_ST_B10']);
  const offsetImg = getFactorImg(['REFLECTANCE_ADD_BAND_.|TEMPERATURE_ADD_BAND_ST_B10']);
  const scaled = image.select('SR_B.|ST_B10').multiply(scaleImg).add(offsetImg);

  // Replace original bands with scaled bands and apply masks
  return image.addBands(scaled, null, true).updateMask(qaMask).updateMask(saturationMask);
};

// Function to create a composite surface reflectance image of Landsat 8 for a specified date range
const createCompositeImage = (startDate, endDate) => {
  // Filter Landsat 8 image collection based on start and end dates
  // Apply prepSrL8 function to each image in the collection
  // Calculate the median of the preprocessed images
  const image = ee
    .ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate(startDate, endDate)
    .map(prepSrL8)
    .median();

  // Define the bands to be used for prediction
  const bands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7', 'ST_B10'];

  // Return the composite image and the bands
  return { image, bands };
};

module.exports = {
  prepSrL8,
  createCompositeImage,
};

/* To view the documentation used you can view the module accuracyEvaluation.js                                                                                                  
The main purpose of this code is to handle Landsat 8 surface reflectance images, which are satellite images that capture information about the Earth's surface.
Here's a breakdown of the code:
I've imported the necessary module at the beginning. Google Earth Engine is required to perform geospatial data analysis, and I've imported it as 'ee'.
The 'prepSrL8' function is defined to preprocess Landsat 8 surface reflectance images. It takes an image as input and applies several preprocessing steps to it. First, it creates masks for unwanted pixels, such as fill, cloud, and cloud shadow pixels. Then, it defines a helper function 'getFactorImg' to get scale factors for the bands in the image. After that, it applies the scale factors to the bands using the 'multiply' and 'add' methods of the 'ee.Image' class. Finally, it replaces the original bands with the scaled bands and applies the masks to the image using the 'updateMask' method.
The 'createCompositeImage' function is defined to create a composite surface reflectance image of Landsat 8 for a specified date range. It takes two arguments, 'startDate' and 'endDate', which define the date range for the composite image. It filters the Landsat 8 image collection based on the date range using the 'filterDate' method, applies the 'prepSrL8' function to each image in the collection using the 'map' method, and calculates the median of the preprocessed images using the 'median' method. It then defines the bands to be used for prediction and returns the composite image and the bands.
Finally, I've exported the 'prepSrL8' and 'createCompositeImage' functions so that they can be used in other parts of the application.
Overall, this code is designed to preprocess Landsat 8 surface reflectance images and create composite images for a specified date range. The composite images can then be used for further analysis or prediction tasks. */
