import { useCallback, useEffect, useState } from 'react';
import { githubService } from '../services/githubService.js';

const GITHUB_API = 'https://api.github.com';

function formatDate(date) {
  if (!date) return 'Not available';

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function timeAgo(date) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(date);
}

function describeEvent(event) {
  const repo = event.repo?.name || 'a repository';

  switch (event.type) {
    case 'PushEvent': {
      const count = event.payload?.commits?.length;
      return `Pushed ${count ? `${count} commit(s)` : 'commits'} to ${repo}`;
    }
    case 'PullRequestEvent':
      return `Worked with a pull request in ${repo}`;
    case 'IssuesEvent':
      return `Updated an issue in ${repo}`;
    case 'IssueCommentEvent':
      return `Commented on an issue in ${repo}`;
    case 'CreateEvent':
      return `Created a ${event.payload?.ref_type || 'resource'} in ${repo}`;
    case 'WatchEvent':
      return `Starred ${repo}`;
    case 'ForkEvent':
      return `Forked ${repo}`;
    case 'PublicEvent':
      return `Made ${repo} public`;
    case 'DeleteEvent':
      return `Deleted a ${event.payload?.ref_type || 'resource'} in ${repo}`;
    case 'ReleaseEvent':
      return `Published a release in ${repo}`;
    default:
      return `${event.type.replace(/Event$/, '').replace(/([A-Z])/g, ' $1').trim()} in ${repo}`;
  }
}

