import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast } from '../../admincomponents/utils/pdfExport';
import './PromoterViewFullAnnouncement.css';

const PromoterViewFullAnnouncement = ({ isOpen, onClose, item, type }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const downloadPDF = async () => {
    const loadingToast = showExportToast();
    try {
      const logoData = await loadLogo();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = 45;

      addReportHeader(pdf, type === 'announcement' ? 'Announcement' : 'Policy', logoData);

      pdf.setFontSize(14);
      pdf.setTextColor(30, 60, 114);
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.title || 'Document', margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont('helvetica', 'normal');
      if (item.date) {
        pdf.text(`Date: ${item.date}`, margin, y);
        y += 8;
      }
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      const contentLines = pdf.splitTextToSize(item.content || '', pdfWidth - 2 * margin);
      pdf.text(contentLines, margin, y);

      addReportFooter(pdf, 1, 1);
      pdf.save(`${type === 'announcement' ? 'Announcement' : 'Policy'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      removeExportToast(loadingToast);
    }
  };

  return (
    <div className="pvfa-modal-overlay" onClick={onClose}>
      <div className="pvfa-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="pvfa-modal-header">
          <h3>{item.title}</h3>
          <button className="pvfa-close-icon" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="pvfa-modal-body">
          {type === 'announcement' ? (
            <>
              <div className="pvfa-meta">
                <span className={`pa-badge button-label ${item.type?.toLowerCase() || 'info'}`}>
                  {item.type ? item.type.toUpperCase() : 'INFO'}
                </span>
                <span className="pvfa-date">
                  <Icon icon="mdi:calendar-outline" /> {item.date}
                </span>
              </div>
              <div className="pvfa-text-content">
                {item.content && item.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className="pvfa-author-info">
                <Icon icon="mdi:account-outline" /> Posted by System Admin
              </div>
            </>
          ) : (
            <>
              <div className="pvfa-meta">
                <span className="pvfa-effective-date">Effective: {item.date}</span>
              </div>
              <div className="pvfa-text-content policy-content">
                {item.content}
              </div>
            </>
          )}
        </div>

        <div className="pvfa-modal-footer">
          {type === 'announcement' ? (
            <button className="pvfa-btn-close" onClick={onClose}>
              Close
            </button>
          ) : (
            <div style={{display: 'flex', gap: '8px', marginLeft: 'auto'}}>
              <button className="pvfa-btn-close" onClick={onClose}>
                Close
              </button>
              <button className="outlined-button" onClick={downloadPDF} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Icon icon="mdi:download-outline" /> Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoterViewFullAnnouncement;
