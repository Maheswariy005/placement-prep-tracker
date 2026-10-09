import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card auth-card" onSubmit={handleSubmit}>
      <h1>Create account</h1>
      <p className="muted">Stored only in this browser. We will wire JWT auth later.</p>
      {error ? <p className="error">{error}</p> : null}
      <label>
        Name
        <input name="name" value={form.name} onChange={update} />
      </label>
      <label>
        Email
        <input name="email" type="email" value={form.email} onChange={update} />
      </label>
      <label>
        Password
        <input name="password" type="password" value={form.password} onChange={update} />
      </label>
      <button type="submit" className="btn btn-primary">
        Register
      </button>
      <p className="muted">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </form>
  );
}