export default function GitHub() {
  const [github, setGithub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState('');
  const [activityError, setActivityError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    setActivityError('');

    try {
      const savedGitHub = await githubService.getMyProfile();
      setGithub(savedGitHub);

      if (!savedGitHub?.username) {
        setEvents([]);
        return;
      }

      if (!savedGitHub.profile) {
        setEvents([]);
        setError('Your GitHub profile is connected. Open Profile and click Sync Now to load your dashboard.');
        return;
      }

      setActivityLoading(true);

      try {
        const response = await fetch(
          `${GITHUB_API}/users/${encodeURIComponent(savedGitHub.username)}/events/public?per_page=10`,
          {
            headers: {
              Accept: 'application/vnd.github+json',
            },
          }
        );

        if (response.status === 403) {
          throw new Error('GitHub rate limit reached. Try again later.');
        }

        if (!response.ok) {
          throw new Error('Could not load recent public activity.');
        }

        const result = await response.json();
        setEvents(Array.isArray(result) ? result : []);
      } catch (err) {
        setEvents([]);
        setActivityError(err.message || 'Could not load recent activity.');
      } finally {
        setActivityLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Could not load your GitHub dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="github-page">
        <div className="page-header">
          <h1>GitHub Dashboard</h1>
          <p>Loading your connected GitHub profile...</p>
        </div>
      </div>
    );
  }

  if (!github?.username) {
    return (
      <div className="github-page">
        <div className="page-header">
          <h1>GitHub Dashboard</h1>
          <p>Your repositories and public activity in one place.</p>
        </div>

        <section className="card">
          <h2>Connect your GitHub profile</h2>
          <p>
            Visit your Profile page, enter your GitHub username, and click
            Connect GitHub followed by Sync Now.
          </p>
          <a href="/profile" className="btn btn-primary">
            Go to Profile
          </a>
        </section>
      </div>
    );
  }

  const { profile, repositories = [], lastSyncedAt } = github;

  const totalStars = repositories.reduce(
    (total, repo) => total + (repo.stars || 0),
    0
  );

  const languages = [
    ...new Set(repositories.map((repo) => repo.language).filter(Boolean)),
  ];

  const recentRepos = [...repositories]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  const eventDays = new Set(
    events.map((event) => new Date(event.created_at).toLocaleDateString())
  );

  return (
    <div className="github-page">
      <div className="page-header github-page-heading">
        <div>
          <h1>GitHub Dashboard</h1>
          <p>Your coding profile, recent activity, and repositories.</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={loadDashboard}
          disabled={loading}
        >
          Refresh Dashboard
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {!profile ? (
        <section className="card">
          <h2>Profile not synced yet</h2>
          <p>
            Your GitHub account is connected, but its profile data hasn't
            been synced. Open Profile and select Sync Now.
          </p>
          <a href="/profile" className="btn btn-primary">
            Go to Profile
          </a>
        </section>
      ) : (
        <>
          <section className="card github-profile-card">
            <img
              className="github-avatar"
              src={profile.avatarUrl}
              alt={`${profile.username}'s GitHub avatar`}
            />

            <div className="github-profile-info">
              <h2>{profile.name || profile.username}</h2>
              <p>@{profile.username}</p>

              {profile.bio && <p>{profile.bio}</p>}
              {profile.location && <p>{profile.location}</p>}

              <a href={profile.profileUrl} target="_blank" rel="noreferrer">
                View GitHub Profile ↗
              </a>

              <p className="form-hint">
                Member since {formatDate(profile.createdAt)}
              </p>
            </div>
          </section>

          <section className="github-stats">
            <div className="card">
              <h3>{profile.publicRepos ?? repositories.length}</h3>
              <p>Public Repositories</p>
            </div>

            <div className="card">
              <h3>{totalStars}</h3>
              <p>Stars in synced repositories</p>
            </div>

            <div className="card">
              <h3>{profile.followers ?? 0}</h3>
              <p>Followers</p>
            </div>

            <div className="card">
              <h3>{profile.following ?? 0}</h3>
              <p>Following</p>
            </div>
          </section>

          <section className="card github-activity-section">
            <div className="page-header">
              <h2>Recent Public Activity</h2>
              <p>
                Public GitHub events reported by GitHub, not a complete
                contribution count.
              </p>
            </div>

            {activityLoading && <p>Loading recent activity...</p>}

            {activityError && <p className="error">{activityError}</p>}

            {!activityLoading && !activityError && events.length === 0 && (
              <p>No recent public events were returned by GitHub.</p>
            )}

            {events.length > 0 && (
              <>
                <div className="github-activity-summary">
                  <div>
                    <h3>{events.length}</h3>
                    <p>Recent public events</p>
                  </div>
                  <div>
                    <h3>{eventDays.size}</h3>
                    <p>Active days in these events</p>
                  </div>
                </div>

                <div className="github-event-list">
                  {events.map((event) => (
                    <article className="github-event" key={event.id}>
                      <span className="github-event-dot" />

                      <div>
                        <p>{describeEvent(event)}</p>
                        <small>
                          {timeAgo(event.created_at)} ·{' '}
                          {formatDate(event.created_at)}
                        </small>
                      </div>

                      {event.repo?.name && (
                        <a
                          href={`https://github.com/${event.repo.name}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View ↗
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}

            <p className="form-hint">
              GitHub public events may be delayed and cover only a limited
              recent period. They don't include all private activity or
              reproduce GitHub's contribution calendar.
            </p>
          </section>

          <section className="github-repositories">
            <div className="page-header">
              <h2>Recently Updated Repositories</h2>
              <p>
                Showing up to six repositories from your latest sync.
                Last synced: {formatDate(lastSyncedAt)}
              </p>
            </div>

            {repositories.length === 0 ? (
              <div className="card">
                <p>No repositories were returned in the last sync.</p>
              </div>
            ) : (
              <div className="github-repo-grid">
                {recentRepos.map((repo) => (
                  <article className="card github-repo-card" key={repo.id}>
                    <h3>
                      <a href={repo.url} target="_blank" rel="noreferrer">
                        {repo.name} ↗
                      </a>
                    </h3>

                    <p>{repo.description || 'No description provided.'}</p>

                    <div className="github-repo-meta">
                      <span>{repo.language || 'Other'}</span>
                      <span>⭐ {repo.stars ?? 0}</span>
                      <span>⑂ {repo.forks ?? 0}</span>
                    </div>

                    <small>
                      {repo.isFork ? 'Fork · ' : ''}
                      Updated {formatDate(repo.updatedAt)}
                    </small>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Languages used</h2>
            {languages.length === 0 ? (
              <p>No language data is available for these repositories.</p>
            ) : (
              <div className="github-language-list">
                {languages.map((language) => (
                  <span className="github-language-tag" key={language}>
                    {language}
                  </span>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
