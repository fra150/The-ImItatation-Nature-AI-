import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

// Pannello comando droni (Fase G1). Solo admin/operator (RBAC UI); il backend
// applica comunque requireRole, qui è solo gating visivo.
export default function DroneCommander({ drones, onChanged }) {
  const { user } = useAuth();
  const role = user?.role;
  const canCommand = role === 'admin' || role === 'operator';

  const [droneId, setDroneId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [amount, setAmount] = useState(10);

  async function run(path, body, confirmText) {
    setMsg('');
    if (!droneId) {
      setMsg('Seleziona un drone.');
      return;
    }
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    try {
      const data = await api(`/drones/${droneId}${path}`, { method: 'POST', body });
      setMsg(`✅ ${path} ok${data?.remainingPayload != null ? ` — residuo ${data.remainingPayload}` : ''}`);
      onChanged?.();
    } catch (e) {
      setMsg(`⚠️ ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  if (!canCommand) {
    return (
      <div className="card">
        <h3>🚁 Comando droni</h3>
        <p className="muted">Solo operator/admin possono inviare comandi (tuo ruolo: {role || 'sconosciuto'}).</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>🚁 Comando droni</h3>
      <label>
        Drone{' '}
        <select value={droneId} onChange={(e) => setDroneId(e.target.value)} disabled={busy}>
          <option value="">— seleziona —</option>
          {drones.map((d) => (
            <option key={d.id} value={d.id}>
              {d.identifier || d.model} · {d.status}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button disabled={busy} onClick={() => run('/command', { type: 'takeoff' })}>
          Decollo
        </button>
        <button disabled={busy} onClick={() => run('/command', { type: 'land' })}>
          Atterra
        </button>
        <button disabled={busy} onClick={() => run('/command', { type: 'return' })}>
          RTH
        </button>
        <button
          disabled={busy}
          onClick={() =>
            run('/release-agent', { amount: Number(amount) || 10 }, `Sganciare ${amount} unità sul drone ${droneId}?`)
          }
        >
          Sgancia agente
        </button>
        <label>
          qtà{' '}
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: 70 }}
            disabled={busy}
          />
        </label>
      </div>
      {msg && <p className={msg.startsWith('✅') ? 'ok' : 'error'}>{msg}</p>}
      <p className="muted">I comandi viaggiano via MQTT; senza broker il backend risponde in degraded mode.</p>
    </div>
  );
}
