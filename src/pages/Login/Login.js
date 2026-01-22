import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateCodeVerifier, generateCodeChallenge, generateRandomState, storeOAuthState } from '../../utils/oauth';
import { API_BASE_URL, OAUTH_REDIRECT_CALLBACK } from '../../config';
import apiService from '../../services/api';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [noUsersExist, setNoUsersExist] = useState(false);

    useEffect(() => {
        // Check if any users exist
        const checkUsers = async () => {
            try {
                const result = await apiService.checkUsersEmpty();
                setNoUsersExist(result && result.empty === true);
            } catch (err) {
                console.error('Error checking users:', err);
            }
        };
        checkUsers();
    }, []);

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

                {noUsersExist && (
                    <div className="login-create-account">
                        <p>No account yet?</p>
                        <button
                            className="create-account-button"
                            onClick={() => navigate('/settings/user')}
                        >
                            Create Account
                        </button>
                    </div>
                )}

                <p className="login-info">
                    Secure authentication using OAuth2 with PKCE
                </p>
            </div>
        </div>
    );
};

export default Login;
