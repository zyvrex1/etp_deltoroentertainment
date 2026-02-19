import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './ManagePricingModal.css';
import { showConfirmAlert, showSuccessAlert, showCancelConfirmAlert } from '../utils/sweetAlert';

const ManagePricingModal = ({ isOpen, onClose, type, onSave }) => {
    // Default data structure based on type
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // Initialize data based on type (Booth or Seat)
            // In a real app, this would likely come from props or an API call
            if (type === 'booth') {
                setItems([
                    {
                        id: 'vip-booth',
                        title: 'VIP Booth',
                        description: 'Premium location, larger space, high visibility.',
                        price: 5000,
                        quantity: 5,
                        badge: 'Premium',
                        badgeColor: 'purple'
                    },
                    {
                        id: 'corner-booth',
                        title: 'Corner Booth',
                        description: 'Corner positions with two open sides.',
                        price: 3000,
                        quantity: 10,
                        badge: 'Popular',
                        badgeColor: 'green'
                    },
                    {
                        id: 'inline-booth',
                        title: 'Inline Booth',
                        description: 'Standard inline positions.',
                        price: 2000,
                        quantity: 20,
                        badge: 'Standard',
                        badgeColor: 'gray'
                    }
                ]);
            } else {
                setItems([
                    {
                        id: 'vip-seats',
                        title: 'VIP Seats',
                        description: 'Front rows, premium view, exclusive access.',
                        price: 5000,
                        quantity: 5,
                        badge: 'Premium',
                        badgeColor: 'purple'
                    },
                    {
                        id: 'non-vip-seats',
                        title: 'Non-VIP Seats',
                        description: 'Standard seating area.',
                        price: 2000,
                        quantity: 20,
                        badge: 'Standard',
                        badgeColor: 'gray'
                    }
                ]);
            }
        }
    }, [isOpen, type]);

    const handleInputChange = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleSave = async () => {
        const result = await showConfirmAlert(
            'Save Pricing Changes?',
            `Are you sure you want to save these pricing changes for ${type === 'booth' ? 'booths' : 'seats'}? This will update the pricing for all items.`,
            'Yes, save changes',
            'Cancel'
        );

        if (result.isConfirmed) {
            try {
                if (onSave) {
                    onSave(items);
                }
                await showSuccessAlert('Pricing Updated', 'The pricing has been updated successfully.');
                onClose();
            } catch (error) {
                console.error('Error saving pricing:', error);
            }
        }
    };

    const handleCancel = async () => {
        const hasChanges = items.some(item => {
            // Check if any item has been modified from initial values
            // In a real app, you'd compare with original values
            return true; // For now, always show confirmation
        });

        if (hasChanges) {
            const result = await showCancelConfirmAlert();
            if (result.isConfirmed) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="general-modal-overlay">
            <div className="general-modal-container">
                <div className="general-modal-header">
                    <h3>{type === 'booth' ? 'Manage Booth Pricing & Inventory' : 'Manage Seats Pricing & Inventory'}</h3>
                    <button className="close-btn" onClick={handleCancel} aria-label="Close modal">
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="manage-pricing-modal-body">
                    {items.map((item) => (
                        <div key={item.id} className="pricing-item-card">
                            <div className="pricing-item-header">
                                <div className="pricing-item-info">
                                    <div className="pricing-title-row">
                                        <h5>{item.title}</h5>
                                        {item.badge && (
                                            <span className={`button-label ${item.badgeColor}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="small-body-text pricing-description">{item.description}</p>
                                </div>
                            </div>

                            <div className="pricing-inputs-row">
                                <div className="input-group">
                                    <h6 htmlFor={`price-${item.id}`}>Price ($)</h6>
                                    <div className="input-wrapper">
                                        <input
                                            id={`price-${item.id}`}
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => handleInputChange(item.id, 'price', e.target.value)}
                                            className="pricing-input"
                                        />
                                        <div className="input-controls">
                                            <button
                                                className="control-btn"
                                                onClick={() => handleInputChange(item.id, 'price', Number(item.price) + 100)}
                                            >
                                                <Icon icon="mdi:chevron-up" />
                                            </button>
                                            <button
                                                className="control-btn"
                                                onClick={() => handleInputChange(item.id, 'price', Math.max(0, Number(item.price) - 100))}
                                            >
                                                <Icon icon="mdi:chevron-down" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <h6 htmlFor={`quantity-${item.id}`}>Quantity</h6>
                                    <div className="input-wrapper">
                                        <input
                                            id={`quantity-${item.id}`}
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleInputChange(item.id, 'quantity', e.target.value)}
                                            className="pricing-input"
                                        />
                                        <div className="input-controls">
                                            <button
                                                className="control-btn"
                                                onClick={() => handleInputChange(item.id, 'quantity', Number(item.quantity) + 1)}
                                            >
                                                <Icon icon="mdi:chevron-up" />
                                            </button>
                                            <button
                                                className="control-btn entry-control"
                                                onClick={() => handleInputChange(item.id, 'quantity', Math.max(0, Number(item.quantity) - 1))}
                                            >
                                                <Icon icon="mdi:chevron-down" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="general-modal-footer">
                        <button className="button cancel-btn" onClick={handleCancel}>Cancel</button>
                        <button className="primary-button save-btn" onClick={handleSave}>Save Changes</button>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default ManagePricingModal;
