import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { companyService } from '../services/companyService.js';
import { mockInterviewService } from '../services/mockInterviewService.js';
import { problemService } from '../services/problemService.js';

export default function Dashboard() {
  const { user } = useAuth();
  const problems = problemService.getAll();
  const companies = companyService.getAll();
  const mocks = mockInterviewService.getAll();
  const due = problemService.getDueToday();

  const weakTopics = useMemo(() => {
    const grouped = {};
    problems.forEach((problem) => {
      grouped[problem.topic] ??= { topic: problem.topic, total: 0, revisit: 0 };
      grouped[problem.topic].total += 1;
      if (problem.status === 'revisit') grouped[problem.topic].revisit += 1;
    });
    return Object.values(grouped)
      .sort((a, b) => b.revisit / b.total - a.revisit / a.total)
      .slice(0, 3);
  }, [problems]);

  const solved = problems.filter((problem) => problem.status === 'solved').length;
  const avgScore = mocks.length
    ? (mocks.reduce((sum, mock) => sum + mock.score, 0) / mocks.length).toFixed(1)
    : '—';

  return (
    <section>
      <h1>Hi, {user.name}</h1>
      <p className="muted">Draft dashboard using local mock data — no API yet.</p>

      <div className="stat-grid">
        <StatCard label="Problems" value={problems.length} hint={`${solved} solved`} />
        <StatCard label="Due today" value={due.length} hint="Spaced revision queue" />
        <StatCard label="Applications" value={companies.length} hint={`${companies.filter((c) => c.status === 'offer').length} offers`} />
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
              <li key={problem.id}>{problem.title}</li>
            ))}
          </ul>
          <Link to="/revisions">Review now</Link>
        </article>
      </div>
    </section>
  );
}
