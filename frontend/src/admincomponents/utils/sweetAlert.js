import Swal from 'sweetalert2';

export const showSuccessAlert = (title, message) => {
    return Swal.fire({
        icon: 'success',
        title: title || 'Success!',
        text: message || 'Operation completed successfully.',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        timer: 2000,
        timerProgressBar: true
    });
};

export const showErrorAlert = (title, message) => {
    return Swal.fire({
        icon: 'error',
        title: title || 'Error!',
        text: message || 'Something went wrong.',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK'
    });
};

export const showWarningAlert = (title, message) => {
    return Swal.fire({
        icon: 'warning',
        title: title || 'Warning!',
        text: message || 'Please confirm your action.',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK'
    });
};

export const showConfirmAlert = (title, message, confirmText = 'Yes, proceed', cancelText = 'Cancel') => {
    return Swal.fire({
        title: title || 'Are you sure?',
        text: message || 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText
    });
};

export const showCreateConfirmAlert = (title = 'Create Item?', message = 'Are you sure you want to create this item?') => {
    return Swal.fire({
        title: title,
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, create it!',
        cancelButtonText: 'Cancel'
    });
};

export const showUpdateConfirmAlert = (title = 'Update Item?', message = 'Are you sure you want to update this item?') => {
    return Swal.fire({
        title: title,
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'Cancel'
    });
};

export const showDeleteConfirmAlert = (title, message) => {
    return Swal.fire({
        title: title || 'Delete Item?',
        text: message || 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });
};

export const showCancelConfirmAlert = () => {
    return Swal.fire({
        title: 'Cancel Changes?',
        text: 'You have unsaved changes. Are you sure you want to cancel?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, cancel',
        cancelButtonText: 'No, keep editing'
    });
};

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
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel'
    });
};

export const showRejectReasonAlert = () => {
    return Swal.fire({
        title: 'Reject Payment Request',
        input: 'textarea',
        inputLabel: 'Rejection Reason',
        inputPlaceholder: 'Please provide a reason for rejecting this payment request...',
        inputAttributes: {
            'aria-label': 'Rejection reason'
        },
        inputValidator: (value) => {
            if (!value || value.trim().length < 10) {
                return 'Please provide a reason (at least 10 characters)';
            }
        },
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel'
    });
};

export const showApproveConfirmAlert = (promoter, amount) => {
    return Swal.fire({
        title: 'Approve Payout?',
        text: `Are you sure you want to approve the payout request for ${promoter} (${amount})?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel'
    });
};

export const showRejectConfirmAlert = (promoter, amount) => {
    return Swal.fire({
        title: 'Reject Payout?',
        text: `Are you sure you want to reject the payout request for ${promoter} (${amount})?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, reject it!',
        cancelButtonText: 'Cancel'
    });
};
