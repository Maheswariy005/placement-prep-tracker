import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/problems', label: 'Problems' },
  { to: '/revisions', label: "Today's Revision" },
  { to: '/companies', label: 'Companies' },
  { to: '/mocks', label: 'Mock Interviews' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="nav">
      <div className="nav-brand">PrepTracker</div>
      {user ? (
        <>
          <nav className="nav-links">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-user">
            <span>{user.name}</span>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </>
      ) : (
        <nav className="nav-links">
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </nav>
      )}
    </header>
  );
}
