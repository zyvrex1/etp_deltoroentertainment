import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { useAuthContext } from '../hooks/useAuthContext';
import { showDeleteConfirmAlert, showSuccessAlert, showConfirmAlert } from '../utils/sweetAlert';
import SponsorAddExhibitor from './SponsorModal/SponsorAddExhibitor';
import SponsorDocuments from './SponsorModal/SponsorDocuments';
import SponsorViewInvoiceReceipt from './SponsorModal/SponsorViewInvoiceReceipt';
import SponsorRequestRefund from './SponsorModal/SponsorRequestRefund';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, drawLongText, finalizeReport } from '../utils/pdfExport';
import './SponsorBoothFullDetails.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function SponsorBoothFullDetails() {
    const { id: reservationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [reservation, setReservation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddExhibitorModalOpen, setIsAddExhibitorModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isInvoiceReceiptModalOpen, setIsInvoiceReceiptModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const fetchReservation = React.useCallback(async () => {
        if (!user?.token || !reservationId) return;
        setIsLoading(true);
        try {
            const response = await axios.get(`${BACKEND_URL}/api/reservations/${reservationId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setReservation(response.data);
        } catch (error) {
            console.error("Fetch reservation error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [reservationId, user?.token]);

    useEffect(() => {
        fetchReservation();
    }, [fetchReservation]);

const exportDocumentToPDF = async (doc) => {
    if (!doc) return;
    const loadingToast = showExportToast();
    const DOCUMENT_TITLE = doc.title;

    try {
        const logoData = await loadLogo();
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const MARGIN = 15;
        const FOOTER_HEIGHT = 15;
        let y = 45;

        addReportHeader(pdf, DOCUMENT_TITLE, logoData);

        // ── helpers ──────────────────────────────────────────────────────────
        const newPageIfNeeded = (needed) => {
            if (y + needed > pdfHeight - FOOTER_HEIGHT - 5) {
                pdf.addPage();
                addReportHeader(pdf, DOCUMENT_TITLE, logoData);
                y = 45;
            }
        };

        const sectionHeading = (title) => {
            newPageIfNeeded(14);
            pdf.setFontSize(11);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, MARGIN, y);
            pdf.setDrawColor(30, 60, 114);
            pdf.setLineWidth(0.4);
            pdf.line(MARGIN, y + 2, pdfWidth - MARGIN, y + 2);
            y += 10;
        };

        // ══════════════════════════════════════════════════════════════════════
        // FULL SECTION CONTENT
        // ══════════════════════════════════════════════════════════════════════
        sectionHeading('Document Content');

        doc.sections.forEach((sec, idx) => {
            newPageIfNeeded(20);

            // Section title row
            const rowBg = idx % 2 === 0 ? [245, 247, 255] : [255, 255, 255];
            pdf.setFillColor(...rowBg);
            pdf.setDrawColor(220, 225, 245);
            pdf.setLineWidth(0.2);
            pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 8, 1, 1, 'FD');

            pdf.setFontSize(9);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${idx + 1}.  ${sec.title}`, MARGIN + 4, y + 5.5);
            y += 15;

            const sectionContent = sec.pdfContent && sec.pdfContent.length > 0
                ? sec.pdfContent.join('\n')
                : 'Please refer to the application portal for the full detailed content of this section.';

            y = drawLongText(pdf, y, sectionContent, MARGIN + 4, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, logoData, DOCUMENT_TITLE);
            y += 6;
        });

        // ══════════════════════════════════════════════════════════════════════
        // FOOTER STRIP
        // ══════════════════════════════════════════════════════════════════════
        y += 8;
        newPageIfNeeded(16);
        pdf.setFillColor(245, 247, 255);
        pdf.setDrawColor(210, 218, 245);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 14, 2, 2, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 130);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
            `${DOCUMENT_TITLE}  •  Generated by eTicketsPro`,
            pdfWidth / 2, y + 9, { align: 'center' }
        );

        finalizeReport(pdf);
        pdf.save(`${DOCUMENT_TITLE.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        removeExportToast(loadingToast);
    }
};
const exportInvoiceToPDF = async () => {
    if (!reservation) return;
    const loadingToast = showExportToast();
    const INVOICE_TITLE = 'Invoice';

    try {
        const logoData = await loadLogo();
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const MARGIN = 15;
        const FOOTER_HEIGHT = 15;
        let y = 45;

        addReportHeader(pdf, INVOICE_TITLE, logoData);

        // ── helpers ──────────────────────────────────────────────────────────
        const newPageIfNeeded = (needed) => {
            if (y + needed > pdfHeight - FOOTER_HEIGHT - 5) {
                pdf.addPage();
                addReportHeader(pdf, INVOICE_TITLE, logoData);
                y = 45;
            }
        };

        const sectionHeading = (title) => {
            newPageIfNeeded(14);
            pdf.setFontSize(11);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, MARGIN, y);
            pdf.setDrawColor(30, 60, 114);
            pdf.setLineWidth(0.4);
            pdf.line(MARGIN, y + 2, pdfWidth - MARGIN, y + 2);
            y += 10;
        };

        const priceLevel = reservation.event?.priceLevels?.find(
            pl => pl._id === reservation.event?.booths?.find(b => b.code === reservation.boothCode)?.priceLevelId
        );
        const subtotal = reservation.amount?.subtotal || 0;
        const fee = reservation.amount?.fee || 0;
        const tax = reservation.amount?.tax || 0;
        const total = reservation.amount?.total || 0;
        const confirmNum = `Booth-${reservation._id.toString().slice(-6).toUpperCase()}`;
        const invoiceRef = `INV-${new Date(reservation.createdAt).getFullYear()}-${reservation._id.slice(-5).toUpperCase()}`;

        // ══════════════════════════════════════════════════════════════════════
        // BANNER
        // ══════════════════════════════════════════════════════════════════════
        pdf.setFillColor(235, 240, 255);
        pdf.setDrawColor(180, 200, 245);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 22, 3, 3, 'FD');

        // Left — event title + ref
        pdf.setFontSize(11);
        pdf.setTextColor(30, 60, 114);
        pdf.setFont('helvetica', 'bold');
        pdf.text(reservation.event?.title || 'Unknown Event', MARGIN + 4, y + 8);
        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 130);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
            `${invoiceRef}  •  Booth ${reservation.boothCode}  •  ${new Date(reservation.createdAt).toLocaleDateString()}`,
            MARGIN + 4, y + 15
        );

        // Right — total paid badge
        const badgeX = pdfWidth - MARGIN - 50;
        pdf.setFillColor(30, 60, 114);
        pdf.roundedRect(badgeX, y + 4, 46, 14, 2, 2, 'F');
        pdf.setFontSize(7.5);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Total Paid', badgeX + 23, y + 10, { align: 'center' });
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
            `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            badgeX + 23, y + 16, { align: 'center' }
        );
        y += 30;

        // ══════════════════════════════════════════════════════════════════════
        // KEY DETAILS — 3-col cards
        // ══════════════════════════════════════════════════════════════════════
        sectionHeading('Booking Details');

        const cardW = (pdfWidth - MARGIN * 2 - 12) / 3;
        const cardH = 22;

        const detailCards = [
            {
                label: 'Confirmation',
                value: confirmNum,
                sub: `Booked ${new Date(reservation.createdAt).toLocaleDateString()}`,
                color: [30, 60, 114],
                bg: [235, 240, 255],
                border: [180, 200, 245],
            },
            {
                label: 'Booth Type',
                value: priceLevel?.priceName || 'Standard',
                sub: priceLevel?.boothSize || '10x10 ft',
                color: [217, 119, 6],
                bg: [255, 251, 235],
                border: [245, 220, 160],
            },
            {
                label: 'Payment Method',
                value: reservation.paymentMethod === 'card' ? 'Credit Card' : 'Invoice',
                sub: 'Payment confirmed',
                color: [22, 163, 74],
                bg: [235, 255, 245],
                border: [180, 235, 210],
            },
        ];

        detailCards.forEach((card, i) => {
            const cx = MARGIN + i * (cardW + 6);
            const cy = y;

            pdf.setFillColor(...card.bg);
            pdf.setDrawColor(...card.border);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, 'FD');

            pdf.setFillColor(...card.color);
            pdf.circle(cx + 5, cy + 6, 2, 'F');

            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.text(card.label, cx + 10, cy + 7);

            pdf.setFontSize(10);
            pdf.setTextColor(...card.color);
            pdf.setFont('helvetica', 'bold');
            pdf.text(card.value, cx + 5, cy + 16);

            pdf.setFontSize(7);
            pdf.setTextColor(130, 130, 130);
            pdf.setFont('helvetica', 'normal');
            pdf.text(card.sub, cx + cardW - 4, cy + 16, { align: 'right' });
        });

        y += cardH + 10;

        // ══════════════════════════════════════════════════════════════════════
        // BILL TO
        // ══════════════════════════════════════════════════════════════════════
        sectionHeading('Billed To');

        newPageIfNeeded(28);
        pdf.setFillColor(248, 248, 255);
        pdf.setDrawColor(210, 210, 240);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 24, 2, 2, 'FD');

        pdf.setFontSize(10);
        pdf.setTextColor(30, 60, 114);
        pdf.setFont('helvetica', 'bold');
        pdf.text(billTo.companyName, MARGIN + 4, y + 8);

        pdf.setFontSize(8.5);
        pdf.setTextColor(60, 60, 60);
        pdf.setFont('helvetica', 'normal');
        pdf.text(billTo.address, MARGIN + 4, y + 15);

        pdf.setTextColor(100, 100, 100);
        pdf.text(`Tax ID: ${billTo.taxId}`, MARGIN + 4, y + 21);

        y += 30;

        // ══════════════════════════════════════════════════════════════════════
        // EXHIBITORS
        // ══════════════════════════════════════════════════════════════════════
        sectionHeading('Exhibitors');

        const allExhibitors = [];
        if (reservation.user) {
            const leadName = `${reservation.user.firstName || ''} ${reservation.user.lastName || ''}`.trim()
                || reservation.user.email || 'Lead Representative';
            allExhibitors.push({ name: leadName, role: 'Lead Representative' });
        }
        (reservation.exhibitors || []).forEach(ex => {
            const exName = `${ex.firstName || ''} ${ex.lastName || ''}`.trim() || ex.email || 'Exhibitor';
            allExhibitors.push({ name: exName, role: 'Exhibitor' });
        });

        allExhibitors.forEach((ex, idx) => {
            newPageIfNeeded(10);
            const rowBg = idx % 2 === 0 ? [245, 247, 255] : [255, 255, 255];
            pdf.setFillColor(...rowBg);
            pdf.setDrawColor(220, 225, 245);
            pdf.setLineWidth(0.2);
            pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 8, 1, 1, 'FD');

            pdf.setFontSize(9);
            pdf.setTextColor(30, 30, 30);
            pdf.setFont('helvetica', 'bold');
            pdf.text(ex.name, MARGIN + 4, y + 5.5);

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 120);
            pdf.text(ex.role, pdfWidth - MARGIN - 4, y + 5.5, { align: 'right' });

            y += 10;
        });

        y += 4;

        // ══════════════════════════════════════════════════════════════════════
        // PRICE BREAKDOWN TABLE
        // ══════════════════════════════════════════════════════════════════════
        sectionHeading('Price Breakdown');

        const headers = ['Description', 'Amount'];
        const rows = [
            ['Booth Registration', `$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
            ['Processing Fee', `$${fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
            ['Tax', `$${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
            ['Total Paid', `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ];
        y = drawTable(pdf, y, headers, rows, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT, 12, 5, logoData, INVOICE_TITLE);

        // ══════════════════════════════════════════════════════════════════════
        // BREAKDOWN BARS
        // ══════════════════════════════════════════════════════════════════════
        y += 8;
        sectionHeading('Payment Breakdown');

        const breakdownItems = [
            { label: 'Booth Price', value: subtotal, color: [30, 60, 114] },
            { label: 'Processing Fee', value: fee, color: [217, 119, 6] },
            { label: 'Tax', value: tax, color: [22, 163, 74] },
        ];
        const maxBar = Math.max(...breakdownItems.map(b => b.value), 1);
        const barMaxW = pdfWidth - MARGIN * 2 - 65;

        breakdownItems.forEach(item => {
            newPageIfNeeded(14);
            const fillW = (item.value / maxBar) * barMaxW;

            pdf.setFontSize(8.5);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text(item.label, MARGIN, y + 4.5);

            pdf.setFillColor(235, 235, 235);
            pdf.roundedRect(MARGIN + 43, y, barMaxW, 6, 1, 1, 'F');

            if (fillW > 0) {
                pdf.setFillColor(...item.color);
                pdf.roundedRect(MARGIN + 43, y, fillW, 6, 1, 1, 'F');
            }

            pdf.setFontSize(7.5);
            pdf.setTextColor(80, 80, 80);
            pdf.text(
                `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                MARGIN + 43 + barMaxW + 2, y + 4.5
            );
            y += 11;
        });

        // Summary strip
        y += 2;
        newPageIfNeeded(12);
        pdf.setFillColor(248, 248, 255);
        pdf.setDrawColor(210, 210, 240);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 10, 2, 2, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 120);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
            `Total Paid: $${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Booth: ${reservation.boothCode}   |   ${reservation.event?.title || 'Unknown Event'}`,
            pdfWidth / 2, y + 6.5, { align: 'center' }
        );
        y += 16;

        // ══════════════════════════════════════════════════════════════════════
        // FOOTER STRIP
        // ══════════════════════════════════════════════════════════════════════
        y += 8;
        newPageIfNeeded(16);
        pdf.setFillColor(245, 247, 255);
        pdf.setDrawColor(210, 218, 245);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 14, 2, 2, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 130);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
            `${invoiceRef}  •  Generated by eTicketsPro`,
            pdfWidth / 2, y + 9, { align: 'center' }
        );

        finalizeReport(pdf);
        pdf.save(`Invoice_${reservation._id}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        removeExportToast(loadingToast);
    }
};
    const handleEventDetails = () => {
        if (reservation?.event?._id) {
            navigate(`/sponsor/sponsor-event/${reservation.event._id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="booth-details-container">
                <div className="booth-header-section">
                    <div className="skeleton skeleton-text title" style={{width: '300px'}}></div>
                </div>
                <div className="booth-main-grid">
                    <div className="booth-info-cards-sec">
                        <div className="skeleton" style={{height: '200px', borderRadius: '12px', marginBottom: '24px'}}></div>
                        <div className="skeleton" style={{height: '150px', borderRadius: '12px', marginBottom: '24px'}}></div>
                        <div className="skeleton" style={{height: '250px', borderRadius: '12px'}}></div>
                    </div>
                    <div className="booth-side-cards-sec">
                        <div className="skeleton" style={{height: '300px', borderRadius: '12px', marginBottom: '24px'}}></div>
                        <div className="skeleton" style={{height: '200px', borderRadius: '12px'}}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!reservation) {
        return (
            <div className="booth-details-container">
                <p>Reservation not found.</p>
            </div>
        );
    }

    const exhibitors = [];
    if (reservation?.user) {
        exhibitors.push({
            id: reservation.user._id,
            name: `${reservation.user.firstName || 'Sponsor'} ${reservation.user.lastName || ''}`,
            role: 'Sponsor Lead',
            email: reservation.user.email || 'N/A',
            phone: reservation.user.phone || 'N/A',
            initial: reservation.user.firstName?.[0]?.toUpperCase() || 'S',
            isOwner: true
        });
    }
    if (reservation?.exhibitors) {
        reservation.exhibitors.forEach(e => {
            exhibitors.push({
                id: e._id,
                name: `${e.firstName || ''} ${e.lastName || ''}`,
                role: 'Exhibitor',
                email: e.email || 'N/A',
                phone: e.phone || 'N/A',
                initial: e.firstName?.[0]?.toUpperCase() || 'E',
                isOwner: false
            });
        });
    }

    let billingAddress = '';
    if (reservation.billingAddress?.address) {
        billingAddress += reservation.billingAddress.address;
    } else if (reservation.user?.streetAddress) {
        billingAddress += reservation.user.streetAddress;
    }

    if (reservation.billingAddress?.city || reservation.user?.city) {
        if (billingAddress) billingAddress += ', ';
        billingAddress += reservation.billingAddress?.city || reservation.user?.city;
    }

    if (reservation.billingAddress?.zipCode || reservation.user?.zipCode) {
        if (billingAddress) billingAddress += ' ';
        billingAddress += reservation.billingAddress?.zipCode || reservation.user?.zipCode;
    }

    const billTo = {
        companyName: reservation.billingAddress?.companyName || reservation.user?.companyName || 'Your Company',
        address: billingAddress.trim() || 'Address not provided',
        taxId: 'N/A'
    };

    const isPromoterEvent = reservation.event?.createdBy?.role === 'promoter';
    const organizerName = isPromoterEvent
        ? (reservation.event?.createdBy?.companyName || `${reservation.event?.createdBy?.firstName || ''} ${reservation.event?.createdBy?.lastName || ''}`.trim() || 'Deltoro Entertainment Events LLC.')
        : 'Deltoro Entertainment Events LLC.';

    const documents = [
        {
            id: 1,
            title: 'Sponsorship Contract',
            size: '2.4 MB',
            format: "PDF",
            sections: [
                {
                    title: 'Parties',
                    content: (
                        <div className="sd-parties" >
                            <p className="small-body-text" style={{ marginBottom: '12px' }}>
                                This Sponsorship Agreement ("Agreement") is entered into between:
                            </p>

                            <ul className="sd-list small-body-text text-secondary">
                                <li>Sponsor: {reservation.user?.companyName || (reservation.user?.firstName + ' ' + reservation.user?.lastName)}</li>
                                <li>Organizer: {organizerName}</li>
                            </ul>
                        </div>
                    ),
                    pdfContent: [
                        'This Sponsorship Agreement ("Agreement") is entered into between:',
                        `• Sponsor: ${reservation.user?.companyName || (reservation.user?.firstName + ' ' + reservation.user?.lastName)}`,
                        `• Organizer: ${organizerName}`
                    ]
                },
                {
                    title: 'Booth Assignment',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            The Organizer agrees to provide the Sponsor with the exhibition space as detailed in the booking summary (including Booth Number, Type, Dimensions, and Location).
                        </p>
                    ),
                    pdfContent: [
                        'The Organizer agrees to provide the Sponsor with the exhibition space as detailed in the booking summary (including Booth Number, Type, Dimensions, and Location).'
                    ]
                },
                {
                    title: 'Sponsorship Fee',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            The total sponsorship fee includes the Booth Base Price, Processing Fee, and Applicable Tax. Payment is processed upon confirmation.
                        </p>
                    ),
                    pdfContent: [
                        'The total sponsorship fee includes the Booth Base Price, Processing Fee, and Applicable Tax. Payment is processed upon confirmation.'
                    ]
                },
                {
                    title: 'Inclusions',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Exhibitor Passes (quantity based on booth type)</li>
                            <li>Dedicated power circuit and WiFi access (if applicable)</li>
                            <li>Company listing in the official event directory</li>
                            <li>Access to post-event lead report</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Exhibitor Passes (quantity based on booth type)',
                        '• Dedicated power circuit and WiFi access (if applicable)',
                        '• Company listing in the official event directory',
                        '• Access to post-event lead report'
                    ]
                },
                {
                    title: 'Cancellation Policy',
                    content: (
                        <div className="sd-cancellation" >
                            <p className="small-body-text" style={{ marginBottom: '12px' }}>
                                Cancellations must be submitted in writing.
                            </p>

                            <ul className="sd-list small-body-text text-secondary">
                                <li>60+ days before event: 50% refund of total fees paid</li>
                                <li>Less than 60 days before event: No refund</li>
                                <li>Force majeure events will be handled on a case-by-case basis.</li>
                            </ul>
                        </div>
                    ),
                    pdfContent: [
                        'Cancellations must be submitted in writing.',
                        '• 60+ days before event: 50% refund of total fees paid',
                        '• Less than 60 days before event: No refund',
                        '• Force majeure events will be handled on a case-by-case basis.'
                    ]
                },
                {
                    title: 'Conduct & Compliance',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Comply with all venue rules and regulations.</li>
                            <li>Not obstruct neighboring booths or common areas.</li>
                            <li>Ensure all booth materials meet fire safety standards.</li>
                            <li>Maintain a professional and respectful environment.</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Comply with all venue rules and regulations.',
                        '• Not obstruct neighboring booths or common areas.',
                        '• Ensure all booth materials meet fire safety standards.',
                        '• Maintain a professional and respectful environment.'
                    ]
                }
            ]
        },
        {
            id: 2,
            title: 'Exhibitor Manual',
            size: '5.1 MB',
            format: "PDF",
            sections: [
                {
                    title: 'Welcome Message',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Welcome to the Event. We are thrilled to have you as a sponsor. This manual contains everything you need to know to make your exhibition experience seamless and successful.
                        </p>
                    ),
                    pdfContent: [
                        'Welcome to the Event. We are thrilled to have you as a sponsor. This manual contains everything you need to know to make your exhibition experience seamless and successful.'
                    ]
                },
                {
                    title: 'Event Schedule Overview',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Setup Days: Dedicated times for booth construction and material preparation.</li>
                            <li>Event Days: General exhibition hours and specific keynote timings.</li>
                            <li>Teardown Days: Designated windows for booth dismantling.</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Setup Days: Dedicated times for booth construction and material preparation.',
                        '• Event Days: General exhibition hours and specific keynote timings.',
                        '• Teardown Days: Designated windows for booth dismantling.'
                    ]
                },
                {
                    title: 'Booth Regulations',
                    content: (
                        <div className="small-body-text text-secondary" style={{ margin: 0 }}>
                            <strong>Height Restrictions:</strong> Standard booths max 8 feet; Island booths max 12 feet. <br />
                            <strong>Display Rules:</strong> All displays must remain within your assigned footprint. No audio exceeding 85 dB.
                        </div>
                    ),
                    pdfContent: [
                        'Height Restrictions: Standard booths max 8 feet; Island booths max 12 feet.',
                        'Display Rules: All displays must remain within your assigned footprint. No audio exceeding 85 dB.'
                    ]
                },
                {
                    title: 'Electrical & Technical',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Basic booth inclusions provide standard drops. High-speed wired internet and dedicated WiFi access must be secured prior to the event. All equipment must be UL-listed.
                        </p>
                    ),
                    pdfContent: [
                        'Basic booth inclusions provide standard drops. High-speed wired internet and dedicated WiFi access must be secured prior to the event. All equipment must be UL-listed.'
                    ]
                },
                {
                    title: 'Shipping & Materials',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Advance shipments are recommended to the unified warehouse. Direct-to-show shipments are only accepted during loading dock hours. All shipments must be labeled with the booth number and company name.
                        </p>
                    ),
                    pdfContent: [
                        'Advance shipments are recommended to the unified warehouse. Direct-to-show shipments are only accepted during loading dock hours. All shipments must be labeled with the booth number and company name.'
                    ]
                }
            ]
        },
        {
            id: 3,
            title: 'Floor Plan',
            size: '1.8 MB',
            format: "PDF",
            sections: [
                {
                    title: 'Your Booth Location',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Details regarding your assigned booth zone, structural dimensions, and proximity to major aisles or features like the Main Entrance.
                        </p>
                    ),
                    pdfContent: [
                        'Details regarding your assigned booth zone, structural dimensions, and proximity to major aisles or features like the Main Entrance.'
                    ]
                },
                {
                    title: 'Adjacent Booths',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            An overview of neighboring booth allocations and standard 10-foot aisle separations.
                        </p>
                    ),
                    pdfContent: [
                        'An overview of neighboring booth allocations and standard 10-foot aisle separations.'
                    ]
                },
                {
                    title: 'Hall Layout Overview',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Premium Island Zones (Zone A)</li>
                            <li>Corner and Standard Booths (Zones B & C)</li>
                            <li>Startup Pavilions (Zone D)</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Premium Island Zones (Zone A)',
                        '• Corner and Standard Booths (Zones B & C)',
                        '• Startup Pavilions (Zone D)'
                    ]
                },
                {
                    title: 'Parking & Access',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Exhibitor parking rates and designated loading dock operating hours. Includes public transit details for attendee guidance.
                        </p>
                    ),
                    pdfContent: [
                        'Exhibitor parking rates and designated loading dock operating hours. Includes public transit details for attendee guidance.'
                    ]
                },
                {
                    title: 'Emergency Exits',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Familiarize yourself with primary, secondary, and tertiary emergency exits. Do not use elevators during emergencies; assembly points are located exteriorly.
                        </p>
                    ),
                    pdfContent: [
                        'Familiarize yourself with primary, secondary, and tertiary emergency exits. Do not use elevators during emergencies; assembly points are located exteriorly.'
                    ]
                }
            ]
        },
        {
            id: 4,
            title: 'Setup Guidelines',
            size: '3.2 MB',
            format: "PDF",
            sections: [
                {
                    title: 'Setup Schedule',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Premium island exhibitors receive priority setup access. All setup must be completed prior to the final inspection deadline before the hall opens.
                        </p>
                    ),
                    pdfContent: [
                        'Premium island exhibitors receive priority setup access. All setup must be completed prior to the final inspection deadline before the hall opens.'
                    ]
                },
                {
                    title: 'What to Bring for Setup',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Basic toolkits and power extension cords</li>
                            <li>Carpet tape and ladders</li>
                            <li>Company signage and promotional materials</li>
                            <li>Lead capture devices</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Basic toolkits and power extension cords',
                        '• Carpet tape and ladders',
                        '• Company signage and promotional materials',
                        '• Lead capture devices'
                    ]
                },
                {
                    title: 'Height & Display Restrictions',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Maximum structure heights apply. Hanging signs require prior management approval. Open flames, live animals, and unsecured helium balloons are strictly prohibited.
                        </p>
                    ),
                    pdfContent: [
                        'Maximum structure heights apply. Hanging signs require prior management approval. Open flames, live animals, and unsecured helium balloons are strictly prohibited.'
                    ]
                },
                {
                    title: 'Cable Management',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            All cables must be properly managed to ensure attendee safety. Floor cables must be covered and taped down. No cables may cross public aisles.
                        </p>
                    ),
                    pdfContent: [
                        'All cables must be properly managed to ensure attendee safety. Floor cables must be covered and taped down. No cables may cross public aisles.'
                    ]
                },
                {
                    title: 'Teardown Schedule',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Exhibits must remain intact until the official exhibition close. All materials must be removed or staged for freight pickup within the designated windows. Late teardowns result in escorted material removal at exhibitor expense.
                        </p>
                    ),
                    pdfContent: [
                        'Exhibits must remain intact until the official exhibition close. All materials must be removed or staged for freight pickup within the designated windows. Late teardowns result in escorted material removal at exhibitor expense.'
                    ]
                }
            ]
        },
        {
            id: 5,
            title: 'Official Invoice',
            size: '0.5 MB',
            format: "PDF",
            isInvoice: true,
            sections: [
                {
                    title: 'Invoice Details',
                    content: (
                        <div className="sd-invoice-summary">
                            <p className="small-body-text" style={{ marginBottom: '12px' }}>
                                This is your official invoice for Booth #{reservation.boothCode}.
                            </p>
                            <ul className="sd-list small-body-text text-secondary">
                                <li>Booth Price: ${(reservation.amount?.subtotal || 0).toLocaleString()}</li>
                                <li>Processing Fee: ${(reservation.amount?.fee || 0).toLocaleString()}</li>
                                <li>Tax: ${(reservation.amount?.tax || 0).toLocaleString()}</li>
                                <li><strong>Total Paid: ${(reservation.amount?.total || 0).toLocaleString()}</strong></li>
                            </ul>
                        </div>
                    ),
                    pdfContent: [
                        `Official Invoice for Booth #${reservation.boothCode}`,
                        `Event: ${reservation.event?.title}`,
                        `Confirmation: Booth-${reservation._id.toString().slice(-6).toUpperCase()}`,
                        '',
                        `• Booth Price: $${(reservation.amount?.subtotal || 0).toLocaleString()}`,
                        `• Processing Fee: $${(reservation.amount?.fee || 0).toLocaleString()}`,
                        `• Tax: $${(reservation.amount?.tax || 0).toLocaleString()}`,
                        `• Total Paid: $${(reservation.amount?.total || 0).toLocaleString()}`
                    ]
                }
            ]
        }
    ];

    const invoiceItem = {
        id: reservation._id,
        title: reservation.event?.title || 'Unknown Event',
        invoiceRef: `INV-${new Date(reservation.createdAt).getFullYear()}-${reservation._id.slice(-5).toUpperCase()}`,
        booth: `Booth ${reservation.boothCode || 'N/A'}`,
        issueDate: new Date(reservation.createdAt).toLocaleDateString(),
        dueDate: new Date(reservation.createdAt).toLocaleDateString(),
        paidDate: new Date(reservation.createdAt).toLocaleDateString(),
        companyName: billTo.companyName,
        companyAddress: billTo.address,
        taxId: billTo.taxId,
        items: [
            { description: `Booth Registration (${reservation.boothCode || ''})`, qty: 1, unitPrice: `$${(reservation.amount?.subtotal || 0).toLocaleString()}`, total: `$${(reservation.amount?.subtotal || 0).toLocaleString()}` },
            { description: 'Processing Fee', qty: 1, unitPrice: `$${(reservation.amount?.fee || 0).toLocaleString()}`, total: `$${(reservation.amount?.fee || 0).toLocaleString()}` },
            { description: 'Tax', qty: 1, unitPrice: `$${(reservation.amount?.tax || 0).toLocaleString()}`, total: `$${(reservation.amount?.tax || 0).toLocaleString()}` }
        ],
        subtotal: `$${(reservation.amount?.subtotal || 0).toLocaleString()}`,
        totalDue: `$${(reservation.amount?.total || 0).toLocaleString()}`,
        paymentMethod: reservation.paymentMethod === 'card' ? 'Credit Card' : 'Invoice'
    };

    const priceLevel = reservation.event?.priceLevels?.find(pl => pl._id === reservation.event?.booths?.find(b => b.code === reservation.boothCode)?.priceLevelId);

    return (
        <div className="booth-details-container">
            <div className="booth-details-header">
                <div className="booth-details-title-area">
                    <button className="booth-details-back-btn" onClick={() => navigate(-1)}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <div>
                        <h2>Booth #{reservation.boothCode}</h2>
                        <p className="regular-body-text text-secondary">{reservation.event?.title || 'Unknown Event'}</p>
                    </div>
                </div>
                <div className={`button-label booth-details-status ${reservation.status}`}>
                    {reservation.status === 'confirmed' ? 'Confirmed' : reservation.status}
                </div>
            </div>

            <div className="booth-details-layout">
                <div className="booth-details-main">
                    <div className="booth-details-cover">
                        <img
                            src={getImageUrl(reservation.event?.image)}
                            alt="Event Cover"
                            onError={(e) => { e.target.src = "/assets/eventbg.jpg"; }}
                        />
                        <div className="booth-details-cover-overlay">
                            <h3>{reservation.event?.title || 'Unknown Event'}</h3>
                            <div className="booth-details-cover-info">
                                <span><Icon icon="mdi:calendar-blank" width="16" /> {reservation.event?.startDate ? new Date(reservation.event.startDate).toLocaleDateString() : 'TBA'}</span>
                                <span><Icon icon="mdi:map-marker-outline" width="16" /> {reservation.event?.venue?.name || 'Venue TBA'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="booth-section">
                        <h4>Booth Details</h4>
                        <div className="booth-info-grid">
                            <div className="booth-info-item">
                                <span className="small-body-text text-secondary">Booth Type</span>
                                <h5>{reservation.boothCode}</h5>
                            </div>
                            <div className="booth-info-item">
                                <span className="small-body-text text-secondary">Dimensions</span>
                                <h5>{priceLevel?.boothSize || '10x10'}</h5>
                            </div>
                            <div className="booth-info-item">
                                <span className="small-body-text text-secondary">Confirmation Number</span>
                                <h5>Booth-{reservation._id.toString().slice(-6).toUpperCase()}</h5>
                            </div>
                            <div className="booth-info-item">
                                <span className="small-body-text text-secondary">Booking Date</span>
                                <h5>{new Date(reservation.createdAt).toLocaleDateString()}</h5>
                            </div>
                        </div>
                    </div>

                    <div className="booth-section">
                        <h4>Invoice Information</h4>
                        <div className="booth-invoice-content" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                            <div className="booth-bill-to" style={{ flex: '1', minWidth: '200px' }}>
                                <h5 className="text-black m-0 mb-8" style={{ marginBottom: '8px' }}>Bill To:</h5>
                                <p className="regular-body-text text-black m-0 font-medium" style={{ fontWeight: '500', marginBottom: '4px' }}>{billTo.companyName}</p>
                                <p className="small-body-text text-secondary m-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.4' }}>{billTo.address}</p>
                                <p className="small-body-text text-secondary m-0 mt-4" style={{ marginTop: '4px' }}>Tax ID: <span className="text-black">{billTo.taxId}</span></p>
                            </div>
                            <div className="booth-price-details" style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <h5 className="text-black m-0 mb-8" style={{ marginBottom: '8px' }}>Price Breakdown:</h5>
                                <div className="payment-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span className="small-body-text text-secondary">Booth Price:</span>
                                    <span className="small-body-text text-black">${(reservation.amount?.subtotal || 0).toLocaleString()}</span>
                                </div>
                                <div className="payment-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span className="small-body-text text-secondary">Processing Fee:</span>
                                    <span className="small-body-text text-black">${(reservation.amount?.fee || 0).toLocaleString()}</span>
                                </div>
                                <div className="payment-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span className="small-body-text text-secondary">Tax:</span>
                                    <span className="small-body-text text-black">${(reservation.amount?.tax || 0).toLocaleString()}</span>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--color-black-quaternary)', margin: '8px 0' }} />
                                <div className="payment-total-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h5 className="m-0 text-black">Total Paid:</h5>
                                    <h4 className="m-0 text-red">${(reservation.amount?.total || 0).toLocaleString()}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="booth-section">
                        <div className="booth-section-header">
                            <h4>Exhibitor Passes ({exhibitors.length}/6)</h4>
                            {reservation?.user?._id === user?._id && (
                                <button className="primary-button add-exhibitor-btn" onClick={() => setIsAddExhibitorModalOpen(true)}>
                                    <Icon icon="mdi:plus" width="18" /> Add Exhibitor
                                </button>
                            )}
                        </div>
                        <div className="exhibitors-list">
                            {exhibitors.map(ex => (
                                <div key={ex.id} className="exhibitor-card">
                                    <div className="exhibitor-avatar">{ex.initial}</div>
                                    <div className="exhibitor-info">
                                        <p className="exhibitor-name regular-body-text font-medium">{ex.name}</p>
                                        <p className="exhibitor-role small-body-text text-secondary">{ex.role}</p>
                                        <div className="exhibitor-contact">
                                            <span className="small-body-text text-secondary"><Icon icon="mdi:email-outline" /> {ex.email}</span>
                                        </div>
                                    </div>
                                    <div className="exhibitor-actions">
                                        {!ex.isOwner && reservation?.user?._id === user?._id && (
                                            <button className="icon-btn" onClick={async () => {
                                                const result = await showDeleteConfirmAlert("Remove Exhibitor?", `Are you sure you want to remove ${ex.name}?`);
                                                if (result.isConfirmed) {
                                                    try {
                                                        await axios.delete(`${BACKEND_URL}/api/reservations/${reservation._id}/exhibitors/${ex.id}`, {
                                                            headers: { Authorization: `Bearer ${user.token}` }
                                                        });
                                                        await showSuccessAlert("Removed", "Exhibitor has been removed successfully.");
                                                        fetchReservation();
                                                    } catch (error) {
                                                        console.error("Remove exhibitor error:", error);
                                                        alert("Failed to remove exhibitor.");
                                                    }
                                                }
                                            }}><Icon icon="mdi:trash-can-outline" width="20" /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="booth-section">
                        <h4>Documents & Resources</h4>
                        <div className="documents-list">
                            {documents.map(doc => (
                                <div key={doc.id} className="document-card">
                                    <div className="document-icon-wrapper">
                                        <Icon icon="mdi:file-document-outline" className="text-red" width="24" />
                                    </div>
                                    <div className="document-info">
                                        <p className="regular-body-text font-medium">{doc.title}</p>
                                        <p className="small-body-text text-secondary">PDF • {doc.size}</p>
                                    </div>
                                    <div className="document-actions">
                                        <button className="doc-action-btn" onClick={() => {
                                            if (doc.isInvoice) {
                                                setIsInvoiceReceiptModalOpen(true);
                                            } else {
                                                setSelectedDocument(doc);
                                                setIsDocumentModalOpen(true);
                                            }
                                        }}><Icon icon="mdi:eye-outline" width="18" /> View</button>
                                        <button className="doc-action-btn" onClick={() => doc.isInvoice ? exportInvoiceToPDF() : exportDocumentToPDF(doc)}><Icon icon="mdi:download-outline" width="18" /> Download</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="booth-details-sidebar">
                    <div className="booth-payment-summary">
                        <h4>Payment Summary</h4>
                        <div className="payment-row">
                            <span className="regular-body-text text-secondary">Booth Price</span>
                            <h5>${(reservation.amount?.subtotal || 0).toLocaleString()}</h5>
                        </div>
                        <div className="payment-row">
                            <span className="regular-body-text text-secondary">Processing Fee</span>
                            <h5>${(reservation.amount?.fee || 0).toLocaleString()}</h5>
                        </div>
                        <div className="payment-row">
                            <span className="regular-body-text text-secondary">Tax</span>
                            <h5>${(reservation.amount?.tax || 0).toLocaleString()}</h5>
                        </div>
                        <hr className="payment-divider" />
                        <div className="payment-total-row">
                            <h4>Total Paid</h4>
                            <h4 className="text-red">${(reservation.amount?.total || 0).toLocaleString()}</h4>
                        </div>

                        <div className="payment-actions">
                            <button className="outlined-button full-width-btn" onClick={handleEventDetails}>View Event Details</button>
                            <button className="outlined-button full-width-btn" onClick={exportInvoiceToPDF}><Icon icon="mdi:download-outline" width="18" /> Download Invoice</button>
                            {(reservation.user?._id === user?._id || reservation.user === user?._id) && (
                                <button className="primary-button cancel-reservation-btn" onClick={() => setIsRefundModalOpen(true)}>Request Refund</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <SponsorAddExhibitor
                isOpen={isAddExhibitorModalOpen}
                onClose={() => setIsAddExhibitorModalOpen(false)}
                reservationId={reservation._id}
                onSuccess={fetchReservation}
            />
            <SponsorDocuments
                isOpen={isDocumentModalOpen}
                onClose={() => setIsDocumentModalOpen(false)}
                document={selectedDocument}
                onDownload={() => exportDocumentToPDF(selectedDocument)}
            />
            <SponsorViewInvoiceReceipt
                isOpen={isInvoiceReceiptModalOpen}
                onClose={() => setIsInvoiceReceiptModalOpen(false)}
                invoiceItem={invoiceItem}
                onDownload={exportInvoiceToPDF}
            />
            <SponsorRequestRefund
                show={isRefundModalOpen}
                onClose={() => setIsRefundModalOpen(false)}
                boothData={reservation}
            />
        </div>
    );
}
