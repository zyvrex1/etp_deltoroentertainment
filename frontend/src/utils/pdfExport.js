const MARGIN = 15;
const HEADER_HEIGHT = 35;
const FOOTER_HEIGHT = 15;

/**
 * Load logo as base64. Tries multiple paths.
 */
export async function loadLogo() {
    const paths = ['/logo/Logo1.png', '/logo/eTicketsProLogo.jpg', '/logo/eTicketsProLogo.png'];
    for (const path of paths) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const res = await fetch(path, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const blob = await res.blob();
                return await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const img = new Image();
                        img.onload = () => {
                            resolve({
                                data: reader.result,
                                width: img.width,
                                height: img.height
                            });
                        };
                        img.onerror = () => resolve(null);
                        img.src = reader.result;
                    };
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
            }
        } catch (e) {
            continue;
        }
    }
    return null;
}

/**
 * Add standard report header with logo and title
 */
export function addReportHeader(pdf, title, logoData) {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    if (logoData) {
        let finalLogoWidth = 32; // Default fallback
        let finalLogoHeight = 16; // Default fallback
        let finalLogoData = logoData;

        if (typeof logoData === 'object' && logoData.width && logoData.height) {
            const aspect = logoData.width / logoData.height;
            const targetHeight = 16;
            const maxWidth = 65; 

            // Start with target height
            finalLogoHeight = targetHeight;
            finalLogoWidth = targetHeight * aspect;

            // If still too wide, cap it and shrink height proportionally
            if (finalLogoWidth > maxWidth) {
                finalLogoWidth = maxWidth;
                finalLogoHeight = maxWidth / aspect;
            }
            
            finalLogoData = logoData.data;
        }

        const format = finalLogoData.includes('image/jpeg') || finalLogoData.includes('image/jpg') ? 'JPEG' : 'PNG';
        pdf.addImage(finalLogoData, format, MARGIN, 8, finalLogoWidth, finalLogoHeight);
    }
    pdf.setFontSize(20);
    pdf.setTextColor(30, 60, 114);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pdfWidth - MARGIN, 14, { align: 'right' });
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pdfWidth - MARGIN, 20, { align: 'right' });
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, HEADER_HEIGHT, pdfWidth - MARGIN, HEADER_HEIGHT);
}

/**
 * Add standard report footer
 */
export function addReportFooter(pdf, pageNum, totalPages) {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.text('eTickets pro - Your access to live events', MARGIN, pdfHeight - 6);
    pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidth - MARGIN, pdfHeight - 6, { align: 'right' });
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, pdfHeight - FOOTER_HEIGHT, pdfWidth - MARGIN, pdfHeight - FOOTER_HEIGHT);
}

/**
 * Utility to add footers to all pages after all content is drawn.
 * Use this at the end of PDF generation instead of calling addReportFooter manually.
 */
export function finalizeReport(pdf) {
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addReportFooter(pdf, i, totalPages);
    }
}

/**
 * Show loading toast
 */
export function showExportToast() {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #333; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
    toast.textContent = 'Generating PDF...';
    document.body.appendChild(toast);
    return toast;
}

/**
 * Remove loading toast
 */
export function removeExportToast(toast) {
    if (toast && document.body.contains(toast)) {
        document.body.removeChild(toast);
    }
}

/**
 * Draw a table in PDF
 * @param {jsPDF} pdf - The PDF document
 * @param {number} startY - Starting Y position
 * @param {Array} headers - Array of header strings
 * @param {Array} rows - Array of row arrays (each row is an array of cell strings)
 * @param {number} margin - Left/right margin
 * @param {number} pdfWidth - PDF width
 * @param {number} pdfHeight - PDF height
 * @param {number} footerHeight - Footer height for page break calculation
 * @param {number} customRowHeight - Base height for a row
 * @param {number} customPaddingY - Padding above text
 * @param {string} logoData - Optional logo for new pages
 * @param {string} title - Optional title for new pages
 * @returns {number} - Final Y position after table
 */
