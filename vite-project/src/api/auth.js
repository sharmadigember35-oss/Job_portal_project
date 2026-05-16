const API_BASE = import.meta.env.VITE_API_URL || "/api";

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
