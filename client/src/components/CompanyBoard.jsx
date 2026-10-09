import { STATUSES } from '../services/companyService.js';
import EmptyState from './EmptyState.jsx';

const labels = {
  applied: 'Applied',
  oa: 'OA',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export default function CompanyBoard({ companies, onStatusChange, onDelete }) {
  if (!companies.length) {
    return <EmptyState title="No applications" message="Track a company to see it on the board." />;
  }

  return (
    <div className="board">
      {STATUSES.map((status) => {
        const column = companies.filter((company) => company.status === status);
        return (
          <section key={status} className="board-column card">
            <h3>
              {labels[status]} <span className="muted">{column.length}</span>
            </h3>
            {column.map((company) => (
              <article key={company.id} className="company-card">
                <strong>{company.name}</strong>
                <p className="muted">{company.role}</p>
                <p className="muted">Applied {company.appliedDate}</p>
                <select
                  value={company.status}
                  onChange={(event) => onStatusChange(company.id, event.target.value)}
                >
                  {STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {labels[option]}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-ghost" onClick={() => onDelete(company.id)}>
                  Remove
                </button>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
