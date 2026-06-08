const AuditLog       = require('../models/auditlogModel')
const { emitUpdate } = require('../socket')

// ── In-memory cap cache (refreshed every 30 s) ────────────────────────────────
// Avoids re-running the cap subquery on every page load.
let _capCache   = null
let _capExpires = 0

async function getCapId() {
  if (_capCache && Date.now() < _capExpires) return _capCache

  const cap = await AuditLog
    .find({}, { _id: 1 })
    .sort({ createdAt: -1 })
    .skip(99)
    .limit(1)
    .lean()
    .hint({ createdAt: -1 })   // force use of the createdAt index

  _capCache   = cap.length > 0 ? cap[0]._id : null
  _capExpires = Date.now() + 30_000   // cache valid for 30 seconds
  return _capCache
}

// Call this after every new AuditLog.create() to keep the cache accurate
function bustCapCache() {
  _capExpires = 0
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/audit-logs
//
// Query params:
//   page        – page number (default 1)
//   limit       – records per page (default 10, max 100)
//   search      – free-text across email, name, role, action, details
//   startDate   – ISO date string
//   endDate     – ISO date string
//
// Rules:
//   • Never returns more than 100 records per response (frontend cap).
//   • ALL records remain stored in MongoDB — nothing is deleted by this route.
//   • When a search query is present the endpoint searches ALL stored records,
//     not just the first 100, so users never miss a match.
// ─────────────────────────────────────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
  try {
    const page      = Math.max(1, parseInt(req.query.page)  || 1)
    const limit     = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const search    = (req.query.search || '').trim()
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null
    const endDate   = req.query.endDate   ? new Date(req.query.endDate)   : null

    // ── Build filter ──────────────────────────────────────────────────────────
    const filter = {}

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) { startDate.setHours(0,  0,  0,   0); filter.createdAt.$gte = startDate }
      if (endDate)   { endDate.setHours(23, 59, 59, 999);  filter.createdAt.$lte = endDate   }
    }

  if (search) {
  const regex = { $regex: search, $options: 'i' }  // 'i' = case-insensitive, partial match
  filter.$or = [
    { email:     regex },
    { firstName: regex },
    { lastName:  regex },
    { action:    regex },
    { role:      regex },
    { ipAddress: regex },
    { details:   regex },
  ]
}

    // ── Cap to 100 most-recent when not searching ─────────────────────────────
    let baseFilter = filter

    if (!search) {
      const capId = await getCapId()
      if (capId) {
        baseFilter = { ...filter, _id: { $gte: capId } }
      }
    }

   const [logs, total, totalStored] = await Promise.all([
  AuditLog.find(baseFilter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  AuditLog.countDocuments(baseFilter),
  page === 1 ? AuditLog.countDocuments() : Promise.resolve(null),
])

    // ── Shape response ────────────────────────────────────────────────────────
    const ACTION_LABEL = {
      LOGIN_SUCCESS: 'Login Success',
      LOGIN_FAILED:  'Login Failed',
      USER_SIGNUP:   'User Signup',
      USER_CREATED:  'User Created',
    }

    const shaped = logs.map(log => ({
      id:        log._id,
      action:    ACTION_LABEL[log.action] || log.action,
      user:      `${log.firstName} ${log.lastName}`.trim() || log.email,
      email:     log.email,
      role:      log.role,
      ipAddress: log.ipAddress,
      details:   log.details,
      timestamp: log.createdAt,
    }))

    res.status(200).json({
      logs:        shaped,
      currentPage: page,
      totalPages:  Math.ceil(total / limit),
      totalShown:  total,       // records in the current visible pool (≤100 unless searching)
      totalStored,              // ALL records ever written to the DB
      isSearching: !!search,    // lets the frontend show a hint when search bypasses the cap
    })

  } catch (err) {
    console.error('getAuditLogs error:', err.message)
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
}

module.exports = { getAuditLogs, bustCapCache }