const express = require('express');
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

// Only allow STUDENT role
router.use(authMiddleware.restrictTo('STUDENT'));

router.post('/session', studentController.recordSession);
router.post('/session/quiz', studentController.updateQuizScore);
router.get('/dashboard', studentController.getStudentDashboard);
router.get('/dashboard/insights', studentController.getStudentInsights);

module.exports = router;
