// frontend/src/hooks/useCursorPagination.jsx
import { useState, useCallback, useRef } from 'react'

/**
 * Cursor (keyset) pagination hook — designed for infinite scroll.
 *
 * Usage:
 *   const { cursor, hasNextPage, items, loading,
 *           setLoading, setMeta, appendItems, replaceItems,
 *           loadMore, reset, queryParams }
 *     = useCursorPagination({ limit: 20 })
 *
 * Workflow:
 *   1. On mount:  call API with queryParams ({ limit })
 *                 → no cursor on first load
 *   2. On response: call appendItems(data.notifications)
 *                   call setMeta(data.pagination)
 *   3. InfiniteScroll sentinel fires → call loadMore()
 *      → advances cursor to nextCursor
 *      → useEffect re-runs the API call with new queryParams
 */
export const useCursorPagination = ({ limit = 20 } = {}) => {
  const [cursor,      setCursor]      = useState(null)
  const [nextCursor,  setNextCursor]  = useState(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(false)

  // Tracks whether the next setItems call should replace or append
  const isFirstLoad = useRef(true)

  // Call with data.pagination from API response
  // { nextCursor, hasNextPage }
  const setMeta = useCallback((meta) => {
    setNextCursor(meta.nextCursor  ?? null)
    setHasNextPage(meta.hasNextPage ?? false)
  }, [])

  // Append a new page of items (infinite scroll — adds to bottom)
  const appendItems = useCallback((newItems) => {
    setItems(prev =>
      isFirstLoad.current ? newItems : [...prev, ...newItems]
    )
    isFirstLoad.current = false
  }, [])

  // Replace all items (hard refresh, e.g. after filter/search change)
  const replaceItems = useCallback((newItems) => {
    isFirstLoad.current = true
    setItems(newItems)
    isFirstLoad.current = false
  }, [])

  // Advance cursor to load the next page
  // Called by InfiniteScroll's onLoadMore prop
  const loadMore = useCallback(() => {
    if (hasNextPage && nextCursor) setCursor(nextCursor)
  }, [hasNextPage, nextCursor])

  // Full reset — call before changing filters/search
  const reset = useCallback(() => {
    setCursor(null)
    setNextCursor(null)
    setHasNextPage(false)
    setItems([])
    isFirstLoad.current = true
  }, [])

  return {
    cursor,
    hasNextPage,
    items,
    loading,
    setLoading,
    setMeta,
    appendItems,
    replaceItems,
    loadMore,
    reset,
    // Pass directly as query params to your API call
    // cursor is undefined on first load (omitted from URL)
    queryParams: { cursor: cursor || undefined, limit },
  }
}

export default useCursorPagination