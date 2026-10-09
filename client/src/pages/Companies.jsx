import { useState } from 'react';
import CompanyBoard from '../components/CompanyBoard.jsx';
import { companyService, STATUSES } from '../services/companyService.js';
import { todayIsoDate } from '../services/storage.js';

const empty = {
  name: '',
  role: '',
  status: 'applied',
  appliedDate: todayIsoDate(),
};

export default function Companies() {
  const [companies, setCompanies] = useState(() => companyService.getAll());
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  function refresh() {
    setCompanies(companyService.getAll());
  }

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      setError('Company name and role are required.');
      return;
    }
    companyService.add(form);
    setForm({ ...empty, appliedDate: todayIsoDate() });
    setError('');
    refresh();
  }

  return (
    <section>
      <h1>Company applications</h1>
      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2>Add company</h2>
        {error ? <p className="error">{error}</p> : null}
        <div className="form-row">
          <label>
            Company
            <input name="name" value={form.name} onChange={update} placeholder="Google" />
          </label>
          <label>
            Role
            <input name="role" value={form.role} onChange={update} placeholder="SDE Intern" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Status
            <select name="status" value={form.status} onChange={update}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Applied date
            <input type="date" name="appliedDate" value={form.appliedDate} onChange={update} />
          </label>
        </div>
        <button type="submit" className="btn btn-primary">
          Save company
        </button>
      </form>

      <CompanyBoard
        companies={companies}
        onStatusChange={(id, status) => {
          companyService.updateStatus(id, status);
          refresh();
        }}
        onDelete={(id) => {
          companyService.remove(id);
          refresh();
        }}
      />
    </section>
  );
}
