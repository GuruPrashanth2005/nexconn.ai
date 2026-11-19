const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware.js');

// Student route: Log activity
router.post('/log', protect, analyticsController.logActivity);

// Faculty routes: View analytics
router.get('/faculty/overview', protect, restrictTo('FACULTY'), analyticsController.getFacultyOverview);
router.get('/faculty/feed', protect, restrictTo('FACULTY'), analyticsController.getGlobalFeed);
router.get('/faculty/student/:studentId', protect, restrictTo('FACULTY'), analyticsController.getStudentTimeline);
router.get('/faculty/student/:studentId/advanced', protect, restrictTo('FACULTY'), analyticsController.getStudentAdvancedAnalytics);

module.exports = router;
