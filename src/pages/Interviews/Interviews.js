import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import './Interviews.css';

const Interviews = () => {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            setLoading(true);
            const data = await apiService.getInterviewList();
            // API returns array of interview objects
            setInterviews(Array.isArray(data) ? data : []);
        } catch (error) {
            // 404 means no interviews found, which is valid
            if (error.status === 404) {
                setInterviews([]);
            } else {
                console.error('Error fetching interviews:', error);
                setInterviews([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleDetailsClick = (interviewId) => {
        navigate(`/interview-review/${interviewId}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredInterviews = interviews.filter(interview =>
        interview.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="interviews-page-loading">Loading interviews...</div>;
    }

    return (
        <div className="page">
            <div className="header-container">
                <h1 className="page-title">Interview</h1>
                <div className="header-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={clearSearch} className="clear-search">
                                x
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="interviews-section">
                <div className="interviews-grid">
                    {filteredInterviews.length === 0 ? (
                        <p className="no-interviews">
                            {searchTerm ? 'No interviews match your search.' : 'No interviews found.'}
                        </p>
                    ) : (
                        filteredInterviews.map((interview) => (
                            <div key={interview.interview_id} className="interview-card">
                                <div className="card-row">
                                    <span className="field-label">Company:</span>
                                    <span className="field-value company-value">{interview.company_name}</span>
                                </div>

                                <div className="card-row">
                                    <span className="field-label">Job Title:</span>
                                    <span className="field-value">{interview.job_title}</span>
                                </div>

                                <div className="card-row">
                                    <span className="field-label">Score:</span>
                                    <span className="field-value score-value">
                                        {interview.interview_score !== null && interview.interview_score !== undefined
                                            ? `${interview.interview_score}%`
                                            : 'N/A'}
                                    </span>
                                </div>

                                <div className="card-row">
                                    <span className="field-label">Date:</span>
                                    <span className="field-value">{formatDate(interview.interview_created)}</span>
                                </div>

                                <div className="card-row card-actions">
                                    <button
                                        className="details-btn"
                                        onClick={() => handleDetailsClick(interview.interview_id)}
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Interviews;
