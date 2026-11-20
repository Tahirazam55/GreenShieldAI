const fs = require('fs');
const path = require('path');
const CONFIG = require('../config');

// Ensure database directory exists
const dbDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;
let useFallback = false;
let memoryStore = [];

try {
  const Database = require('better-sqlite3');
  db = new Database(CONFIG.DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create table
  db.exec(`
    CREATE TABLE IF NOT EXISTS field_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      region_id TEXT NOT NULL,
      patch_id TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      detected_class TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      disturb_cause TEXT,
      notes TEXT,
      officer_name TEXT NOT NULL,
      photo_filename TEXT,
      confidence_rating INTEGER DEFAULT 5
    )
  `);

  console.log('[DB] SQLite database initialized at:', CONFIG.DB_PATH);
} catch (err) {
  console.warn('[DB] better-sqlite3 native addon unavailable, using JSON file fallback:', err.message);
  useFallback = true;
  const jsonPath = path.join(dbDir, 'verifications.json');
  if (fs.existsSync(jsonPath)) {
    try {
      memoryStore = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch {
      memoryStore = [];
    }
  }
}

function seedSampleData() {
  const current = getAllVerifications();
  if (current.length === 0) {
    const samples = [
      {
        region_id: 'swat',
        latitude: 35.1952,
        longitude: 72.5641,
        detected_class: 'Severe Disturbance / Cutting',
        verification_status: 'Confirmed Disturbance',
        disturb_cause: 'Illegal Logging / Tree Cutting',
        notes: 'Fresh stumps identified near logging access track. Estimated 18 mature deodar cedar trees felled.',
        officer_name: 'Sub-Divisional Forest Officer (SDFO) Swat',
        confidence_rating: 5
      },
      {
        region_id: 'swat',
        latitude: 35.2104,
        longitude: 72.5489,
        detected_class: 'Burn Scar / Fire',
        verification_status: 'Confirmed Disturbance',
        disturb_cause: 'Wildfire / Surface Burn',
        notes: 'Scorch marks on lower pine trunks, understory scrub burnt across 2.3 hectares.',
        officer_name: 'Range Forest Officer Kalam',
        confidence_rating: 5
      },
      {
        region_id: 'abbottabad',
        latitude: 34.0682,
        longitude: 73.3821,
        detected_class: 'Vegetation Decline',
        verification_status: 'False Alarm (Natural/Seasonal)',
        disturb_cause: 'Seasonal Needlecast / Mistletoe',
        notes: 'Crown thinning caused by heavy needlecast infestation, no intentional tree cutting observed.',
        officer_name: 'Galyat Forest Division Ranger',
        confidence_rating: 4
      },
      {
        region_id: 'mansehra',
        latitude: 34.6491,
        longitude: 73.4912,
        detected_class: 'Severe Disturbance / Cutting',
        verification_status: 'Confirmed Disturbance',
        disturb_cause: 'Landslide / Soil Slippage',
        notes: 'Gully erosion and soil slippage washed down slope following heavy monsoon rain.',
        officer_name: 'Kaghan Watershed Inspector',
        confidence_rating: 5
      },
      {
        region_id: 'dir_upper',
        latitude: 35.5312,
        longitude: 72.2145,
        detected_class: 'Regrowth',
        verification_status: 'Confirmed Disturbance',
        disturb_cause: 'Planted Saplings',
        notes: 'Billion Tree Afforestation Project (BTAP) plantation site showing thriving chir pine saplings.',
        officer_name: 'Dir Wildlife & Forest Guard',
        confidence_rating: 5
      }
    ];

    for (const s of samples) {
      addVerification(s);
    }
  }
}

function addVerification(record) {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  if (!useFallback && db) {
    const stmt = db.prepare(`
      INSERT INTO field_verifications (
        timestamp, region_id, patch_id, latitude, longitude,
        detected_class, verification_status, disturb_cause,
        notes, officer_name, photo_filename, confidence_rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      now,
      record.region_id || 'swat',
      record.patch_id || null,
      record.latitude,
      record.longitude,
      record.detected_class || 'Forest Loss',
      record.verification_status || 'Confirmed Disturbance',
      record.disturb_cause || 'Unspecified',
      record.notes || '',
      record.officer_name || 'Forest Ranger',
      record.photo_filename || null,
      record.confidence_rating || 5
    );
    return info.lastInsertRowid;
  } else {
    const id = memoryStore.length + 1;
    const newRecord = {
      id,
      timestamp: now,
      ...record
    };
    memoryStore.unshift(newRecord);
    try {
      fs.writeFileSync(path.join(dbDir, 'verifications.json'), JSON.stringify(memoryStore, null, 2));
    } catch {}
    return id;
  }
}

function getAllVerifications(regionId = null) {
  if (!useFallback && db) {
    let query = 'SELECT * FROM field_verifications';
    const params = [];
    if (regionId) {
      query += ' WHERE region_id = ?';
      params.push(regionId);
    }
    query += ' ORDER BY id DESC';
    return db.prepare(query).all(...params);
  } else {
    if (regionId) {
      return memoryStore.filter(r => r.region_id === regionId);
    }
    return memoryStore;
  }
}

// Seed on startup
seedSampleData();

module.exports = {
  addVerification,
  getAllVerifications,
  seedSampleData
};
