import { useState } from 'react';
import { api } from '../api';

// I 5 layer Earth Engine reali esposti dal backend.
const LAYERS = [
  { key: 'forest', label: '🌲 Forest change', path: '/api/forestChange' },
  { key: 'temp', label: '🌡️ Temperatura (ERA5)', path: '/api/weather/era5' },
  { key: 'wind', label: '💨 Vento (RTMA)', path: '/api/weather/wind' },
  { key: 'unsup', label: '🛰️ Land cover · K-means', path: '/api/classify/unsupervised' },
  { key: 'sup', label: '🧠 Land cover · Random Forest', path: '/api/classify/supervised' },
];

export default function EEPanel() {
  const [active, setActive] = useState(null);
  const [url, setUrl] = useState('');
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(layer) {
    setActive(layer.key);
    setLoading(true);
    setError('');
    setUrl('');
    setMeta(null);
    try {
      const data = await api(layer.path);
      setUrl(data.thumbnailUrl);
      setMeta(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ee-panel">
      <h2>🌍 Earth Engine — dati satellitari live</h2>
      <p className="muted">Layer reali dal progetto Google Earth Engine collegato al backend.</p>
      <div className="ee-buttons">
        {LAYERS.map((l) => (
          <button key={l.key} className={active === l.key ? 'active' : ''} onClick={() => load(l)}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="ee-view">
        {!active && <div className="muted">Scegli un layer per caricarlo da Earth Engine.</div>}
        {loading && <div className="muted">Caricamento da Earth Engine… (può richiedere alcuni secondi)</div>}
        {error && (
          <div className="error">
            ⚠️ {error}
            {/not configured|503/i.test(error) ? ' — Earth Engine non configurato sul server.' : ''}
          </div>
        )}
        {url && <img src={url} alt="Earth Engine layer" />}
        {meta && meta.trainingAccuracy != null && (
          <div className="muted">Accuratezza classificatore: {(meta.trainingAccuracy * 100).toFixed(1)}%</div>
        )}
      </div>
    </div>
  );
}
