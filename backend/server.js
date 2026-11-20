const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const CONFIG = require('./config');
const { initGee, getGeeStatus } = require('./services/geeClient');
const apiRoutes = require('./routes/api');
const verifyRoutes = require('./routes/verify');
const reportRoutes = require('./routes/report');

const app = express();

// Security & Logging Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static Folders
app.use('/uploads', express.static(CONFIG.UPLOADS_DIR));
app.use('/cache', express.static(CONFIG.CACHE_DIR));
app.use('/api/cache', express.static(CONFIG.CACHE_DIR));

// Mount Routes
app.use('/api', apiRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/report', reportRoutes);

// Root Health Ping
app.get('/', (req, res) => {
  res.json({
    app: `${CONFIG.APP_NAME} Backend API`,
    tagline: CONFIG.TAGLINE,
    status: 'online',
    port: CONFIG.PORT,
    geeStatus: getGeeStatus()
  });
});

// Start Server & Initialize Earth Engine
async function startServer() {
  console.log('[Server] Connecting to Earth Engine...');
  const geeResult = await initGee();
  console.log('[Server] GEE Status:', geeResult.message);

  app.listen(CONFIG.PORT, () => {
    console.log('='.repeat(70));
    console.log(`🌲 ${CONFIG.APP_NAME} Backend listening on port ${CONFIG.PORT}`);
    console.log(`   API Health: http://localhost:${CONFIG.PORT}/api/health`);
    console.log(`   Mode: ${getGeeStatus().mode}`);
    console.log('='.repeat(70));
  });
}

startServer();

module.exports = app;
