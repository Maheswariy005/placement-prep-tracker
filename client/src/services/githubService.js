
import { getToken } from "./authService.js";

const API_URL = "http://localhost:5000/api/github";

async function request(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "GitHub request failed.");
  }

  return data;
}

export const githubService = {
  async connect(username) {
    return request("/connect", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  },

  async sync() {
    return request("/sync", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async getMyProfile() {
    const data = await request("/me");
    return data.github;
  },
};
