import { createId, readStore, writeStore } from './storage.js';

const KEY = 'ppt_companies';

const seed = [
  { id: 'c1', name: 'Google', role: 'SDE Intern', status: 'interview', appliedDate: '2026-09-12' },
  { id: 'c2', name: 'Amazon', role: 'SDE-1', status: 'oa', appliedDate: '2026-09-20' },
  { id: 'c3', name: 'Microsoft', role: 'SDE Intern', status: 'applied', appliedDate: '2026-10-01' },
  { id: 'c4', name: 'Atlassian', role: 'Frontend Intern', status: 'rejected', appliedDate: '2026-08-18' },
  { id: 'c5', name: 'Flipkart', role: 'SDE-1', status: 'offer', appliedDate: '2026-07-04' },
];

function all() {
  return readStore(KEY, seed);
}

export const STATUSES = ['applied', 'oa', 'interview', 'offer', 'rejected'];

export const companyService = {
  getAll() {
    return all();
  },

  add(payload) {
    const company = {
      id: createId(),
      name: payload.name.trim(),
      role: payload.role.trim(),
      status: payload.status,
      appliedDate: payload.appliedDate,
    };
    writeStore(KEY, [company, ...all()]);
    return company;
  },

  updateStatus(id, status) {
    const companies = all().map((company) =>
      company.id === id ? { ...company, status } : company,
    );
    writeStore(KEY, companies);
  },

  remove(id) {
    writeStore(
      KEY,
      all().filter((company) => company.id !== id),
    );
  },
};
