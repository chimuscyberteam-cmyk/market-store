export function authApi(client) {
  return {
    register: (d) => client.post('/api/auth/register', d, { auth: false }),
    login:    (d) => client.post('/api/auth/login', d, { auth: false }),
    refresh:  (t) => client.post('/api/auth/refresh', { refreshToken: t }, { auth: false }),
    logout:   (t) => client.post('/api/auth/logout', { refreshToken: t }, { auth: false }),
    me:       ()  => client.get('/api/auth/me')
  };
}
