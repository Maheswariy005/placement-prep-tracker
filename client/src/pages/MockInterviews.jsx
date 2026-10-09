import { useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import { mockInterviewService } from '../services/mockInterviewService.js';
import { todayIsoDate } from '../services/storage.js';

const empty = {
  type: 'DSA',
  date: todayIsoDate(),
  score: 7,
  feedback: '',
  weakAreas: '',
};

export default function MockInterviews() {
  const [mocks, setMocks] = useState(() => mockInterviewService.getAll());
  const [form, setForm] = useState(empty);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    mockInterviewService.add(form);
    setForm({ ...empty, date: todayIsoDate() });
    setMocks(mockInterviewService.getAll());
  }

  return (
    <section>
      <h1>Mock interviews</h1>
      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2>Log a mock</h2>
        <div className="form-row">
          <label>
            Type
            <select name="type" value={form.type} onChange={update}>
              <option value="DSA">DSA</option>
              <option value="HR">HR</option>
              <option value="technical">Technical</option>
              <option value="system design">System design</option>
            </select>
          </label>
          <label>
            Date
            <input type="date" name="date" value={form.date} onChange={update} />
          </label>
          <label>
            Score / 10
            <input type="number" min="0" max="10" name="score" value={form.score} onChange={update} />
          </label>
        </div>
        <label>
          Feedback
          <textarea name="feedback" value={form.feedback} onChange={update} rows="2" />
        </label>
        <label>
          Weak areas
          <input name="weakAreas" value={form.weakAreas} onChange={update} placeholder="Graphs, OS" />
        </label>
        <button type="submit" className="btn btn-primary">
          Save mock
        </button>
      </form>

      {!mocks.length ? (
        <EmptyState title="No mocks yet" message="Log your first mock interview." />
      ) : (
        <div className="stack">
          {mocks.map((mock) => (
            <article key={mock.id} className="card">
              <div className="row-between">
                <h2>
                  {mock.type} · {mock.score}/10
                </h2>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    mockInterviewService.remove(mock.id);
                    setMocks(mockInterviewService.getAll());
                  }}
                >
                  Delete
                </button>
              </div>
              <p className="muted">{mock.date}</p>
              <p>{mock.feedback}</p>
              <p className="muted">Weak areas: {mock.weakAreas || '—'}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
