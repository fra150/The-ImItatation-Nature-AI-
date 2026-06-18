// Import the Google Earth Engine library
const ee = require('@google/earthengine');

// NOTA: il blocco demo Earth Engine (caricamento di un'immagine Landsat +
// chiamate Map.setCenter/Map.addLayer del Code Editor EE) è stato rimosso:
// eseguiva codice al require usando globali inesistenti in Node e faceva
// crashare l'app all'avvio. Resta la funzione riutilizzabile.

/**
 * Addestra un clusterer non supervisionato (K-means) su un'immagine EE.
 * Richiede una sessione Earth Engine già inizializzata.
 */
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

  return result;
};

module.exports = {
  trainUnsupervisedClusterer,
};
