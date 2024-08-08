const Area = require('./area');
const { sequelize } = require('../config/database');
const Sensor = require('../model/sensor');
const Drone = require('../model/drone');
const FireEvent = require('../model/fireEvent');
const { Sequelize } = require('sequelize');

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

// Export the models
module.exports = {
  Area,
  FireEvent,
  Sensor,
  Drone,
};

/* In this code,It is important to remember that the relationships are incomplete at this time because there is no database configured at this time. I have established the relationships between different models in my application using Sequelize, an Object-Relational Mapping (ORM) library for Node.js. The models I've worked with are `Area`, `FireEvent`, `Sensor`, and `Drone`.
Firstly, I defined the associations between the `Drone` and `Area` models. A Drone can belong to many Areas, and an Area can have many Drones. This is a many-to-many relationship, so I used the `belongsToMany` method and specified the join table `AreaDrones`.
Additionally, a Drone can belong to a FireEvent and an Area. I used the `belongsTo` method to define these one-to-many relationships.
Moving on to the `Sensor` model, I defined its associations with the `FireEvent` and `Area` models. A Sensor can belong to many Areas, and an Area can have many Sensors. This is also a many-to-many relationship, so I used the `belongsToMany` method and specified the join table `AreaSensors`. Furthermore, a Sensor can have many Drones and FireEvents, so I used the `hasMany` method to define these one-to-many relationships.
For the `FireEvent` model, I defined its associations with the `Drone`, `Area`, and `Sensor` models. A FireEvent can have many Drones and Sensors, and it belongs to an Area. I used the `hasMany` and `belongsTo` methods to define these relationships.
Finally, for the `Area` model, I defined its associations with the `Drone`, `Sensor`, and `FireEvent` models. An Area can have many Drones, Sensors, and FireEvents. I used the `hasMany` method to define these one-to-many relationships. Additionally, an Area can belong to many Drones and Sensors, which is a many-to-many relationship. I used the `belongsToMany` method and specified the join tables `AreaDrones` and `AreaSensors` to define these relationships.
In summary, I have established the necessary relationships between the `Area`, `FireEvent`, `Sensor`, and `Drone` models using Sequelize. This allows me to easily query and manipulate data across these models based on their relationships. */