export function drawTable(pdf, startY, headers, rows, margin, pdfWidth, pdfHeight, footerHeight, customRowHeight = 10, customPaddingY = 3, logoData = null, title = null) {
    const colWidths = [];
    const totalWidth = pdfWidth - 2 * margin;
    const numCols = headers.length;

    // Calculate column widths (equal distribution)
    const colWidth = totalWidth / numCols;
    for (let i = 0; i < numCols; i++) {
        colWidths.push(colWidth);
    }

    let y = startY;
    const rowHeight = customRowHeight;
    const headerHeight = Math.max(10, customRowHeight + 4);

    // Helper function to draw table header
    const drawTableHeader = (currentY) => {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, currentY, totalWidth, headerHeight, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(30, 60, 114);
        pdf.setFont('helvetica', 'bold');
        
        let x = margin;
        headers.forEach((header, i) => {
            const textX = x + 3;
            const textY = currentY + headerHeight / 2 + 1;
            pdf.text(header, textX, textY, {
                align: 'left',
                maxWidth: colWidths[i] - 6,
            });
            x += colWidths[i];
        });

        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(margin, currentY + headerHeight, margin + totalWidth, currentY + headerHeight);
        return currentY + headerHeight + 2;
    };

    // Initial header draw
    y = drawTableHeader(y);

    // Draw rows
    pdf.setFontSize(8);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont('helvetica', 'normal');

    rows.forEach((row) => {
        // Calculate max cell height needed for this row
        let maxCellHeight = rowHeight;
        row.forEach((cell, i) => {
            const lines = pdf.splitTextToSize(cell || '', colWidths[i] - 4);
            const cellHeight = lines.length * 3.5 + (customRowHeight - 7);
            if (cellHeight > maxCellHeight) maxCellHeight = cellHeight;
        });

        // Check if we need a new page (with safety margin of 15mm from footer)
        if (y + maxCellHeight > pdfHeight - footerHeight - 15) {
            pdf.addPage();
            
            // Re-add report header if info is available
            if (logoData && title) {
                addReportHeader(pdf, title, logoData);
            }
            
            // Ensure we start below the report header
            const newY = HEADER_HEIGHT + 10;
            y = drawTableHeader(newY);
            
            // Set font back for row data
            pdf.setFontSize(8);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
        }

        // Draw cells
        let x = margin;
        row.forEach((cell, i) => {
            const lines = pdf.splitTextToSize(cell || '', colWidths[i] - 4);
            // Center text vertically in the calculated maxCellHeight if needed, 
            // but for now just use customPaddingY from the top of the row
            pdf.text(lines, x + 3, y + customPaddingY, { maxWidth: colWidths[i] - 4 });
            x += colWidths[i];
        });

        // Draw row bottom border
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.1);
        pdf.line(margin, y + maxCellHeight, margin + totalWidth, y + maxCellHeight);

        y += maxCellHeight;
    });

    return y;
}

/**
 * Draw a long block of text in PDF with automatic page breaks
 * @param {jsPDF} pdf - The PDF document
 * @param {number} startY - Starting Y position
 * @param {string} text - The text to draw
 * @param {number} margin - Left/right margin
 * @param {number} pdfWidth - PDF width
 * @param {number} pdfHeight - PDF height
 * @param {number} footerHeight - Footer height for page break calculation
 * @param {number} fontSize - Font size
 * @param {string} logoData - Optional logo for new pages
 * @param {string} title - Optional title for new pages
 * @returns {number} - Final Y position
 */
export function drawLongText(pdf, startY, text, margin, pdfWidth, pdfHeight, footerHeight, fontSize = 11, logoData = null, title = null) {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');

    const maxWidth = pdfWidth - 2 * margin;
    const lines = pdf.splitTextToSize(text || '', maxWidth);
    let y = startY;
    const lineHeight = fontSize * 0.5; // Roughly 0.5mm per pt

    lines.forEach((line) => {
        // Check if we need a new page
        if (y + lineHeight > pdfHeight - footerHeight - 15) {
            pdf.addPage();
            
            if (logoData && title) {
                addReportHeader(pdf, title, logoData);
            }
            
            y = HEADER_HEIGHT + 10;
            pdf.setFontSize(fontSize);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
        }

        pdf.text(line, margin, y);
        y += lineHeight;
    });

    return y;
}


/**
 * Generate a Payout Invoice PDF
 * @param {Object} pdfDeps - Dependencies: jsPDF class
 * @param {Object} payout - Payout data
 * @param {Array} events - List of all events (for titles)
 * @param {Array} salesData - List of all sales (for share calculation)
 * @param {Object} options - { shouldSave, logoData }
 * @returns {Promise<string|null>} - Blob URL if not saving, or null
 */
