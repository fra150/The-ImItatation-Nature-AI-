import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('francesco');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      nav('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">🔥</div>
        <h1>Fire Prevention</h1>
        <p className="muted">The Imitatation Nature AI — accedi alla dashboard</p>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error && <div className="error">⚠️ {error}</div>}
        <button disabled={loading}>{loading ? 'Accesso…' : 'Login'}</button>
        <p className="hint">Demo seedata: francesco / Password123!</p>
        <Link to="/register">Crea un account</Link>
      </form>
    </div>
  );
}
