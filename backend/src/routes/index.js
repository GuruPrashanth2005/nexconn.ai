const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const facultyRoutes = require('./faculty.routes');
const studentRoutes = require('./student.routes');
const aiRoutes = require('./ai.routes');
const chemistryRoutes = require('./chemistry.routes');
const analyticsRoutes = require('./analytics.routes');
const nexconnRoutes = require('./nexconn.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'HydroLab 3D backend is alive and healthy.',
  });
});

router.use('/auth', authRoutes);
router.use('/faculty', facultyRoutes);
router.use('/student', studentRoutes);
router.use('/ai', aiRoutes);
router.use('/chemistry', chemistryRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/nexconn', nexconnRoutes);

module.exports = router;
