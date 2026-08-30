const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // FastAPI returns { detail: "..." } on errors — surface that plain-language message
    throw new ApiError(data.detail || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

export const api = {
  registerRider: (payload) => request("/riders/register", { method: "POST", body: payload }),
  login: (payload) => request("/riders/login", { method: "POST", body: payload }),
  getMe: (token) => request("/riders/me", { token }),
  createPolicy: (token) => request("/policies/", { method: "POST", token }),
  listPolicies: (token) => request("/policies/me", { token }),
  listZones: () => request("/zones/"),
};

export { ApiError };
