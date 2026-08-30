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
    throw new ApiError(data.detail || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

export const api = {
  registerRider: (payload) => request("/riders/register", { method: "POST", body: payload }),
  login: (payload) => request("/riders/login", { method: "POST", body: payload }),
  getMe: (token) => request("/riders/me", { token }),

  listZones: () => request("/zones/"),
  listCompanies: () => request("/companies/"),

  listMyRides: (token) => request("/rides/me", { token }),
  getRide: (rideId, token) => request(`/rides/${rideId}`, { token }),
  simulateRides: (token) => request("/rides/simulate", { method: "POST", token }),

  raiseClaim: (payload, token) => request("/claims/", { method: "POST", body: payload, token }),
  listMyClaims: (token) => request("/claims/me", { token }),
};

export { ApiError };
