import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../utils/oauth';
import apiService from '../../services/api';

/**
 * PrivateRoute component - protects routes requiring authentication
 *
 * Checks if user has valid access token in localStorage
 * Redirects to /login if not authenticated
 *
 * Special case: /settings/user is accessible without authentication
 * when no users exist in the database (for initial user creation)
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} Protected component or redirect to login
 */
const PrivateRoute = ({ children }) => {
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [allowAccess, setAllowAccess] = useState(false);

    const checkAccess = useCallback(async () => {
        setChecking(true);

        // If already authenticated, allow access
        if (isAuthenticated()) {
            setAllowAccess(true);
            setChecking(false);
            return;
        }

        // Special case: check if /settings/user should be accessible for first user creation
        if (location.pathname === '/settings/user') {
            try {
                const result = await apiService.checkUsersEmpty();
                if (result && result.empty === true) {
                    // No users exist, allow access to create first user
                    setAllowAccess(true);
                    setChecking(false);
                    return;
                }
            } catch (error) {
                console.error('Error checking users empty:', error);
            }
        }

        // Not authenticated and not a special case
        setAllowAccess(false);
        setChecking(false);
    }, [location.pathname]);

    // Check access on mount and when location changes
    useEffect(() => {
        checkAccess();
    }, [checkAccess]);

    // Also check on window focus (user returns to tab)
    useEffect(() => {
        const handleFocus = () => {
            // Re-check authentication when user returns to the tab
            if (!isAuthenticated()) {
                setAllowAccess(false);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // Show nothing while checking (prevents flash of login page)
    if (checking) {
        return null;
    }

    // Redirect to login page if not allowed
    if (!allowAccess) {
        return <Navigate to="/login" replace />;
    }

    // Render protected component if allowed
    return children;
};

export default PrivateRoute;