export async function generatePayoutInvoicePDF(jsPDF, payout, events, salesData, options = {}) {
  const { shouldSave = true } = options;
  const INVOICE_TITLE = "Payout Invoice Receipt";
  
  try {
    const logoData = options.logoData || await loadLogo();
    const doc = new jsPDF("p", "mm", "a4");
    const pdfWidth = doc.internal.pageSize.getWidth();
    let y = 45;

    addReportHeader(doc, INVOICE_TITLE, logoData);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date Requested: ${payout.requested || payout.date}`, MARGIN, y);
    y += 8;
    doc.text(`Status: ${payout.status}`, MARGIN, y);
    y += 8;
    doc.text(`Reference: ${payout.reference}`, MARGIN, y);
    y += 8;

    const methodText = payout.method || "Not Specified";
    doc.text(`Payout Method: ${methodText}`, MARGIN, y);
    y += 6;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");

    if (payout.methodDetails) {
      Object.entries(payout.methodDetails).forEach(([key, value]) => {
        if (value && key !== 'last4') {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          doc.text(`${formattedKey}: ${value}`, MARGIN + 5, y);
          y += 5;
        }
      });
      if (Object.keys(payout.methodDetails).length === 1 && payout.methodDetails.last4) {
        doc.text(`Details: ${payout.methodDetails.last4}`, MARGIN + 5, y);
        y += 5;
      }
    }
    y += 5;

    if (payout.status === 'reject' || payout.status === 'rejected') {
      doc.setFontSize(10);
      doc.setTextColor(200, 0, 0); // Red for rejection
      doc.setFont("helvetica", "bold");
      doc.text("Rejection Reason:", MARGIN, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      
      const reason = payout.rejectionReason || "No reason provided.";
      const lines = doc.splitTextToSize(reason, pdfWidth - 2 * MARGIN);
      doc.text(lines, MARGIN, y + 5);
      y += 10 + (lines.length * 5);
    }

    doc.setFontSize(12);
    doc.setTextColor(30, 60, 114);
    doc.setFont("helvetica", "bold");

    const hasSpecificEvents = payout.eventIds && payout.eventIds.length > 0;
    const targetEventIds = hasSpecificEvents
      ? (typeof payout.eventIds[0] === 'object' ? payout.eventIds.map(e => e._id) : payout.eventIds)
      : [...new Set(salesData.map(s => s.eventId))];

    // Determine Header Text
    const headerText = (hasSpecificEvents && targetEventIds.length === 1)
      ? events.find(e => e._id === targetEventIds[0])?.title || payout.eventIds[0]?.title || "Event Name"
      : (hasSpecificEvents ? "Event Name" : "All Events");

    doc.text(headerText, MARGIN, y);
    doc.text("Amount", pdfWidth - MARGIN - 30, y);
    y += 4;

    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, y, pdfWidth - MARGIN, y);
    y += 8;

    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");

    const totalRevenueAll = salesData
      .filter(s => targetEventIds.includes(s.eventId))
      .reduce((sum, s) => sum + (s.amount?.total || 0), 0);

    const formatCurrency = (val) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const amountNum = parseFloat(payout.amount?.toString().replace(/[$,]/g, '') || 0);

    targetEventIds.forEach((eventId) => {
      const event = events.find(e => e._id === eventId);
      const eventTitle = event ? event.title : "Unknown Event";
      
      const eventSales = salesData.filter(s => s.eventId === eventId);
      const eventTicketRev = eventSales.filter(s => s.type !== 'booth').reduce((sum, s) => sum + (s.amount?.total || 0), 0);
      const eventBoothRev = eventSales.filter(s => s.type === 'booth').reduce((sum, s) => sum + (s.amount?.total || 0), 0);
      const eventTotalRev = eventTicketRev + eventBoothRev;

      if (eventTotalRev > 0) {
        const eventPayoutShare = totalRevenueAll > 0 ? (eventTotalRev / totalRevenueAll) * amountNum : 0;
        const ticketShare = (eventTicketRev / eventTotalRev) * eventPayoutShare;
        const boothShare = (eventBoothRev / eventTotalRev) * eventPayoutShare;

        if (targetEventIds.length > 1 || !hasSpecificEvents) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 60, 114);
          doc.text(eventTitle, MARGIN, y);
          y += 8;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);
        }

        if (ticketShare > 0) {
          doc.text("Ticket Sales", (targetEventIds.length > 1 || !hasSpecificEvents) ? MARGIN + 5 : MARGIN, y);
          doc.text(formatCurrency(ticketShare), pdfWidth - MARGIN - 30, y);
          y += 8;
        }
        
        if (boothShare > 0) {
          doc.text("Booth Sales", (targetEventIds.length > 1 || !hasSpecificEvents) ? MARGIN + 5 : MARGIN, y);
          doc.text(formatCurrency(boothShare), pdfWidth - MARGIN - 30, y);
          y += 8;
        }
        
        if (targetEventIds.length > 1 || !hasSpecificEvents) {
          doc.setDrawColor(230, 230, 230);
          doc.line(MARGIN, y, pdfWidth - MARGIN, y);
          y += 8;
        }
      }
    });

    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, y, pdfWidth - MARGIN, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 60, 114);
    doc.text("Total:", MARGIN, y);
    doc.text(`${payout.amountStr || payout.amount}`, pdfWidth - MARGIN - 30, y);
    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for using our platform.", MARGIN, y);

    finalizeReport(doc);

    if (shouldSave) {
      doc.save(`Payout_Invoice_${(payout.requested || payout.date).replace(/, /g, "_").replace(/ /g, "_")}.pdf`);
      return null;
    } else {
      const blob = doc.output('blob');
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    throw error;
  }
}
