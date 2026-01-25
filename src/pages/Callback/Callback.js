import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    retrieveOAuthState,
    clearOAuthState,
    storeAccessToken
} from '../../utils/oauth';
import { API_BASE_URL, OAUTH_REDIRECT_CALLBACK } from '../../config';
import './Callback.css';

const Callback = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);

    useEffect(() => {
        handleCallback();
    }, []);

    /**
     * Handle OAuth callback and exchange authorization code for access token
     */
    const handleCallback = async () => {
        try {
            // Parse URL parameters
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');
            const errorParam = params.get('error');
            const errorDescription = params.get('error_description');

            // Check for errors from authorization server
            if (errorParam) {
                throw new Error(errorDescription || errorParam);
            }

            // Validate required parameters
            if (!code) {
                throw new Error('Authorization code not received');
            }

            // Retrieve stored OAuth state
            const { codeVerifier, state: storedState } = retrieveOAuthState();

            // Validate state parameter (CSRF protection)
            if (!storedState || state !== storedState) {
                throw new Error('Invalid state parameter - possible CSRF attack');
            }

            // Validate code verifier exists
            if (!codeVerifier) {
                throw new Error('Code verifier not found');
            }

            // Exchange authorization code for access token
            await exchangeCodeForToken(code, codeVerifier);

            // Clear OAuth state from localStorage
            clearOAuthState();

            // Set success status
            setStatus('success');

            // Redirect to Job Tracker page after short delay
            setTimeout(() => {
                navigate('/job-tracker');
            }, 1500);

        } catch (err) {
            console.error('OAuth callback error:', err);
            setError(err.message || 'Authentication failed');
            setStatus('error');

            // Clear OAuth state on error
            clearOAuthState();
        }
    };

    /**
     * Exchange authorization code for access token
     * @param {string} code - Authorization code
     * @param {string} codeVerifier - PKCE code verifier
     */
    const exchangeCodeForToken = async (code, codeVerifier) => {
        const response = await fetch(`${API_BASE_URL}/v1/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                code_verifier: codeVerifier,
                redirect_uri: OAUTH_REDIRECT_CALLBACK
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error_description || 'Token exchange failed');
        }

        const tokenData = await response.json();

        if (!tokenData.access_token) {
            throw new Error('Access token not received');
        }

        // Store access token in localStorage
        storeAccessToken(tokenData.access_token);
    };

    return (
        <div className="callback-container">
            <div className="callback-card">
                {status === 'processing' && (
                    <>
                        <div className="callback-spinner"></div>
                        <h2 className="callback-title">Authenticating...</h2>
                        <p className="callback-message">Please wait while we verify your credentials.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="callback-success-icon">✓</div>
                        <h2 className="callback-title">Success!</h2>
                        <p className="callback-message">Redirecting to your dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="callback-error-icon">✗</div>
                        <h2 className="callback-title">Authentication Failed</h2>
                        <p className="callback-error-message">{error}</p>
                        <button
                            className="callback-retry-button"
                            onClick={() => navigate('/login')}
                        >
                            Return to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Callback;
