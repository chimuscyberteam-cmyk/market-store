export function categoriesApi(client) {
  return { list: () => client.get('/api/categories', { auth: false }) };
}
