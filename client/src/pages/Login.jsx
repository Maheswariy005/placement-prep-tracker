import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    try {
      login(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card auth-card" onSubmit={handleSubmit}>
      <h1>Welcome back</h1>
      <p className="muted">Draft login — no backend. Any email/password will sign you in.</p>
      {error ? <p className="error">{error}</p> : null}
      <label>
        Email
        <input name="email" type="email" value={form.email} onChange={update} />
      </label>
      <label>
        Password
        <input name="password" type="password" value={form.password} onChange={update} />
      </label>
      <button type="submit" className="btn btn-primary">
        Login
      </button>
      <p className="muted">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </form>
  );
}
