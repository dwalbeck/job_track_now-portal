/**
 * OAuth2 Authorization Code Flow with PKCE utilities
 */

/**
 * Base64 URL encode without padding
 * @param {Uint8Array} array - Array to encode
 * @returns {string} Base64 URL encoded string
 */
function base64URLEncode(array) {
    const base64 = btoa(String.fromCharCode.apply(null, array));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generate a cryptographically secure random code verifier
 * @returns {string} Code verifier string
 */
export function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64URLEncode(array);
}

/**
 * Generate code challenge from code verifier using SHA-256
 * @param {string} verifier - Code verifier string
 * @returns {Promise<string>} Code challenge string
 */
export async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64URLEncode(new Uint8Array(hash));
}

/**
 * Generate a random state parameter for CSRF protection
 * @returns {string} Random state string
 */
export function generateRandomState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return base64URLEncode(array);
}

/**
 * Store OAuth state in localStorage
 * @param {string} codeVerifier - Code verifier to store
 * @param {string} state - State parameter to store
 */
export function storeOAuthState(codeVerifier, state) {
    localStorage.setItem('oauth_code_verifier', codeVerifier);
    localStorage.setItem('oauth_state', state);
}

/**
 * Retrieve OAuth state from localStorage
 * @returns {Object} Object containing codeVerifier and state
 */
export function retrieveOAuthState() {
    return {
        codeVerifier: localStorage.getItem('oauth_code_verifier'),
        state: localStorage.getItem('oauth_state')
    };
}

/**
 * Clear OAuth state from localStorage
 */
export function clearOAuthState() {
    localStorage.removeItem('oauth_code_verifier');
    localStorage.removeItem('oauth_state');
}

/**
 * Store access token in localStorage
 * @param {string} token - Access token
 */
export function storeAccessToken(token) {
    localStorage.setItem('access_token', token);
}

/**
 * Retrieve access token from localStorage
 * @returns {string|null} Access token or null if not found
 */
export function getAccessToken() {
    return localStorage.getItem('access_token');
}

/**
 * Clear access token from localStorage
 */
export function clearAccessToken() {
    localStorage.removeItem('access_token');
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if access token exists
 */
export function isAuthenticated() {
    return !!getAccessToken();
}
