
const API_URL = "http://localhost:5000/api/auth";

const USER_KEY = "ppt_user";
const TOKEN_KEY = "ppt_token";

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveSession(user, token) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function registerUser({ name, email, password }) {
  if (!name.trim() || !email.trim() || !password) {
    throw new Error("Name, email and password are required.");
  }

  const data = await request("/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  return data.user;
}

export async function loginUser({ email, password }) {
  if (!email.trim() || !password) {
    throw new Error("Email and password are required.");
  }

  const data = await request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  saveSession(data.user, data.token);

  return data.user;
}

export async function fetchCurrentUser() {
  const token = getToken();

  if (!token) return null;

  try {
    const data = await request("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.user;
  } catch (error) {
    if (
      error.message === "Invalid or expired token" ||
      error.message === "Access denied. Token required." ||
      error.message === "Access denied token required!"
    ) {
      logoutUser();
      return null;
    }

    // Don't erase the session for a temporary server/network error.
    throw error;
  }
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
