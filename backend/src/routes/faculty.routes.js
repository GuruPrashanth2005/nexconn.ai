const express = require('express');
const facultyController = require('../controllers/faculty.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

// Only allow FACULTY role
router.use(authMiddleware.restrictTo('FACULTY'));

router
  .route('/students')
  .get(facultyController.getStudents)
  .post(facultyController.addStudent);

router.delete('/students/:id', facultyController.removeStudent);
router.get('/students/:id/sessions', facultyController.getStudentSessions);

router.get('/analytics', facultyController.getStudentAnalytics);

module.exports = router;
