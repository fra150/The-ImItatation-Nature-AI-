import { createContext, useContext, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  async function login(username, password) {
    const data = await api('/auth/login', {
      method: 'POST',
      auth: false,
      body: { username, password },
    });
    if (!data?.token || !data?.refreshToken) {
      throw new Error('Risposta di login non valida (token mancante)');
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    const u = { username };
    localStorage.setItem('user', JSON.stringify(u));
    setToken(data.token);
    setUser(u);
  }

  async function register(username, password, role) {
    await api('/auth/register', { method: 'POST', auth: false, body: { username, password, role } });
    return login(username, password);
  }

  async function logout() {
    // Revoca reale lato server (best-effort: il logout locale avviene comunque
    // anche se la richiesta fallisce, es. rete assente).
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api('/auth/logout', { method: 'POST', auth: false, body: { refreshToken } });
    } catch {
      // ignorato: la sessione locale va comunque chiusa
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ token, user, login, register, logout }}>{children}</AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
