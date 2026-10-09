import { useMemo, useState } from 'react';
import ProblemForm from '../components/ProblemForm.jsx';
import ProblemList from '../components/ProblemList.jsx';
import { problemService } from '../services/problemService.js';

export default function Problems() {
  const [problems, setProblems] = useState(() => problemService.getAll());
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');

  const visible = useMemo(() => {
    return problems.filter((problem) => {
      const matchesQuery = problem.title.toLowerCase().includes(query.toLowerCase());
      const matchesDifficulty = difficulty === 'all' || problem.difficulty === difficulty;
      const matchesStatus = status === 'all' || problem.status === status;
      return matchesQuery && matchesDifficulty && matchesStatus;
    });
  }, [problems, query, difficulty, status]);

  function refresh() {
    setProblems(problemService.getAll());
  }

  return (
    <section>
      <h1>DSA problems</h1>
      <ProblemForm
        onAdd={(payload) => {
          problemService.add(payload);
          refresh();
        }}
      />

      <div className="filters card">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title"
        />
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="todo">Todo</option>
          <option value="solved">Solved</option>
          <option value="revisit">Revisit</option>
        </select>
      </div>

      <ProblemList
        problems={visible}
        onStatusChange={(id, nextStatus) => {
          problemService.update(id, { status: nextStatus });
          refresh();
        }}
        onDelete={(id) => {
          problemService.remove(id);
          refresh();
        }}
      />
    </section>
  );
}
