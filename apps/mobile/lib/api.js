import Constants from 'expo-constants';

// In dev (Expo Go), derive from Metro's host. In production APK, MUST use env var.
function resolveBase() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
    return `http://${host}:4000`;
  }
  throw new Error('EXPO_PUBLIC_API_URL is not set. Rebuild with env var.');
}

export const API_BASE = resolveBase();

let currentToken = null;
let currentRefreshToken = null;
let onTokensUpdated = null;

export function setAuthToken(token) { currentToken = token; }
export function setRefreshToken(token) { currentRefreshToken = token; }
export function setOnTokensUpdated(cb) { onTokensUpdated = cb; }

async function tryRefresh() {
  if (!currentRefreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken })
    });
    if (!res.ok) return false;
    const data = await res.json();
    currentToken = data.accessToken;
    currentRefreshToken = data.refreshToken;
    if (onTokensUpdated) onTokensUpdated({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch(path, { method = 'GET', body, token, _retried } = {}) {
  const authToken = token || currentToken;
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch(path, { method, body, token: currentToken, _retried: true });
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}
