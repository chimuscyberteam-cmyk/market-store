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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Server returned ${res.status}` };
  }
}

export async function apiFetch(path, {
  method = 'GET',
  body,
  auth = true,
  _retried = false,
  _wakeAttempt = 0
} = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (netErr) {
    // Network-level failure (offline, DNS, CORS)
    throw new Error(`Network error: ${netErr.message}`);
  }

  // Render free-tier cold start: 502/503/504 while waking up. Retry a few times.
  if ((res.status === 502 || res.status === 503 || res.status === 504) && _wakeAttempt < 4) {
    const wait = 2000 + _wakeAttempt * 1500; // 2s, 3.5s, 5s, 6.5s
    await sleep(wait);
    return apiFetch(path, { method, body, auth, _retried, _wakeAttempt: _wakeAttempt + 1 });
  }

  const data = await safeJson(res);

  // Auto-refresh on expired token (once)
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
          const refreshData = await safeJson(r);
          if (refreshData?.accessToken) {
            setTokens({
              accessToken: refreshData.accessToken,
              refreshToken: refreshData.refreshToken
            });
            setUser(refreshData.user);
            return apiFetch(path, { method, body, auth, _retried: true });
          }
        }
      } catch {}
    }
  }

  if (!res.ok) {
    const message = data?.error
      || (res.status === 502 || res.status === 503 || res.status === 504
        ? 'Server is waking up. Please try again in a moment.'
        : `Request failed (${res.status})`);
    
    if (res.status === 401 || res.status === 403) {
      // Token expired or invalid -> Clear session and redirect
      localStorage.removeItem('ms.accessToken');
      localStorage.removeItem('ms.refreshToken');
      localStorage.removeItem('ms.user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?expired=true';
      }
    }

    throw new Error(message);
  }
  return data;
}
