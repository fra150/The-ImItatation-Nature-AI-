const { sequelize } = require('../config/database');
const Area = require('./area');
const Sensor = require('./sensor');
const Drone = require('./drone');
const FireEvent = require('./fireEvents');
const User = require('./user');
const WeatherData = require('./weatherData');

// Associazioni pulite e coerenti (ogni relazione definita UNA volta, con un
// foreignKey unico — niente colonne duplicate). I foreignKey combaciano con le
// eventuali colonne FK già dichiarate nei modelli (es. Sensor.AreaId,
// FireEvent.areaId, WeatherData.areaId) così Sequelize le riusa.

// Area 1—N Sensor / Drone / FireEvent / WeatherData
Area.hasMany(Sensor, { foreignKey: 'AreaId' });
Sensor.belongsTo(Area, { foreignKey: 'AreaId' });

Area.hasMany(Drone, { foreignKey: 'areaId' });
Drone.belongsTo(Area, { foreignKey: 'areaId' });

Area.hasMany(FireEvent, { foreignKey: 'areaId' });
FireEvent.belongsTo(Area, { foreignKey: 'areaId' });

Area.hasMany(WeatherData, { foreignKey: 'areaId' });
WeatherData.belongsTo(Area, { foreignKey: 'areaId' });

// FireEvent 1—N Drone (droni assegnati a un incendio)
FireEvent.hasMany(Drone, { foreignKey: 'fireEventId' });
Drone.belongsTo(FireEvent, { foreignKey: 'fireEventId' });

// FireEvent N—1 Sensor (incendio rilevato da un sensore)
Sensor.hasMany(FireEvent, { foreignKey: 'detectedBySensorId' });
FireEvent.belongsTo(Sensor, { foreignKey: 'detectedBySensorId' });

module.exports = {
  Area,
  FireEvent,
  Sensor,
  Drone,
  User,
  WeatherData,
};
