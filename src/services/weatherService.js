/* WeatherService for weather data relevant to fire spread forecasting 
(temperature, humidity, wind speed, etc.). It should be noted that this part of the code is only predictive*/

const ee = require('@google/earthengine'); // Library for interfacing with Google Earth Engine
const moment = require('moment'); // Library for manipulating dates //aggiungere moment

async function initializeEarthEngine() {
  // Autenticazione (se necessario)
  ee.Authenticate();

  return new Promise((resolve, reject) => {
    ee.Initialize((error) => {
      if (error) {
        console.error('Errore nel inizializazione di Google Earth Engine:', error);
        reject(error);
      } else {
        console.log('Google Earth Engine inizializzato correttamente.');
        resolve();
      }
    });
  });
}

// Function to get climate data from ERA5 - note that the data is all an example and should be modified based on ne
async function getERA5Data(startDate, endDate) {
  let era5_2mt = ee
    .ImageCollection('ECMWF/ERA5/DAILY') // where I got the spatial images that connect to @google/earthengine
    .select('mean_2m_air_temperature')
    .filter(ee.Filter.date(startDate, endDate));

  let era5_tp = ee
    .ImageCollection('ECMWF/ERA5/DAILY')
    .select('total_precipitation')
    .filter(ee.Filter.date(startDate, endDate));

  let era5_2d = ee
    .ImageCollection('ECMWF/ERA5/DAILY')
    .select('dewpoint_2m_temperature')
    .filter(ee.Filter.date(startDate, endDate));

  let era5_mslp = ee
    .ImageCollection('ECMWF/ERA5/DAILY')
    .select('mean_sea_level_pressure')
    .filter(ee.Filter.date(startDate, endDate));

  let era5_sp = ee
    .ImageCollection('ECMWF/ERA5/DAILY')
    .select('surface_pressure')
    .filter(ee.Filter.date(startDate, endDate))
    .map((image) => image.divide(100).set('system:time_start', image.get('system:time_start'))); // Convert pressure from Pa to hPa

  let era5_u_wind_10m = ee
    .ImageCollection('ECMWF/ERA5/DAILY')
    .select('u_component_of_wind_10m')
    .filter(ee.Filter.date(startDate, endDate));

  return {
    temperature: era5_2mt,
    precipitation: era5_tp,
    dewpoint: era5_2d,
    seaLevelPressure: era5_mslp,
    surfacePressure: era5_sp,
    wind: era5_u_wind_10m,
  };
}

// Function to display data on a map
const visualizeDataOnMap = (data) => {
  // Color palette for total precipitation
  const visTp = {
    min: 0.0,
    max: 0.1,
    palette: ['ffffff', '00ffff', '0080ff', 'da00ff', 'ffa400', 'ff0000'],
  };

  // Color palette for temperature
  const vis2mt = {
    min: 250,
    max: 320,
    palette: [
      '000080',
      '0000d9',
      '4000ff',
      '8000ff',
      '0080ff',
      '00ffff',
      '00ff80',
      '80ff00',
      'daff00',
      'ffff00',
      'fff500',
      'ffda00',
      'ffb000',
      'ffa400',
      'ff4f00',
      'ff2500',
      'ff0a00',
      'ff00ff',
    ],
  };

  // Color palette for pressure
  const visPressure = {
    min: 500,
    max: 1150,
    palette: ['01ffff', '058bff', '0600ff', 'df00ff', 'ff00ff', 'ff8c00', 'ff8c00'],
  };

  // Add layers to the map
  Map.addLayer(
    data.precipitation.filter(ee.Filter.date('')), // Enter data relating to a specific day.
    visTp,
    'Daily total precipitation sums',
  );
  Map.addLayer(
    data.dewpoint.filter(ee.Filter.date('')), // Enter data relating to a specific day.
    vis2mt,
    'Daily mean 2m dewpoint temperature',
  );
  Map.addLayer(
    data.temperature.filter(ee.Filter.date('')), // Enter data relating to a specific day.
    vis2mt,
    'Daily mean 2m air temperature',
  );
  Map.addLayer(
    data.wind.filter(ee.Filter.date('')), // Enter data relating to a specific day.
    visPressure,
    'Daily mean 10m u-component of wind',
  );
  Map.addLayer(
    data.surfacePressure.filter(ee.Filter.date('')), // enter data relating to a specific day
    visPressure,
    'Daily mean surface pressure',
  );

  Map.setCenter(21.2, 22.2, 2); // Center the map on a specific location
};

// Band aliases.
const BLUE = 'CMI_C01';
const RED = 'CMI_C02';
const VEGGIE = 'CMI_C03';
const GREEN = 'GREEN';

// 16 pairs of CMI and DQF followed by synthetic green Bah 2018.
// Band numbers in the EE asset, zero-based index.
const NUM_BANDS = 33;
// Skipping the interleaved DQF bands.
const BLUE_BAND_INDEX = (1 - 1) * 2;
const RED_BAND_INDEX = (2 - 1) * 2;
const VEGGIE_BAND_INDEX = (3 - 1) * 2;
const GREEN_BAND_INDEX = NUM_BANDS - 1;

// Display range for GOES RGB.
const GOES_MIN = 0.0;
const GOES_MAX = 0.7; // Alternatively 1.0 or 1.3.
const GAMMA = 1.3;

const goesRgbViz = {
  bands: [RED, GREEN, BLUE],
  min: GOES_MIN,
  max: GOES_MAX,
  gamma: GAMMA,
};

