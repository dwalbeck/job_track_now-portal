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
    // Debug: log token info when stored
    const payload = decodeJwtPayload(token);
    if (payload) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = payload.exp - now;
        console.log(`Token stored. iat=${payload.iat}, exp=${payload.exp}, now=${now}, expires in ${expiresIn} seconds (${Math.round(expiresIn/3600)} hours)`);
    }
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
 * Decode JWT token payload (without verification)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function decodeJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        // Decode base64url payload
        const payload = parts[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Failed to decode JWT:', e);
        return null;
    }
}

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired or invalid
 */
export function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) {
        console.warn('Token has no exp claim or could not be decoded');
        return true;
    }
    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    const now = Date.now();
    const isExpired = now >= expirationTime;

    if (isExpired) {
        const expiredAgo = Math.round((now - expirationTime) / 1000);
        console.warn(`Token expired ${expiredAgo} seconds ago. exp=${payload.exp}, now=${Math.floor(now/1000)}, iat=${payload.iat}`);
    }

    return isExpired;
}

/**
 * Check if user is authenticated with a valid, non-expired token
 * @returns {boolean} True if access token exists and is not expired
 */
export function isAuthenticated() {
    const token = getAccessToken();
    if (!token) {
        console.log('isAuthenticated: No token found');
        return false;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
        // Clear expired token
        console.log('isAuthenticated: Token is expired, clearing');
        clearAccessToken();
        return false;
    }

    return true;
}

/**
 * Get the current user's username from the JWT token
 * @returns {string|null} Username or null if not authenticated
 */
export function getCurrentUsername() {
    const token = getAccessToken();
    if (!token) {
        return null;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
        return null;
    }

    // The username is stored in 'preferred_username' or 'sub' claim
    return payload.preferred_username || payload.sub || null;
}

/**
 * Get the current user's ID from the JWT token
 * @returns {number|null} User ID or null if not authenticated
 */
export function getCurrentUserId() {
    const token = getAccessToken();
    if (!token) {
        return null;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
        return null;
    }

    return payload.user_id || null;
}

/**
 * Check if the current user is an admin
 * @returns {boolean} True if user is admin, false otherwise
 */
export function isCurrentUserAdmin() {
    const token = getAccessToken();
    if (!token) {
        return false;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
        return false;
    }

    return payload.is_admin === true;
}

/**
 * Get the current user's full name from the JWT token
 * @returns {string|null} Full name or null if not authenticated
 */
export function getCurrentUserFullName() {
    const token = getAccessToken();
    if (!token) {
        return null;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
        return null;
    }

    const firstName = payload.first_name || '';
    const lastName = payload.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || null;
}

/**
 * Get all user info from the JWT token
 * @returns {Object|null} Object with user_id, username, first_name, last_name, is_admin or null
 */
export function getCurrentUserInfo() {
    const token = getAccessToken();
    if (!token) {
        return null;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
        return null;
    }

    return {
        user_id: payload.user_id || null,
        username: payload.preferred_username || payload.sub || null,
        first_name: payload.first_name || null,
        last_name: payload.last_name || null,
        is_admin: payload.is_admin === true
    };
}
