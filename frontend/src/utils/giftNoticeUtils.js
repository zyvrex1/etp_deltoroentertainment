export const isRejectedPayment = (paymentStatus) => {
    return paymentStatus?.toLowerCase() === 'rejected';
};

export const isRejectedOrRefundedPayment = (paymentStatus) => {
    const p = paymentStatus?.toLowerCase();
    return p === 'rejected' || p === 'refunded';
};

export const hasGiftOnOrder = (appliedGift, giftCode) => {
    return !!(appliedGift || giftCode);
};

export const getGiftDisplayName = (appliedGift, giftCode) => {
    if (appliedGift?.name) {
        return giftCode ? `${appliedGift.name} (${giftCode})` : appliedGift.name;
    }
    return giftCode || 'promo';
};

export const shouldShowGiftRestoredNotice = (paymentStatus, appliedGift, giftCode) => {
    return isRejectedPayment(paymentStatus) && hasGiftOnOrder(appliedGift, giftCode);
};
