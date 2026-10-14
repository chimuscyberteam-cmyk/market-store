import Constants from 'expo-constants';

const metroHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? `http://${metroHost}:4000`;

// In-memory session state, kept in sync by AuthContext
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

  // Auto-refresh on expired access token
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
