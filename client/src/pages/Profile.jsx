import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { connectLeetCode } from '../services/authService.js';
import { problemService } from '../services/problemService.js';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [username, setUsername] = useState(user?.leetcodeUsername || '');
  const [connected, setConnected] = useState(user?.leetcodeUsername || '');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    setUsername(user?.leetcodeUsername || '');
    setConnected(user?.leetcodeUsername || '');
  }, [user?.leetcodeUsername]);

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
    setSyncResult(null);

    if (!username.trim()) {
      setError('Please enter your LeetCode username.');
      return;
    }

    try {
      setLoading(true);

      const result = await connectLeetCode(username.trim());

      setConnected(result.username);
      setUsername(result.username);
      await refreshUser();

      setSuccess('LeetCode public profile connected successfully.');
    } catch (err) {
      setError(err.message || 'Could not connect to LeetCode.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setError('');
    setSuccess('');
    setSyncResult(null);

    try {
      setSyncing(true);

      const result = await problemService.syncLeetCode();

      setSyncResult(result);
      setSuccess('LeetCode sync completed successfully.');
    } catch (err) {
      setError(err.message || 'LeetCode sync failed.');
    } finally {
      setSyncing(false);
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
            Connected username: <strong>{connected}</strong>
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
            disabled={loading || syncing}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || syncing || !username.trim()}
          >
            {loading
              ? 'Connecting...'
              : connected
                ? 'Update LeetCode Profile'
                : 'Connect LeetCode'}
          </button>
        </form>

        {connected && (
          <div className="sync-section">
            <h3>Sync Accepted Submissions</h3>
            <p>
              Import your recent accepted LeetCode problems into your
              placement preparation tracker.
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSync}
              disabled={syncing || loading}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>

            {syncing && (
              <p>Please wait while we fetch your submissions.</p>
            )}

            {syncResult && (
              <div className="sync-result">
                <p>Problems found: {syncResult.found}</p>
                <p>Imported: {syncResult.imported}</p>
                <p>Skipped: {syncResult.skipped}</p>
              </div>
            )}
          </div>
        )}

        {error && <p className="error">{error}</p>}
        {success && <p>{success}</p>}

        <p className="form-hint">
          This checks whether the public profile is accessible. It does
          not verify account ownership.
        </p>
      </section>
    </div>
  );
}