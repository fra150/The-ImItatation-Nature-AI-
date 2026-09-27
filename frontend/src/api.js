// Client API verso il backend (default http://localhost:3001; override con
// VITE_API_URL). Allega il JWT salvato in localStorage sulle richieste e, se
// scaduto (401), tenta UN rinnovo silenzioso via /auth/refresh prima di
// arrendersi — l'access token ora vive poco (vedi ACCESS_TOKEN_TTL sul
// backend), il refresh token è quello a vita lunga.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const token = () => localStorage.getItem('token');
const refreshTokenValue = () => localStorage.getItem('refreshToken');

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// Single-flight: N richieste in 401 parallelo condividono UN solo refresh,
// le altre attendono (evita thundering refresh + logout a cascata).
let refreshPromise = null;

async function tryRefresh() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const rt = refreshTokenValue();
    if (!rt) return false;
    try {
      const res = await fetch(BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      // Rate-limit / errore rete transitorio: NON cancellare la sessione.
      if (res.status === 429) return false;
      if (!res.ok) throw new Error('refresh failed');
      const data = await res.json();
      if (!data?.token || !data?.refreshToken) throw new Error('refresh failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch (e) {
      // Solo revoca/scadenza invalida la sessione; errori di rete la conservano.
      if (e?.message === 'refresh failed') clearSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function api(path, { method = 'GET', body, auth = true, _retried = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Un solo tentativo di rinnovo, mai su /auth/* stessa (eviterebbe loop).
  if (res.status === 401 && auth && !_retried && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) return api(path, { method, body, auth, _retried: true });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = Array.isArray(data.errors) && data.errors[0];
    const msg = data.message || first?.msg || data.detail || data.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const API_BASE = BASE;
