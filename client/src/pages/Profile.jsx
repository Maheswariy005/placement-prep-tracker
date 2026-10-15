import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { connectLeetCode } from '../services/authService.js';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [username, setUsername] = useState(user?.leetcodeUsername || '');
  const [connected, setConnected] = useState(
    user?.leetcodeUsername || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Not available';

  async function handleConnect(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Please enter your LeetCode username.');
      return;
    }

    try {
      setLoading(true);

      const result = await connectLeetCode(username.trim());

      setConnected(result.username);
      setUsername(result.username);
      setSuccess('LeetCode public profile connected successfully.');

      // Refresh the authenticated user's details from the backend.
      await refreshUser();
    } catch (err) {
      setError(err.message || 'Could not connect to LeetCode.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account and connect your coding profile.</p>
      </div>

      <section className="card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div>
            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email || 'No email available'}</p>
          </div>
        </div>

        <hr />

        <h3>Personal Information</h3>

        <div className="profile-details">
          <div>
            <span>Full Name</span>
            <p>{user?.name || 'Not available'}</p>
          </div>

          <div>
            <span>Email Address</span>
            <p>{user?.email || 'Not available'}</p>
          </div>

          <div>
            <span>Member Since</span>
            <p>{memberSince}</p>
          </div>
        </div>
      </section>

      <section className="card leetcode-card">
        <div className="leetcode-heading">
          <div>
            <h2>LeetCode Profile</h2>
            <p>
              Connect your public LeetCode profile to import available
              recent accepted submissions.
            </p>
          </div>

          <span className="connection-status">
            {connected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {connected && (
          <p>
            Connected username:{' '}
            <strong>{connected}</strong>
          </p>
        )}

        <form onSubmit={handleConnect}>
          <label htmlFor="leetcodeUsername">
            LeetCode Username
          </label>

          <input
            id="leetcodeUsername"
            name="leetcodeUsername"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your LeetCode username"
            autoComplete="off"
            disabled={loading}
          />

          {error && <p className="error">{error}</p>}
          {success && <p>{success}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !username.trim()}
          >
            {loading
              ? 'Connecting...'
              : connected
                ? 'Update LeetCode Profile'
                : 'Connect LeetCode'}
          </button>

          <p className="form-hint">
            This checks whether the public profile is accessible. It
            does not verify account ownership.
          </p>
        </form>
      </section>
    </div>
  );
}