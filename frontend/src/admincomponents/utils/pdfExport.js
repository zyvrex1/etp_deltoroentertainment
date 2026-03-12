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
                    reader.onloadend = () => resolve(reader.result);
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
        const logoHeight = 16;
        const logoWidth = 32; // 1:1 aspect ratio - not stretched
        const format = logoData.includes('image/jpeg') || logoData.includes('image/jpg') ? 'JPEG' : 'PNG';
        pdf.addImage(logoData, format, MARGIN, 8, logoWidth, logoHeight);
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
    pdf.text('eTickets pro - Your access to live events', MARGIN, pdfHeight - 6);
    pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidth - MARGIN, pdfHeight - 6, { align: 'right' });
    pdf.setDrawColor(220, 220, 220);
    pdf.line(MARGIN, pdfHeight - FOOTER_HEIGHT, pdfWidth - MARGIN, pdfHeight - FOOTER_HEIGHT);
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
 * @returns {number} - Final Y position after table
 */
export function drawTable(pdf, startY, headers, rows, margin, pdfWidth, pdfHeight, footerHeight, customRowHeight = 10, customPaddingY = 3) {
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

    // Draw header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y, totalWidth, headerHeight, 'F');

    // Header text styling
    pdf.setFontSize(9);
    pdf.setTextColor(30, 60, 114);
    pdf.setFont('helvetica', 'bold');

    // Vertically center header labels, left-aligned within each column
    let x = margin;
    headers.forEach((header, i) => {
        const textX = x + 3; // small left padding
        const textY = y + headerHeight / 2 + 1; // vertically centered with slight offset
        pdf.text(header, textX, textY, {
            align: 'left',
            maxWidth: colWidths[i] - 6,
        });
        x += colWidths[i];
    });

    y += headerHeight;

    // Draw header bottom border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + totalWidth, y);
    y += 2;

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

        // Check if we need a new page
        if (y + maxCellHeight > pdfHeight - footerHeight - 10) {
            pdf.addPage();
            // Redraw header on new page
            // Draw header on new page
            const newHeaderY = margin + 5;
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, newHeaderY, totalWidth, headerHeight, 'F');
            pdf.setFontSize(9);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            x = margin;
            headers.forEach((header, i) => {
                const textX = x + 3;
                const textY = newHeaderY + headerHeight / 2 + 1;
                pdf.text(header, textX, textY, {
                    align: 'left',
                    maxWidth: colWidths[i] - 6,
                });
                x += colWidths[i];
            });
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, newHeaderY + headerHeight, margin + totalWidth, newHeaderY + headerHeight);
            y = newHeaderY + headerHeight + 2;
            pdf.setFontSize(8);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
        }

        // Draw cells
        x = margin;
        row.forEach((cell, i) => {
            const lines = pdf.splitTextToSize(cell || '', colWidths[i] - 4);
            pdf.text(lines, x + 2, y + customPaddingY, { maxWidth: colWidths[i] - 4 });
            x += colWidths[i];
        });

        // Draw row bottom border
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.2);
        pdf.line(margin, y + maxCellHeight - 1, margin + totalWidth, y + maxCellHeight - 1);

        y += maxCellHeight;
    });

    return y;
}
