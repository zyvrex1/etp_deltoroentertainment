import React from 'react';
import { Icon } from '@iconify/react';
import './CustomerHistoryViewReceipt.css';

const CustomerHistoryViewReceipt = ({ show, onClose, receiptData }) => {
    if (!show) return null;

    // Use mock data if no receiptData provided
    const data = receiptData || {
        orderNum: 'ORD-12345',
        date: '5/1/2026 10:30:00 PM',
        billedTo: {
            name: 'Zyvrex Perez',
            email: 'hello@zyvrex.com'
        },
        paymentMethod: 'Visa ending in 4242',
        status: 'Paid',
        items: [
            { item: 'Row A, Seat 12', type: 'VIP Ticket', qty: 1, price: '$150.00', total: '$150.00' },
            { item: 'Event Hoodie', type: 'Merch', qty: 1, price: '$45.00', total: '$45.00' }
        ],
        subtotal: '$195.00',
        serviceFee: '$10.00',
        tax: '$15.37',
        totalPaid: '$220.37'
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="chvr-modal-overlay">
            <div className="chvr-modal-container">
                <button className="chvr-close-btn" onClick={onClose}>
                    <Icon icon="mdi:close" width="24" />
                </button>

                <div className="chvr-receipt-header">
                    <div className="chvr-header-left text-left">
                        <div className="chvr-logo-container">
                            <img src="/logo/Logo1.png" alt="eTicketsPro" className="chvr-logo-image" />
                        </div>
                        <p className="small-body-text text-secondary mt-1 m-0">Transaction Receipt</p>
                    </div>
                    <div className="chvr-header-right text-right" style={{ paddingRight: '0' }}>
                        <h4 className="text-black m-0 mb-1">Order #{data.orderNum}</h4>
                        <p className="small-body-text text-secondary m-0">{data.date}</p>
                    </div>
                </div>

                <hr className="chvr-divider" />

                <div className="chvr-billing-info">
                    <div className="chvr-info-block text-left">
                        <span className="smaller-body-text chvr-info-label">BILLED TO</span>
                        <h6 className="text-black m-0 mb-1">{data.billedTo.name}</h6>
                        <span className="small-body-text text-secondary">{data.billedTo.email}</span>
                    </div>
                    <div className="chvr-info-block text-right">
                        <span className="smaller-body-text chvr-info-label">PAYMENT METHOD</span>
                        <h6 className="text-black m-0 mb-1">{data.paymentMethod}</h6>
                        <span className="small-body-text chvr-text-green">{data.status}</span>
                    </div>
                </div>

                <hr className="chvr-divider" />

                <div className="chvr-table-container">
                    <table className="chvr-table">
                        <thead>
                            <tr>
                                <th className="text-left">Item</th>
                                <th className="text-left">Type</th>
                                <th className="text-center">Qty</th>
                                <th className="text-right">Price</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((row, index) => (
                                <tr key={index}>
                                    <td className="text-black">{row.item}</td>
                                    <td className="text-secondary">{row.type}</td>
                                    <td className="text-center text-black">{row.qty}</td>
                                    <td className="text-right text-secondary">{row.price}</td>
                                    <td className="text-right text-black">{row.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <hr className="chvr-divider" />

                <div className="chvr-summary-container">
                    <div className="chvr-summary-content">
                        <div className="chvr-summary-row mb-2">
                            <span className="small-body-text text-black">Subtotal</span>
                            <span className="small-body-text text-black">{data.subtotal}</span>
                        </div>
                        <div className="chvr-summary-row mb-2">
                            <span className="small-body-text text-black">Service Fee</span>
                            <span className="small-body-text text-black">{data.serviceFee}</span>
                        </div>
                        <div className="chvr-summary-row mb-3">
                            <span className="small-body-text text-black">Tax</span>
                            <span className="small-body-text text-black">{data.tax}</span>
                        </div>

                        <hr className="chvr-divider mb-3 mt-3" />

                        <div className="chvr-summary-row">
                            <h4 className="text-black m-0">Total Paid</h4>
                            <h4 className="text-red m-0">{data.totalPaid}</h4>
                        </div>
                    </div>
                </div>

                <hr className="chvr-divider" />

                <div className="chvr-footer-content">
                    <h4 className="text-black mb-2 m-0 mt-2">Thank you for your purchase!</h4>
                    <p className="small-body-text text-secondary mb-1 mt-2">Please present your QR ticket at the event entrance.</p>
                    <p className="small-body-text text-secondary mb-3 mt-0">For food and merch orders, present your pickup ticket at the vendor booth.</p>
                    <p className="smaller-body-text text-secondary m-0">Support Contact: support@eticketspro.com</p>

                    <button className="primary-button chvr-print-btn mt-4" onClick={handlePrint}>
                        <Icon icon="mdi:printer" width="18" className="mr-2" />
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerHistoryViewReceipt;
