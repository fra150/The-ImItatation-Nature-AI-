// Seed del database con dati demo realistici (parchi italiani a rischio
// incendio). Uso: `npm run seed`. Resetta le tabelle (force) e le ripopola.
// Gira sul DB configurato in .env (default: SQLite -> database.sqlite).
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('../src/config/database');
const { Area, Sensor, Drone, FireEvent, User, WeatherData } = require('../src/models');
const ForestData = require('../src/models/forestModel');

async function seed() {
  console.log(`Seeding database (dialect=${process.env.DB_DIALECT || 'sqlite'})...`);
  await sequelize.sync({ force: true });

  // --- Utenti (password: Password123!) ---
  const hash = await bcrypt.hash('Password123!', 10);
  await User.bulkCreate([
    { username: 'francesco', password: hash, role: 'admin' },
    { username: 'operatore1', password: hash, role: 'user' },
  ]);

  // --- Aree ---
  const etna = await Area.create({
    name: "Parco dell'Etna",
    location: { latitude: 37.751, longitude: 14.993 },
    description: 'Vulcano attivo, Sicilia',
    riskLevel: 'high',
  });
  const gennargentu = await Area.create({
    name: 'Gennargentu',
    location: { latitude: 40.012, longitude: 9.3 },
    description: 'Massiccio montuoso, Sardegna',
    riskLevel: 'medium',
  });
  const aspromonte = await Area.create({
    name: 'Aspromonte',
    location: { latitude: 38.18, longitude: 15.9 },
    description: 'Parco nazionale, Calabria',
    riskLevel: 'high',
  });

  // --- Sensori ---
  await Sensor.bulkCreate([
    { name: 'ETNA-THERM-01', type: 'thermal', status: 'active', location: { latitude: 37.752, longitude: 14.995 }, manufacturer: 'Bosch', model: 'TH-2000', serialNumber: 'ETN-TH-001', description: 'Termocamera cresta nord', softwareVersion: '2.1', firmwareVersion: '1.4', hardwareVersion: '1.0', AreaId: etna.id },
    { name: 'ETNA-SMOKE-02', type: 'smoke', status: 'active', location: { latitude: 37.749, longitude: 14.99 }, manufacturer: 'Honeywell', model: 'SM-50', serialNumber: 'ETN-SM-002', description: 'Rilevatore fumo versante sud', softwareVersion: '1.0', firmwareVersion: '1.0', hardwareVersion: '1.0', AreaId: etna.id },
    { name: 'GEN-GAS-01', type: 'gas', status: 'active', location: { latitude: 40.013, longitude: 9.302 }, manufacturer: 'Figaro', model: 'GS-10', serialNumber: 'GEN-GS-001', description: 'Sensore gas', softwareVersion: '1.2', firmwareVersion: '1.1', hardwareVersion: '1.0', AreaId: gennargentu.id },
    { name: 'ASP-LIDAR-01', type: 'lidar', status: 'inactive', location: { latitude: 38.181, longitude: 15.902 }, manufacturer: 'Velodyne', model: 'VLP-16', serialNumber: 'ASP-LD-001', description: 'LIDAR mappatura 3D', softwareVersion: '3.0', firmwareVersion: '2.0', hardwareVersion: '2.0', AreaId: aspromonte.id },
  ]);

  // --- Droni ---
  await Drone.bulkCreate([
    { identifier: 'SKYDIO-01', model: 'Skydio X10', status: 'available', batteryLevel: 95, payloadCapacity: 20, location: { latitude: 37.75, longitude: 14.994 }, action: 'patrol', areaId: etna.id, online: true, lastSeenAt: new Date() },
    { identifier: 'DJI-M350-02', model: 'DJI Matrice 350', status: 'in_use', batteryLevel: 60, payloadCapacity: 10, location: { latitude: 40.011, longitude: 9.299 }, action: 'survey', areaId: gennargentu.id, online: true, lastSeenAt: new Date() },
    { identifier: 'FIREBALL-03', model: 'Fireball-Dropper 1', status: 'maintenance', batteryLevel: 20, payloadCapacity: 100, location: { latitude: 38.179, longitude: 15.899 }, action: 'extinguish', areaId: aspromonte.id, online: false },
  ]);

  // --- Eventi incendio ---
  const now = Date.now();
  await FireEvent.bulkCreate([
    { areaId: etna.id, location: 'Cresta nord Etna', latitude: 37.758, longitude: 14.998, startTime: new Date(now - 2 * 3600 * 1000), severity: 'high', status: 'in_progress', description: 'Focolaio rilevato da ETNA-THERM-01' },
    { areaId: aspromonte.id, location: 'Versante est Aspromonte', latitude: 38.185, longitude: 15.91, startTime: new Date(now - 48 * 3600 * 1000), endTime: new Date(now - 40 * 3600 * 1000), severity: 'medium', status: 'extinguished', description: 'Incendio domato dalla squadra droni' },
  ]);

  // --- Dati meteo (ERA5, temperature in Kelvin) ---
  await WeatherData.bulkCreate([
    { areaId: etna.id, date: new Date(), mean_2m_air_temperature: 305.2, total_precipitation: 0, dewpoint_2m_temperature: 285.1, mean_sea_level_pressure: 101200, surface_pressure: 98000, u_component_of_wind_10m: 6.4, v_component_of_wind_10m: 2.1 },
    { areaId: gennargentu.id, date: new Date(), mean_2m_air_temperature: 299.0, total_precipitation: 0.002, dewpoint_2m_temperature: 288.0, mean_sea_level_pressure: 101500, surface_pressure: 99000, u_component_of_wind_10m: 3.1, v_component_of_wind_10m: -1.4 },
  ]);

  // --- Dati forest-change (Hansen-like) ---
  await ForestData.bulkCreate([
    { treeCover2000: 78, loss: true, gain: false, lossYear: 12, firstB30: 120, firstB40: 110, firstB50: 90, firstB70: 80, lastB30: 60, lastB40: 55, lastB50: 50, lastB70: 45, dataMask: 1 },
    { treeCover2000: 45, loss: false, gain: true, lossYear: 0, firstB30: 100, firstB40: 95, firstB50: 85, firstB70: 75, lastB30: 105, lastB40: 100, lastB50: 90, lastB70: 80, dataMask: 1 },
  ]);

  const counts = {
    users: await User.count(),
    areas: await Area.count(),
    sensors: await Sensor.count(),
    drones: await Drone.count(),
    fireEvents: await FireEvent.count(),
    weatherData: await WeatherData.count(),
    forestData: await ForestData.count(),
  };
  console.log('✅ Seed completato:', counts);
  await sequelize.close();
}

seed().catch((err) => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});