// Function to apply scale and offset to the image.
const applyScaleAndOffset = function (image) {
  image = ee.Image(image);
  const bands = new Array(NUM_BANDS);
  for (let i = 1; i < 17; i++) {
    const bandName = 'CMI_C' + (100 + i + '').slice(-2);
    const offset = ee.Number(image.get(bandName + '_offset'));
    const scale = ee.Number(image.get(bandName + '_scale'));
    bands[(i - 1) * 2] = image.select(bandName).multiply(scale).add(offset);
    const dqfName = 'DQF_C' + (100 + i + '').slice(-2);
    bands[(i - 1) * 2 + 1] = image.select(dqfName);
  }

  // Bah, Gunshor, Schmit, Generating True Color GOES-16 Images Without a Green Band, 2018.
  // Green = 0.45 * Red + 0.10 * NIR + 0.45 * Blue
  const green1 = bands[RED_BAND_INDEX].multiply(0.45);
  const green2 = bands[VEGGIE_BAND_INDEX].multiply(0.1);
  const green3 = bands[BLUE_BAND_INDEX].multiply(0.45);
  const green = green1.add(green2).add(green3);
  bands[GREEN_BAND_INDEX] = green.rename(GREEN);

  return ee.Image(ee.Image(bands).copyProperties(image, image.propertyNames()));
};

// Collection and image IDs.
const collection = 'NOAA/GOES/16/MCMIPC/'; // in this case we can keep the files of the NoAA-goes-16 configuration, but we can also change it with our mysql.
const imageName = ''; // Here you add the image name
const assetId = collection + imageName;
const image = applyScaleAndOffset(assetId);
Map.setCenter(); // here you insert the coordinates of the map to be displayed in a visualization environment, for example (-75, 37, 5)
Map.addLayer(image, goesRgbViz); // here you insert

// Function to retrieve and display wind speed dataset data
const getWindSpeedData = async () => {
  // Define the dataset
  const dataset = ee
    .ImageCollection('NOAA/NWS/RTMA')
    .filter(ee.Filter.date('2024-03-01', '2024-03-02'));

  // Select the wind speed band
  const windSpeed = dataset.select('WIND');

  // Define the visualization properties
  const windSpeedVis = {
    min: 0.0,
    max: 12.0,
    palette: ['001137', '01abab', 'e7eb05', '620500'],
  };
  // Center the map on the specified location and add the wind speed layer
  Map.setCenter(-95.62, 39.91, 4);
  Map.addLayer(windSpeed, windSpeedVis, 'Wind Speed');

  // Return the dataset
  return dataset;
};

// Export the functions for use in other modules by creating a table =
module.exports = {
  getERA5Data,
  visualizeDataOnMap,
  applyScaleAndOffset,
  getWindSpeedData,
  initializeEarthEngine,
};

/* the data used for these modules are the following I have to cite them for copyright reasons
here is a list = ERA5 Daily Aggregates - Latest Climate Reanalysis Produced by ECMWF / Copernicus Climate Change Service, for the following point
provides aggregate values ​​for each day for seven ERA5 climate reanalysis parameters: 2 m air temperature, 2 m dew point temperature,
total precipitation, mean sea level pressure, surface pressure, 10 m wind u-component and 10 m wind v-component. In addition,
the daily minimum and maximum 2 m air temperature were calculated based on the hourly 2 m air temperature data.
The daily total precipitation values ​​are given as daily sums. All other parameters are given as daily means.
Credits to be given for their copyright = Copernicus Climate Change Service (C3S) (2017): ERA5: Fifth generation ECMWF atmospheric reanalysis of global climate.
Copernicus Climate Change Service Climate Data Store (CDS), (access date), https://cds.climate.copernicus.eu/cdsapp#!/home
Number 2 data from = Sentinel-5P NRTI CLOUD: Near Real-Time Cloud were taken for the following point: it retrieves the cloud fraction using measurements in the UV/VIS spectral regions and ROCINN retrieves the cloud height (pressure) and optical thickness (albedo) using measurements in and around the oxygen A-band at 760 nm.
Version 3.0 of the algorithms is used, which is based on a more realistic treatment of clouds as optically uniform layers of light-scattering particles.
Additionally, cloud parameters are also provided for a cloud model that assumes that the cloud is a Lambertian reflective boundary.
site = https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_NRTI_L3_CLOUD#description
site = https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_DAILY#description
site = https://developers.google.com/earth-engine/datasets/catalog/NOAA_NWS_RTMA#bands
site = https://developers.google.com/earth-engine/datasets/catalog/NOAA_NWS_RTMA#description
citation = none
added = GOES-16 MCMIPC Series ABI Level 2 Cloud and Moisture Imagery CONUS
other text = The Cloud and Moisture Imagery products all have a resolution of 2 km. Bands 1-6 are reflective.
The dimensionless quantity of the "reflectance" is normalized by the solar zenith angle. These bands support the characterization of clouds, vegetation,
snow/ice, and aerosols. Bands 7-16 are emissive. The brightness temperature at the Top-Of-Atmosphere (TOA) is measured in Kelvin.
These bands support the characterization of the surface, clouds, water vapor, ozone, volcanic ash, and dust based on emissive properties.
citation = Bah, Gunshor, Schmit, Generation of GOES-16 True Color Imagery without a Green Band, 2018. doi:10.1029/2018EA000379
Product User Guide (PUG) Volume 5, L2+ Products.
Schmit, T., Griffith, P., et al, (2016), A closer look at the ABI on the GOES-R series, Bull. Amer. Meteor. Soc., 98(4), 681-698. doi:10.1175/BAMS-D-15-00230.1
i added = RTMA: Real-Time Mesoscale Analysis
because = Real-Time Mesoscale Analysis (RTMA) is a high spatial and temporal resolution analysis for near-surface weather conditions.
This dataset includes hourly analyses at 2.5 km for CONUS.
citation = none are not copyrighted.
link = https://developers.google.com/earth-engine/datasets/catalog/NOAA_GOES_16_MCMIPC#description
*/
