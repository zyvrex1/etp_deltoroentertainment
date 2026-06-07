import React from 'react';
import { getGiftDisplayName, isRejectedPayment } from '../utils/giftNoticeUtils';
import './GiftRestoredNotice.css';

const GiftRestoredNotice = ({
    paymentStatus,
    appliedGift,
    giftCode,
    compact = false,
    className = '',
}) => {
    if (!isRejectedPayment(paymentStatus)) return null;
    if (!appliedGift && !giftCode) return null;

    const giftName = getGiftDisplayName(appliedGift, giftCode);

    return (
        <div className={`gift-restored-notice ${compact ? 'gift-restored-notice--compact' : ''} ${className}`.trim()}>
            <div>
                {!compact && (
                    <h6 className="m-0 mb-1">Payment Rejected — Gift Returned</h6>
                )}
                <p className="small-body-text m-0">
                    {compact ? (
                        <>
                            This payment was rejected. Your digital gift (
                            <strong>{giftName}</strong>
                            ) has been returned to your account and can be used on another transaction.
                        </>
                    ) : (
                        <>
                            This payment was rejected. The digital gift or promo used on this order (
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
