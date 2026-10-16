import { getToken } from "./authService.js";

const API_URL = "http://localhost:5000/api/problems";

async function request(endpoint = "", options = {}) {
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
    throw new Error(data.message || "Problem request failed");
  }

  return data;
}

export const problemService = {
  async getAll() {
    const data = await request();
    return data.problems;
  },

  async add(payload) {
    const data = await request("", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return data.problem;
  },

  async update(id, updates) {
    const data = await request(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    return data.problem;
  },

  async remove(id) {
    return request(`/${id}`, {
      method: "DELETE",
    });
  },

  async getDueToday() {
    const data = await request("/revisions");
    return data.problems;
  },

  // NEW: Sync recent accepted LeetCode submissions
  async syncLeetCode() {
    return request("/sync-leetcode", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
