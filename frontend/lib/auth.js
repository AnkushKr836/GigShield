const TOKEN_KEY = "gigshield_token";
const ADMIN_TOKEN_KEY = "gigshield_admin_token";

export function saveToken(token) {
  if (typeof window !== "undefined") {
    // A browser has one active GigShield identity at a time. Prevent an old
    // admin session from granting the rider UI access to admin routes.
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken() {
  if (typeof window !== "undefined") return localStorage.getItem(TOKEN_KEY);
  return null;
}

export function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

export function saveAdminToken(token) {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

export function getAdminToken() {
  if (typeof window !== "undefined") return localStorage.getItem(ADMIN_TOKEN_KEY);
  return null;
}

export function isAdminTokenValid(token = getAdminToken()) {
  if (typeof window === "undefined" || !token) return false;
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return false;
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    return payload.role === "admin" && Number(payload.exp) * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function clearAdminToken() {
  if (typeof window !== "undefined") localStorage.removeItem(ADMIN_TOKEN_KEY);
}
