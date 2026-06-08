// src/services/auditLogService.js
// Centralizes all API calls for the Audit Logs feature.

const BASE_URL = '/api/audit-logs';

/**
 * Fetch a paginated page of audit logs.
 *
 * @param {object} params
 * @param {string}  params.token        - JWT bearer token from auth context
 * @param {number}  [params.page=1]     - Page number (1-based)
 * @param {number}  [params.limit=7]    - Records per page (max 100)
 * @param {string}  [params.search='']  - Free-text search (bypasses the 100-record cap)
 * @param {Date}    [params.startDate]  - Filter start date (inclusive)
 * @param {Date}    [params.endDate]    - Filter end date (inclusive)
 *
 * @returns {Promise<{
 *   logs: AuditLogEntry[],
 *   currentPage: number,
 *   totalPages: number,
 *   totalShown: number,
 *   totalStored: number,
 *   isSearching: boolean,
 * }>}
 */
export const fetchAuditLogs = async ({
  token,
  page = 1,
  limit = 7,
  search = '',
  startDate,
  endDate,
} = {}) => {
  const params = new URLSearchParams({ page, limit });

  if (search)    params.set('search', search);
  if (startDate) params.set('startDate', startDate.toISOString());
  if (endDate)   params.set('endDate',   endDate.toISOString());

  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to load audit logs');
  }

  return res.json();
};


// ─── Type hint (JSDoc only — no TypeScript required) ─────────────────────────
/**
 * @typedef {object} AuditLogEntry
 * @property {string} id
 * @property {'Login Success'|'Login Failed'} action
 * @property {string} user        - "FirstName LastName" or email fallback
 * @property {string} email
 * @property {string} role
 * @property {string} ipAddress
 * @property {string} details
 * @property {string} timestamp   - ISO date string
 */