import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/problems', label: 'Problems' },
  { to: '/revisions', label: "Today's Revision" },
  { to: '/github', label: 'GitHub' },
  { to: '/mocks', label: 'Mock Interviews' },
  { to: '/profile', label: 'Profile' },
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
      <div
        className="nav-brand"
        onClick={() => user && navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (user) navigate('/');
          }
        }}
      >
        PrepTracker
      </div>

      {user ? (
        <>
          <nav className="nav-links">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-user">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/profile')}
              title="View profile"
            >
              {user.name}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleLogout}
            >
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