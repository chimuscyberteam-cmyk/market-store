// 404 Not Found Handler
export function notFound(req, res, next) {
  res.status(404).json({ error: 'Route not found' });
}

// Global Error Handler
export function errorHandler(err, req, res, next) {
  // 1. Check for PostgreSQL Unique Violation (Duplicate Email/Phone)
  if (err.code === '23505') {
    if (err.constraint === 'users_phone_key') {
      return res.status(409).json({ error: 'This phone number is already registered. Please log in or use a different number.' });
    }
    if (err.constraint === 'users_email_key') {
      return res.status(409).json({ error: 'This email is already registered. Please log in or use a different email.' });
    }
    return res.status(409).json({ error: 'This information is already in use by another account.' });
  }

  // 2. Check for PostgreSQL Foreign Key Violation (e.g., referencing a non-existent user)
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Invalid reference. The related record does not exist.' });
  }

  // 3. Check for Invalid UUID or Data Type
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Invalid data format provided.' });
  }

  // 4. Zod Validation Errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: err.errors[0].message });
  }

  // 5. Fallback for custom errors (like 401, 403, 404)
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // 6. Catch-all for unknown errors (Don't leak raw SQL to the user)
  console.error('🔥 Unhandled Server Error:', err);
  res.status(500).json({ 
    error: 'Something went wrong on our end. Please try again later.' 
  });
}
