export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://market-store-api.onrender.com';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ms.accessToken');
}
export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ms.refreshToken');
}
export function setTokens({ accessToken, refreshToken }) {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem('ms.accessToken', accessToken);
  if (refreshToken) localStorage.setItem('ms.refreshToken', refreshToken);
}
export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ms.accessToken');
  localStorage.removeItem('ms.refreshToken');
  localStorage.removeItem('ms.user');
}
export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('ms.user');
  return raw ? JSON.parse(raw) : null;
}
export function setUser(u) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ms.user', JSON.stringify(u));
}

export async function apiFetch(path, { method = 'GET', body, auth = true, _retried } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401 && auth && !_retried) {
    const rt = getRefreshToken();
    if (rt) {
      try {
        const r = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt })
        });
        if (r.ok) {
          const data = await r.json();
          setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
          setUser(data.user);
          return apiFetch(path, { method, body, auth, _retried: true });
        }
      } catch {}
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}
