import { clearAdminToken, getAdminToken } from "@/lib/auth";

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
    if (res.status === 401 && token && token === getAdminToken()) {
      clearAdminToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("gigshield:admin-unauthorized"));
      }
    }
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
  getRideWeather: (rideId, token) => request(`/rides/${rideId}/weather`, { token }),
  getRideRoute: (rideId, token) => request(`/rides/${rideId}/route`, { token }),
  simulateRides: (token) => request("/rides/simulate", { method: "POST", token }),

  raiseClaim: (payload, token) => request("/claims/", { method: "POST", body: payload, token }),
  getClaimProgress: (tokenId, token) => request(`/claims/${tokenId}/progress`, { token }),
  listMyClaims: (token) => request("/claims/me", { token }),
  listManualReviewClaims: (token) => request("/claims/manual-review", { token }),
  listAdminClaims: (token) => request("/claims/admin", { token }),
  getClaimDetail: (tokenId, token) => request(`/claims/${tokenId}/detail`, { token }),
  decideClaim: (tokenId, payload, token) => request(`/claims/${tokenId}/decision`, { method: "PATCH", body: payload, token }),

  getAnalyticsSummary: (token) => request("/analytics/summary", { token }),
  getAnalyticsStressTest: (token) => request("/analytics/stress-test", { token }),
  listMyPayouts: (token) => request("/payouts/me", { token }),
  getPublicSummary: () => request("/analytics/public-summary"),

  listEmployees: (token) => request("/admin/employees/", { token }),
  ensureDemoRides: (token) => request("/admin/employees/ensure-demo-rides", { method: "POST", token }),
  seedEmployees: (count, token) => request("/admin/employees/seed", { method: "POST", body: { count }, token }),

  listTrafficSnapshots: (token) => request("/admin/traffic-analysis/snapshots", { token }),
  generateSyntheticTrafficDataset: (riderId, payload, token) => request(`/admin/traffic-analysis/employees/${riderId}/generate-dataset`, { method: "POST", body: payload, token }),
  getTrafficModelStatus: (token, zoneId) => request(`/admin/traffic-analysis/model/status${zoneId ? `?zone_id=${encodeURIComponent(zoneId)}` : ""}`, { token }),
  trainTrafficModel: (zoneId, token) => request(`/admin/traffic-analysis/model/train${zoneId ? `?zone_id=${encodeURIComponent(zoneId)}` : ""}`, { method: "POST", token }),
  getEmployeeTrafficRides: (riderId, token) => request(`/admin/traffic-analysis/employees/${riderId}/rides`, { token }),
  runEmployeeTrafficAnalysis: (riderId, token) => request(`/admin/traffic-analysis/employees/${riderId}/run`, { method: "POST", token }),
  getTrafficAnalysisRun: (runId, token) => request(`/admin/traffic-analysis/runs/${runId}`, { token }),
  getAdminRideRoute: (rideId, token) => request(`/admin/traffic-analysis/rides/${rideId}/route`, { token }),
};

export async function downloadSyntheticTrafficDataset(zoneId, token) {
  const query = zoneId ? `?zone_id=${encodeURIComponent(zoneId)}` : "";
  const response = await fetch(`${API_BASE}/admin/traffic-analysis/dataset/export.csv${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(data.detail || "Could not export the synthetic traffic dataset.", response.status);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "gigshield-synthetic-traffic-v1.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export { ApiError };
