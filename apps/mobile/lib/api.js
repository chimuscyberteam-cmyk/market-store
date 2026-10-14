import Constants from 'expo-constants';

// Metro tells us the laptop's LAN IP. The API runs on the same laptop at :4000.
const metroHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? `http://${metroHost}:4000`;

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}
