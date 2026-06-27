import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import "./AuthModal.css";

const AuthPolicyModal = ({ isOpen, onClose, item, type }) => {
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  return (
    <div className="auth-modal-overlay policy-modal-overlay">
      <div className="auth-modal-content policy-modal-content">
        <div className="auth-modal-header">
          <button className="auth-modal-close" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
          <h3 className="auth-modal-title">{item.title}</h3>
          <p className="auth-modal-subtitle small-body-text">
            {type === "tos" ? "Terms and Conditions of Use" : "Privacy and Data Protection Policy"}
          </p>
        </div>

        <div className="auth-modal-body policy-modal-body">
          <div className="policy-meta">
            <span className="policy-date">
              <Icon icon="mdi:clock-outline" /> Last updated: {item.date}
            </span>
          </div>

          <div className="policy-text-content">
            {item.content ? (
              item.content.includes("<p>") || item.content.includes("<h3>") || item.content.includes("<ul>") ? (
                <div
                  className="policy-html-content"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              ) : (
                item.content.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="policy-paragraph" style={{ whiteSpace: "pre-wrap" }}>
                    {paragraph}
                  </p>
                ))
              )
            ) : (
              <p className="no-content">No content available for this policy.</p>
            )}
          </div>
        </div>

        <div className="auth-footer" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", padding: "24px 32px" }}>
          <button
            className="auth-submit-btn btn-customer"
            onClick={onClose}
            style={{ marginTop: 0 }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPolicyModal;
