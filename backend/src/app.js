const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const setupSecurity = require('./middlewares/security');
const globalErrorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');
const apiRoutes = require('./routes');

const app = express();

// 1. GLOBAL MIDDLEWARES
// Security configuration
setupSecurity(app);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Compression
app.use(compression());

// 2. ROUTES

// API routes
const predictRoutes = require('./routes/predict.routes');
app.use('/', predictRoutes);

app.use('/api/v1', apiRoutes);

// Static file serving for the SPA frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Catch-all route to serve the React SPA
app.use((req, res, next) => {
  // Only serve index.html for GET requests that aren't API calls
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
      if (err) {
        res.status(500).send('Frontend not built. Please run npm run build in frontend directory.');
      }
    });
  }
  next();
});

// Handle undefined API routes
app.use('/api', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3. GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
