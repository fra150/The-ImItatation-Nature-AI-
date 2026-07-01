const {
  windVectorToSpeedBearing,
  estimateSpread,
} = require('../src/services/fireSpreadService');

// Logica pura, senza DB/rete: verifica la matematica del vettore vento e
// l'euristica di propagazione — chiaramente NON un modello fisico (vedi
// commenti nel service), ma dev'essere internamente coerente e testabile.
describe('fireSpreadService — windVectorToSpeedBearing', () => {
  test('vento puro da ovest verso est (u>0, v=0) -> rotta 90°', () => {
    const { speedMs, bearingDeg } = windVectorToSpeedBearing(10, 0);
    expect(speedMs).toBeCloseTo(10);
    expect(bearingDeg).toBeCloseTo(90);
  });

  test('vento puro da sud verso nord (u=0, v>0) -> rotta 0°', () => {
    const { bearingDeg } = windVectorToSpeedBearing(0, 10);
    expect(bearingDeg).toBeCloseTo(0);
  });

  test('vento puro da nord verso sud (u=0, v<0) -> rotta 180°', () => {
    const { bearingDeg } = windVectorToSpeedBearing(0, -10);
    expect(bearingDeg).toBeCloseTo(180);
  });

  test('vento calmo -> velocità zero', () => {
    const { speedMs } = windVectorToSpeedBearing(0, 0);
    expect(speedMs).toBe(0);
  });
});

describe('fireSpreadService — estimateSpread', () => {
  test('vento più forte -> tasso di propagazione maggiore, a parità di severità', () => {
    const calmo = estimateSpread({ windU: 1, windV: 0, severity: 'medium' });
    const forte = estimateSpread({ windU: 15, windV: 0, severity: 'medium' });
    expect(forte.spreadRateMps).toBeGreaterThan(calmo.spreadRateMps);
  });

  test('severità più alta -> tasso maggiore, a parità di vento', () => {
    const bassa = estimateSpread({ windU: 5, windV: 5, severity: 'low' });
    const alta = estimateSpread({ windU: 5, windV: 5, severity: 'high' });
    expect(alta.spreadRateMps).toBeGreaterThan(bassa.spreadRateMps);
  });

  test('dichiara sempre esplicitamente il metodo e il disclaimer euristico', () => {
    const result = estimateSpread({ windU: 5, windV: 5, severity: 'high' });
    expect(result.method).toBe('heuristic-wind-linear');
    expect(result.confidence).toBe('low');
    expect(result.disclaimer).toMatch(/euristic/i);
  });

  test('horizonMinutes personalizzato scala la distanza proiettata', () => {
    const oraSingola = estimateSpread({ windU: 5, windV: 0, severity: 'medium', horizonMinutes: 60 });
    const dueOre = estimateSpread({ windU: 5, windV: 0, severity: 'medium', horizonMinutes: 120 });
    expect(dueOre.projectedDistanceMeters).toBeCloseTo(oraSingola.projectedDistanceMeters * 2, -1);
  });
});
