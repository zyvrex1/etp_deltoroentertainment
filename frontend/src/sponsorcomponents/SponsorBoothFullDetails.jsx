import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { useAuthContext } from '../hooks/useAuthContext';
import { showDeleteConfirmAlert, showSuccessAlert, showConfirmAlert } from '../utils/sweetAlert';
import SponsorAddExhibitor from './SponsorModal/SponsorAddExhibitor';
import SponsorDocuments from './SponsorModal/SponsorDocuments';
import SponsorViewInvoiceReceipt from './SponsorModal/SponsorViewInvoiceReceipt';
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

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Document Export', MARGIN, y);
            y += 10;

            doc.sections.forEach(sec => {
                if (y > pdfHeight - FOOTER_HEIGHT - 20) {
                    pdf.addPage();
                    addReportHeader(pdf, DOCUMENT_TITLE, logoData);
                    y = 45;
                }

                pdf.setFontSize(12);
                pdf.setTextColor(30, 60, 114);
                pdf.setFont('helvetica', 'bold');
                pdf.text(sec.title, MARGIN, y);
                y += 6;

                const sectionContent = sec.pdfContent && sec.pdfContent.length > 0
                    ? sec.pdfContent.join('\n')
                    : 'Please refer to the application portal for the full detailed content of this section.';

                y = drawLongText(pdf, y, sectionContent, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, logoData, DOCUMENT_TITLE);
                y += 8;
            });

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
            const MARGIN = 15;
            let y = 45;

            addReportHeader(pdf, INVOICE_TITLE, logoData);

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Invoice Details', MARGIN, y);
            y += 10;

            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Event: ${reservation.event?.title || 'Unknown Event'}`, MARGIN, y);
            y += 6;
            pdf.text(`Booth: ${reservation.boothCode}`, MARGIN, y);
            y += 6;
            pdf.text(`Confirmation Number: Booth-${reservation._id.toString().slice(-6).toUpperCase()}`, MARGIN, y);
            y += 6;
            pdf.text(`Booking Date: ${new Date(reservation.createdAt).toLocaleDateString()}`, MARGIN, y);
            y += 10;

            const headers = ['Description', 'Amount'];
            const rows = [
                ['Booth Price', `$${(reservation.amount?.subtotal || 0).toLocaleString()}`],
                ['Processing Fee', `$${(reservation.amount?.fee || 0).toLocaleString()}`],
                ['Tax', `$${(reservation.amount?.tax || 0).toLocaleString()}`],
                ['Total Paid', `$${(reservation.amount?.total || 0).toLocaleString()}`]
            ];
            y = drawTable(pdf, y, headers, rows, MARGIN, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 15, 12, 5, logoData, INVOICE_TITLE);

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
            <div className="booth-details-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Icon icon="line-md:loading-twotone-loop" width="48" />
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
                                <li>Organizer: Deltoro Entertainment Events LLC.</li>
                            </ul>
                        </div>
                    ),
                    pdfContent: [
                        'This Sponsorship Agreement ("Agreement") is entered into between:',
                        `• Sponsor: ${reservation.user?.companyName || (reservation.user?.firstName + ' ' + reservation.user?.lastName)}`,
                        '• Organizer: Deltoro Entertainment Events LLC.'
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
                            src={reservation.event?.image ?
                                (reservation.event.image.startsWith('http') ? reservation.event.image : `${BACKEND_URL}/uploads/${reservation.event.image}`)
                                : "/assets/eventbg.jpg"}
                            alt="Event Cover"
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
                                <button className="primary-button cancel-reservation-btn" onClick={() => {
                                    navigate('/sponsor/support', {
                                        state: {
                                            tab: 'Submit a Concern',
                                            prefill: { subject: 'Refund Booth', category: 'Billing & Payment', priority: 'High', event: reservation.event?.title }
                                        }
                                    });
                                }}>Request Refund</button>
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
        </div>
    );
}
