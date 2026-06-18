// frontend/src/admincomponents/audit.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Icon } from '@iconify/react'
import './audit.css'
import DateRangePicker from '../utils/DateRangePicker'
import jsPDF from 'jspdf'
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from '../utils/pdfExport'
import { useAuthContext } from '../hooks/useAuthContext'
import { io } from 'socket.io-client'
import usePagination from '../hooks/usePagination'         // ← NEW
import PaginationBar from '../components/PaginationBar'    // ← NEW

const BACKEND_URL  = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
const ITEMS_PER_PAGE = 7

const maskIP = (ip) => {
  if (!ip) return '—'
  if (ip === '::1') return 'localhost'
  const parts = ip.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}…`
  const v6parts = ip.split(':')
  const first   = v6parts.filter(Boolean)
  return first.length > 0 ? `${first[0]}::…` : ip
}

const ACTION_BADGE = {
  'Login Success': 'badge-success',
  'Login Failed':  'badge-danger',
  'User Signup':   'badge-info',
  'User Created':  'badge-warning',
}

const AuditLogs = () => {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const socketRef   = useRef(null)
  const loadLogsRef = useRef(null)

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { user } = useAuthContext()

  // ── Offset pagination hook ────────────────────────────────────────────────
  // Replaces: currentPage, totalPages + all manual setters
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
    queryParams: pageParams,   // { page, limit } — passed straight to API
  } = usePagination({ limit: ITEMS_PER_PAGE })

  // ── Other state ───────────────────────────────────────────────────────────
  const [logs,            setLogs]            = useState([])
  const [isLoading,       setIsLoading]       = useState(true)
  const [error,           setError]           = useState(null)
  const [searchQuery,     setSearchQuery]     = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [totalStored,     setTotalStored]     = useState(0)
  const [isSearching,     setIsSearching]     = useState(false)
  const [expandedRow,     setExpandedRow]     = useState(null)

  const [dateRange, setDateRange] = useState({
    preset:      'all',
    presetLabel: 'All time',
    start: new Date(2000, 0, 1),
    end:   new Date(2100, 11, 31),
  })

  // ── Debounce search → reset to page 1 ────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      resetPage()   // ← go back to page 1 on new search
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery, resetPage])

  // ── Stable date strings for useCallback deps ──────────────────────────────
  const startISO = dateRange?.preset !== 'all' ? dateRange?.start?.toISOString() : null
  const endISO   = dateRange?.preset !== 'all' ? dateRange?.end?.toISOString()   : null

  // ── loadLogs ──────────────────────────────────────────────────────────────
  const loadLogs = useCallback(async ({ silent = false, overridePage } = {}) => {
    if (!user?.token) return
    if (!silent) { setIsLoading(true); setError(null) }

    try {
      // pageParams = { page, limit } from usePagination
      const fetchPage = overridePage ?? pageParams.page
      const params = new URLSearchParams({
        page:  fetchPage,
        limit: pageParams.limit,
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (startISO)        params.set('startDate', startISO)
      if (endISO)          params.set('endDate',   endISO)

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (!res.ok) throw new Error('Failed to load audit logs')
      const data = await res.json()

      setLogs(data.logs)

      // ← Feed the pagination hook with meta from the response envelope
      setTotal({
        total:      data.pagination?.total      ?? data.totalShown,
        totalPages: data.pagination?.totalPages ?? data.totalPages,
      })

      if (data.totalStored != null) setTotalStored(data.totalStored)
      setIsSearching(data.isSearching ?? false)
    } catch (err) {
      if (silent) console.error('Audit log refresh failed:', err.message)
      else setError(err.message)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [pageParams.page, pageParams.limit, debouncedSearch, startISO, endISO, user?.token, setTotal])

  // ── Trigger fetch when page or filters change ─────────────────────────────
  useEffect(() => { loadLogs() }, [loadLogs])

  // ── Keep ref current for socket callbacks ─────────────────────────────────
  useEffect(() => { loadLogsRef.current = loadLogs }, [loadLogs])

  // ── WebSocket — silent live refresh ───────────────────────────────────────
  useEffect(() => {
    if (!user?.token) return
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'], withCredentials: true })
    socketRef.current = socket

    const liveRefresh = () => {
      resetPage()
      loadLogsRef.current?.({ silent: true, overridePage: 1 })
    }

    socket.on('auditLogUpdate',   liveRefresh)
    socket.on('auditLoginFailed', liveRefresh)
    socket.on('auditUserSignup',  liveRefresh)
    socket.on('auditUserCreated', liveRefresh)
    socket.on('connect_error', (err) => console.error('Audit socket error:', err.message))

    return () => {
      socket.off('auditLogUpdate',   liveRefresh)
      socket.off('auditLoginFailed', liveRefresh)
      socket.off('auditUserSignup',  liveRefresh)
      socket.off('auditUserCreated', liveRefresh)
      // Defer disconnect so the socket can finish its handshake first.
      // Calling disconnect() on a still-connecting socket causes the
      // "WebSocket closed before connection established" warning.
      if (socket.connected) {
        socket.disconnect()
      } else {
        socket.on('connect', () => socket.disconnect())
      }
    }
  }, [user?.token, resetPage])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange)
    resetPage()
  }

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id)

  // ── PDF Export ────────────────────────────────────────────────────────────
  const exportReport = async () => {
    const loadingToast = showExportToast()
    const REPORT_TITLE = 'Audit Logs Report'
    try {
      const logoData = await loadLogo()
      const pdf      = new jsPDF('p', 'mm', 'a4')
      const pdfWidth  = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin    = 15
      const FOOTER_HEIGHT = 15
      let y = 45

      addReportHeader(pdf, REPORT_TITLE, logoData)
      pdf.setFontSize(12)
      pdf.setTextColor(30, 60, 114)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Audit Log Entries', margin, y)
      y += 8

      const headers = ['Action', 'User', 'Email', 'Role', 'IP Address', 'Timestamp']
      const rows = logs.map(log => [
        log.action,
        log.user,
        log.email,
        log.role,
        maskIP(log.ipAddress),  // ← masked just like the table column
        new Date(log.timestamp).toLocaleString(),
      ])

      y = drawTable(pdf, y, headers, rows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3, logoData, REPORT_TITLE)
      y += 10
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `Report generated from Audit Logs. ${total.toLocaleString()} entries shown of ${totalStored.toLocaleString()} total stored.`,
        margin, y, { maxWidth: pdfWidth - 2 * margin }
      )
      finalizeReport(pdf)
      pdf.save(`Audit_Logs_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      removeExportToast(loadingToast)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="audit-container">
      {/* Header */}
      <div className="audit-header">
        <div className="header-title-group">
          <h1>Audit Logs</h1>
          <p className="large-body-text">Track all user login activity for security and compliance.</p>
        </div>
        <button className="outlined-button export-btn" onClick={exportReport}>
          <Icon icon="mdi:download-outline" /> Export Report
        </button>
      </div>

      <div className="audit-content">
        {/* Record count banner */}
        <div className="audit-record-info">
          <Icon icon="mdi:information-outline" />
          {isSearching ? (
            <span>
              Searching <strong>all {totalStored.toLocaleString()} stored records</strong> — found {total.toLocaleString()} match{total !== 1 ? 'es' : ''}.
            </span>
          ) : (
            <span>
              Showing the <strong>latest 100 records</strong> in the frontend.{' '}
              <strong>{totalStored.toLocaleString()}</strong> total records stored in the database.
              Use the search bar to find older entries.
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="audit-toolbar">
          <div className="audit-toolbar-left">
            <div className="audit-search">
              <Icon icon="mdi:magnify" className="search-icon" />
              <input
                type="text"
                placeholder="Search all records by name, email, IP…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <Icon icon="mdi:close" />
                </button>
              )}
            </div>
          </div>
          <div className="audit-toolbar-right">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              buttonClassName="filter-btn"
              placeholder="Select date range"
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          {error ? (
            <div className="empty-state">
              <Icon icon="mdi:alert-circle-outline" style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--color-danger)' }} />
              <h4>Failed to load logs</h4>
              <p className="small-body-text">{error}</p>
              <button className="outlined-button" onClick={() => loadLogs()}>Try Again</button>
            </div>
          ) : isLoading ? (
            <table className="audit-table">
              <thead>
                <tr><th>Action</th><th>User</th><th>Email</th><th>Role</th><th>IP Address</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                  <tr key={i}>
                    {[120, 130, 180, 80, 110, 150].map((w, j) => (
                      <td key={j}><div className="skeleton skeleton-text" style={{ width: `${w}px` }} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <Icon icon="mdi:clipboard-text-off-outline" style={{ fontSize: '48px', marginBottom: '16px' }} />
              <h4>{searchQuery ? 'No logs found' : 'No login activity yet'}</h4>
              <p className="small-body-text">
                {searchQuery
                  ? <> No records match "<strong>{searchQuery}</strong>". </>
                  : 'No login events have been recorded yet.'}
              </p>
            </div>
          ) : (
            <table className="audit-table">
              <thead>
                <tr><th>Action</th><th>User</th><th>Email</th><th>Role</th><th>IP Address</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={expandedRow === log.id ? 'expanded' : ''}>
                    <td className="action-td" data-label="Action">
                      <div className="mobile-expand-icon" onClick={() => toggleRow(log.id)}>
                        <Icon icon={expandedRow === log.id ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
                      </div>
                      <span className={`badge ${ACTION_BADGE[log.action] || ''}`}>{log.action}</span>
                    </td>
                    <td className="regular-body-text" data-label="User">{log.user}</td>
                    <td className="small-body-text"   data-label="Email">{log.email}</td>
                    <td className="small-body-text"   data-label="Role">{log.role}</td>
                    <td className="small-body-text"   data-label="IP Address">
                      <span className="ip-chip" title={log.ipAddress || '—'}>{maskIP(log.ipAddress)}</span>
                    </td>
                    <td className="small-body-text timestamp-cell" data-label="Timestamp">
                      <div className="timestamp-wrapper">
                        <Icon icon="mdi:clock-time-four-outline" className="clock-icon" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/*
          ── Pagination bar ─────────────────────────────────────────────────────
          Replaces the old manual Previous / Page X of Y / Next buttons.
          PaginationBar renders null when totalPages <= 1.
        */}
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={total}
          onPrev={prev}
          onNext={next}
          onGoTo={goTo}
        />
      </div>
    </div>
  )
}

export default AuditLogs