import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/oauth';

/**
 * PrivateRoute component - protects routes requiring authentication
 *
 * Checks if user has valid access token in localStorage
 * Redirects to /login if not authenticated
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} Protected component or redirect to login
 */
const PrivateRoute = ({ children }) => {
    // Check if user is authenticated (has access token)
    if (!isAuthenticated()) {
        // Redirect to login page if not authenticated
        return <Navigate to="/login" replace />;
    }

    // Render protected component if authenticated
    return children;
};

export default PrivateRoute;
