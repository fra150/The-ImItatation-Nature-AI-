// Import the Google Earth Engine library
const ee = require('@google/earthengine');

// NOTA: il blocco demo Earth Engine (caricamento dei punti di training +
// chiamate Map.* del Code Editor EE, con variabili `image`/`classified` non
// definite) è stato rimosso: eseguiva codice al require facendo crashare l'app
// all'avvio. Resta la funzione riutilizzabile trainSupervisedClassifier.

/**
 * Addestra un classificatore supervisionato (SmileCart) su un'immagine EE
 * usando punti etichettati. Richiede una sessione Earth Engine inizializzata.
 */
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

module.exports = {
  trainSupervisedClassifier,
};
