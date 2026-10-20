export function notFound(req, res, next) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err, req, res, next) {
  // Catch Duplicate Phone/Email (PostgreSQL 23505)
  if (err.code === '23505') {
    if (err.constraint === 'users_phone_key') {
      return res.status(409).json({ error: 'This phone number is already registered.' });
    }
    if (err.constraint === 'users_email_key') {
      return res.status(409).json({ error: 'This email is already registered.' });
    }
    return res.status(409).json({ error: 'This information is already in use.' });
  }

  // Catch Zod Validation Errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: err.errors[0].message });
  }

  // Catch Custom Errors
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Log the actual error for you to see in Render, but send a safe message to the user
  console.error('🔥 Server Error:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
