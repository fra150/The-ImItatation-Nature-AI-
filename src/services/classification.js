// Classificazione del territorio con Earth Engine — endpoint reali e
// self-contained (nessun input etichettato richiesto dall'utente):
//  - unsupervised: K-means su un composito Landsat 8 -> thumbnail dei cluster.
//  - supervised: Random Forest etichettato automaticamente con MODIS land cover
//    -> thumbnail della classificazione + accuratezza di training.
// Default: area San Francisco Bay (ottima copertura Landsat), estate 2021.
const ee = require('@google/earthengine');
const { initEarthEngine } = require('./earthEngine');

const BANDS = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];
const DEFAULT_BBOX = [-122.6, 37.2, -121.7, 37.9];

function compositeImage(region, startDate, endDate) {
  return ee
    .ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(region)
    .filterDate(startDate, endDate)
    .median()
    .select(BANDS);
}

function getThumb(image, region, visParams) {
  return new Promise((resolve, reject) => {
    image.getThumbURL({ ...visParams, dimensions: 512, region }, (url, err) =>
      err ? reject(new Error(typeof err === 'string' ? err : JSON.stringify(err))) : resolve(url),
    );
  });
}

async function unsupervised({
  bbox = DEFAULT_BBOX,
  startDate = '2021-06-01',
  endDate = '2021-09-30',
  numClusters = 7,
} = {}) {
  await initEarthEngine();
  const region = ee.Geometry.Rectangle(bbox);
  const image = compositeImage(region, startDate, endDate);
  const training = image.sample({ region, scale: 30, numPixels: 1000 });
  const clusterer = ee.Clusterer.wekaKMeans(numClusters).train(training);
  const result = image.cluster(clusterer);
  // Palette di colori distinti per i cluster (banda singola -> PNG valido).
  const palette = [
    '1f78b4', '33a02c', 'e31a1c', 'ff7f00', '6a3d9a', 'b15928', 'a6cee3', 'fb9a99', 'fdbf6f', 'cab2d6',
  ];
  const thumbnailUrl = await getThumb(result, region, {
    min: 0,
    max: numClusters - 1,
    palette: palette.slice(0, numClusters),
  });
  return { type: 'unsupervised-kmeans', numClusters, bbox, startDate, endDate, thumbnailUrl };
}

async function supervised({ bbox = DEFAULT_BBOX, startDate = '2021-06-01', endDate = '2021-09-30' } = {}) {
  await initEarthEngine();
  const region = ee.Geometry.Rectangle(bbox);
  const image = compositeImage(region, startDate, endDate);
  // Etichette automatiche: MODIS land cover (IGBP, banda LC_Type1).
  const modis = ee.Image('MODIS/061/MCD12Q1/2020_01_01').select('LC_Type1');
  const training = image.addBands(modis).sample({ region, numPixels: 1000, scale: 30, seed: 0 });
  const classifier = ee.Classifier.smileRandomForest(10).train({
    features: training,
    classProperty: 'LC_Type1',
    inputProperties: BANDS,
  });
  const classified = image.classify(classifier);
  const igbpPalette = [
    'aec3d4', '152106', '225129', '369b47', '30eb5b', '387242', '6a2325', 'c3aa69',
    'b76031', 'd9903d', '91af40', '111149', 'cdb33b', 'cc0013', '33280d', 'd7cdcc', 'f7e084',
  ];
  const thumbnailUrl = await getThumb(classified, region, { min: 1, max: 17, palette: igbpPalette });
  const trainingAccuracy = await new Promise((resolve, reject) =>
    classifier
      .confusionMatrix()
      .accuracy()
      .getInfo((v, err) => (err ? reject(new Error(err)) : resolve(v))),
  );
  return { type: 'supervised-randomforest', bbox, startDate, endDate, trainingAccuracy, thumbnailUrl };
}

module.exports = { unsupervised, supervised };
