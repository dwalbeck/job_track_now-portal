import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUsername } from '../../utils/oauth';
import apiService from '../../services/api';
import './GeneralSettings.css';

const GeneralSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

    const [formData, setFormData] = useState({
        docx2html: 'convertapi',
        odt2html: 'pandoc',
        pdf2html: 'markitdown',
        html2docx: 'convertapi',
        html2odt: 'pandoc',
        html2pdf: 'weasyprint',
        default_llm: 'gpt-4.1-mini',
        resume_extract_llm: 'gpt-4.1-mini',
        job_extract_llm: 'gpt-4.1-mini',
        rewrite_llm: 'gpt-5.2',
        cover_llm: 'gpt-4.1-mini',
        company_llm: 'gpt-5.2',
        tools_llm: 'gpt-4o-mini',
        openai_api_key: '',
        tinymce_api_key: '',
        convertapi_key: '',
        no_response_week: 6
    });

    // Converter options
    const converterOptions = {
        docx2html: ['convertapi', 'docx-parser-converter', 'mammoth', 'pandoc'],
        odt2html: ['pandoc', 'odt2md'],
        pdf2html: ['markitdown', 'pdfplumber'],
        html2docx: ['convertapi', 'html4docx', 'python-docx'],
        html2odt: ['pandoc'],
        html2pdf: ['weasyprint', 'pdfkit', 'convertapi']
    };

    // LLM options
    const llmOptions = [
        'gpt-4.1-mini',
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-4.1',
        'gpt-5.2',
        'gpt-5-search-api',
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus'
    ];

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError(null);

            const username = getCurrentUsername();
            if (!username) {
                setError('Unable to determine current user');
                setLoading(false);
                return;
            }

            // First get user_id from username
            const userData = await apiService.getUserByUsername(username);
            setUserId(userData.user_id);

            // Then try to get user settings
            try {
                const settings = await apiService.getUserSetting(userData.user_id);
                setFormData({
                    docx2html: settings.docx2html || 'convertapi',
                    odt2html: settings.odt2html || 'pandoc',
                    pdf2html: settings.pdf2html || 'markitdown',
                    html2docx: settings.html2docx || 'convertapi',
                    html2odt: settings.html2odt || 'pandoc',
                    html2pdf: settings.html2pdf || 'weasyprint',
                    default_llm: settings.default_llm || 'gpt-4.1-mini',
                    resume_extract_llm: settings.resume_extract_llm || 'gpt-4.1-mini',
                    job_extract_llm: settings.job_extract_llm || 'gpt-4.1-mini',
                    rewrite_llm: settings.rewrite_llm || 'gpt-5.2',
                    cover_llm: settings.cover_llm || 'gpt-4.1-mini',
                    company_llm: settings.company_llm || 'gpt-5.2',
                    tools_llm: settings.tools_llm || 'gpt-4o-mini',
                    openai_api_key: settings.openai_api_key || '',
                    tinymce_api_key: settings.tinymce_api_key || '',
                    convertapi_key: settings.convertapi_key || '',
                    no_response_week: settings.no_response_week || 6
                });
            } catch (settingsErr) {
                // Settings might not exist yet, use defaults
                console.log('No existing settings found, using defaults');
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            setError('Failed to load settings');
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            setError('User ID not available');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const submitData = {
                user_id: userId,
                ...formData,
                no_response_week: parseInt(formData.no_response_week, 10) || 6
            };

            await apiService.saveUserSetting(submitData);
            alert('Settings saved successfully');
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    if (loading) {
        return <div className="general-settings-loading">Loading...</div>;
    }

    return (
        <div className="general-settings-page">
            <div className="general-settings-header">
                <h1 className="page-title">General Settings</h1>
            </div>

            {error && <div className="general-settings-error">{error}</div>}

            <form onSubmit={handleSubmit} className="general-settings-form">
                <div className="general-settings-columns">
                    {/* Left Column */}
                    <div className="general-settings-column">
                        {/* File Conversions Section */}
                        <div className="form-section">
                            <h3 className="section-title">File Conversions</h3>
                            <div className="form-row">
                                <label>Docx to HTML</label>
                                <select
                                    name="docx2html"
                                    value={formData.docx2html}
                                    onChange={handleInputChange}
                                >
                                    {converterOptions.docx2html.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Odt to HTML</label>
                                <select
                                    name="odt2html"
                                    value={formData.odt2html}
                                    onChange={handleInputChange}
                                >
                                    {converterOptions.odt2html.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>PDF to HTML</label>
                                <select
                                    name="pdf2html"
                                    value={formData.pdf2html}
                                    onChange={handleInputChange}
                                >
                                    {converterOptions.pdf2html.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>HTML to Docx</label>
                                <select
                                    name="html2docx"
                                    value={formData.html2docx}
                                    onChange={handleInputChange}
                                >
                                    {converterOptions.html2docx.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>HTML to Odt</label>
                                <select
                                    name="html2odt"
                                    value={formData.html2odt}
                                    onChange={handleInputChange}
                                >
                                    {converterOptions.html2odt.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>HTML to PDF</label>
                                <select
                                    name="html2pdf"
                                    value={formData.html2pdf}
                                    onChange={handleInputChange}
                                >
                                    {converterOptions.html2pdf.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* API Keys Section */}
                        <div className="form-section">
                            <h3 className="section-title">API Keys</h3>
                            <div className="form-row">
                                <label>OpenAI API Key</label>
                                <input
                                    type="password"
                                    name="openai_api_key"
                                    value={formData.openai_api_key}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-row">
                                <label>TinyMCE API Key</label>
                                <input
                                    type="password"
                                    name="tinymce_api_key"
                                    value={formData.tinymce_api_key}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-row">
                                <label>ConvertAPI Key</label>
                                <input
                                    type="password"
                                    name="convertapi_key"
                                    value={formData.convertapi_key}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="general-settings-column">
                        {/* Large Language Models Section */}
                        <div className="form-section">
                            <h3 className="section-title">Large Language Models</h3>
                            <div className="form-row">
                                <label>Default LLM</label>
                                <select
                                    name="default_llm"
                                    value={formData.default_llm}
                                    onChange={handleInputChange}
                                >
                                    {llmOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Resume Extract LLM</label>
                                <select
                                    name="resume_extract_llm"
                                    value={formData.resume_extract_llm}
                                    onChange={handleInputChange}
                                >
                                    {llmOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Job Extraction LLM</label>
                                <select
                                    name="job_extract_llm"
                                    value={formData.job_extract_llm}
                                    onChange={handleInputChange}
                                >
                                    {llmOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Resume Rewrite LLM</label>
                                <select
                                    name="rewrite_llm"
                                    value={formData.rewrite_llm}
                                    onChange={handleInputChange}
                                >
                                    {llmOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Cover Letter LLM</label>
                                <select
                                    name="cover_llm"
                                    value={formData.cover_llm}
                                    onChange={handleInputChange}
                                >
                                    {llmOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Company Research LLM</label>
                                <select
                                    name="company_llm"
                                    value={formData.company_llm}
                                    onChange={handleInputChange}
                                >
                                    {llmOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Tools LLM</label>
                                <select
                                    name="tools_llm"
                                    value={formData.tools_llm}
                                    onChange={handleInputChange}
                                >
                                    {llmOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Application Settings Section */}
                        <div className="form-section">
                            <h3 className="section-title">Application Settings</h3>
                            <div className="form-row">
                                <label>Auto Status Change</label>
                                <input
                                    type="number"
                                    name="no_response_week"
                                    value={formData.no_response_week}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="52"
                                    className="input-small"
                                />
                                <span className="input-suffix">weeks of no contact</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="submit-button" disabled={saving}>
                        {saving ? 'Saving...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GeneralSettings;
