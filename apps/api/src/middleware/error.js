export function notFound(_req, res) { res.status(404).json({ error: 'Not found' }); }
export function errorHandler(err, _req, res, _next) {
  if (err?.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.issues });
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
}
