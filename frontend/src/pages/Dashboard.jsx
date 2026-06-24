import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import MapView from '../components/MapView';
import EEPanel from '../components/EEPanel';

// I GET sono pubblici; estrae l'array qualunque sia la forma della risposta.
const arr = (d) => (Array.isArray(d) ? d : d?.sensors || d?.areas || d?.drones || d?.data || []);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [areas, setAreas] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [drones, setDrones] = useState([]);
  const [fires, setFires] = useState([]);

  useEffect(() => {
    api('/api/areas/areas').then((d) => setAreas(arr(d))).catch(() => {});
    api('/sensors').then((d) => setSensors(arr(d))).catch(() => {});
    api('/drones').then((d) => setDrones(arr(d))).catch(() => {});
    api('/api/fire-events').then((d) => setFires(arr(d))).catch(() => {});
  }, []);

  const activeFires = fires.filter((f) => f.status !== 'extinguished');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          🔥 The Imitatation Nature AI <span className="badge">SaaS</span>
        </div>
        <div className="user">
          👤 {user?.username} ·{' '}
          <button className="link" onClick={logout}>
            Esci
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="stats">
            <Stat value={areas.length} label="Aree" />
            <Stat value={sensors.length} label="Sensori" />
            <Stat value={drones.length} label="Droni" />
            <Stat value={activeFires.length} label="Incendi" danger />
          </div>
          <ResList title="🔥 Incendi attivi" items={activeFires.map((f) => `${f.location} — ${f.severity}`)} />
          <ResList title="🚁 Droni" items={drones.map((d) => `${d.model} · ${d.status} · 🔋${d.batteryLevel}%`)} />
          <ResList title="📡 Sensori" items={sensors.map((s) => `${s.name} (${s.type})`)} />
        </aside>

        <main className="main">
          <MapView areas={areas} sensors={sensors} drones={drones} fires={fires} />
          <EEPanel />
        </main>
      </div>
    </div>
  );
}

function Stat({ value, label, danger }) {
  return (
    <div className={'stat' + (danger ? ' danger' : '')}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ResList({ title, items }) {
  return (
    <div className="reslist">
      <h3>{title}</h3>
      <ul>{items.length ? items.map((t, i) => <li key={i}>{t}</li>) : <li className="muted">—</li>}</ul>
    </div>
  );
}
