import { createId, readStore, writeStore } from './storage.js';

const KEY = 'ppt_mocks';

const seed = [
  {
    id: 'm1',
    type: 'DSA',
    date: '2026-09-28',
    score: 7,
    feedback: 'Good brute force, missed the optimal heap approach.',
    weakAreas: 'Heaps, Time complexity',
  },
  {
    id: 'm2',
    type: 'HR',
    date: '2026-10-02',
    score: 8,
    feedback: 'Clear stories. Shorten the conflict example.',
    weakAreas: 'STAR format',
  },
  {
    id: 'm3',
    type: 'technical',
    date: '2026-10-05',
    score: 6,
    feedback: 'OS answers were shaky.',
    weakAreas: 'OS, DBMS',
  },
];

function all() {
  return readStore(KEY, seed);
}

export const mockInterviewService = {
  getAll() {
    return all();
  },

  add(payload) {
    const interview = {
      id: createId(),
      type: payload.type,
      date: payload.date,
      score: Number(payload.score),
      feedback: payload.feedback.trim(),
      weakAreas: payload.weakAreas.trim(),
    };
    writeStore(KEY, [interview, ...all()]);
    return interview;
  },

  remove(id) {
    writeStore(
      KEY,
      all().filter((interview) => interview.id !== id),
    );
  },
};
