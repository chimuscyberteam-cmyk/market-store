export function itemsApi(client) {
  return {
    list:  (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return client.get(`/api/items${q ? `?${q}` : ''}`, { auth: false });
    },
    mine:  () => client.get('/api/items/mine/list'),
    get:   (id) => client.get(`/api/items/${id}`, { auth: false }),
    create:(d) => client.post('/api/items', d)
  };
}
