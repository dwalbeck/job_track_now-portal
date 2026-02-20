import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import apiService from '../../services/api';
import {getTodayDate, formatDateForInput} from '../../utils/dateUtils';
import './JobForm.css';

const JobForm = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        job_id: null,
        company: '',
        job_title: '',
        salary: '',
        location: '',
        interest_level: 5,
        posting_url: '',
        apply_url: '',
        job_desc: '',
        job_status: 'applied',
        starred: false,
        date_applied: getTodayDate()
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const statusOptions = [
        {value: 'applied', label: 'Applied'},
        {value: 'interviewing', label: 'Interviewing'},
        {value: 'rejected', label: 'Rejected'},
        {value: 'no response', label: 'No Response'}
    ];

    const interestLevels = Array.from({length: 10}, (_, i) => i + 1);

    useEffect(() => {
        if (isEdit) {
            fetchJobData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchJobData = async () => {
        try {
            setLoading(true);
            const job = await apiService.getJob(id);
            setFormData({
                ...job,
                date_applied: formatDateForInput(job.date_applied)
            });
        } catch (error) {
            console.error('Error fetching job:', error);
            setError('Failed to load job data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStarToggle = () => {
        setFormData(prev => ({
            ...prev,
            starred: !prev.starred
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEdit) {
                await apiService.updateJob(formData);
            } else {
                await apiService.createJob(formData);
            }
            navigate('/job-tracker');
        } catch (error) {
            console.error('Error saving job:', error);
            setError('Failed to save job');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/job-tracker');
    };

    if (loading && isEdit) {
        return <div className="loading">Loading job data...</div>;
    }

    return (
        <div className="job-form-page">
            <div className="job-form-header">
                <h1 className="page-title">{isEdit ? 'Edit Posting' : 'Add New Posting'}</h1>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="job-form">
                <input type="hidden" name="job_id" value={formData.job_id}/>

                <div className="form-columns">
                    {/* Left Column */}
                    <div className="form-column">
                        <div className="form-row-inline">
                            <label htmlFor="company">Company*</label>
                            <input
                                type="text"
                                id="company"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row-inline">
                            <label htmlFor="job_title">Job Title*</label>
                            <input
                                type="text"
                                id="job_title"
                                name="job_title"
                                value={formData.job_title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row-inline">
                            <label htmlFor="interest_level">Interest Level</label>
                            <select
                                id="interest_level"
                                name="interest_level"
                                value={formData.interest_level}
                                onChange={handleChange}
                            >
                                {interestLevels.map(level => (
                                    <option key={level} value={level}>
                                        {level} - {level <= 3 ? 'low' : level <= 7 ? 'medium' : 'high'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row-inline">
                            <label htmlFor="date_applied">Date Applied</label>
                            <input
                                type="date"
                                id="date_applied"
                                name="date_applied"
                                value={formData.date_applied}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="form-column">
                        <div className="form-row-inline">
                            <label htmlFor="salary">Salary</label>
                            <input
                                type="text"
                                id="salary"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-row-inline">
                            <label htmlFor="location">Location</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-row-inline">
                            <label htmlFor="job_status">Job Status</label>
                            <select
                                id="job_status"
                                name="job_status"
                                value={formData.job_status}
                                onChange={handleChange}
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row-inline">
                            <label>Starred</label>
                            <div className="star-toggle">
                                <img
                                    src={formData.starred ? '/star-on.png' : '/star-off.png'}
                                    alt={formData.starred ? 'Starred' : 'Not starred'}
                                    onClick={handleStarToggle}
                                    className="star-toggle-img"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full width URL fields */}
                <div className="form-row-inline form-row-full">
                    <label htmlFor="posting_url">Posting URL</label>
                    <input
                        type="url"
                        id="posting_url"
                        name="posting_url"
                        value={formData.posting_url}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-row-inline form-row-full">
                    <label htmlFor="apply_url">Apply URL</label>
                    <input
                        type="url"
                        id="apply_url"
                        name="apply_url"
                        value={formData.apply_url}
                        onChange={handleChange}
                    />
                </div>

                {/* Job Description */}
                <div className="form-group-description">
                    <label htmlFor="job_desc">Job Description</label>
                    <textarea
                        id="job_desc"
                        name="job_desc"
                        value={formData.job_desc}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="cancel-button"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobForm;
