import React, { useState } from 'react';
import { generateCodeVerifier, generateCodeChallenge, generateRandomState, storeOAuthState } from '../../utils/oauth';
import { API_BASE_URL, OAUTH_REDIRECT_CALLBACK } from '../../config';
import './Login.css';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Start OAuth2 Authorization Code Flow with PKCE
     */
    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            // Generate PKCE code verifier and challenge
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            const state = generateRandomState();

            // Store code verifier and state for later use
            storeOAuthState(codeVerifier, state);

            // Build authorization URL
            const params = new URLSearchParams({
                response_type: 'code',
                redirect_uri: OAUTH_REDIRECT_CALLBACK,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                state: state
            });

            // Redirect to authorization endpoint
            window.location.href = `${API_BASE_URL}/v1/authorize?${params}`;
        } catch (err) {
            console.error('Error starting OAuth flow:', err);
            setError('Failed to start login process. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Job Track Now</h1>
                <p className="login-subtitle">Track your job applications with ease</p>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <button
                    className="login-button"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? 'Starting login...' : 'Login'}
                </button>

                <p className="login-info">
                    Secure authentication using OAuth2 with PKCE
                </p>
            </div>
        </div>
    );
};

export default Login;
