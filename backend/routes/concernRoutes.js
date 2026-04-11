const express = require('express');
const concernController = require('../controllers/concernController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const concernUpload = require('../middleware/concernUpload');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Sponsor/Customer routes
router.post('/', requireRole('sponsor', 'customer'), concernUpload.array('attachments', 5), concernController.createConcern);
router.get('/sponsor', requireRole('sponsor'), concernController.getSponsorConcerns);

// Admin routes
router.get('/admin', requireRole('admin'), concernController.getAdminConcerns);
router.get('/admin/unread-count', requireRole('admin'), concernController.getAdminUnreadCount);
router.patch('/:id/status', requireRole('admin'), concernController.updateStatus);
router.patch('/:id/assign', requireRole('admin'), concernController.assignConcern);

// Internal Notes (Admin only)
router.post('/:id/notes', requireRole('admin'), concernController.addInternalNote);
router.patch('/:id/notes/:noteId', requireRole('admin'), concernController.updateInternalNote);
router.delete('/:id/notes/:noteId', requireRole('admin'), concernController.deleteInternalNote);

// Shared routes (requires auth)
router.get('/:id', concernController.getConcernById);
router.post('/:id/messages', concernUpload.array('attachments', 5), concernController.addMessage);

module.exports = router;
