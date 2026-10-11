import { useCallback, useEffect, useMemo, useState } from 'react';
import ProblemForm from '../components/ProblemForm.jsx';
import ProblemList from '../components/ProblemList.jsx';
import { problemService } from '../services/problemService.js';

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await problemService.getAll();
      setProblems(data);
    } catch (err) {
      setError(err.message || 'Unable to load problems.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const visible = useMemo(() => {
    return problems.filter((problem) => {
      const matchesQuery = problem.title
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesDifficulty =
        difficulty === 'all' || problem.difficulty === difficulty;

      const matchesStatus =
        status === 'all' || problem.status === status;

      return matchesQuery && matchesDifficulty && matchesStatus;
    });
  }, [problems, query, difficulty, status]);

  async function handleAdd(payload) {
    setSaving(true);
    setError('');

    try {
      const createdProblem = await problemService.add(payload);

      setProblems((current) => [createdProblem, ...current]);
    } catch (err) {
      setError(err.message || 'Unable to save problem.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, nextStatus) {
    setError('');

    try {
      const updatedProblem = await problemService.update(id, {
        status: nextStatus,
      });

      setProblems((current) =>
        current.map((problem) =>
          problem._id === id ? updatedProblem : problem
        )
      );
    } catch (err) {
      setError(err.message || 'Unable to update problem.');
    }
  }

  async function handleDelete(id) {
    setError('');

    try {
      await problemService.remove(id);

      setProblems((current) =>
        current.filter((problem) => problem._id !== id)
      );
    } catch (err) {
      setError(err.message || 'Unable to delete problem.');
    }
  }

  return (
    <section>
      <h1>DSA problems</h1>

      <ProblemForm onAdd={handleAdd} />

      {saving && <p className="muted">Saving problem...</p>}

      {error && (
        <div className="error" role="alert">
          {error}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={loadProblems}
          >
            Retry loading
          </button>
        </div>
      )}

      <div className="filters card">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title"
        />

        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
        >
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="todo">Todo</option>
          <option value="solved">Solved</option>
          <option value="revisit">Revisit</option>
        </select>
      </div>

      {loading ? (
        <p>Loading problems...</p>
      ) : (
        <ProblemList
          problems={visible}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}