const USER_KEY = 'ppt_user';

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function registerUser({ name, email, password }) {
  if (!name.trim() || !email.trim() || password.length < 6) {
    throw new Error('Enter a name, email, and a password of at least 6 characters.');
  }

  const user = { id: email.toLowerCase(), name: name.trim(), email: email.trim().toLowerCase() };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function loginUser({ email, password }) {
  if (!email.trim() || !password) {
    throw new Error('Email and password are required.');
  }

  const existing = getCurrentUser();
  const user = existing?.email === email.trim().toLowerCase()
    ? existing
    : { id: email.toLowerCase(), name: email.split('@')[0], email: email.trim().toLowerCase() };

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
}
