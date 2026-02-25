import { useState } from "react";
import { Icon } from "@iconify/react";
import "./PromoterPayoutMethodModal.css"

import {
    showSuccessAlert,
    showCancelConfirmAlert,
    showCreateConfirmAlert,
} from "../../admincomponents/utils/sweetAlert";

const PromoterPayoutMethodModal = ({ isOpen, onClose }) => {
    const [cardNumber, setCardNumber] = useState("");
    const [expiration, setExpiration] = useState("");
    const [cvc, setCvc] = useState("");
    const [cardholderName, setCardholderName] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await showCreateConfirmAlert(
            "Add Card?",
            "Are you sure you want to add this card?"
        );

        if (result.isConfirmed) {
            await showSuccessAlert("Success", "Card added successfully.");
            onClose();
        }
    };

    const handleClose = async () => {
        if (cardNumber || expiration || cvc || cardholderName) {
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
        <div className="po-general-modal-overlay">
            <div className="po-general-payout-modal-container">
                <div className="po-general-modal-header">
                    <h3>Add Payout Method</h3>
                    <button className="po-close-btn" onClick={handleClose}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <form className="payout-modal-body" onSubmit={handleSubmit}>
                    <div className="payout-form-group">
                        <h6>Card Number</h6>
                        <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="0000 0000 0000 0000"
                        />
                    </div>

                    <div className="payout-form-row">
                        <div className="payout-form-group">
                            <h6>Expiration</h6>
                            <input
                                type="text"
                                required
                                value={expiration}
                                onChange={(e) => setExpiration(e.target.value)}
                                placeholder="MM/YY"
                            />
                        </div>
                        <div className="payout-form-group">
                            <h6>CVC</h6>
                            <input
                                type="text"
                                required
                                value={cvc}
                                onChange={(e) => setCvc(e.target.value)}
                                placeholder="123"
                            />
                        </div>
                    </div>

                    <div className="payout-form-group">
                        <h6>Cardholder Name</h6>
                        <input
                            type="text"
                            required
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="payout-checkbox-group">
                        <input
                            type="checkbox"
                            id="setDefault"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                        />
                        <label htmlFor="setDefault" className="smaller-body-text">Set as default payment method</label>
                    </div>

                    <div className="general-modal-footer">
                        <button
                            type="button"
                            className="button cancel-btn"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="primary-button save-btn">
                            Add Card
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromoterPayoutMethodModal;
