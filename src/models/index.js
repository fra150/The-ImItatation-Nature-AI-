const { sequelize } = require('../config/database');
const Area = require('./area');
const Sensor = require('./sensor');
const Drone = require('./drone');
const FireEvent = require('./fireEvents');
const User = require('./user');
const WeatherData = require('./weatherData');

// Associations Drone
Drone.belongsToMany(Area, { through: 'AreaDrones' });
Drone.belongsTo(FireEvent, { foreignKey: 'fire_event_id' });
Drone.belongsTo(Area, { foreignKey: 'area_id' });

// Associations Sensor
Sensor.belongsTo(FireEvent, { foreignKey: 'fire_event_id' });
Sensor.belongsToMany(Area, { through: 'AreaSensors' });
Sensor.hasMany(Drone, { foreignKey: 'sensor_id' });
Sensor.hasMany(FireEvent, { foreignKey: 'sensor_id' });

// Associations fireEvents
FireEvent.hasMany(Drone, { foreignKey: 'fire_event_id' });
FireEvent.belongsTo(Area, { foreignKey: 'area_id' });
FireEvent.hasMany(Sensor, { foreignKey: 'fire_event_id' });
FireEvent.belongsTo(Sensor, { foreignKey: 'detected_by_sensor_id' });

// Associations Area
Area.hasMany(Drone, { foreignKey: 'area_id' });
Area.belongsToMany(Drone, { through: 'AreaDrones' });
Area.belongsToMany(Sensor, { through: 'AreaSensors' });
Area.hasMany(Sensor, { foreignKey: 'areaId' });
Area.hasMany(Drone, { foreignKey: 'areaId' });
Area.hasMany(FireEvent, { foreignKey: 'area_id' });

// Export models
module.exports = {
  Area,
  FireEvent,
  Sensor,
  Drone,
  User,
  WeatherData,
};
