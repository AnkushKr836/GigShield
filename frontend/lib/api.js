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

  adminLogin: (payload) => request("/admin/login", { method: "POST", body: payload }),

  listZones: () => request("/zones/"),
  createZone: (payload, token) => request("/zones/", { method: "POST", body: payload, token }),
  updateZone: (id, payload, token) => request(`/zones/${id}`, { method: "PATCH", body: payload, token }),
  deleteZone: (id, token) => request(`/zones/${id}`, { method: "DELETE", token }),

  listCompanies: () => request("/companies/"),
  createCompany: (payload, token) => request("/companies/", { method: "POST", body: payload, token }),
  updateCompany: (id, payload, token) => request(`/companies/${id}`, { method: "PATCH", body: payload, token }),
  deleteCompany: (id, token) => request(`/companies/${id}`, { method: "DELETE", token }),

  listCoveragePlans: (companyId, token) => request(`/coverage-plans/${companyId ? `?company_id=${companyId}` : ""}`, { token }),
  createCoveragePlan: (payload, token) => request("/coverage-plans/", { method: "POST", body: payload, token }),
  updateCoveragePlan: (id, payload, token) => request(`/coverage-plans/${id}`, { method: "PATCH", body: payload, token }),
  deleteCoveragePlan: (id, token) => request(`/coverage-plans/${id}`, { method: "DELETE", token }),

  listMyRides: (token, limit = 5, offset = 0) => request(`/rides/me?limit=${limit}&offset=${offset}`, { token }),
  getRide: (rideId, token) => request(`/rides/${rideId}`, { token }),
  simulateRides: (token) => request("/rides/simulate", { method: "POST", token }),

  raiseClaim: (payload, token) => request("/claims/", { method: "POST", body: payload, token }),
  listMyClaims: (token) => request("/claims/me", { token }),
  listManualReviewClaims: (token) => request("/claims/manual-review", { token }),
  decideClaim: (tokenId, payload, token) => request(`/claims/${tokenId}/decision`, { method: "PATCH", body: payload, token }),

  getAnalyticsSummary: (token) => request("/analytics/summary", { token }),
  getPublicSummary: () => request("/analytics/public-summary"),

  listEmployees: (token) => request("/admin/employees/", { token }),
  seedEmployees: (count, token) => request("/admin/employees/seed", { method: "POST", body: { count }, token }),
};

export { ApiError };
