import { getToken } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mycampusmarket.shop';

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && options.auth !== false) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('ms.accessToken');
      localStorage.removeItem('ms.refreshToken');
      localStorage.removeItem('ms.user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?expired=true';
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw err;
  }
}

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ms.accessToken');
  }
  return null;
}
