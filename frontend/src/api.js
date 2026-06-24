// Client API verso il backend (default http://localhost:3000; override con
// VITE_API_URL). Allega il JWT salvato in localStorage sulle richieste.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const token = () => localStorage.getItem('token');

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.detail || data.error || `HTTP ${res.status}`);
  return data;
}

export const API_BASE = BASE;
