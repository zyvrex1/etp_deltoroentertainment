import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './UploadMapModal.css';

const UploadMapModal = ({ isOpen, onClose, onSave }) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    if (!isOpen) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSave = () => {
        if (onSave && selectedFile) {
            onSave(selectedFile);
        }
        onClose();
    };

    return (
        <div className="upload-map-modal-overlay">
            <div className="upload-map-modal-container">
                <div className="upload-map-modal-header">
                    <h3>Upload Venue Map</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="upload-map-modal-body">
                    <div
                        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('map-upload-input').click()}
                    >
                        <input
                            id="map-upload-input"
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleChange}
                            style={{ display: 'none' }}
                        />

                        {selectedFile ? (
                            <div className="file-preview">
                                <Icon icon="mdi:file-image" width="48" height="48" className="preview-icon" />
                                <p className="file-name">{selectedFile.name}</p>
                                <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button
                                    className="remove-file-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="upload-placeholder">
                                <div className="icon-circle">
                                    <Icon icon="mdi:image-area" width="32" height="32" />
                                </div>
                                <p className="upload-title">Click to upload map image</p>
                                <p className="upload-subtitle">PNG, JPG up to 5MB</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="upload-map-modal-footer">
                    <button className="button cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="primary-button save-btn"
                        onClick={handleSave}
                        disabled={!selectedFile}
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadMapModal;
