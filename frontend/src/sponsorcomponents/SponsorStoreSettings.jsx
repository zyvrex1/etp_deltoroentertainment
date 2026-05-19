import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuthContext } from '../hooks/useAuthContext';
import reservationService from '../services/reservationService';
import { showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import './SponsorStoreSettings.css';

const SponsorStoreSettings = ({ reservationId, boothCode }) => {
    const { user } = useAuthContext();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        description: '',
        logo: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user || !reservationId) return;

            try {
                const reservation = await reservationService.getReservationById(reservationId, user.token);
                const settings = reservation.storeSettings || {};
                
                setFormData({
                    companyName: settings.companyName || reservation.user?.companyName || `${reservation.user?.firstName || ''} ${reservation.user?.lastName || ''}`.trim(),
                    industry: settings.industry || reservation.user?.industry || '',
                    description: settings.description || '',
                    logo: null
                });

                if (settings.logo) {
                    setPreviewUrl(settings.logo.startsWith('/') ? settings.logo : `/uploads/${settings.logo}`);
                } else if (reservation.user?.avatar) {
                    setPreviewUrl(reservation.user.avatar.startsWith('/') ? reservation.user.avatar : `/uploads/${reservation.user.avatar}`);
                }

                // Determine if user is only an exhibitor (not the owner and not an admin)
                const ownerId = reservation.user?._id || reservation.user;
                const isOwner = ownerId === user?.id || ownerId === user?._id;
                const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
                setIsReadOnly(!isOwner && !isAdmin);
            } catch (error) {
                console.error("Error fetching reservation settings:", error);
            } finally {
                setIsFetching(false);
            }
        };

        fetchSettings();
    }, [user, reservationId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, logo: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.token || !reservationId) {
            showErrorAlert('Error', 'Missing session information. Please try refreshing the page.');
            return;
        }

        try {
            setIsLoading(true);
            const data = new FormData();
            data.append('companyName', formData.companyName);
            data.append('industry', formData.industry);
            data.append('description', formData.description);
            if (formData.logo) {
                data.append('avatar', formData.logo);
            }

            await reservationService.updateStoreSettings(reservationId, data, user.token);
            
            showSuccessAlert('Success!', 'Store profile for this booth updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            showErrorAlert('Error', error.response?.data?.error || 'Failed to update store profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="sponsor-store-settings-container">
            {/* Restored Banner */}
            <div className="spi-info-banner">
                <Icon icon="mdi:information-outline" className="spi-banner-icon" />
                <div className="spi-banner-content">
                    <h6>Walk-in / Pay On-Site Only</h6>
                    <p className="smaller-body-text">
                        All payments are processed on-site at your booth. This profile information will be displayed to customers browsing your store.
                    </p>
                </div>
            </div>

            <div className="sss-section-header">
                <h3>Store Profile Settings</h3>
                <p className="small-body-text">
                    {isReadOnly 
                        ? "View how your store appears to customers. Only the booth owner can edit these settings." 
                        : "Manage how your store appears to customers on the platform."}
                </p>
            </div>

            <div className="sss-main-layout">
                {/* Left Side: Settings Form */}
                <div className="sss-left-column">
                    <form className="sss-card sss-profile-card" onSubmit={handleSubmit}>
                        <h5>Store Information</h5>
                        <p className="smaller-body-text sss-desc">Basic details about your store.</p>

                        <div className="sss-form-grid">
                            {isFetching ? (
                                <>
                                    <div className="sss-form-group">
                                        <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                                        <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }}></div>
                                    </div>
                                    <div className="sss-form-group">
                                        <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
                                        <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }}></div>
                                    </div>
                                    <div className="sss-form-group full-width">
                                        <div className="skeleton skeleton-text" style={{ width: '30%' }}></div>
                                        <div className="skeleton" style={{ height: '100px', borderRadius: '8px' }}></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="sss-form-group">
                                        <label className="small-body-text">Store Name</label>
                                        <input 
                                            type="text" 
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleInputChange}
                                            placeholder="Enter store/company name"
                                            required
                                            className="small-body-text"
                                            disabled={isReadOnly}
                                        />
                                    </div>

                                    <div className="sss-form-group">
                                        <label className="small-body-text">Industry / Category</label>
                                        <input 
                                            type="text" 
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Food & Beverage, Tech, Art"
                                            className="small-body-text"
                                            disabled={isReadOnly}
                                        />
                                    </div>

                                    <div className="sss-form-group full-width">
                                        <label className="small-body-text">Store Description / Bio</label>
                                        <textarea 
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Tell customers about your store..."
                                            rows="4"
                                            className="small-body-text"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="sss-logo-section">
                            <label className="small-body-text">Store Logo</label>
                            <div className="sss-logo-upload">
                                <div className="sss-logo-preview">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Store Logo" onError={(e) => e.target.src = '/assets/eventbg.jpg'} />
                                    ) : (
                                        <div className="sss-logo-placeholder">
                                            <Icon icon="mdi:storefront-outline" />
                                        </div>
                                    )}
                                </div>
                                <div className="sss-logo-actions">
                                    {!isReadOnly && (
                                        <>
                                            <label htmlFor="logo-upload" className="outlined-button sss-upload-btn">
                                                <Icon icon="mdi:cloud-upload-outline" /> Change Logo
                                            </label>
                                            <input 
                                                id="logo-upload" 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleFileChange} 
                                                hidden 
                                            />
                                        </>
                                    )}
                                    <p className="smaller-body-text">Recommended: Square image, min 200x200px</p>
                                </div>
                            </div>
                        </div>

                        {!isReadOnly && (
                            <button type="submit" className="primary-button sss-save-button" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Profile Settings'}
                            </button>
                        )}
                    </form>

                    {/* Restored Payment Flow */}
                    <div className="spi-card spi-flow-card">
                        <h5>How the Payment Flow Works</h5>
                        <div className="spi-flow-steps">
                            <div className="spi-flow-step">
                                <div className="step-number step-1">1</div>
                                <div className="step-content">
                                    <h6>Customer Places Order</h6>
                                    <p className="small-body-text">Order is created with status Unpaid</p>
                                </div>
                            </div>
                            <div className="spi-flow-step">
                                <div className="step-number step-2">2</div>
                                <div className="step-content">
                                    <h6>Sponsor Prepares Order</h6>
                                    <p className="small-body-text">Food, drinks, or merch is prepared</p>
                                </div>
                            </div>
                            <div className="spi-flow-step">
                                <div className="step-number step-3">3</div>
                                <div className="step-content">
                                    <h6>Customer Arrives & Pays</h6>
                                    <p className="small-body-text">Payment collected via cash</p>
                                </div>
                            </div>
                            <div className="spi-flow-step">
                                <div className="step-number step-4">4</div>
                                <div className="step-content">
                                    <h6>Sponsor Marks as Paid</h6>
                                    <p className="small-body-text">Order updated to Paid, then Completed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Preview & Sidebar */}
                <div className="sss-right-column">
            <div className="sss-sidebar-card sss-preview-card">
                <div className="sss-sidebar-header">
                    <Icon icon="mdi:eye-outline" className="header-icon" />
                    <h6>Store Preview</h6>
                </div>
                
                <div className="sss-preview-container">
                    {isFetching ? (
                        <div className="csb-card sss-mock-card skeleton" style={{ minHeight: '350px' }}></div>
                    ) : (
                        <div className="csb-card sss-mock-card">
                            <div className="csb-card-image-wrap">
                                <img 
                                    src={previewUrl || '/assets/eventbg.jpg'} 
                                    alt="Preview" 
                                    onError={(e) => { e.target.src = '/assets/eventbg.jpg'; }}
                                />
                                <div className="csb-booth-badge button-label">{boothCode || 'N/A'}</div>
                            </div>
                            <div className="csb-card-details">
                                <h5 className="csb-company-name">{formData.companyName || 'Your Store Name'}</h5>
                                <div className="csb-card-info small-body-text">
                                    <Icon icon="mdi:domain" />
                                    <span>{formData.industry || 'Category'}</span>
                                </div>
                                <p className="csb-card-desc smaller-body-text">
                                    {formData.description || 'there is no description'}
                                </p>

                                <div className="csb-stats-row">
                                    <div className="csb-stat-item">
                                        <span className="smaller-body-text stat-label">Products</span>
                                        <span className="large-body-text stat-value">0</span>
                                    </div>
                                </div>

                                <button className="primary-button csb-visit-btn" disabled>
                                    Visit Store <Icon icon="mdi:arrow-right" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                <p className="smaller-body-text sidebar-desc notice-footer">
                    This is how your store card will appear to customers in the store directory.
                </p>
            </div>

                    {/* Restored Customer Notice */}
                    <div className="spi-sidebar-card">
                        <div className="spi-sidebar-header">
                            <Icon icon="mdi:map-marker-outline" className="header-icon" />
                            <h6>Customer Notice</h6>
                        </div>
                        <div className="spi-notice-bubble">
                            <p className="small-body-text">
                                <em>"This store accepts walk-in purchases only. We accept cash payments on-site only."</em>
                            </p>
                        </div>
                        <p className="smaller-body-text sidebar-desc notice-footer">
                            This message is displayed to customers when they browse your store.
                        </p>
                    </div>

                    {/* Restored Best Practices */}
                    <div className="spi-sidebar-card">
                        <div className="spi-sidebar-header">
                            <Icon icon="mdi:shield-check-outline" className="header-icon" />
                            <h6>Best Practices</h6>
                        </div>
                        <ul className="spi-best-practices">
                            <li className="small-body-text">Keep sufficient cash change available at your booth</li>
                            <li className="small-body-text">Mark orders as Paid immediately after receiving payment</li>
                            <li className="small-body-text">Use "Ready for Pickup" status to notify customers</li>
                        </ul>
                    </div>

                    {/* Restored Processing Fees */}
                    {/* <div className="spi-sidebar-card">
                        <div className="spi-sidebar-header">
                            <Icon icon="mdi:receipt-text-outline" className="header-icon" />
                            <h6>Processing Fees</h6>
                        </div>
                        <div className="spi-fees-box">
                            <h6>No online processing fees</h6>
                            <p className="smaller-body-text">Since all payments are handled on-site, there are no platform transaction fees.</p>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default SponsorStoreSettings;
