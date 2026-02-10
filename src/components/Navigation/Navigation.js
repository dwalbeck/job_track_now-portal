import React, { useState } from 'react';
import {Link, useLocation} from 'react-router-dom';
import {useJob} from '../../context/JobContext';
import './Navigation.css';

const Navigation = () => {
    const location = useLocation();
    const {navigateToPage} = useJob();
    const [homeHovered, setHomeHovered] = useState(false);
    const [settingsHovered, setSettingsHovered] = useState(false);

    const menuItems = [
        {path: '/job-tracker', label: 'Job Posting', key: 'job-tracker'},
        {path: '/contacts', label: 'Contacts', key: 'contacts'},
        {path: '/calendar', label: 'Calendar', key: 'calendar'},
        {path: '/notes', label: 'Notes', key: 'notes'},
        {path: '/documents', label: 'Documents', key: 'documents'},
        {path: '/resume', label: 'Resume', key: 'resume'},
        {path: '/cover-letter', label: 'Cover Letter', key: 'cover-letter'},
        {path: '/tools', label: 'Tools', key: 'tools'},
        {path: '/interview', label: 'Interview', key: 'interview'},
    ];

    const homeSubItems = [
        {path: '/home/features', label: 'Features', key: 'home-features'},
        {path: '/home/screenshots', label: 'Screenshots', key: 'home-screenshots'},
        {path: '/home/documentation', label: 'Documentation', key: 'home-documentation'},
    ];

    const settingsSubItems = [
        {path: '/settings/user', label: 'User', key: 'settings-user'},
        {path: '/settings/general', label: 'General', key: 'settings-general'},
    ];

    const handleMenuClick = (key) => {
        navigateToPage(key);
    };

    const isHomeActive = location.pathname === '/' || homeSubItems.some(item => location.pathname === item.path);
    const showHomeSubmenu = homeHovered || isHomeActive;

    const isSettingsActive = settingsSubItems.some(item => location.pathname === item.path);
    const showSettingsSubmenu = settingsHovered || isSettingsActive;

    return (
        <nav className="navigation">
            <div className="nav-logo-container">
                <img src="/logo.png" alt="Job Track Now" className="nav-title-image" />
                <img src="/motto.png" alt="Track smarter, land faster" className="nav-motto-img" />
            </div>
            <div className="nav-container">
                {/* Home menu with submenu */}
                <div
                    className="nav-home-container"
                    onMouseEnter={() => setHomeHovered(true)}
                    onMouseLeave={() => setHomeHovered(false)}
                >
                    <Link
                        to="/"
                        className={`nav-item nav-home-trigger ${location.pathname === '/' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('home')}
                    >
                        Home
                    </Link>
                    {showHomeSubmenu && (
                        <div className="nav-home-submenu">
                            {homeSubItems.map((item) => (
                                <Link
                                    key={item.key}
                                    to={item.path}
                                    className={`nav-item nav-subitem ${location.pathname === item.path ? 'active' : ''}`}
                                    onClick={() => handleMenuClick(item.key)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {menuItems.map((item) => (
                    <Link
                        key={item.key}
                        to={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => handleMenuClick(item.key)}
                    >
                        {item.label}
                    </Link>
                ))}

                {/* Settings menu with submenu */}
                <div
                    className="nav-settings-container"
                    onMouseEnter={() => setSettingsHovered(true)}
                    onMouseLeave={() => setSettingsHovered(false)}
                >
                    <div className="nav-item nav-settings-trigger">
                        Settings
                    </div>
                    {showSettingsSubmenu && (
                        <div className="nav-settings-submenu">
                            {settingsSubItems.map((item) => (
                                <Link
                                    key={item.key}
                                    to={item.path}
                                    className={`nav-item nav-subitem ${location.pathname === item.path ? 'active' : ''}`}
                                    onClick={() => handleMenuClick(item.key)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
