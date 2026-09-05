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
  getMyCredibility: (token) => request("/riders/me/credibility", { token }),

  listZones: () => request("/zones/"),
  createZone: (payload) => request("/zones/", { method: "POST", body: payload }),

  listCompanies: () => request("/companies/"),
  createCompany: (payload) => request("/companies/", { method: "POST", body: payload }),

  listCoveragePlans: (companyId) => request(`/coverage-plans/${companyId ? `?company_id=${companyId}` : ""}`),
  createCoveragePlan: (payload) => request("/coverage-plans/", { method: "POST", body: payload }),

  listMyRides: (token, limit = 5, offset = 0) => request(`/rides/me?limit=${limit}&offset=${offset}`, { token }),
  getRide: (rideId, token) => request(`/rides/${rideId}`, { token }),
  simulateRides: (token) => request("/rides/simulate", { method: "POST", token }),

  raiseClaim: (payload, token) => request("/claims/", { method: "POST", body: payload, token }),
  listMyClaims: (token) => request("/claims/me", { token }),
  listManualReviewClaims: () => request("/claims/manual-review"),
  decideClaim: (tokenId, payload) => request(`/claims/${tokenId}/decision`, { method: "PATCH", body: payload }),

  getAnalyticsSummary: () => request("/analytics/summary"),
};

export { ApiError };
