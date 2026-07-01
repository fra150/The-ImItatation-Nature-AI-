// Import the Google Maps library
const { createClient } = require('@googlemaps/google-maps-services-js');

// Client creato PIGRAMENTE al primo utilizzo, non al require(): così importare
// questo modulo non fa mai crashare l'app se GOOGLE_MAPS_API_KEY non è
// configurata (stesso pattern di degradazione graziosa usato altrove nel
// progetto, es. geminiService/mqtt).
let googleMapsClient = null;
const getClient = () => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not defined (set GOOGLE_MAPS_API_KEY)');
  }
  if (!googleMapsClient) {
    googleMapsClient = createClient({ key: process.env.GOOGLE_MAPS_API_KEY, Promise: Promise });
  }
  return googleMapsClient;
};

// Function to get the geolocation of an address
const getGeolocation = async (address) => {
  // Check if the address is a non-empty string
  if (typeof address !== 'string' || address.trim() === '') {
    throw new Error('Invalid address');
  }

  try {
    // Make a request to the Google Maps API
    const response = await getClient().geocode({ address }).asPromise();

    // Check if the response is valid
    if (!response.json.results || response.json.results.length === 0) {
      throw new Error('No results found');
    }

    // Return the geolocation
    return response.json.results[0].geometry.location;
  } catch (error) {
    // Chiave mancante o indirizzo non valido: rilancia il messaggio originale,
    // così chi chiama sa esattamente cosa mancava (prima veniva inghiottito
    // da un messaggio generico "Failed to get geolocation").
    if (error.message.includes('API key') || error.message === 'No results found') {
      throw error;
    }
    // Handle network or connection errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Failed to connect to Google Maps API');
    }

    // Throw a generic error
    throw new Error('Failed to get geolocation');
  }
};

// Export the function
module.exports = {
  getGeolocation,
};

/* I have created a JavaScript function to get the geolocation of an address using Google Maps API.
The code checks if the Google Maps API key is defined and if the address is a non-empty string before making the API request. It also handles network or connection errors and throws a generic error if the geolocation cannot be retrieved.
Here are the steps I followed:
1. I imported the Google Maps library, which provided me with a client to make requests to the API.
2. I checked if the Google Maps API key is defined in the runtime environment. If not, I threw an error.
3. I created a Google Maps client using the API key and JavaScript's Promise class.
4. I defined an asynchronous function called `getGeolocation` that accepts an address as an argument.
5. Inside the function, I checked if the address is a non-empty string. If not, I threw an error.
6. I made a request to the Google Maps API using the client's `geocode` method and the provided address.
7. I checked if the API response is valid, making sure there are results available. If not, I threw an error.
8. I extracted the geolocation from the first result of the API response and returned it.
9. I handled any network or connection errors, throwing an appropriate error.
10. Finally, I exported the `getGeolocation` function so it can be used in other modules. */
