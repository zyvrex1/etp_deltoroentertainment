// frontend/src/components/PaginationBar.jsx
//
// Uses the existing .pagination / .pagination-btn / .pagination-info
// classes already defined in audit.css — no new styles needed.
//
// Props:
//   page        – current page number
//   totalPages  – total number of pages
//   total       – total record count (optional, shown as trailing label)
//   onPrev      – () => void
//   onNext      – () => void
//   onGoTo      – (page: number) => void

const PaginationBar = ({ page, totalPages, total, onPrev, onNext, onGoTo }) => {
  if (totalPages <= 1) return null

  // Build a window of up to 5 page numbers centred on current page
  const getPages = () => {
    const pages = []
    let start = Math.max(1, page - 2)
    let end   = Math.min(totalPages, start + 4)
    if (end - start < 4) start = Math.max(1, end - 4)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  const pages = getPages()

  return (
    <div className="pagination">
      {/* ← Previous */}
      <button
        className="pagination-btn"
        onClick={onPrev}
        disabled={page === 1}
      >
        Previous
      </button>

      {/* First page + ellipsis if the window doesn't start at 1 */}
      {pages[0] > 1 && (
        <>
          <button className="pagination-btn" onClick={() => onGoTo(1)}>1</button>
          {pages[0] > 2 && (
            <span className="pagination-info">…</span>
          )}
        </>
      )}

      {/* Page number buttons */}
      {pages.map(p => (
        <button
          key={p}
          className="pagination-btn"
          onClick={() => onGoTo(p)}
          disabled={p === page}
          style={p === page ? {
            background: 'var(--color-red-quaternary, #fef2f2)',
            color:      'var(--color-red-primary, #dc2626)',
            borderColor:'var(--color-red-primary, #dc2626)',
            fontWeight: 600,
            cursor:     'default',
          } : {}}
        >
          {p}
        </button>
      ))}

      {/* Ellipsis + last page if the window doesn't reach totalPages */}
      {pages.at(-1) < totalPages && (
        <>
          {pages.at(-1) < totalPages - 1 && (
            <span className="pagination-info">…</span>
          )}
          <button className="pagination-btn" onClick={() => onGoTo(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      {/* Next → */}
      <button
        className="pagination-btn"
        onClick={onNext}
        disabled={page === totalPages}
      >
        Next
      </button>

      {/* Total count label — same .pagination-info style as "Page X of Y" */}
      {total != null && (
        <span className="pagination-info">
          {total.toLocaleString()} total
        </span>
      )}
    </div>
  )
}

export default PaginationBar