import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, clearAccessToken, getCurrentUserFullName, isCurrentUserAdmin } from '../../utils/oauth';
import { generateCodeVerifier, generateCodeChallenge, generateRandomState, storeOAuthState } from '../../utils/oauth';
import { API_BASE_URL, OAUTH_REDIRECT_CALLBACK } from '../../config';
import './TopBar.css';

const TopBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userName, setUserName] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const authStatus = isAuthenticated();
            setAuthenticated(authStatus);

            if (authStatus) {
                // Get user info from JWT token directly
                const fullName = getCurrentUserFullName();
                const adminStatus = isCurrentUserAdmin();
                setUserName(fullName || '');
                setIsAdmin(adminStatus);
            } else {
                // Clear user info if not authenticated
                setUserName('');
                setIsAdmin(false);
            }
        };

        checkAuth();
    }, [location.pathname]); // Re-check auth when route changes

    const handleLogin = async () => {
        try {
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            const state = generateRandomState();

            storeOAuthState(codeVerifier, state);

            const params = new URLSearchParams({
                response_type: 'code',
                redirect_uri: OAUTH_REDIRECT_CALLBACK,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                state: state
            });

            window.location.href = `${API_BASE_URL}/v1/authorize?${params}`;
        } catch (err) {
            console.error('Error starting OAuth flow:', err);
        }
    };

    const handleLogout = () => {
        clearAccessToken();
        setAuthenticated(false);
        setUserName('');
        navigate('/login');
    };

    return (
        <div className="top-bar">
            <div className="top-bar-content">
                {authenticated ? (
                    <>
                        <span className="top-bar-logout" onClick={handleLogout}>
                            Logout
                        </span>
                        <span className="top-bar-username">{userName}</span>
                        {isAdmin && <span className="top-bar-admin">admin</span>}
                    </>
                ) : (
                    <span className="top-bar-login" onClick={handleLogin}>
                        Login
                    </span>
                )}
            </div>
        </div>
    );
};

export default TopBar;
