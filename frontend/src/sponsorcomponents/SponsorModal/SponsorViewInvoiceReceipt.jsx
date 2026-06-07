import React from 'react';
import { Icon } from '@iconify/react';
import GiftRestoredNotice from '../../components/GiftRestoredNotice';
import './SponsorViewInvoiceReceipt.css';

const SponsorViewInvoiceReceipt = ({ isOpen, onClose, invoiceItem, onDownload }) => {
    if (!isOpen || !invoiceItem) return null;

    const item = invoiceItem;

    return (
        <div className="sponsor-invoice-modal-overlay">
            <div className="sponsor-invoice-modal">
                <div className="sir-modal-header">
                    <div className="sir-header-titles">
                        <h4 className="m-0 text-black">Invoice {item.invoiceRef}</h4>
                        <span className="small-body-text text-secondary">{item.title}</span>
                    </div>
                    <button className="sir-modal-close-icon" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="sir-modal-body">
                    <div className="sir-invoice-container">
                        <div className="sir-invoice-top">
                            <div className="sir-invoice-brand">
                                <Icon icon="icon-park-solid:tickets-two" width="40" color="var(--color-red-primary)" />
                                <div className="sir-brand-text">
                                    <h5 className="m-0 text-black">eTicketsPro</h5>
                                    <span className="smaller-body-text text-secondary">Event Sponsorship Platform</span>
                                </div>
                            </div>
                            <div className="sir-invoice-titletext">
                                <h3 className="text-red m-0">INVOICE</h3>
                            </div>
                        </div>

                        <div className="sir-invoice-details">
                            <div className="sir-sender-info">
                                <p className="small-body-text text-secondary m-0">717 S. 12th Street Unit #3</p>
                                <p className="small-body-text text-secondary m-0">McAllen, TX 78501</p>
                                <p className="small-body-text text-secondary m-0">sales@deltoroentertainment.com</p>
                            </div>
                            <div className="sir-meta-info">
                                <div className="sir-meta-row">
                                    <span className="small-body-text text-secondary">Invoice #:</span>
                                    <span className="small-body-text text-black font-medium">{item.invoiceRef}</span>
                                </div>
                                <div className="sir-meta-row">
                                    <span className="small-body-text text-secondary">Issue Date:</span>
                                    <span className="small-body-text text-black">{item.issueDate}</span>
                                </div>
                                <div className="sir-meta-row">
                                    <span className="small-body-text text-secondary">Due Date:</span>
                                    <span className="small-body-text text-black">{item.dueDate}</span>
                                </div>
                            </div>
                        </div>

                        <div className="sir-bill-to">
                            <h5 className="text-black m-0 mb-8">Bill To:</h5>
                            <p className="small-body-text text-black m-0 font-medium">{item.companyName}</p>
                            <p className="small-body-text text-secondary m-0" style={{ whiteSpace: 'pre-line' }}>{item.companyAddress}</p>
                            <p className="small-body-text text-secondary m-0 mt-4">Tax ID: <span className="text-black">{item.taxId}</span></p>
                        </div>

                        <div className="sir-event-details">
                            <h6 className="text-black m-0 mb-8">Event Details</h6>
                            <div className="sir-event-info-grid">
                                <span className="small-body-text text-black"><p className="font-medium inline-block m-0" style={{ display: 'inline-block' }}>Event:</p> {item.title}</span>
                                <span className="small-body-text text-black"><p className="font-medium inline-block m-0" style={{ display: 'inline-block' }}>Booth Number:</p> {item.booth}</span>
                            </div>
                        </div>
                        \
                        {/* Promo/Gift Badge */}
                        {(item.giftCode || item.appliedGift) && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: '8px', padding: '8px 12px', marginBottom: '8px'
                            }}>
                                <Icon icon="mdi:ticket-percent" width="18" color="#16a34a" />
                                <span className="small-body-text" style={{ color: '#16a34a', fontWeight: 600 }}>
                                    {item.appliedGift?.name
                                        ? `${item.appliedGift.name} (${item.giftCode})`
                                        : item.giftCode}
                                    {' — '}
                                    {item.appliedGift?.valueType === 'fixed'
                                        ? `$${item.appliedGift.value?.toLocaleString()} off`
                                        : item.appliedGift?.valueType === 'percent'
                                            ? `${item.appliedGift.value}% off`
                                            : item.appliedGift?.valueType === 'bxgy'
                                                ? 'Buy 1 Get 1 Free'
                                                : 'Discount Applied'}
                                </span>
                            </div>
                        )}
                        <div className="sir-items-table">

                            <table className="sir-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Qty</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {item.items.map((lineItem, idx) => (
                                        <tr key={idx}>
                                            <td data-label="Description">{lineItem.description}</td>
                                            <td data-label="Qty">{lineItem.qty}</td>
                                            <td data-label="Unit Price" style={lineItem.isFree ? { color: '#16a34a', fontWeight: 700 } : lineItem.isDiscount ? { color: '#16a34a' } : {}}>
                                                {lineItem.isFree ? 'FREE' : lineItem.unitPrice}
                                            </td>
                                            <td data-label="Total" className={`font-medium ${lineItem.isFree ? '' : 'text-black'}`} style={lineItem.isFree ? { color: '#16a34a', fontWeight: 700 } : lineItem.isDiscount ? { color: '#16a34a' } : {}}>
                                                {lineItem.isFree ? 'FREE' : lineItem.total}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="sir-table-footer">
                                <div className="sir-totals-box">
    {item.discount > 0 && !item.isBXGY && (
        <>
            <div className="sir-totals-row">
                <span className="small-body-text text-secondary">Subtotal (before discount):</span>
                <span className="small-body-text text-black">
                    ${((parseFloat(item.subtotal.replace(/[^\d.]/g, '')) || 0) + item.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className="sir-totals-row">
                <span className="small-body-text" style={{ color: '#16a34a' }}>
                    {(() => {
                        const giftType = item.appliedGift?.valueType;
                        const giftValue = item.appliedGift?.value;
                        const suffix = giftType === 'percent'
                            ? `${giftValue}% off`
                            : giftType === 'fixed'
                                ? `Fixed`
                                : item.discountLabel || '';
                        return `Gift Card Discount${suffix ? ` — ${suffix}` : ''}:`;
                    })()}
                </span>
                <span className="small-body-text" style={{ color: '#16a34a' }}>
                    −${item.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
        </>
    )}
    <div className="sir-totals-row">
        <span className="small-body-text text-secondary">Subtotal:</span>
                                        <span className="small-body-text text-black">{item.subtotal}</span>
                                    </div>
                                    <div className="sir-totals-row sir-final-total">
                                        <h5 className="m-0 text-black">Total Due:</h5>
                                        <h4 className="m-0 text-red">{item.totalDue}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                       {item.status === 'paid' ? (
                            <div className="sir-payment-status paid">
                                <Icon icon="mdi:check-circle-outline" width="24" className="text-green" />
                                <div className="sir-status-text">
                                    <h6 className="m-0 text-green">Payment Received</h6>
                                    <span className="smaller-body-text text-secondary">
                                        Paid on <span className="text-green">{item.paidDate}</span> via <span className="text-green">{item.paymentMethod}</span>
                                    </span>
                                </div>
                            </div>
                        ) : item.paymentStatus === 'Rejected' || item.paymentStatus === 'Refunded' ? (
                            <div className="sir-payment-status pending">
                                <Icon icon="mdi:close-circle-outline" width="24" color="#dc2626" />
                                <div className="sir-status-text">
                                    <h6 className="m-0" style={{ color: '#dc2626' }}>Payment {item.paymentStatus}</h6>
                                    <span className="smaller-body-text text-secondary">
                                        This payment was not completed.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="sir-payment-status pending">
                                <Icon icon="mdi:clock-alert-outline" width="24" color="#d97706" />
                                <div className="sir-status-text">
                                    <h6 className="m-0" style={{ color: '#d97706' }}>Payment Pending</h6>
                                    <span className="smaller-body-text text-secondary">
                                        This invoice has not been paid yet. Please complete your payment at the earliest.
                                    </span>
                                </div>
                            </div>
                        )}

                        <GiftRestoredNotice
                            paymentStatus={item.paymentStatus}
                            appliedGift={item.appliedGift}
                            giftCode={item.giftCode}
                        />

                        <div className="sir-payment-instructions">
                            <p className="smaller-body-text text-black font-medium m-0 mb-4">Payment Instructions:</p>
                            <p className="smaller-body-text text-secondary m-0">Wire Transfer: Bank of America, Account #123456789, Routing #987654321</p>
                            <p className="smaller-body-text text-secondary m-0">ACH: Use invoice number as reference</p>
                            <p className="smaller-body-text text-secondary m-0">Questions? Contact us at billing@eticketspro.com or call +1 (555) 123-4567</p>
                        </div>
                    </div>
                </div>

                <div className="sir-modal-footer">
                    <button className="outlined-button sir-close-btn" onClick={onClose} style={{ color: 'var(--color-black-primary)' }}>Close</button>
                    <button className="primary-button sir-download-btn" onClick={onDownload}>
                        <Icon icon="mdi:download" width="18" /> Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SponsorViewInvoiceReceipt;
