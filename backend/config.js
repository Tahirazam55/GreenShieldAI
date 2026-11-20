const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CONFIG = {
  APP_NAME: 'GreenShieldAI',
  TAGLINE: 'Predict. Detect. Protect.',
  PORT: process.env.PORT || 5000,
  GEE_PROJECT_ID: process.env.GEE_PROJECT_ID || '',
  GEE_KEY_PATH: process.env.GEE_KEY_PATH || path.join(__dirname, 'keys/gee-key.json'),
  GEE_API_KEY: process.env.GEE_API_KEY || 'AIzaSyCK-I9MDgaIGCFqTN1l7mVQyQIulxqL_Lg',
  DEFAULT_MODE: process.env.DEFAULT_MODE || 'DEMO',
  CACHE_DIR: path.join(__dirname, 'cache'),
  UPLOADS_DIR: path.join(__dirname, 'uploads'),
  DB_PATH: path.join(__dirname, 'data/verification.db'),

  START_YEAR: 2018,
  END_YEAR: 2026,
  AVAILABLE_YEARS: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  BASELINE_YEAR: 2018,
  PRESENT_YEAR: 2026,

  // Historical milestones for high-risk patch time-compare
  PAST_10_YEAR: 2016, // Landsat 8 OLI
  PAST_5_YEAR: 2021,  // Sentinel-2 L2A
  FUTURE_5_YEAR: 2031,
  FUTURE_10_YEAR: 2036,

  // Dry season for cloud-free median composites (June - September)
  DRY_SEASON_MONTHS: [6, 7, 8, 9],

  MAX_AREA_SQ_KM: 400.0,

  THRESHOLDS: {
    forest_loss_dndvi: -0.25,        // Severe canopy loss / probable cutting
    vegetation_decline_dndvi: -0.10, // Moderate drop
    recovery_dndvi: 0.15,            // Regeneration
    burn_scar_dnbr: 0.27,            // Fire damage threshold
    min_patch_hectares: 0.5,         // Ignore micro noise
    hansen_treecover_pct: 30
  },

  DISTURBANCE_CLASSES: {
    forest_loss: {
      id: 4,
      name: 'Severe Disturbance / Probable Cutting',
      shortLabel: 'Forest Loss',
      color: '#E63946',
      fillOpacity: 0.65,
      description: 'Potential disturbance requiring field verification: sharp canopy drop'
    },
    vegetation_decline: {
      id: 3,
      name: 'Vegetation Decline / Canopy Thinning',
      shortLabel: 'Vegetation Decline',
      color: '#F4A261',
      fillOpacity: 0.55,
      description: 'Gradual loss in leaf moisture or greenness index'
    },
    burn_scar: {
      id: 5,
      name: 'Burn Scar / Fire Disturbance',
      shortLabel: 'Burn Scar',
      color: '#3D1308',
      fillOpacity: 0.70,
      description: 'High dNBR burn severity and/or FIRMS thermal hotspot overlap'
    },
    regrowth: {
      id: 2,
      name: 'Regrowth / Canopy Recovery',
      shortLabel: 'Regrowth',
      color: '#2A9D8F',
      fillOpacity: 0.50,
      description: 'Positive vegetative trend / plantation succession'
    },
    stable_forest: {
      id: 1,
      name: 'Stable Forest Canopy',
      shortLabel: 'Stable Forest',
      color: '#2D6A4F',
      fillOpacity: 0.35,
      description: 'No significant spectral variance detected'
    }
  },

  RISK_LEVELS: {
    High: { color: '#D90429', threshold: 0.65 },
    Moderate: { color: '#F77F00', threshold: 0.35 },
    Low: { color: '#52B788', threshold: 0.0 }
  },

  PRESET_LOCATIONS: {
    swat: {
      id: 'swat',
      name: 'Swat (Miandam / Kalam)',
      district: 'Swat',
      description: 'High-altitude coniferous and mixed forest valley with intensive tourist pressure and timber value.',
      center: [35.20, 72.56],
      bbox: [72.50, 35.15, 72.62, 35.25], // [min_lon, min_lat, max_lon, max_lat]
      zoom: 13,
      forestType: 'Himalayan Moist Temperate Forest'
    },
    abbottabad: {
      id: 'abbottabad',
      name: 'Abbottabad / Galyat (Nathia Gali)',
      district: 'Abbottabad',
      description: 'Dense moist temperate pine forests under significant tourism and urban expansion pressure.',
      center: [34.07, 73.38],
      bbox: [73.33, 34.02, 73.43, 34.12],
      zoom: 13,
      forestType: 'Himalayan Moist Temperate Forest'
    },
    dir_upper: {
      id: 'dir_upper',
      name: 'Upper Dir (Kumrat Valley)',
      district: 'Upper Dir',
      description: 'Pristine deodar cedar and spruce riverine valley experiencing rapid ecotourism growth.',
      center: [35.53, 72.21],
      bbox: [72.15, 35.48, 72.27, 35.58],
      zoom: 13,
      forestType: 'Sub-alpine & Coniferous Forest'
    },
    chitral: {
      id: 'chitral',
      name: 'Chitral (Chitral Gol National Park)',
      district: 'Chitral',
      description: 'Dry temperate oak, juniper, and cedar forest providing critical Markhor wildlife habitat.',
      center: [35.90, 71.73],
      bbox: [71.68, 35.85, 71.78, 35.95],
      zoom: 13,
      forestType: 'Dry Temperate Coniferous / Oak'
    },
    kohistan: {
      id: 'kohistan',
      name: 'Kohistan (Dassu / Pattan Valleys)',
      district: 'Kohistan',
      description: 'Steep Indus gorge watershed forests vulnerable to landslides, road construction, and logging.',
      center: [35.25, 73.21],
      bbox: [73.15, 35.20, 73.27, 35.30],
      zoom: 13,
      forestType: 'Himalayan Dry Temperate / Pine'
    },
    mansehra: {
      id: 'mansehra',
      name: 'Mansehra (Shogran / Kaghan)',
      district: 'Mansehra',
      description: 'Scenic sub-alpine spruce, fir, and pine stands bordering alpine meadows in Kaghan Valley.',
      center: [34.65, 73.49],
      bbox: [73.43, 34.60, 73.55, 34.70],
      zoom: 13,
      forestType: 'Himalayan Moist Temperate'
    }
  },

  DISCLAIMER_TEXT: 'NOTICE: Detections represent potential disturbance requiring field verification. Earth observation algorithms detect spectral variance that may result from natural mortality, snow damage, landslides, or seasonal thinning in addition to anthropogenic cutting.'
};

module.exports = CONFIG;
