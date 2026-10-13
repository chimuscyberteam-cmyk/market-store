export function createClient({ baseUrl, getToken, onUnauthorized } = {}) {
  async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
    const h = { 'Content-Type': 'application/json', ...headers };
    if (auth && getToken) {
      const t = await getToken();
      if (t) h.Authorization = `Bearer ${t}`;
    }
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw Object.assign(new Error(data?.error || res.statusText), { status: res.status, data });
    return data;
  }
  return {
    get:   (p, o)    => request(p, { ...o, method: 'GET' }),
    post:  (p, b, o) => request(p, { ...o, method: 'POST', body: b }),
    patch: (p, b, o) => request(p, { ...o, method: 'PATCH', body: b })
  };
}
