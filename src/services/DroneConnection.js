// src/services/DroneConnection.js
class DroneConnection {
  async getWeatherData(location) {
    console.log(`Fetching weather data for location: ${location}`);
    return {
      temperature: Math.random() * 30,
      humidity: Math.random() * 100,
      windSpeed: Math.random() * 20,
    };
  }
}

module.exports = { DroneConnection };

/* I have created a class called `DroneConnection` that has an asynchronous method called `getWeatherData`. This method takes a geographical location as input and returns an object containing random weather data for that location. The data returned includes temperature, humidity, and wind speed.
To create this class, I followed these steps:
1. I defined the `DroneConnection` class using modern JavaScript syntax.
2. Inside the class, I defined the `getWeatherData` method that accepts a `location` parameter.
3. Inside the `getWeatherData` method, I used the `console.log` function to log the location for which I am retrieving weather data.
4. I created a JavaScript object that contains three properties: `temperature`, `humidity`, and `windSpeed`.
5. I used the `Math.random()` function to generate random values for each of these properties. The temperature is a number between 0 and 30, the humidity is a number between 0 and 100, and the wind speed is a number between 0 and 20.
6. Finally, I returned the object containing the random weather data.
I exported the `DroneConnection` class using the `module.exports` syntax so that it can be imported and used in other JavaScript files. */
