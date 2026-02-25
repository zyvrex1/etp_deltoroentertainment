import React, { useState } from "react";
import { Icon } from "@iconify/react";
import "./PromoterAddTicketTypeModal.css";

const PromoterAddTicketTypeModal = ({ isOpen, onClose, onAdd }) => {
    const [ticketName, setTicketName] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [description, setDescription] = useState("");
    const [salesStart, setSalesStart] = useState("");
    const [salesEnd, setSalesEnd] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onAdd) {
            onAdd({ ticketName, price, quantity, description, salesStart, salesEnd });
        }
        onClose();
    };

    return (
        <div className="promoter-add-ticket-modal-overlay">
            <div className="promoter-add-ticket-modal-container">
                <div className="promoter-add-ticket-modal-header">
                    <h3>Add Ticket Type</h3>
                    <button type="button" className="promoter-add-ticket-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <form className="promoter-add-ticket-modal-body promoter-add-ticket-form" onSubmit={handleSubmit}>
                    <div className="promoter-add-ticket-form-group promoter-add-ticket-full-width">
                        <h6>Ticket Name</h6>
                        <input
                            type="text"
                            required
                            value={ticketName}
                            onChange={(e) => setTicketName(e.target.value)}
                            placeholder="e.g. VIP Admission"
                        />
                    </div>

                    <div className="promoter-add-ticket-form-row">
                        <div className="promoter-add-ticket-form-group">
                            <h6>Price ($)</h6>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="promoter-add-ticket-form-group">
                            <h6>Quantity</h6>
                            <input
                                type="number"
                                required
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="100"
                            />
                        </div>
                    </div>

                    <div className="promoter-add-ticket-form-group promoter-add-ticket-full-width">
                        <h6>Description</h6>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's included with this ticket?"
                            rows="4"
                        ></textarea>
                    </div>

                    <div className="promoter-add-ticket-form-row">
                        <div className="promoter-add-ticket-form-group">
                            <h6>Sales Start</h6>
                            <input
                                type="date"
                                required
                                value={salesStart}
                                onChange={(e) => setSalesStart(e.target.value)}
                            />
                        </div>
                        <div className="promoter-add-ticket-form-group">
                            <h6>Sales End</h6>
                            <input
                                type="date"
                                required
                                value={salesEnd}
                                onChange={(e) => setSalesEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="promoter-add-ticket-modal-footer">
                        <button type="button" className="button promoter-add-ticket-cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-button promoter-add-ticket-save-btn">
                            Create Ticket
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromoterAddTicketTypeModal;
