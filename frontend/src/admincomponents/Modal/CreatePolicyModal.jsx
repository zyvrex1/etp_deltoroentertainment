import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.min.mjs';
import { showSuccessAlert, showCancelConfirmAlert, showErrorAlert, showCreateConfirmAlert } from "../../utils/sweetAlert";
import './ManagePolicyModal.css';

// 1. Import the local worker file using Vite's URL asset loader
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

// 2. Set the worker source directly to the local file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const CreatePolicyModal = ({
  isOpen,
  onClose,
  onSave,
  existingPolicies = [],
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [publishDate, setPublishDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const fileInputRef = useRef(null);

  const usedKeys = existingPolicies.map((p) => p.policyKey);
  const availableKeys = ["tos", "privacy", "refund", "cp", "guidelines", "sponsor"].filter(
    (key) => !usedKeys.includes(key),
  );

  // Only set initial policyKey once when modal opens
  const [policyKey, setPolicyKey] = useState(availableKeys[0] || "");

  useEffect(() => {
    if (isOpen) {
      setPolicyKey(availableKeys[0] || "");
    }
  }, [isOpen, availableKeys[0]]);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showErrorAlert("Error", "Please upload a valid PDF file.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullHtml = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Step 1: Group items into visual lines by Y coordinate
        let lines = [];
        let currentLine = null;
        for (const item of textContent.items) {
          const currentY = item.transform[5];
          const fontSize = Math.abs(item.transform[3]);
          const isBold = item.fontName && item.fontName.toLowerCase().includes('bold');
          const x = item.transform[4];

          if (!currentLine || Math.abs(currentY - currentLine.y) > 3) {
            if (currentLine) lines.push(currentLine);
            currentLine = { text: item.str, y: currentY, x: x, fontSize, isBold };
          } else {
            if (!currentLine.text.endsWith(" ") && !item.str.startsWith(" ")) {
              currentLine.text += " ";
            }
            currentLine.text += item.str;
            currentLine.fontSize = Math.max(currentLine.fontSize, fontSize);
            if (isBold) currentLine.isBold = true;
          }
        }
        if (currentLine) lines.push(currentLine);

        // Step 2: Sort top-to-bottom
        lines.sort((a, b) => b.y - a.y);

        // Step 3: Determine base font size (median) to identify headings
        const sizes = lines.map(l => l.fontSize).sort((a, b) => a - b);
        const baseSize = sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] : 12;

        // Determine the left margin (minimum x position) for indent detection
        const leftMargins = lines.map(l => l.x).filter(x => x > 0).sort((a, b) => a - b);
        const baseLeftMargin = leftMargins.length > 0 ? leftMargins[Math.floor(leftMargins.length * 0.1)] : 0;

        // Bullet / list item patterns
        const bulletCharRegex = /^[•●◦▪▸►◆○\-–—*]\s+/;
        const numberedRegex = /^\d+[\.\)]\s+/;
        const letteredRegex = /^[a-zA-Z][\.\)]\s+/;
        const romanRegex = /^(ix|iv|v?i{1,3}|xi{0,3})[\.\)]\s+/i;

        const isBulletLine = (text) =>
          bulletCharRegex.test(text) ||
          numberedRegex.test(text) ||
          letteredRegex.test(text) ||
          romanRegex.test(text);

        const stripBullet = (text) =>
          text
            .replace(bulletCharRegex, "")
            .replace(numberedRegex, "")
            .replace(letteredRegex, "")
            .replace(romanRegex, "")
            .trim();

        // Step 4: Build HTML
        let inList = false;
        let pText = "";
        let currentListItem = "";

        const flushP = () => {
          if (pText.trim()) {
            fullHtml += `<p>${pText.trim()}</p>\n\n`;
            pText = "";
          }
        };

        const flushListItem = () => {
          if (currentListItem.trim()) {
            fullHtml += `  <li>${currentListItem.trim()}</li>\n`;
            currentListItem = "";
          }
        };

        const closeList = () => {
          flushListItem();
          if (inList) {
            fullHtml += `</ul>\n\n`;
            inList = false;
          }
        };

        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];
          const text = line.text.trim();
          if (!text) continue;

          const prevLine = j > 0 ? lines[j - 1] : null;
          const gap = prevLine ? prevLine.y - line.y : 0;
          const isNewBlock = gap > line.fontSize * 1.5;
          const isIndented = line.x > baseLeftMargin + 10;

          const isHeading =
            line.fontSize > baseSize * 1.15 ||
            (line.isBold && line.fontSize > baseSize * 1.05);

          const isBullet = isBulletLine(text);

          // Continuation line: indented, not a new bullet, still in a list
          const isContinuation = inList && !isBullet && isIndented && !isNewBlock;

          if (isHeading) {
            flushP();
            closeList();
            fullHtml += `<h3>${text}</h3>\n\n`;
          } else if (isBullet) {
            flushP();
            if (!inList) {
              fullHtml += `<ul>\n`;
              inList = true;
            } else {
              flushListItem();
            }
            currentListItem = stripBullet(text);
          } else if (isContinuation) {
            // Append continuation text to current list item
            currentListItem += (currentListItem ? " " : "") + text;
          } else {
            closeList();
            if (isNewBlock) flushP();
            pText += (pText ? " " : "") + text;
          }
        }

        flushP();
        closeList();
      }

      setContent(fullHtml.trim());
      showSuccessAlert("Success", "PDF formatted as HTML successfully.");
    } catch (error) {
      console.error("Error extracting PDF:", error);
      showErrorAlert("Error", "Failed to extract text from PDF.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!policyKey) {
      showErrorAlert("Error", "All policy keys are already used");
      return;
    }

    const result = await showCreateConfirmAlert(
      "Add Policy?",
      `Are you sure you want to add the "${title}" policy?`
    );

    if (!result.isConfirmed) return;

    try {
      const newPolicy = { title, content, policyKey, publishDate };

      // Pass the policy object back to parent to handle save
      await onSave(newPolicy);

      onClose();
      showSuccessAlert(
        "Policy Added",
        "The policy has been added successfully.",
      );

      // Reset form
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Error adding policy:", error);
      showErrorAlert("Error", error.message);
    }
  };

  const handleCancel = async () => {
    const hasChanges = title || content;
    if (hasChanges) {
      const result = await showCancelConfirmAlert();
      if (result.isConfirmed) onClose();
    } else {
      onClose();
    }
  };

  const policyLabel = (key) =>
    key === "tos"
      ? "Terms of Service"
      : key === "privacy"
        ? "Privacy Policy"
        : "Refund Policy";

  const policyLabels = {
    tos: "Terms of Service",
    privacy: "Privacy Policy",
    refund: "Refund Policy",
    cp: "Cookie Policy",
    guidelines: "Event Guidelines",
    sponsor: "Sponsor Agreement"
  };

  const allKeys = ["tos", "privacy", "refund", "cp", "guidelines", "sponsor"];

  return (
    <div className="general-modal-overlay">
      <div className="general-announcement-modal-container">
        <div className="general-modal-header">
          <h3>Add New Policy</h3>
          <button type="button" className="close-btn" onClick={handleCancel}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="modal-body">
          <form className="create-announcement-form" onSubmit={handleSubmit}>
            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <h6>Policy Key</h6>
                {availableKeys.length === 0 ? (
                  <p>All policy keys are already used.</p>
                ) : (
                  <div className="modal-filter-dropdown" ref={dropdownRef}>
                    <button
                      type="button"
                      className="modal-filter-dropdown-btn"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className="modal-truncate-text">
                        {policyKey ? policyLabels[policyKey] : "Select Policy"}
                      </span>
                      <Icon
                        icon="mdi:chevron-down"
                        className={`modal-dropdown-icon ${isDropdownOpen ? "open" : ""}`}
                      />
                    </button>
                    {isDropdownOpen && (
                      <div className="modal-filter-dropdown-menu">
                        {allKeys.map((key) => {
                          const isUsed = existingPolicies.some((p) => p.policyKey === key);
                          return (
                            <button
                              type="button"
                              key={key}
                              className={`modal-filter-dropdown-item ${policyKey === key ? "active" : ""}`}
                              onClick={() => {
                                if (!isUsed) {
                                  setPolicyKey(key);
                                  setIsDropdownOpen(false);
                                }
                              }}
                              disabled={isUsed}
                              style={{ opacity: isUsed ? 0.5 : 1, cursor: isUsed ? 'not-allowed' : 'pointer' }}
                            >
                              {policyLabels[key]} {isUsed ? "(Already used)" : ""}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="announcement-form-group">
                <h6>Publish Date</h6>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="announcement-form-row" style={{ alignItems: "flex-end" }}>
              <div className="announcement-form-group">
                <h6>Policy Title</h6>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter policy title..."
                  required
                  disabled={availableKeys.length === 0}
                />
              </div>

              <div className="announcement-form-group" style={{ marginBottom: "0" }}>
                <button
                  type="button"
                  className="button cancel-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={availableKeys.length === 0}
                  style={{ padding: "0", height: "42px", fontSize: "0.9rem", display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid var(--color-black-tertiary)', borderRadius: '6px' }}
                >
                  <Icon icon="mdi:upload" style={{ marginRight: "0.5rem" }} />
                  Upload PDF
                </button>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            <div className="announcement-form-group">
              <h6>Policy Content</h6>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter policy details here..."
                required
                disabled={availableKeys.length === 0}
              ></textarea>
            </div>


            <div className="general-announcement-modal-footer">
              <button type="button" className="button cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button save-btn"
                disabled={availableKeys.length === 0}
              >
                Add Policy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePolicyModal;
