const { EventEmitter } = require('events');
const { sequelize } = require('../src/config/database');
const { Area, Sensor, Drone, FireEvent } = require('../src/models');
const iotGateway = require('../src/services/iotGateway');
const realtime = require('../src/services/realtimeService');

// Strato IoT/droni su MQTT testato SENZA broker reale: handler diretti su DB
// in-memory + un client MQTT finto (EventEmitter) per i publish/subscribe.
function makeClient() {
  const c = new EventEmitter();
  c.published = [];
  c.subscribed = [];
  c.subscribe = (topics, cb) => {
    c.subscribed.push(...(Array.isArray(topics) ? topics : [topics]));
    if (cb) cb(null);
  };
  c.publish = (topic, payload, opts) => c.published.push({ topic, payload, opts });
  return c;
}

describe('iotGateway — topic schema', () => {
  test('parseTopic riconosce solo i topic a 3 segmenti di drones/sensors', () => {
    expect(iotGateway.parseTopic('drones/SKYDIO-01/telemetry')).toEqual({
      domain: 'drones',
      id: 'SKYDIO-01',
      kind: 'telemetry',
    });
    expect(iotGateway.parseTopic('sensors/5/telemetry')).toEqual({
      domain: 'sensors',
      id: '5',
      kind: 'telemetry',
    });
    expect(iotGateway.parseTopic('foo/bar')).toBeNull();
    expect(iotGateway.parseTopic('weird/a/b/c')).toBeNull();
  });

  test('le factory dei topic usano la wildcard MQTT di default', () => {
    expect(iotGateway.topics.droneTelemetry()).toBe('drones/+/telemetry');
    expect(iotGateway.topics.droneCommands('SKYDIO-01')).toBe('drones/SKYDIO-01/commands');
  });
});

describe('iotGateway — comandi verso il drone', () => {
  afterEach(() => iotGateway._reset());

  test('sendCommand senza broker degrada a no-op (false)', () => {
    iotGateway._reset();
    expect(iotGateway.sendCommand('SKYDIO-01', { type: 'land' })).toBe(false);
  });

  test('sendCommand pubblica sul topic comandi col payload JSON corretto', () => {
    const c = makeClient();
    const ok = iotGateway.sendCommand('SKYDIO-01', { type: 'goto', latitude: 37.7 }, c);
    expect(ok).toBe(true);
    expect(c.published).toHaveLength(1);
    expect(c.published[0].topic).toBe('drones/SKYDIO-01/commands');
    const msg = JSON.parse(c.published[0].payload);
    expect(msg.type).toBe('goto');
    expect(msg.latitude).toBe(37.7);
    expect(typeof msg.ts).toBe('number');
  });

  test('sendMission rifiuta waypoints vuoti e pubblica quando validi', () => {
    const c = makeClient();
    expect(() => iotGateway.sendMission('SKYDIO-01', [], c)).toThrow(/waypoints/);
    iotGateway.sendMission('SKYDIO-01', [{ latitude: 1, longitude: 2 }], c);
    expect(JSON.parse(c.published[0].payload).type).toBe('mission');
  });

  test('init si sottoscrive ai topic di telemetria droni e sensori', () => {
    const c = makeClient();
    iotGateway.init(c);
    expect(c.subscribed).toEqual(
      expect.arrayContaining(['drones/+/telemetry', 'drones/+/status', 'drones/+/ack', 'sensors/+/telemetry']),
    );
  });
});

