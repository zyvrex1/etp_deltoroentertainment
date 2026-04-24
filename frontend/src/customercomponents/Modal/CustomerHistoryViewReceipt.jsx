import React from 'react';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable } from '../../utils/pdfExport';
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

    const handleDownloadPDF = async () => {
        const loadingToast = showExportToast();
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const MARGIN = 15;
            let y = 45;

            addReportHeader(pdf, 'Transaction Receipt', logoData);

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Order #${data.orderNum}`, MARGIN, y);
            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text(data.date, pdf.internal.pageSize.getWidth() - MARGIN, y, { align: 'right' });
            y += 15;

            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'bold');
            pdf.text('BILLED TO', MARGIN, y);
            pdf.text('PAYMENT METHOD', pdf.internal.pageSize.getWidth() - MARGIN, y, { align: 'right' });
            y += 6;
            
            pdf.setFont('helvetica', 'normal');
            pdf.text(data.billedTo.name, MARGIN, y);
            pdf.text(data.paymentMethod, pdf.internal.pageSize.getWidth() - MARGIN, y, { align: 'right' });
            y += 6;
            
            pdf.text(data.billedTo.email, MARGIN, y);
            pdf.setTextColor(40, 167, 69); // Green status
            pdf.text(data.status, pdf.internal.pageSize.getWidth() - MARGIN, y, { align: 'right' });
            y += 20;

            const headers = ['Item', 'Type', 'Qty', 'Price', 'Total'];
            const rows = data.items.map(item => [
                item.item,
                item.type,
                item.qty.toString(),
                item.price,
                item.total
            ]);

            y = drawTable(pdf, y, headers, rows, MARGIN, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 15, 12, 5);

            y += 10;
            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.text(`Subtotal: ${data.subtotal}`, pdf.internal.pageSize.getWidth() - MARGIN, y, { align: 'right' });
            y += 6;
            pdf.text(`Service Fee: ${data.serviceFee}`, pdf.internal.pageSize.getWidth() - MARGIN, y, { align: 'right' });
            y += 6;
            pdf.text(`Tax: ${data.tax}`, pdf.internal.pageSize.getWidth() - MARGIN, y, { align: 'right' });
            y += 10;
            
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(30, 60, 114);
            pdf.text('Total Paid:', pdf.internal.pageSize.getWidth() - MARGIN - 30, y, { align: 'right' });
            pdf.setTextColor(220, 53, 69); // Red color for total
            pdf.text(data.totalPaid, pdf.internal.pageSize.getWidth() - MARGIN, y, { align: 'right' });

            addReportFooter(pdf, 1, 1);
            pdf.save(`Receipt_${data.orderNum}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
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
                                    <td className="text-left text-black">{row.item}</td>
                                    <td className="text-left text-secondary">{row.type}</td>
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

                    <button className="primary-button chvr-print-btn mt-2" onClick={handleDownloadPDF} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon icon="mdi:download" width="18" className="mr-2" />
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerHistoryViewReceipt;
