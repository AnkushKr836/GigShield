const TOKEN_KEY = "gigshield_token";
const ADMIN_TOKEN_KEY = "gigshield_admin_token";

export function saveToken(token) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  if (typeof window !== "undefined") return localStorage.getItem(TOKEN_KEY);
  return null;
}

export function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

export function saveAdminToken(token) {
  if (typeof window !== "undefined") localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminToken() {
  if (typeof window !== "undefined") return localStorage.getItem(ADMIN_TOKEN_KEY);
  return null;
}

export function clearAdminToken() {
  if (typeof window !== "undefined") localStorage.removeItem(ADMIN_TOKEN_KEY);
}
