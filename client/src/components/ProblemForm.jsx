import { useState } from 'react';

const empty = {
  title: '',
  platform: 'LeetCode',
  topic: '',
  difficulty: 'easy',
  status: 'todo',
  notes: '',
};

export default function ProblemForm({ onAdd }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.topic.trim()) {
      setError('Title and topic are required.');
      return;
    }

    setError('');

    try {
      await onAdd(form);
      setForm(empty);
    } catch {
      setError('Could not save the problem. Please try again.');
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Add problem</h2>
      {error ? <p className="error">{error}</p> : null}
      <label>
        Title
        <input name="title" value={form.title} onChange={update} placeholder="Two Sum" />
      </label>
      <div className="form-row">
        <label>
          Platform
          <input name="platform" value={form.platform} onChange={update} />
        </label>
        <label>
          Topic
          <input name="topic" value={form.topic} onChange={update} placeholder="Arrays" />
        </label>
      </div>
      <div className="form-row">
        <label>
          Difficulty
          <select name="difficulty" value={form.difficulty} onChange={update}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={update}>
            <option value="todo">Todo</option>
            <option value="solved">Solved</option>
            <option value="revisit">Revisit</option>
          </select>
        </label>
      </div>
      <label>
        Notes
        <textarea name="notes" value={form.notes} onChange={update} rows="2" />
      </label>
      <button type="submit" className="btn btn-primary">
        Save problem
      </button>
    </form>
  );
}
