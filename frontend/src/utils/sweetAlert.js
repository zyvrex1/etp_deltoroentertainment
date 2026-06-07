import Swal from 'sweetalert2';

// Toast configuration for top-right notifications
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    showCloseButton: true,
    customClass: {
        popup: 'swal2-toast-custom',
        closeButton: 'swal2-close'
    },
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

// Basic Success Toast
export const showSuccessAlert = (title, message) => {
    return Toast.fire({
        icon: 'success',
        title: message || title || 'Success!',
        customClass: {
            popup: 'swal2-toast-custom swal2-toast-success-custom',
            closeButton: 'swal2-close'
        }
    });
};

// Basic Error Toast
export const showErrorAlert = (title, message) => {
    return Toast.fire({
        icon: 'error',
        title: message || title || 'Something went wrong.',
        customClass: {
            popup: 'swal2-toast-custom swal2-toast-error-custom',
            closeButton: 'swal2-close'
        }
    });
};

// Loading toast (e.g. PDF export) — pair with closeLoadingToast()
export const showLoadingToast = (message = 'Generating PDF...') => {
    return Toast.fire({
        title: message,
        showConfirmButton: false,
        timer: undefined,
        timerProgressBar: false,
        didOpen: () => {
            Swal.showLoading();
        },
        customClass: {
            popup: 'swal2-toast-custom',
            closeButton: 'swal2-close'
        }
    });
};

export const closeLoadingToast = () => {
    Swal.close();
};

// Warning Alert (Toast)
export const showWarningAlert = (title, message) => {
    return Toast.fire({
        icon: 'warning',
        title: message || title || 'Warning!',
        customClass: {
            popup: 'swal2-toast-custom swal2-toast-error-custom',
            closeButton: 'swal2-close'
        }
    });
};


// Generic Confirmation Alert (Centred)
export const showConfirmAlert = (title, message, confirmText = 'Yes, proceed', cancelText = 'Cancel', isApproval = false) => {
    const bannerClass = isApproval ? 'confirm-banner-success' : 'confirm-banner-warning';
    const confirmButtonClass = isApproval ? 'swal2-confirm-green' : 'swal2-confirm-red';
    const icon = isApproval ?
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' :
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';

    return Swal.fire({
        title: title || 'Are you sure?',
        html: `
            <div class="${bannerClass}">
                ${icon}
                <span>${message || 'This action cannot be undone.'}</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: confirmButtonClass,
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Create Item Confirmation (Green)
export const showCreateConfirmAlert = (title = 'Create Item?', message = 'Are you sure you want to create this item?') => {
    return Swal.fire({
        title: title,
        html: `
            <div class="confirm-banner-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span>${message}</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, create it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-green',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Update Item Confirmation (Green)
export const showUpdateConfirmAlert = (title = 'Update Item?', message = 'Are you sure you want to update this item?') => {
    return Swal.fire({
        title: title,
        html: `
            <div class="confirm-banner-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>${message}</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-green',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Delete Item Confirmation (Red)
export const showDeleteConfirmAlert = (title = 'Delete Item?', message = 'This action cannot be undone.') => {
    return Swal.fire({
        title: title,
        html: `
            <div class="confirm-banner-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span>${message}</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Rejection/Cancel Confirmation (Red)
export const showCancelConfirmAlert = () => {
    return Swal.fire({
        title: 'Cancel Changes?',
        html: `
            <div class="confirm-banner-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                <span>You have unsaved changes. Are you sure you want to cancel?</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, cancel',
        cancelButtonText: 'No, keep editing',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Input Required (Generic)
export const showInputAlert = (title, inputLabel, inputPlaceholder = '', inputType = 'text') => {
    return Swal.fire({
        title: title || 'Input Required',
        input: inputType,
        inputLabel: inputLabel,
        inputPlaceholder: inputPlaceholder,
        inputValidator: (value) => {
            if (!value) {
                return 'This field is required!';
            }
        },
        showCancelButton: true,
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-green',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Reject Reason Alert (Destructive)
export const showRejectReasonAlert = () => {
    return Swal.fire({
        title: 'Reject Request',
        input: 'textarea',
        inputLabel: 'Rejection Reason',
        inputPlaceholder: 'Please provide a reason for rejecting...',
        inputAttributes: {
            'aria-label': 'Rejection reason'
        },
        inputValidator: (value) => {
            if (!value || value.trim().length < 5) {
                return 'Please provide a reason (at least 5 characters)';
            }
        },
        showCancelButton: true,
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Approve Confirmation (Success/Green)
export const showApproveConfirmAlert = (name, detail) => {
    return Swal.fire({
        title: 'Approve Submission?',
        html: `
            <div class="confirm-banner-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span>Are you sure you want to approve this for ${name} ${detail ? `(${detail})` : ''}?</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-green',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Reject Confirmation (Destructive/Red)
export const showRejectConfirmAlert = (name, detail) => {
    return Swal.fire({
        title: 'Reject Submission?',
        html: `
            <div class="confirm-banner-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                <span>Are you sure you want to reject this for ${name} ${detail ? `(${detail})` : ''}?</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, reject it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Logout Confirmation (Warning/Red)
export const showLogoutConfirmAlert = () => {
    return Swal.fire({
        title: 'Confirm Logout?',
        html: `
            <div class="confirm-banner-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                <span>Are you sure you want to logout?</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Logout',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Refund Confirmation (Red)
export const showRefundConfirmAlert = (orderId, amount) => {
    return Swal.fire({
        title: 'Confirm Refund?',
        html: `
            <div class="confirm-banner-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                <span>Are you sure you want to process a refund of ${amount} for order #${orderId}? This action will be recorded.</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Process Refund',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Generic Question Alert (Centred)
export const showQuestionAlert = (title, message, confirmText = 'Yes', cancelText = 'Cancel') => {
    return Swal.fire({
        title: title || 'Are you sure?',
        html: `
            <div class="confirm-banner-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span>${message}</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Generic Info Alert (Centred)
export const showInfoAlert = (title, message) => {
    return Swal.fire({
        title: title || 'Information',
        html: `
            <div class="confirm-banner-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>${message}</span>
            </div>
        `,
        confirmButtonText: 'OK',
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red'
        }
    });
};

// Add to Cart Confirmation
export const showAddToCartConfirmAlert = (count) => {
    return Swal.fire({
        title: 'Add to Cart?',
        html: `
            <div class="confirm-banner-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span>Are you sure you want to add ${count} ticket(s) to your cart?</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, add them',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Send Message Confirmation
export const showSendMessageConfirmAlert = () => {
    return Swal.fire({
        title: 'Send Message?',
        html: `
            <div class="confirm-banner-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                <span>Are you sure you want to send this message to our support team?</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, send it',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};

// Checkout Confirmation
export const showCheckoutConfirmAlert = (count) => {
    return Swal.fire({
        title: 'Proceed to Checkout?',
        html: `
            <div class="confirm-banner-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                <span>Are you sure you want to proceed to checkout with ${count} ticket(s)?</span>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, proceed',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-confirm-modal-custom',
            confirmButton: 'swal2-confirm-red',
            cancelButton: 'swal2-cancel-custom'
        }
    });
};