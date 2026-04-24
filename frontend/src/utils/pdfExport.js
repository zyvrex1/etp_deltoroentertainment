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
            const res = await fetch(path);
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
                        img.src = reader.result;
                    };
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

