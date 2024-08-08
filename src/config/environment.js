require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  textToSpeechCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to Google Cloud TTS credentials JSON file
};/* Here is the insertion of the other keys.

/* Here, all the API keys and those necessary to make the TheimitatationNatureAI project work are added. */
