const errorHandler = (err, req, res, next) => {
  // ✅ INTERNAL: log the full technical details server-side only
  console.error(`[ERROR] ${new Date().toISOString()}`)
  console.error(`Route: ${req.method} ${req.originalUrl}`)
  console.error(err.stack)  // full stack trace stays on server

  const isProduction = process.env.NODE_ENV === 'production'

  // ✅ Known safe upload errors — always expose these (they're user-facing)
  if (err.message === 'Only image files are allowed (JPG, PNG, WEBP)') {
    return res.status(400).json({ error: err.message })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size must be less than 5MB' })
  }

  // ✅ Respect status codes thrown by routes (e.g. err.status = 403)
  const statusCode = err.status || err.statusCode || 500

  // ✅ EXTERNAL: clean response — no stack, no paths, no db info
  res.status(statusCode).json(
    isProduction
      ? { error: 'An unexpected error occurred' }           // prod: nothing leaked
      : { error: err.message, stack: err.stack }            // dev: full details for debugging
  )
}

module.exports = errorHandler