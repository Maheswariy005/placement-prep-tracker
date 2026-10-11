import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { companyService } from '../services/companyService.js';
import { mockInterviewService } from '../services/mockInterviewService.js';
import { problemService } from '../services/problemService.js';

export default function Dashboard() {
  const { user } = useAuth();

  const [problems, setProblems] = useState([]);
  const [due, setDue] = useState([]);
  const [companies] = useState(() => companyService.getAll());
  const [mocks] = useState(() => mockInterviewService.getAll());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProblems() {
      try {
        const [allProblems, dueProblems] = await Promise.all([
          problemService.getAll(),
          problemService.getDueToday(),
        ]);

        if (active) {
          setProblems(allProblems);
          setDue(dueProblems);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProblems();

    return () => {
      active = false;
    };
  }, []);

  const weakTopics = useMemo(() => {
    const grouped = {};

    problems.forEach((problem) => {
      const topic = problem.topic || 'Uncategorized';

      grouped[topic] ??= { topic, total: 0, revisit: 0 };
      grouped[topic].total += 1;

      if (problem.status === 'revisit') {
        grouped[topic].revisit += 1;
      }
    });

    return Object.values(grouped)
      .sort((a, b) => b.revisit / b.total - a.revisit / a.total)
      .slice(0, 3);
  }, [problems]);

  const solved = problems.filter(
    (problem) => problem.status === 'solved'
  ).length;

  const avgScore = mocks.length
    ? (
        mocks.reduce((sum, mock) => sum + mock.score, 0) / mocks.length
      ).toFixed(1)
    : '—';

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <section>
      <h1>Hi, {user?.name || 'there'}</h1>
      <p className="muted">
        Your placement preparation at a glance.
      </p>

      {error && <p className="error">{error}</p>}

      <div className="stat-grid">
        <StatCard label="Problems" value={problems.length} hint={`${solved} solved`} />
        <StatCard label="Due today" value={due.length} hint="Spaced revision queue" />
        <StatCard
          label="Applications"
          value={companies.length}
          hint={`${companies.filter((c) => c.status === 'offer').length} offers`}
        />
        <StatCard label="Mock avg" value={avgScore} hint="Out of 10" />
      </div>

      <div className="split">
        <article className="card">
          <h2>Weak topics</h2>
          <ul className="plain-list">
            {weakTopics.map((item) => (
              <li key={item.topic}>
                <strong>{item.topic}</strong>
                <span className="muted">
                  {' '}
                  {item.revisit}/{item.total} marked revisit
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Due revisions</h2>
          <ul className="plain-list">
            {due.slice(0, 5).map((problem) => (
              <li key={problem._id}>{problem.title}</li>
            ))}
          </ul>
          <Link to="/revisions">Review now</Link>
        </article>
      </div>
    </section>
  );
}