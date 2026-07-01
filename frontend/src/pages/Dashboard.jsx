import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { socket } from '../socket';
import MapView from '../components/MapView';
import EEPanel from '../components/EEPanel';

// I GET sono pubblici; estrae l'array qualunque sia la forma della risposta.
const arr = (d) => (Array.isArray(d) ? d : d?.sensors || d?.areas || d?.drones || d?.data || []);

// Etichetta sintetica di salute della connessione (offline / RSSI+link).
const connectionLabel = (d) => {
  if (d.online === false) return '⚠️ offline';
  if (d.linkQuality == null) return '';
  if (d.linkQuality < 30) return `📶 debole (${d.linkQuality}%)`;
  if (d.linkQuality < 70) return `📶 media (${d.linkQuality}%)`;
  return `📶 forte (${d.linkQuality}%)`;
};

// Inserisce o aggiorna (per id) un elemento in una lista, immutabile.
const upsert = (list, item) => {
  if (!item || item.id == null) return list;
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const copy = list.slice();
  copy[i] = { ...copy[i], ...item };
  return copy;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [areas, setAreas] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [drones, setDrones] = useState([]);
  const [fires, setFires] = useState([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    api('/api/areas/areas').then((d) => setAreas(arr(d))).catch(() => {});
    api('/sensors').then((d) => setSensors(arr(d))).catch(() => {});
    api('/drones').then((d) => setDrones(arr(d))).catch(() => {});
    api('/api/fire-events').then((d) => setFires(arr(d))).catch(() => {});
  }, []);

  // Real-time: ascolta gli eventi del backend e aggiorna lo stato in-place, così
  // mappa e liste si aggiornano da sole senza re-fetch.
  useEffect(() => {
    socket.connect();
    const onConnect = () => setLive(true);
    const onDisconnect = () => setLive(false);
    const onDrone = (d) => setDrones((prev) => upsert(prev, d));
    const onFireNew = (f) => setFires((prev) => upsert(prev, f));
    const onDispatch = ({ fireEvent, assignedDrone }) => {
      if (fireEvent) setFires((prev) => upsert(prev, fireEvent));
      if (assignedDrone) setDrones((prev) => upsert(prev, assignedDrone));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('drone:update', onDrone);
    socket.on('fire:new', onFireNew);
    socket.on('fire:dispatch', onDispatch);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('drone:update', onDrone);
      socket.off('fire:new', onFireNew);
      socket.off('fire:dispatch', onDispatch);
      socket.disconnect();
    };
  }, []);

  const activeFires = fires.filter((f) => f.status !== 'extinguished');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          🔥 The Imitatation Nature AI <span className="badge">SaaS</span>
          <span
            title={live ? 'Real-time connesso' : 'Real-time disconnesso'}
            style={{ marginLeft: 10, fontSize: 12, opacity: 0.85 }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                marginRight: 5,
                background: live ? '#22c55e' : '#9ca3af',
                boxShadow: live ? '0 0 6px #22c55e' : 'none',
                verticalAlign: 'middle',
              }}
            />
            {live ? 'live' : 'offline'}
          </span>
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
          <ResList
            title="🚁 Droni"
            items={drones.map((d) =>
              [`${d.model} · ${d.status} · 🔋${d.batteryLevel}%`, connectionLabel(d)].filter(Boolean).join(' · '),
            )}
          />
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
