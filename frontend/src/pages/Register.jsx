import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password, 'user');
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
        <h1>Crea account</h1>
        <p className="muted">Min 3 caratteri username, password ≥ 8</p>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error && <div className="error">⚠️ {error}</div>}
        <button disabled={loading}>{loading ? 'Creazione…' : 'Registrati'}</button>
        <Link to="/login">Ho già un account</Link>
      </form>
    </div>
  );
}
