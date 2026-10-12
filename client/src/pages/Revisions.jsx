import { useCallback, useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import { problemService } from '../services/problemService.js';

export default function Revisions() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadRevisions = useCallback(async () => {
    try {
      setError('');
      const data = await problemService.getDueToday();
      setProblems(data);
    } catch (err) {
      setError(err.message || 'Failed to load revision problems.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  async function updateStatus(problem, status) {
    try {
      setUpdatingId(problem._id);
      setError('');

      await problemService.update(problem._id, { status });

      // Remove it from this page if it is no longer marked for revision.
      if (status !== 'revisit') {
        setProblems((current) =>
          current.filter((item) => item._id !== problem._id)
        );
      } else {
        await loadRevisions();
      }
    } catch (err) {
      setError(err.message || 'Failed to update problem status.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <main className="page"><p>Loading revision problems...</p></main>;
  }

  return (
    <main className="page">
      <h1>Today's revision</h1>
      <p>Problems marked for revision appear here.</p>

      {error && <p className="error">{error}</p>}

      {problems.length === 0 ? (
        <EmptyState
          title="Nothing to revise"
          message="You're all caught up! Mark a problem as Revisit to see it here."
        />
      ) : (
        <div className="card-list">
          {problems.map((problem) => (
            <article className="card" key={problem._id}>
              <h2>{problem.title}</h2>

              <p>
                Difficulty: {problem.difficulty}
              </p>

              <p>
                Status: {problem.status}
              </p>

              {problem.topic && <p>Topic: {problem.topic}</p>}

              {problem.notes && <p>Notes: {problem.notes}</p>}

              <div className="button-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={updatingId === problem._id}
                  onClick={() => updateStatus(problem, 'solved')}
                >
                  Mark Solved
                </button>

                <button
                  type="button"
                  className="btn"
                  disabled={updatingId === problem._id}
                  onClick={() => updateStatus(problem, 'todo')}
                >
                  Move to Todo
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}