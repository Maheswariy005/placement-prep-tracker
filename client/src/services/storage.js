export function readStore(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

export function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
