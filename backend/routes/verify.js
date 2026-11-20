/**
 * Field Verification & Ground Truth Routes
 * Handles ranger reports, photo evidence upload, and SQLite storage.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CONFIG = require('../config');
const { addVerification, getAllVerifications } = require('../db/database');

// Ensure uploads directory exists
if (!fs.existsSync(CONFIG.UPLOADS_DIR)) {
  fs.mkdirSync(CONFIG.UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CONFIG.UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `verify_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// GET /api/verify
router.get('/', (req, res) => {
  const { regionId } = req.query;
  const logs = getAllVerifications(regionId);
  res.json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// POST /api/verify
router.post('/', upload.single('photo'), (req, res) => {
  try {
    const {
      region_id,
      patch_id,
      latitude,
      longitude,
      detected_class,
      verification_status,
      disturb_cause,
      notes,
      officer_name,
      confidence_rating
    } = req.body;

    const photo_filename = req.file ? req.file.filename : null;

    const recordId = addVerification({
      region_id: region_id || 'swat',
      patch_id: patch_id || null,
      latitude: parseFloat(latitude) || 35.20,
      longitude: parseFloat(longitude) || 72.56,
      detected_class: detected_class || 'Forest Loss',
      verification_status: verification_status || 'Confirmed Disturbance',
      disturb_cause: disturb_cause || 'Illegal Logging / Tree Cutting',
      notes: notes || '',
      officer_name: officer_name || 'Forest Ranger',
      photo_filename,
      confidence_rating: parseInt(confidence_rating, 10) || 5
    });

    res.json({
      success: true,
      id: recordId,
      message: 'Field verification log saved successfully to SQLite database'
    });
  } catch (err) {
    console.error('[Verify] Error logging verification:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
