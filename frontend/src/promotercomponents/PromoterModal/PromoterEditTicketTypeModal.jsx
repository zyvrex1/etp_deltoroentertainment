import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./PromoterEditTicketTypeModal.css";
import { showSuccessAlert, showCancelConfirmAlert, showCreateConfirmAlert } from "../../admincomponents/utils/sweetAlert";

const PromoterEditTicketTypeModal = ({ isOpen, onClose, onSave, initialTicket }) => {
    const [ticketName, setTicketName] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [description, setDescription] = useState("");
    const [salesStart, setSalesStart] = useState("");
    const [salesEnd, setSalesEnd] = useState("");

    useEffect(() => {
        if (initialTicket) {
            setTicketName(initialTicket.ticketName || "");
            setPrice(initialTicket.price || "");
            setQuantity(initialTicket.quantity || "");
            setDescription(initialTicket.description || "");
            setSalesStart(initialTicket.salesStart || "");
            setSalesEnd(initialTicket.salesEnd || "");
        }
    }, [initialTicket]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await showCreateConfirmAlert(
            "Update Ticket?",
            "Are you sure you want to update this ticket type?"
        );

        if (result.isConfirmed) {
            if (onSave) {
                onSave({ ...initialTicket, ticketName, price, quantity, description, salesStart, salesEnd });
            }
            await showSuccessAlert("Updated", "Ticket type updated successfully.");
            onClose();
        }
    };

    const handleCancel = async () => {
        const result = await showCancelConfirmAlert();
        if (result.isConfirmed) {
            onClose();
        }
    };

    return (
        <div className="promoter-edit-ticket-modal-overlay">
            <div className="promoter-edit-ticket-modal-container">
                <div className="promoter-edit-ticket-modal-header">
                    <h3>Edit Ticket Type</h3>
                    <button type="button" className="promoter-edit-ticket-close-btn" onClick={handleCancel}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <form className="promoter-edit-ticket-modal-body promoter-edit-ticket-form" onSubmit={handleSubmit}>
                    <div className="promoter-edit-ticket-form-group promoter-edit-ticket-full-width">
                        <h6>Ticket Name</h6>
                        <input
                            type="text"
                            required
                            value={ticketName}
                            onChange={(e) => setTicketName(e.target.value)}
                            placeholder="e.g. VIP Admission"
                        />
                    </div>

                    <div className="promoter-edit-ticket-form-row">
                        <div className="promoter-edit-ticket-form-group">
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
                        <div className="promoter-edit-ticket-form-group">
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

                    <div className="promoter-edit-ticket-form-group promoter-edit-ticket-full-width">
                        <h6>Description</h6>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's included with this ticket?"
                            rows="4"
                        ></textarea>
                    </div>

                    <div className="promoter-edit-ticket-form-row">
                        <div className="promoter-edit-ticket-form-group">
                            <h6>Sales Start</h6>
                            <input
                                type="date"
                                required
                                value={salesStart}
                                onChange={(e) => setSalesStart(e.target.value)}
                            />
                        </div>
                        <div className="promoter-edit-ticket-form-group">
                            <h6>Sales End</h6>
                            <input
                                type="date"
                                required
                                value={salesEnd}
                                onChange={(e) => setSalesEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="promoter-edit-ticket-modal-footer">
                        <button type="button" className="buutton promoter-edit-ticket-cancel-btn" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-button promoter-edit-ticket-save-btn">
                            Update Ticket
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromoterEditTicketTypeModal;
