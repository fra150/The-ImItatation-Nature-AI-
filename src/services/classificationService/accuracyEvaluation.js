// Import the Google Earth Engine library
const ee = require('@google/earthengine');

// NOTA: il blocco demo Earth Engine (copiato dalla guida ufficiale EE, sezione
// "Supervised Classification") è stato rimosso. Eseguiva codice al require e
// usava globali del Code Editor di Earth Engine (print, Map, prepSrL8) che in
// Node non esistono, facendo crashare l'intera app all'avvio. Resta solo la
// funzione riutilizzabile evaluateAccuracy, da invocare DOPO aver inizializzato
// Earth Engine (vedi forestService.initializeEarthEngine).

/**
 * Valuta l'accuratezza di un classificatore EE su un'immagine etichettata.
 * Richiede una sessione Earth Engine già inizializzata.
 */
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
