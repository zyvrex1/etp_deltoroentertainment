// frontend/src/hooks/usePagination.jsx
import { useState, useCallback } from 'react'

/**
 * Offset pagination hook.
 *
 * Usage:
 *   const { page, limit, totalPages, total,
 *           setTotal, goTo, next, prev, reset, queryParams }
 *     = usePagination({ limit: 7 })
 *
 * Workflow:
 *   1. Pass queryParams to your API call  → ?page=1&limit=7
 *   2. When API responds call setTotal(data.pagination)
 *      → updates totalPages + total count
 *   3. Call next() / prev() / goTo(n) to change pages
 */
export const usePagination = ({ limit: initLimit = 20 } = {}) => {
  const [page,       setPage]       = useState(1)
  const [limit,      setLimit]      = useState(initLimit)
  const [totalPages, setTotalPages] = useState(1)
  const [total,      setTotalCount] = useState(0)

  // Call with the pagination envelope from the API response:
  // setTotal({ total, totalPages })
  const setTotal = useCallback((meta) => {
    setTotalCount(meta.total    ?? 0)
    setTotalPages(meta.totalPages ?? 1)
  }, [])

  const goTo = useCallback((p) => {
    setPage(() => Math.max(1, Math.min(p, totalPages)))
  }, [totalPages])

  const next  = useCallback(() => goTo(page + 1), [page, goTo])
  const prev  = useCallback(() => goTo(page - 1), [page, goTo])
  const reset = useCallback(() => setPage(1),      [])

  return {
    page,
    limit,
    totalPages,
    total,
    setLimit,
    setTotal,
    goTo,
    next,
    prev,
    reset,
    // Drop directly into URLSearchParams / axios params
    queryParams: { page, limit },
  }
}

export default usePagination