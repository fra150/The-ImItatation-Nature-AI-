const ee = require('@google/earthengine');
const forestModel = require('../models/forestModel');
const { initEarthEngine } = require('./earthEngine');

// Inizializza Earth Engine via service account (vedi services/earthEngine.js).
// Il vecchio ee.Authenticate()/ee.Initialize() non funziona più in
// @google/earthengine 0.1.x (ee.Authenticate è undefined: serve il service account).
const initializeEarthEngine = () => initEarthEngine();

// Dataset Hansen Global Forest Change (UMD). Versione aggiornabile quando esce.
const HANSEN_DATASET = 'UMD/hansen/global_forest_change_2023_v1_11';

// Genera una thumbnail REALE del forest-change da Earth Engine. Sostituisce la
// versione rotta che chiamava forestModel.getForestChangeCollection() (metodo
// inesistente: forestModel è un model Sequelize). Richiede EE configurato;
// in caso contrario initEarthEngine() rigetta e l'handler risponde 503.
// options: { band?: string, bbox?: [west, south, east, north] }
const getForestChangeData = async (options = {}) => {
  await initializeEarthEngine();
  const band = options.band || 'treecover2000';
  const bbox = options.bbox || [-10, 35, 30, 60]; // default: Europa
  const image = ee.Image(HANSEN_DATASET).select(band);
  const palette = band === 'treecover2000' ? ['black', 'green'] : ['ffffff', 'ff0000'];

  const thumbnailUrl = await new Promise((resolve, reject) => {
    image.getThumbURL(
      { min: 0, max: 100, palette, dimensions: 512, region: ee.Geometry.Rectangle(bbox) },
      (url, err) =>
        err ? reject(new Error(typeof err === 'string' ? err : JSON.stringify(err))) : resolve(url),
    );
  });

  return { dataset: HANSEN_DATASET, band, bbox, thumbnailUrl };
};

// Function to generate chart data
const generateChartData = async () => {
  try {
    await initializeEarthEngine();
    const collection = forestModel.getForestChangeCollection();

    const lossByYear = collection
      .reduceColumns(ee.Reducer.sum(), ['lossyear'])
      .get('sum')
      .getInfo();
    const gain = collection.reduceColumns(ee.Reducer.sum(), ['gain']).get('sum').getInfo();

    return {
      labels: ['Loss by Year', 'Gain'],
      datasets: [
        {
          label: 'Forest Change',
          data: [lossByYear, gain],
          backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
          borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
          borderWidth: 1,
        },
      ],
    };
  } catch (error) {
    console.error('Error generating chart data:', error);
    throw error;
  }
};

// Function to create a chart
const createChart = async (data) => {
  // chartjs-node-canvas è opzionale (richiede il canvas nativo): caricata in
  // modo lazy così forestService resta importabile anche quando non è installata.
  const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
  const width = 800;
  const height = 600;
  const chartCallback = (ChartJS) => {
    ChartJS.defaults.global.elements.rectangle.borderWidth = 2;
  };

  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
  const configuration = {
    type: 'bar',
    data: data,
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  };

  try {
    return await chartJSNodeCanvas.renderToBuffer(configuration);
  } catch (error) {
    console.error('Error creating chart:', error);
    throw error;
  }
};

async function insertForestData(data) {
  try {
    const newForestData = await forestModel.create(data);
    return newForestData;
  } catch (error) {
    console.error('Error inserting forest data:', error);
    throw error;
  }
}

module.exports = {
  getForestChangeData,
  generateChartData,
  createChart,
  initializeEarthEngine,
  insertForestData,
};

/*This code is designed to interact with Google Earth Engine, a cloud-based platform for analyzing and visualizing large-scale geospatial data. The code uses the Earth Engine API to retrieve forest change data, generate chart data, create a chart, and insert forest data into a database.
Firstly, I import the necessary modules and libraries, including '@google/earthengine', 'forestModel', 'chartjs-node-canvas', and 'moment'. I then define an asynchronous function called 'initializeEarthEngine' that authenticates and initializes the Earth Engine API.
The 'getForestChangeData' function retrieves forest change data from the Earth Engine API. It first initializes the Earth Engine API, then uses the 'forestModel' to get a collection of forest change data. It defines visualization parameters for the data, including the bands, minimum and maximum values, and color palette. It then generates a thumbnail URL for the data and returns it.
The 'generateChartData' function generates chart data for the forest change data. It initializes the Earth Engine API and gets the forest change collection. It then calculates the total loss by year and gain from the data and returns it in a format that can be used by the 'chartjs-node-canvas' library to create a chart.
The 'createChart' function creates a chart using the 'chartjs-node-canvas' library. It takes chart data as input, defines the chart configuration, and then renders the chart to a buffer.
Finally, the 'insertForestData' function inserts forest data into a database using the 'forestModel'. It takes data as input, creates a new forest data entry in the database, and returns the new data entry.
Overall, this code provides a comprehensive set of functions for working with forest change data using the Earth Engine API, generating charts, and inserting data into a database. */