describe('iotGateway — telemetria & rilevamento (DB in-memory)', () => {
  let area;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    area = await Area.create({
      name: 'Zona IoT',
      location: { latitude: 37.75, longitude: 14.99 },
      riskLevel: 'high',
    });
  });
  afterAll(async () => {
    await sequelize.close();
  });
  beforeEach(async () => {
    await Drone.destroy({ where: {} });
    await Sensor.destroy({ where: {} });
    await FireEvent.destroy({ where: {} });
    iotGateway._reset();
  });

  test('handleDroneTelemetry aggiorna lo snapshot live ed emette drone:update', async () => {
    const spy = jest.spyOn(realtime, 'emitDroneUpdate');
    const drone = await Drone.create({
      identifier: 'DRN-T1',
      model: 'Test X',
      status: 'available',
      location: null,
    });

    const updated = await iotGateway.handleDroneTelemetry('DRN-T1', {
      latitude: 37.5,
      longitude: 15.0,
      batteryLevel: 80,
      altitude: 120,
      speed: 10,
      heading: 90,
    });

    expect(updated.id).toBe(drone.id);
    const reloaded = await Drone.findByPk(drone.id);
    expect(reloaded.location.latitude).toBeCloseTo(37.5);
    expect(reloaded.batteryLevel).toBe(80);
    expect(reloaded.altitude).toBe(120);
    expect(reloaded.online).toBe(true);
    expect(reloaded.lastSeenAt).toBeTruthy();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('init instrada i messaggi MQTT in arrivo agli handler (message -> DB)', async () => {
    const drone = await Drone.create({
      identifier: 'DRN-WIRE',
      model: 'Wire X',
      status: 'available',
      location: null,
    });
    const c = makeClient();
    iotGateway.init(c); // registra il listener 'message' + subscribe

    // Simula la consegna del broker: il client emette un 'message'.
    c.emit(
      'message',
      'drones/DRN-WIRE/telemetry',
      Buffer.from(JSON.stringify({ batteryLevel: 42, latitude: 37.2, longitude: 15.1 })),
    );

    // onMessage è async: poll in-process fino all'aggiornamento.
    let reloaded;
    for (let i = 0; i < 30; i += 1) {
      reloaded = await Drone.findByPk(drone.id);
      if (reloaded.batteryLevel === 42) break;
      await new Promise((r) => setTimeout(r, 20));
    }
    expect(reloaded.batteryLevel).toBe(42);
    expect(reloaded.online).toBe(true);
    expect(reloaded.location.latitude).toBeCloseTo(37.2);
  });

  test('telemetria da drone sconosciuto è ignorata senza errori', async () => {
    const res = await iotGateway.handleDroneTelemetry('NOPE', { batteryLevel: 50 });
    expect(res).toBeNull();
  });

  test('handleSensorTelemetry sopra soglia crea un FireEvent e dispaccia il drone', async () => {
    await Sensor.create({
      name: 'ETNA-THERM-TEST',
      type: 'thermal',
      status: 'active',
      location: { latitude: 37.752, longitude: 14.995 },
      manufacturer: 'Bosch',
      model: 'TH-2000',
      serialNumber: 'ETN-TEST-1',
      description: 'termocamera test',
      softwareVersion: '1',
      firmwareVersion: '1',
      hardwareVersion: '1',
      AreaId: area.id,
    });
    const sensor = await Sensor.findOne({ where: { serialNumber: 'ETN-TEST-1' } });
    await Drone.create({
      identifier: 'DRN-NEAR',
      model: 'Test X',
      status: 'available',
      location: { latitude: 37.75, longitude: 14.994 },
    });

    const { fire } = await iotGateway.handleSensorTelemetry(sensor.id, { temperature: 80 });

    expect(fire).not.toBeNull();
    expect(fire.dispatched).toBe(true);
    expect(await FireEvent.count()).toBe(1);
    const reloaded = await Drone.findOne({ where: { identifier: 'DRN-NEAR' } });
    expect(reloaded.status).toBe('in_use');
  });

  test('letture sensore sotto soglia non creano incendi', async () => {
    await Sensor.create({
      name: 'ETNA-THERM-COLD',
      type: 'thermal',
      status: 'active',
      location: { latitude: 37.752, longitude: 14.995 },
      manufacturer: 'Bosch',
      model: 'TH-2000',
      serialNumber: 'ETN-TEST-2',
      description: 'termocamera test',
      softwareVersion: '1',
      firmwareVersion: '1',
      hardwareVersion: '1',
      AreaId: area.id,
    });
    const sensor = await Sensor.findOne({ where: { serialNumber: 'ETN-TEST-2' } });
    const { fire } = await iotGateway.handleSensorTelemetry(sensor.id, { temperature: 25 });
    expect(fire).toBeNull();
    expect(await FireEvent.count()).toBe(0);
  });
});
