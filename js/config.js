/**
 * ResourceX – Global Configuration
 * Central place for all configuration constants.
 */

const CONFIG = {
  /** Application metadata */
  APP_NAME:    'ResourceX',
  APP_TAGLINE: 'One Campus. Every Resource.',
  APP_VERSION: '1.0.0-frontend',

  /**
   * API base URL – change this to point at your Java Spring Boot backend.
   * In demo mode this value is unused; all data comes from demo-data.js.
   */
  API_BASE_URL: 'http://localhost:8080/api',

  /**
   * Google OAuth 2.0 Client ID for Google Identity Services (GIS).
   * If left empty, an interactive Google account selector fallback is used for testing/demo.
   */
  GOOGLE_CLIENT_ID: '',

  /**
   * DEMO_MODE = true  → use local sample data (no backend required)
   * DEMO_MODE = false → use real REST API calls via api.js
   */
  DEMO_MODE: false,

  /** Simulated network delay in demo mode (ms) */
  DEMO_DELAY: 400,

  /** Pagination defaults */
  DEFAULT_PAGE_SIZE: 12,

  /** Auth storage keys (non-sensitive demo state only) */
  STORAGE_KEYS: {
    THEME:       'rx_theme',
    DEMO_USER:   'rx_demo_user',
    WISHLIST:    'rx_wishlist',
    DRAFT:       'rx_listing_draft',
  },

  /** Supported resource categories */
  CATEGORIES: [
    { id: 'books',       label: 'Books & Textbooks',       icon: 'book-open' },
    { id: 'electronics', label: 'Electronics & IoT',       icon: 'cpu' },
    { id: 'lab',         label: 'Laboratory Equipment',    icon: 'flask-conical' },
    { id: 'materials',   label: 'Project Materials',       icon: 'layers' },
    { id: 'notes',       label: 'Notes & PDFs',            icon: 'file-text' },
    { id: 'papers',      label: 'Question Papers',         icon: 'scroll' },
    { id: 'slides',      label: 'Presentations',           icon: 'presentation' },
    { id: 'manuals',     label: 'Lab Manuals',             icon: 'book-marked' },
  ],

  /** Exchange modes */
  EXCHANGE_MODES: [
    { id: 'free',   label: 'Free Share',  icon: 'gift' },
    { id: 'borrow', label: 'Borrow/Lend', icon: 'refresh-cw' },
    { id: 'sell',   label: 'Buy/Sell',    icon: 'shopping-cart' },
  ],

  /** Resource types */
  RESOURCE_TYPES: [
    { id: 'physical', label: 'Physical' },
    { id: 'digital',  label: 'Digital'  },
  ],

  /** Departments */
  DEPARTMENTS: [
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Information Technology',
    'Chemical Engineering',
    'Biotechnology',
    'Physics',
    'Mathematics',
    'Management Studies',
    'Other',
  ],

  /** Toast durations */
  TOAST_DURATION: 4000,
};

// Freeze to prevent accidental mutation
Object.freeze(CONFIG);

// Make available globally
window.CONFIG = CONFIG;
