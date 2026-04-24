import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './PromoterUploadMapModal.css';
import { showConfirmAlert, showSuccessAlert, showCancelConfirmAlert } from '../../utils/sweetAlert';

const PromoterUploadMapModal = ({ isOpen, onClose, onSave }) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

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
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!selectedFile) return;

        const result = await showConfirmAlert(
            'Upload Map?',
            `Are you sure you want to upload "${selectedFile.name}"? This will replace the current map.`,
            'Yes, upload',
            'Cancel'
        );

        if (result.isConfirmed) {
            try {
                if (onSave) {
                    onSave(selectedFile);
                }
                await showSuccessAlert('Map Uploaded', 'The map has been uploaded successfully.');
                onClose();
            } catch (error) {
                console.error('Error uploading map:', error);
            }
        }
    };

    const handleCancel = async () => {
        if (selectedFile) {
            const result = await showCancelConfirmAlert();
            if (result.isConfirmed) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    return (
        <div className="promoter-upload-map-modal-overlay">
            <div className="promoter-upload-map-modal-container">
                <div className="promoter-upload-map-header">
                    <h3>Upload Venue Map</h3>
                    <button className="promoter-upload-map-close-btn" onClick={handleCancel}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="promoter-upload-map-body">
                    <div
                        className={`promoter-upload-map-area ${dragActive ? 'promoter-upload-map-drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('promoter-map-upload-input').click()}
                    >
                        <input
                            id="promoter-map-upload-input"
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleChange}
                            style={{ display: 'none' }}
                        />

                        {selectedFile ? (
                            <div className="promoter-upload-map-file-preview">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Map Preview" className="promoter-upload-map-preview-image" />
                                ) : (
                                    <Icon icon="mdi:file-image" width="48" height="48" className="promoter-upload-map-preview-icon" />
                                )}
                                <p className="promoter-upload-map-file-name">{selectedFile.name}</p>
                                <p className="promoter-upload-map-file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button
                                    className="promoter-upload-map-remove-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                        setPreviewUrl(null);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="promoter-upload-map-placeholder">
                                <div className="promoter-upload-map-icon-circle">
                                    <Icon icon="mdi:image-area" width="32" height="32" />
                                </div>
                                <p className="promoter-upload-map-upload-title">Click to upload map image</p>
                                <p className="promoter-upload-map-upload-subtitle">PNG, JPG up to 5MB</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="promoter-upload-map-footer">
                    <button className="promoter-upload-map-cancel-btn" onClick={handleCancel}>Cancel</button>
                    <button
                        className="promoter-upload-map-save-btn"
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

export default PromoterUploadMapModal;
