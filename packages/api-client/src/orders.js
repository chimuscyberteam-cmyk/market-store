export function ordersApi(client) {
  return {
    quote:  (d) => client.post('/api/orders/quote', d, { auth: false }),
    create: (d) => client.post('/api/orders', d)
  };
}
