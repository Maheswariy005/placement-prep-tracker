import { createId, readStore, todayIsoDate, writeStore } from './storage.js';

const KEY = 'ppt_problems';

const seed = [
  {
    id: 'p1',
    title: 'Two Sum',
    platform: 'LeetCode',
    topic: 'Arrays',
    difficulty: 'easy',
    status: 'solved',
    notes: 'Hash map in one pass.',
    nextReviewDate: todayIsoDate(),
  },
  {
    id: 'p2',
    title: 'Longest Substring Without Repeating Characters',
    platform: 'LeetCode',
    topic: 'Sliding Window',
    difficulty: 'medium',
    status: 'revisit',
    notes: 'Need to tighten the window logic.',
    nextReviewDate: todayIsoDate(),
  },
  {
    id: 'p3',
    title: 'Merge K Sorted Lists',
    platform: 'LeetCode',
    topic: 'Heaps',
    difficulty: 'hard',
    status: 'todo',
    notes: '',
    nextReviewDate: todayIsoDate(),
  },
  {
    id: 'p4',
    title: 'Binary Tree Level Order Traversal',
    platform: 'LeetCode',
    topic: 'Trees',
    difficulty: 'medium',
    status: 'solved',
    notes: 'BFS with a queue.',
    nextReviewDate: '2026-12-01',
  },
  {
    id: 'p5',
    title: 'Detect Cycle in Directed Graph',
    platform: 'GFG',
    topic: 'Graphs',
    difficulty: 'medium',
    status: 'revisit',
    notes: 'DFS colors vs Kahn.',
    nextReviewDate: todayIsoDate(),
  },
];

function all() {
  return readStore(KEY, seed);
}

export const problemService = {
  getAll() {
    return all();
  },

  add(payload) {
    const problems = all();
    const problem = {
      id: createId(),
      title: payload.title.trim(),
      platform: payload.platform.trim() || 'LeetCode',
      topic: payload.topic.trim(),
      difficulty: payload.difficulty,
      status: payload.status,
      notes: payload.notes.trim(),
      nextReviewDate: payload.nextReviewDate || todayIsoDate(),
    };
    writeStore(KEY, [problem, ...problems]);
    return problem;
  },

  update(id, updates) {
    const problems = all().map((problem) =>
      problem.id === id ? { ...problem, ...updates } : problem,
    );
    writeStore(KEY, problems);
    return problems.find((problem) => problem.id === id);
  },

  remove(id) {
    writeStore(
      KEY,
      all().filter((problem) => problem.id !== id),
    );
  },

  getDueToday() {
    const today = todayIsoDate();
    return all().filter((problem) => problem.nextReviewDate <= today);
  },
};
