const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function registerUser(username, password) {
  return request("/register", { username, password });
}

export function loginUser(username, password) {
  return request("/login", { username, password });
}

export function postJob(title, description, image_data, user_id) {
  return request("/jobs", { title, description, image_data, user_id });
}

export async function getJobs() {
  const response = await fetch(`${API_BASE}/jobs`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch jobs");
  }
  return data;
}

export function applyJob(job_id, user_id) {
  return request("/apply", { job_id, user_id });
}
