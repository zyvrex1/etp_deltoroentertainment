const express = require('express');
const router = express.Router();
const { getTopPerformingEvents, getOverviewStats, getDashboardReport } = require('../controllers/analyticsController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

router.use(requireAuth);
router.use(requireRole('admin', 'superadmin'));

router.get('/top-performing-events', getTopPerformingEvents);
router.get('/overview-stats', getOverviewStats);
router.get('/dashboard-report', getDashboardReport);

module.exports = router;
