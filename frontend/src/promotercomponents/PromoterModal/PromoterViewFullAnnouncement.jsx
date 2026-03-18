import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
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
            <>
              <button className="pvfa-btn-close" onClick={onClose}>
                Close
              </button>
              <button className="pvfa-btn-download">
                <Icon icon="mdi:download-outline" /> Download PDF
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoterViewFullAnnouncement;
