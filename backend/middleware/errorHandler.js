function errorHandler(err, _req, res, _next) {
  console.error('[error]', err.message);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return res.status(409).json({ message: `Duplicate value for: ${field}` });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
}

module.exports = errorHandler;
