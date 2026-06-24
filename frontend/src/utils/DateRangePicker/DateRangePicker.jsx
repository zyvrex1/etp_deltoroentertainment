import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import './DateRangePicker.css';

const PRESETS = [
    { value: 'all', label: 'All time' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7', label: 'Last 7 days' },
    { value: 'last28', label: 'Last 28 days' },
    { value: 'last90', label: 'Last 90 days' },
    { value: 'thisWeek', label: 'This week' },
    { value: 'thisMonth', label: 'This month' },
    { value: 'thisYear', label: 'This year' },
    { value: 'lastWeek', label: 'Last week' },
    { value: 'lastMonth', label: 'Last month' },
];

const getPresetRange = (preset) => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    switch (preset) {
        case 'all':
            return null;
        case 'yesterday': {
            const yesterdayStart = new Date(start);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            const yesterdayEnd = new Date(yesterdayStart);
            yesterdayEnd.setHours(23, 59, 59, 999);
            return { start: yesterdayStart, end: yesterdayEnd };
        }
        case 'last7': {
            const s = new Date(start);
            s.setDate(s.getDate() - 6);
            return { start: s, end: endOfToday };
        }
        case 'last28': {
            const s = new Date(start);
            s.setDate(s.getDate() - 27);
            return { start: s, end: endOfToday };
        }
        case 'last90': {
            const s = new Date(start);
            s.setDate(s.getDate() - 89);
            return { start: s, end: endOfToday };
        }
        case 'thisWeek': {
            const s = new Date(start);
            const day = s.getDay();
            const diff = s.getDate() - day + (day === 0 ? -6 : 1);
            s.setDate(diff);
            return { start: s, end: endOfToday };
        }
        case 'thisMonth': {
            const s = new Date(start);
            s.setDate(1);
            return { start: s, end: endOfToday };
        }
        case 'thisYear': {
            const s = new Date(start);
            s.setMonth(0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            return { start: s, end: endOfYear };
        }
        case 'lastWeek': {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const weekStart = new Date(d);
            weekStart.setHours(0, 0, 0, 0);
            weekStart.setDate(diff);
            const weekEnd = new Date(weekStart);
            weekEnd.setHours(23, 59, 59, 999);
            weekEnd.setDate(weekStart.getDate() + 6);
            return { start: weekStart, end: weekEnd };
        }
        case 'lastMonth': {
            const s = new Date(start);
            s.setMonth(s.getMonth() - 1);
            s.setDate(1);
            const e = new Date(s.getFullYear(), s.getMonth() + 1, 0);
            e.setHours(23, 59, 59, 999);
            return { start: s, end: e };
        }
        default:
            return null;
    }
};

const formatDateLabel = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysInMonth = (year, month) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = [];
    const startPad = first.getDay();
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
};

