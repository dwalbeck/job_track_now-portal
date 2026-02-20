import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUsername, isAuthenticated } from '../../utils/oauth';
import apiService from '../../services/api';
import './UserSettings.css';

const UserSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [verifyPasswordTouched, setVerifyPasswordTouched] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);

    const [formData, setFormData] = useState({
        user_id: null,
        address_id: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        linkedin_url: '',
        github_url: '',
        website_url: '',
        portfolio_url: '',
        login: '',
        passwd: '',
        verify_passwd: ''
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check if user is authenticated
            if (!isAuthenticated()) {
                // Check if this is the first user creation scenario
                try {
                    const result = await apiService.checkUsersEmpty();
                    if (result && result.empty === true) {
                        // No users exist - this is first user creation
                        setIsNewUser(true);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error('Error checking users:', err);
                }
                setError('Unable to determine current user');
                setLoading(false);
                return;
            }

            const username = getCurrentUsername();
            if (!username) {
                setError('Unable to determine current user');
                setLoading(false);
                return;
            }

            const userData = await apiService.getUserByUsername(username);

            setFormData({
                user_id: userData.user_id,
                address_id: userData.address_id,
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                address_1: userData.address_1 || '',
                address_2: userData.address_2 || '',
                city: userData.city || '',
                state: userData.state || '',
                zip: userData.zip || '',
                country: userData.country || '',
                linkedin_url: userData.linkedin_url || '',
                github_url: userData.github_url || '',
                website_url: userData.website_url || '',
                portfolio_url: userData.portfolio_url || '',
                login: userData.login || '',
                passwd: '',
                verify_passwd: ''
            });
        } catch (err) {
            console.error('Error loading user data:', err);
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Check password match when either password field changes
        if (name === 'passwd' || name === 'verify_passwd') {
            if (name === 'verify_passwd') {
                setVerifyPasswordTouched(true);
            }
            const passwd = name === 'passwd' ? value : formData.passwd;
            const verifyPasswd = name === 'verify_passwd' ? value : formData.verify_passwd;
            setPasswordMatch(passwd === verifyPasswd);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.verify_passwd && !passwordMatch) {
            setError('Passwords do not match');
            return;
        }

        // For new user creation, require password
        if (isNewUser && (!formData.passwd || !formData.passwd.trim())) {
            setError('Password is required for new user');
            return;
        }

        // For new user, require essential fields
        if (isNewUser) {
            if (!formData.first_name || !formData.last_name || !formData.login || !formData.email) {
                setError('First name, last name, username, and email are required');
                return;
            }
        }

        try {
            setSaving(true);
            setError(null);

            const submitData = {
                user_id: formData.user_id,
                address_id: formData.address_id,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                address_1: formData.address_1,
                address_2: formData.address_2,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
                country: formData.country,
                linkedin_url: formData.linkedin_url,
                github_url: formData.github_url,
                website_url: formData.website_url,
                portfolio_url: formData.portfolio_url,
                login: formData.login
            };

            // Only include password if it's been entered
            if (formData.passwd && formData.passwd.trim()) {
                submitData.passwd = formData.passwd;
            }

            await apiService.saveUser(submitData);

            if (isNewUser) {
                alert('User created successfully! Please log in.');
                navigate('/login');
            } else {
                alert('User information saved successfully');
            }
        } catch (err) {
            console.error('Error saving user data:', err);
            setError(err.detail || 'Failed to save user data');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (isNewUser) {
            navigate('/login');
        } else {
            navigate('/');
        }
    };

    const isSubmitDisabled = () => {
        return saving || (verifyPasswordTouched && formData.verify_passwd && !passwordMatch);
    };

    if (loading) {
        return <div className="user-settings-loading">Loading...</div>;
    }

    return (
        <div className="page">
            <div className="header-container">
                <h1 className="page-title">{isNewUser ? 'Create Account' : 'User Information'}</h1>
            </div>

            {error && <div className="user-settings-error">{error}</div>}

            <form onSubmit={handleSubmit} className="user-settings-form">
                <div className="user-settings-columns">
                    {/* Left Column */}
                    <div className="user-settings-column">
                        {/* Personal Section */}
                        <div className="form-section">
                            <h3 className="section-title">Personal</h3>
                            <div className="form-row">
                                <label>First Name{isNewUser && ' *'}</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    required={isNewUser}
                                />
                            </div>
                            <div className="form-row">
                                <label>Last Name{isNewUser && ' *'}</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    required={isNewUser}
                                />
                            </div>
                            <div className="form-row">
                                <label>E-mail{isNewUser && ' *'}</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required={isNewUser}
                                />
                            </div>
                            <div className="form-row">
                                <label>Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Links Section */}
                        <div className="form-section">
                            <h3 className="section-title">Links</h3>
                            <div className="form-row">
                                <label>LinkedIn URL</label>
                                <input
                                    type="text"
                                    name="linkedin_url"
                                    value={formData.linkedin_url}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-row">
                                <label>GitHub URL</label>
                                <input
                                    type="text"
                                    name="github_url"
                                    value={formData.github_url}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-row">
                                <label>Portfolio URL</label>
                                <input
                                    type="text"
                                    name="portfolio_url"
                                    value={formData.portfolio_url}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-row">
                                <label>Website URL</label>
                                <input
                                    type="text"
                                    name="website_url"
                                    value={formData.website_url}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="user-settings-column">
                        {/* Address Section */}
                        <div className="form-section">
                            <h3 className="section-title">Address</h3>
                            <div className="form-row">
                                <label>Address</label>
                                <input
                                    type="text"
                                    name="address_1"
                                    value={formData.address_1}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-row">
                                <label>Address 2</label>
                                <input
                                    type="text"
                                    name="address_2"
                                    value={formData.address_2}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-row">
                                <label>City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-row">
                                <label>State/Province</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-row form-row-inline">
                                <div className="form-field">
                                    <label>Zip Code</label>
                                    <input
                                        type="text"
                                        name="zip"
                                        value={formData.zip}
                                        onChange={handleInputChange}
                                        className="input-small"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className="input-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Credentials Section */}
                        <div className="form-section">
                            <h3 className="section-title">Credentials</h3>
                            <div className="form-row">
                                <label>Username{isNewUser && ' *'}</label>
                                <input
                                    type="text"
                                    name="login"
                                    value={formData.login}
                                    onChange={handleInputChange}
                                    required={isNewUser}
                                />
                            </div>
                            <div className="form-row">
                                <label>Password{isNewUser && ' *'}</label>
                                <input
                                    type="password"
                                    name="passwd"
                                    value={formData.passwd}
                                    onChange={handleInputChange}
                                    placeholder={isNewUser ? 'Required' : 'Leave blank to keep current'}
                                    required={isNewUser}
                                />
                            </div>
                            <div className="form-row">
                                <label>Verify Password{isNewUser && ' *'}</label>
                                <input
                                    type="password"
                                    name="verify_passwd"
                                    value={formData.verify_passwd}
                                    onChange={handleInputChange}
                                    className={verifyPasswordTouched ? (passwordMatch ? 'input-valid' : 'input-invalid') : ''}
                                    required={isNewUser}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="submit-button" disabled={isSubmitDisabled()}>
                        {saving ? 'Saving...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserSettings;
