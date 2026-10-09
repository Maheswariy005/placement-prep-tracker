import { useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import { problemService } from '../services/problemService.js';
import { todayIsoDate } from '../services/storage.js';

function nextDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function Revisions() {
  const [due, setDue] = useState(() => problemService.getDueToday());

  function review(id, quality) {
    const days = quality >= 4 ? 6 : quality >= 3 ? 3 : 1;
    problemService.update(id, {
      status: quality >= 3 ? 'solved' : 'revisit',
      nextReviewDate: quality === 0 ? todayIsoDate() : nextDate(days),
    });
    setDue(problemService.getDueToday());
  }

  return (
    <section>
      <h1>Today&apos;s revision</h1>
      <p className="muted">Rate 0–5. This is a simplified SM-2 preview, not the final algorithm.</p>
      {!due.length ? (
        <EmptyState title="Nothing due" message="You are caught up for today." />
      ) : (
        <div className="stack">
          {due.map((problem) => (
            <article key={problem.id} className="card">
              <h2>{problem.title}</h2>
              <p className="muted">
                {problem.topic} · {problem.difficulty} · {problem.platform}
              </p>
              {problem.notes ? <p>{problem.notes}</p> : null}
              <div className="quality-row">
                {[0, 1, 2, 3, 4, 5].map((quality) => (
                  <button
                    key={quality}
                    type="button"
                    className="btn"
                    onClick={() => review(problem.id, quality)}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
