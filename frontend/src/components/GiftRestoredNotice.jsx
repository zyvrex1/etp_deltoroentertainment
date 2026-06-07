import React from 'react';
import { Icon } from '@iconify/react';
import { getGiftDisplayName, isRejectedOrRefundedPayment } from '../utils/giftNoticeUtils';
import './GiftRestoredNotice.css';

const GiftRestoredNotice = ({
    paymentStatus,
    appliedGift,
    giftCode,
    compact = false,
    className = '',
}) => {
    if (!isRejectedOrRefundedPayment(paymentStatus)) return null;
    if (!appliedGift && !giftCode) return null;

    const status = paymentStatus?.toLowerCase();
    const statusLabel = status === 'refunded' ? 'refunded' : 'rejected';
    const giftName = getGiftDisplayName(appliedGift, giftCode);

    return (
        <div className={`gift-restored-notice ${compact ? 'gift-restored-notice--compact' : ''} ${className}`.trim()}>
            <div>
                {!compact && (
                    <h6 className="m-0 mb-1">
                        Payment {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)} — Gift Returned
                    </h6>
                )}
                <p className="small-body-text m-0">
                    {compact ? (
                        <>
                            This payment was {statusLabel}. Your digital gift (
                            <strong>{giftName}</strong>
                            ) has been returned to your account and can be used on another transaction.
                        </>
                    ) : (
                        <>
                            This payment was {statusLabel}. The digital gift or promo used on this order (
                            <strong>{giftName}</strong>
                            ) has been returned to your account and is available for your next purchase.
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default GiftRestoredNotice;
