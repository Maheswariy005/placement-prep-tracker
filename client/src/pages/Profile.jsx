import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { connectLeetCode } from '../services/authService.js';
import { problemService } from '../services/problemService.js';
import { githubService } from '../services/githubService.js';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  // LeetCode state
  const [leetcodeUsername, setLeetcodeUsername] = useState(
    user?.leetcodeUsername || ''
  );
  const [leetcodeConnected, setLeetcodeConnected] = useState(
    user?.leetcodeUsername || ''
  );
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeSyncing, setLeetcodeSyncing] = useState(false);
  const [leetcodeSyncResult, setLeetcodeSyncResult] = useState(null);

  // GitHub state
  const [githubUsername, setGithubUsername] = useState('');
  const [githubConnected, setGithubConnected] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [githubLastSyncedAt, setGithubLastSyncedAt] = useState(null);
  const [githubSyncResult, setGithubSyncResult] = useState(null);

  // Shared messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setLeetcodeUsername(user?.leetcodeUsername || '');
    setLeetcodeConnected(user?.leetcodeUsername || '');
  }, [user?.leetcodeUsername]);

  // Load the logged-in user's saved GitHub connection.
  useEffect(() => {
    let cancelled = false;

    async function loadGitHubConnection() {
      try {
        const github = await githubService.getMyProfile();

        if (cancelled) return;

        setGithubUsername(github.username || '');
        setGithubConnected(github.username || '');
        setGithubLastSyncedAt(github.lastSyncedAt || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load GitHub connection.');
        }
      }
    }

    loadGitHubConnection();

    return () => {
      cancelled = true;
    };
  }, []);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Not available';

  async function handleConnectLeetCode(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLeetcodeSyncResult(null);

    if (!leetcodeUsername.trim()) {
      setError('Please enter your LeetCode username.');
      return;
    }

    try {
      setLeetcodeLoading(true);

      const result = await connectLeetCode(leetcodeUsername.trim());

      setLeetcodeUsername(result.username);
      setLeetcodeConnected(result.username);
      await refreshUser();

      setSuccess('LeetCode public profile connected successfully.');
    } catch (err) {
      setError(err.message || 'Could not connect to LeetCode.');
    } finally {
      setLeetcodeLoading(false);
    }
  }

  async function handleSyncLeetCode() {
    setError('');
    setSuccess('');
    setLeetcodeSyncResult(null);

    try {
      setLeetcodeSyncing(true);

      const result = await problemService.syncLeetCode();

      setLeetcodeSyncResult(result);
      setSuccess('LeetCode sync completed successfully.');
    } catch (err) {
      setError(err.message || 'LeetCode sync failed.');
    } finally {
      setLeetcodeSyncing(false);
    }
  }

  async function handleConnectGitHub(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setGithubSyncResult(null);

    if (!githubUsername.trim()) {
      setError('Please enter your GitHub username.');
      return;
    }

    try {
      setGithubLoading(true);

      const result = await githubService.connect(githubUsername.trim());

      setGithubUsername(result.github.username);
      setGithubConnected(result.github.username);
      setGithubLastSyncedAt(null);

      setSuccess('GitHub public profile connected successfully.');
    } catch (err) {
      setError(err.message || 'Could not connect to GitHub.');
    } finally {
      setGithubLoading(false);
    }
  }

  async function handleSyncGitHub() {
    setError('');
    setSuccess('');
    setGithubSyncResult(null);

    try {
      setGithubSyncing(true);

      const result = await githubService.sync();

      setGithubSyncResult(result);
      setGithubLastSyncedAt(result.lastSyncedAt);

      setSuccess('GitHub profile and repositories synced successfully.');
    } catch (err) {
      setError(err.message || 'GitHub sync failed.');
    } finally {
      setGithubSyncing(false);
    }
  }

  const formattedGitHubSyncDate = githubLastSyncedAt
    ? new Date(githubLastSyncedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Not synced yet';

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account and connect your coding profiles.</p>
      </div>

      {/* Personal information */}
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

      {/* LeetCode integration */}
      <section className="card leetcode-card">
        <div className="leetcode-heading">
          <div>
            <h2>LeetCode Profile</h2>
            <p>
              Connect your public LeetCode profile to import recent
              accepted submissions.
            </p>
          </div>

          <span className="connection-status">
            {leetcodeConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {leetcodeConnected && (
          <p>
            Connected username: <strong>{leetcodeConnected}</strong>
          </p>
        )}

        <form onSubmit={handleConnectLeetCode}>
          <label htmlFor="leetcodeUsername">LeetCode Username</label>

          <input
            id="leetcodeUsername"
            type="text"
            value={leetcodeUsername}
            onChange={(event) => setLeetcodeUsername(event.target.value)}
            placeholder="Enter your LeetCode username"
            autoComplete="off"
            disabled={leetcodeLoading || leetcodeSyncing}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              leetcodeLoading ||
              leetcodeSyncing ||
              !leetcodeUsername.trim()
            }
          >
            {leetcodeLoading
              ? 'Connecting...'
              : leetcodeConnected
                ? 'Update LeetCode Profile'
                : 'Connect LeetCode'}
          </button>
        </form>

        {leetcodeConnected && (
          <div className="sync-section">
            <h3>Sync Accepted Submissions</h3>
            <p>
              Import recent accepted problems into your placement tracker.
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSyncLeetCode}
              disabled={leetcodeSyncing || leetcodeLoading}
            >
              {leetcodeSyncing ? 'Syncing...' : 'Sync Now'}
            </button>

            {leetcodeSyncResult && (
              <div className="sync-result">
                <p>Problems found: {leetcodeSyncResult.found}</p>
                <p>Imported: {leetcodeSyncResult.imported}</p>
                <p>Skipped: {leetcodeSyncResult.skipped}</p>
              </div>
            )}
          </div>
        )}

        <p className="form-hint">
          Public profile accessibility is checked; account ownership is
          not verified.
        </p>
      </section>

      {/* GitHub integration */}
      <section className="card github-card">
        <div className="leetcode-heading">
          <div>
            <h2>GitHub Profile</h2>
            <p>
              Connect your public GitHub profile and sync your repositories
              to display them on your GitHub dashboard.
            </p>
          </div>

          <span className="connection-status">
            {githubConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {githubConnected && (
          <p>
            Connected username: <strong>{githubConnected}</strong>
          </p>
        )}

        <form onSubmit={handleConnectGitHub}>
          <label htmlFor="githubUsername">GitHub Username</label>

          <input
            id="githubUsername"
            type="text"
            value={githubUsername}
            onChange={(event) => setGithubUsername(event.target.value)}
            placeholder="Enter your GitHub username"
            autoComplete="off"
            disabled={githubLoading || githubSyncing}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              githubLoading ||
              githubSyncing ||
              !githubUsername.trim()
            }
          >
            {githubLoading
              ? 'Connecting...'
              : githubConnected
                ? 'Update GitHub Profile'
                : 'Connect GitHub'}
          </button>
        </form>

        {githubConnected && (
          <div className="sync-section">
            <h3>Sync GitHub Data</h3>
            <p>
              Refresh your public profile and repository information.
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSyncGitHub}
              disabled={githubSyncing || githubLoading}
            >
              {githubSyncing ? 'Syncing...' : 'Sync Now'}
            </button>

            <p className="form-hint">
              Last synced: {formattedGitHubSyncDate}
            </p>

            {githubSyncResult && (
              <div className="sync-result">
                <p>
                  Repositories synced: {githubSyncResult.repositoryCount}
                </p>
                <p>
                  Profile: {githubSyncResult.profile?.name ||
                    githubSyncResult.username}
                </p>
              </div>
            )}
          </div>
        )}

        <p className="form-hint">
          This integration displays public GitHub information. It does not
          verify account ownership or access private repositories.
        </p>
      </section>

      {/* Shared status messages */}
      {error && <p className="error">{error}</p>}
      {success && <p>{success}</p>}
    </div>
  );
}