export default function DateRangePicker({ value, onChange, buttonClassName, placeholder = 'Select date range' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activePreset, setActivePreset] = useState(value?.preset || null);
    const [rangeStart, setRangeStart] = useState(null);
    const [rangeEnd, setRangeEnd] = useState(null);
    const [selectingStart, setSelectingStart] = useState(true);
    const [viewMonth, setViewMonth] = useState(() => {
        const now = new Date();
        const d = (value?.preset === 'all' || !value?.start) ? now : new Date(value.start);
        return { year: d.getFullYear(), month: d.getMonth() };
    });
    const modalRef = useRef(null);

    const getInitialRange = () => {
        if (value?.start && value?.end) {
            return { start: new Date(value.start), end: new Date(value.end) };
        }
        if (value?.preset === 'all') {
            return { start: new Date(2000, 0, 1), end: new Date(9999, 11, 31) };
        }
        return getPresetRange(value?.preset || 'last90') || { start: new Date(), end: new Date() };
    };

    useEffect(() => {
        if (isOpen) {
            const range = getInitialRange();
            setRangeStart(range.start);
            setRangeEnd(range.end);
            setActivePreset(value?.preset ?? null);
            const now = new Date();
            const viewDate = (value?.preset === 'all' || !range.start) ? now : range.start;
            setViewMonth({ year: viewDate.getFullYear(), month: viewDate.getMonth() });
            setSelectingStart(true);
        }
    }, [isOpen, value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handlePresetChange = (preset) => {
        if (preset === 'all') {
            setActivePreset('all');
            const farPast = new Date(2000, 0, 1);
            const farFuture = new Date(9999, 11, 31);
            setRangeStart(farPast);
            setRangeEnd(farFuture);
            return;
        }
        const range = getPresetRange(preset);
        if (!range) return;
        setActivePreset(preset);
        setRangeStart(range.start);
        setRangeEnd(range.end);
    };

    const handleDateClick = (date) => {
        if (!date) return;
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        setActivePreset(null);

        if (selectingStart) {
            setRangeStart(d);
            setRangeEnd(d);
            setSelectingStart(false);
        } else {
            if (d.getTime() < (rangeStart?.getTime() || 0)) {
                setRangeStart(d);
                setRangeEnd(new Date(rangeStart));
            } else {
                setRangeEnd(d);
            }
            setSelectingStart(true);
        }
    };

    const handleUpdate = () => {
        const presetLabel = PRESETS.find((p) => p.value === activePreset)?.label;
        onChange({
            preset: activePreset,
            presetLabel,
            start: rangeStart || getInitialRange().start,
            end: rangeEnd || getInitialRange().end,
        });
        setIsOpen(false);
    };

    const handleCancel = () => {
        setIsOpen(false);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const prevMonth = () => {
        if (viewMonth.month === 0) {
            setViewMonth({ year: viewMonth.year - 1, month: 11 });
        } else {
            setViewMonth({ year: viewMonth.year, month: viewMonth.month - 1 });
        }
    };

    const nextMonth = () => {
        if (viewMonth.month === 11) {
            setViewMonth({ year: viewMonth.year + 1, month: 0 });
        } else {
            setViewMonth({ year: viewMonth.year, month: viewMonth.month + 1 });
        }
    };

    const isInRange = (d) => {
        if (!rangeStart || !rangeEnd || !d) return false;
        const t = d.getTime();
        const s = rangeStart.getTime();
        const e = rangeEnd.getTime();
        return t >= Math.min(s, e) && t <= Math.max(s, e);
    };

    const isStartOrEnd = (d) => {
        if (!d || !rangeStart || !rangeEnd) return false;
        const t = d.getTime();
        const s = rangeStart.getTime();
        const e = rangeEnd.getTime();
        return t === s || t === e;
    };

    const days1 = getDaysInMonth(viewMonth.year, viewMonth.month);
    const days2 = getDaysInMonth(viewMonth.month === 11 ? viewMonth.year + 1 : viewMonth.year, viewMonth.month === 11 ? 0 : viewMonth.month + 1);

    const currentStart = rangeStart || getInitialRange().start;
    const currentEnd = rangeEnd || getInitialRange().end;
    let buttonLabel = placeholder;
    if (value?.start && value?.end) {
        if (value.preset === 'all') {
            buttonLabel = 'All time';
        } else if (value.presetLabel) {
            buttonLabel = `${value.presetLabel}: ${formatDateLabel(new Date(value.start))} - ${formatDateLabel(new Date(value.end))}`;
        } else {
            buttonLabel = `${formatDateLabel(new Date(value.start))} - ${formatDateLabel(new Date(value.end))}`;
        }
    }

    const modalContent = isOpen ? (
        <div className="general-modal-overlay" onClick={handleClose}>
            <div className="general-date-range-picker-modal-container" ref={modalRef} onClick={(e) => e.stopPropagation()}>
                <div className="general-modal-header">
                    <h3>Select Date Range</h3>
                    <button className="close-btn" onClick={handleClose} type="button">
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="date-range-picker-modal-body">
                    <div className="date-range-picker-content">
                        <div className="date-range-presets">
                            {PRESETS.map((p) => (
                                <label key={p.value} className="date-range-preset-item">
                                    <input
                                        type="radio"
                                        name="date-preset"
                                        checked={activePreset === p.value}
                                        onChange={() => handlePresetChange(p.value)}
                                    />
                                    <span>{p.label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="date-range-calendars">
                            <div className="date-range-calendar-nav">
                                <button type="button" onClick={prevMonth} aria-label="Previous month">
                                    <Icon icon="mdi:chevron-left" width="24" />
                                </button>
                                <div className="date-range-month-labels">
                                    <span>{new Date(viewMonth.year, viewMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    <span>{new Date(viewMonth.month === 11 ? viewMonth.year + 1 : viewMonth.year, viewMonth.month === 11 ? 0 : viewMonth.month + 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                </div>
                                <button type="button" onClick={nextMonth} aria-label="Next month">
                                    <Icon icon="mdi:chevron-right" width="24" />
                                </button>
                            </div>
                            <div className="date-range-calendar-grid">
                                {[days1, days2].map((days, calIdx) => (
                                    <div key={calIdx} className="date-range-calendar">
                                        <div className="date-range-weekdays">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                                <span key={d}>{d}</span>
                                            ))}
                                        </div>
                                        <div className="date-range-days">
                                            {days.map((d, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className={`date-range-day ${!d ? 'empty' : ''} ${d && isInRange(d) ? 'in-range' : ''} ${d && isStartOrEnd(d) ? 'start-end' : ''}`}
                                                    onClick={() => handleDateClick(d)}
                                                    disabled={!d}
                                                >
                                                    {d ? d.getDate() : ''}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="date-range-picker-modal-footer">
                    <div className="date-range-display">
                        {formatDateLabel(currentStart)} - {formatDateLabel(currentEnd)}
                    </div>
                    <p className="date-range-timezone">Dates are shown in Pacific Time</p>
                    <div className="date-range-actions">
                        <button type="button" className="outlined-button date-range-cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button type="button" className="primary-button date-range-update" onClick={handleUpdate}>
                            Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            <button
                type="button"
                className={`date-range-picker-btn ${buttonClassName || ''}`}
                onClick={() => setIsOpen(true)}
            >
                <Icon icon="mdi:calendar" width="18" />
                <span>{buttonLabel}</span>
                <Icon icon="mdi:chevron-down" width="18" />
            </button>

            {createPortal(modalContent, document.body)}
        </>
    );
}
