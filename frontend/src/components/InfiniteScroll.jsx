// frontend/src/components/InfiniteScroll.jsx
import { useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'

/**
 * Wraps a list and auto-fires loadMore() when the bottom
 * sentinel enters the viewport.
 *
 * Usage:
 *   <InfiniteScroll
 *     hasNextPage={hasNextPage}
 *     loading={loading}
 *     onLoadMore={loadMore}
 *   >
 *     {items.map(item => <NotifCard key={item._id} item={item} />)}
 *   </InfiniteScroll>
 */
const InfiniteScroll = ({
  children,
  hasNextPage,
  loading,
  onLoadMore,
  threshold = 0.1
}) => {
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !loading) {
          onLoadMore()
        }
      },
      { threshold }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, loading, onLoadMore, threshold])

  return (
    <div>
      {children}

      {/* Sentinel — invisible div at the bottom that triggers loading */}
      <div ref={sentinelRef} style={{ height: '1px' }} aria-hidden="true" />

      {loading && (
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '16px', gap: '8px',
          color: 'var(--color-text-secondary)'
        }}>
          <Icon icon="mdi:loading" style={{
            fontSize: '18px', animation: 'spin 1s linear infinite'
          }} />
          <span className="small-body-text">Loading more…</span>
        </div>
      )}

      {!hasNextPage && !loading && (
        <p className="small-body-text" style={{
          textAlign: 'center', padding: '16px',
          color: 'var(--color-text-tertiary)'
        }}>
          You've reached the end
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default InfiniteScroll