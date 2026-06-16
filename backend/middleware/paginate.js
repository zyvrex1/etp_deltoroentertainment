// backend/middleware/paginate.js
const { isValidObjectId } = require('mongoose')

const DEFAULT_LIMIT = 20
const MAX_LIMIT     = 100

const paginate = (req, res, next) => {
  const raw = req.query

  // ── limit ─────────────────────────────────────
  let limit = parseInt(raw.limit, 10)
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT
  if (limit > MAX_LIMIT) limit = MAX_LIMIT

  // ── offset strategy ───────────────────────────
  let page = parseInt(raw.page, 10)
  if (!Number.isFinite(page) || page < 1) page = 1
  const skip = (page - 1) * limit

  // ── cursor strategy ───────────────────────────
  const rawCursor = raw.cursor || null
  const cursor = rawCursor && isValidObjectId(rawCursor)
    ? rawCursor : null

  // ── sort / order ──────────────────────────────
  const sort  = raw.sort  || 'createdAt'
  const order = ['asc','desc'].includes(raw.order?.toLowerCase())
    ? raw.order.toLowerCase() : 'desc'

  req.pagination = { page, limit, skip, cursor, sort, order }
  next()
}

module.exports = paginate