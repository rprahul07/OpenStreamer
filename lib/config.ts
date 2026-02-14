// API Configuration
export const API_CONFIG = {
  // Base URL for API calls
  // Can be overridden by environment variable EXPO_PUBLIC_API_URL
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.220.38:5000',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
    },
    TRACKS: {
      GET_ALL: '/api/tracks',
      GET_BY_ID: '/api/tracks',
      GET_BY_USER: '/api/tracks/user',
      UPLOAD: '/api/tracks/upload',
      UPDATE_PLAY_COUNT: '/api/tracks',
    },
    PLAYLISTS: {
      GET_ALL: '/api/playlists',
      GET_BY_USER: '/api/playlists/user',
      GET_BY_ID: '/api/playlists',
      CREATE: '/api/playlists',
      GET_TRACKS: '/api/playlists',
    },
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
  
  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000,
  },
};

// Development/Production flags
export const IS_DEV = __DEV__;
export const IS_WEB = typeof window !== 'undefined' && window.document !== undefined;
