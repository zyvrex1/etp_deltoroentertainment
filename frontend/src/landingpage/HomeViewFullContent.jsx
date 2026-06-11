import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, showExportToast, removeExportToast, drawLongText, finalizeReport } from '../utils/pdfExport';
import './AuthModal.css';

const HomeViewFullContent = ({ isOpen, onClose, item, type }) => {
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
    const DOCUMENT_TITLE = type === 'announcement' ? 'Announcement' : 'Policy';
    try {
      const logoData = await loadLogo();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const FOOTER_HEIGHT = 15;
      let y = 45;

      addReportHeader(pdf, DOCUMENT_TITLE, logoData);

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
      
      y = drawLongText(pdf, y, item.content || '', margin, pdfWidth, pdfHeight, FOOTER_HEIGHT, 11, logoData, DOCUMENT_TITLE);

      finalizeReport(pdf);
      pdf.save(`${DOCUMENT_TITLE}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      removeExportToast(loadingToast);
    }
  };

  const isPolicy = type === 'policy';

  return (
    <div className="auth-modal-overlay policy-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content policy-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <button className="auth-modal-close" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
          <h3 className="auth-modal-title">{item.title}</h3>
          <p className="auth-modal-subtitle small-body-text">
            {isPolicy ? (
              item.key === "tos" ? "Terms and Conditions of Use" :
              item.key === "privacy" ? "Privacy and Data Protection Policy" :
              item.key === "refund" ? "Refund and Cancellation Policy" :
              item.key === "cp" ? "Cookie Policy" :
              item.key === "guidelines" ? "Community Guidelines" :
              item.key === "sponsor" ? "Sponsor Terms and Conditions" :
              "Platform Policy"
            ) : (
              `Platform Announcement - Category: ${item.type || 'General'}`
            )}
          </p>
        </div>

        <div className="auth-modal-body policy-modal-body">
          <div className="policy-meta">
            <span className="policy-date">
              <Icon icon={isPolicy ? "mdi:clock-outline" : "mdi:calendar-outline"} />
              {isPolicy ? `Last updated: ${item.date}` : `Posted: ${item.date}`}
            </span>
          </div>
          
          <div className="policy-text-content">
            {item.content ? (
              item.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="policy-paragraph">
                  {paragraph.split("\n").map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {line}
                      {lineIndex < paragraph.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              ))
            ) : (
              <p className="no-content">No content available.</p>
            )}

            {!isPolicy && (
              <div style={{ marginTop: "24px", color: "var(--color-white-tertiary)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="mdi:account-outline" /> Posted by System Admin
              </div>
            )}
          </div>
        </div>

        <div className="auth-footer" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", padding: "24px 32px" }}>
          <button 
            className="auth-submit-btn btn-customer" 
            onClick={downloadPDF}
            style={{ marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Icon icon="mdi:download-outline" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeViewFullContent;
