// API Configuration
// Create React App automatically loads .env files and makes REACT_APP_* variables
// available via process.env at build time
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const FRONTEND_BASE_URL = process.env.REACT_APP_FRONTEND_BASE_URL || 'http://localhost';
const OAUTH_REDIRECT_CALLBACK = process.env.REACT_APP_OAUTH_REDIRECT_CALLBACK || `${FRONTEND_BASE_URL}/callback`;
const TINYMCE_API_KEY = process.env.REACT_APP_TINYMCE_API_KEY || '';

export { API_BASE_URL, FRONTEND_BASE_URL, OAUTH_REDIRECT_CALLBACK, TINYMCE_API_KEY };
