import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import apiService from '../../services/api';
import './CompanyResearch.css';

const CompanyResearch = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const fromPage = location.state?.from || 'documents';
    const [formData, setFormData] = useState({
        job_id: '',
        company_name: '',
        linkedin_url: '',
        website_url: '',
        hq_city: '',
        hq_state: ''
    });
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [researching, setResearching] = useState(false);
    const [researchComplete, setResearchComplete] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [selectedJobId, setSelectedJobId] = useState('');

    const fetchCompanyByJob = useCallback(async (jobId) => {
        try {
            const response = await apiService.getCompanyByJob(jobId);

            // If report already exists, redirect to view page
            if (response.report_html && response.report_html.trim() !== '') {
                if (response.company_id) {
                    navigate(`/company-report/${response.company_id}`, {
                        state: { jobId: jobId }
                    });
                } else {
                    alert('Company report exists but company_id not found');
                }
                return;
            }

            // Otherwise, pre-populate form with job data
            setFormData({
                job_id: jobId,
                company_name: response.company || '',
                linkedin_url: response.linkedin_url || '',
                website_url: response.website_url || '',
                hq_city: response.hq_city || '',
                hq_state: response.hq_state || ''
            });

            // If company record already exists, save the company_id
            if (response.company_id) {
                setCompanyId(response.company_id);
            }

        } catch (error) {
            console.error('Error fetching company by job:', error);
            alert('Failed to load company data for this job. Please try again.');
        }
    }, [navigate]);

    const fetchJobs = async () => {
        try {
            setJobsLoading(true);
            const response = await apiService.getJobList();
            setJobs(response || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setJobsLoading(false);
        }
    };

    useEffect(() => {
        const jobId = searchParams.get('job_id');
        if (jobId) {
            fetchCompanyByJob(jobId);
        }
    }, [searchParams, fetchCompanyByJob]);

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();

        // Validate required field
        if (!formData.company_name.trim()) {
            alert('Company Name is required');
            return;
        }

        try {
            setSearching(true);
            setShowResults(false);
            setSearchResults([]);

            // Step 1: Create company record
            const createResponse = await apiService.createCompany(formData);
            const newCompanyId = createResponse.company_id;
            setCompanyId(newCompanyId);

            console.log('Company created with ID:', newCompanyId);

            // Step 2: Search for company matches
            const searchResponse = await apiService.searchCompany(newCompanyId);

            console.log('Search results:', searchResponse);
            setSearchResults(searchResponse || []);
            setShowResults(true);

        } catch (error) {
            console.error('Error during company search:', error);
            alert('Failed to search for company. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    const handleRowClick = async (result) => {
        if (!companyId) {
            alert('Company ID not found');
            return;
        }

        try {
            console.log('Selected result:', result);
            console.log('Company logo URL:', result.company_logo_url);

            // Update company record with selected match
            const updateData = {
                company_id: companyId,
                company_name: result.company_name,
                website_url: result.website_url,
                hq_city: result.location_city,
                hq_state: result.location_state,
                industry: result.industry,
                linkedin_url: result.linkedin_url,
                company_logo_url: result.company_logo_url || ''
            };

            console.log('Sending update data:', updateData);
            await apiService.updateCompany(updateData);

            console.log('Company updated successfully');

            // Hide results and start research
            setShowResults(false);
            setResearching(true);

            // Start company research
            const researchResponse = await apiService.researchCompany(companyId);
            const newProcessId = researchResponse.process_id;

            console.log('Research started with process_id:', newProcessId);

            // Start polling
            pollResearchStatus(newProcessId);

        } catch (error) {
            console.error('Error updating company or starting research:', error);
            alert('Failed to start company research. Please try again.');
            setResearching(false);
        }
    };

    const pollResearchStatus = async (pid) => {
        const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
        let attempts = 0;

        const poll = async () => {
            attempts++;
            console.log(`Polling attempt ${attempts}/${maxAttempts} for process_id: ${pid}`);

            try {
                const pollResponse = await apiService.request(`/v1/process/poll/${pid}`, {
                    method: 'GET',
                    timeout: 10000
                });
                console.log("Process state:", pollResponse.process_state);

                if (pollResponse.process_state === 'complete' || pollResponse.process_state === 'confirmed') {
                    console.log('Research process completed successfully');
                    setResearching(false);
                    setResearchComplete(true);
                    return;
                } else if (pollResponse.process_state === 'failed') {
                    console.error('Research process failed');
                    alert('Company research process failed. Please try again.');
                    setResearching(false);
                    return;
                }

                // Still running, continue polling
                if (attempts >= maxAttempts) {
                    console.error('Polling timed out');
                    alert('Company research timed out after 10 minutes. Please try again.');
                    setResearching(false);
                    return;
                }

                console.log('Process still running, retrying in 5 seconds...');
                setTimeout(poll, 5000);
            } catch (error) {
                console.error('Error during polling:', error);
                alert('Error checking research status. Please try again.');
                setResearching(false);
            }
        };

        poll();
    };

    const handleDisplayReport = () => {
        // Pass jobId if it exists in formData
        const navState = formData.job_id ? { jobId: formData.job_id } : {};
        navigate(`/company-report/${companyId}`, { state: navState });
    };

    const handleCancel = () => {
        // Navigate back to the source page
        if (fromPage === 'job-details' && formData.job_id) {
            navigate(`/job-details/${formData.job_id}`);
        } else {
            navigate('/documents');
        }
    };

    return (
        <div className="company-research-container">
            <div className="header-container">
                <h1 className="page-title">Company Research</h1>
            </div>
            <div className="content-wrapper">
                <div className="form-section-research">
                    <h2 className="page-section-heading">Search Criteria</h2>

                    <form onSubmit={handleSearch} className="company-search-form">
                        <div className="form-group">
                            <label htmlFor="job_id">Job Posting</label>
                            <select
                                id="job_id"
                                name="job_id"
                                className="company-select"
                                value={selectedJobId}
                                onChange={(e) => setSelectedJobId(e.target.value)}
                                disabled={jobsLoading}
                            >
                                <option value="">-- Select a job (optional) --</option>
                                {jobs.map((job) => (
                                    <option key={job.job_id} value={job.job_id}>
                                        {job.company} - {job.job_title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="company_name">
                                Company Name<span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleInputChange}
                                placeholder="Company name (required)"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="linkedin_url">LinkedIn</label>
                            <input
                                type="text"
                                id="linkedin_url"
                                name="linkedin_url"
                                value={formData.linkedin_url}
                                onChange={handleInputChange}
                                placeholder="https://www.linkedin.com/in/"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="website_url">Website</label>
                            <input
                                type="text"
                                id="website_url"
                                name="website_url"
                                value={formData.website_url}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="hq_city">City</label>
                            <input
                                type="text"
                                id="hq_city"
                                name="hq_city"
                                value={formData.hq_city}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="hq_state">State/Province</label>
                            <input
                                type="text"
                                id="hq_state"
                                name="hq_state"
                                value={formData.hq_state}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="button-group">
                            <button type="button" onClick={handleCancel} className="cancel-btn">
                                Cancel
                            </button>
                            <button type="submit" className="search-btn" disabled={searching}>
                                {searching ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    </form>
                </div>

                {searching && (
                    <div className="search-message">
                        Searching for matching Company details to verify...
                    </div>
                )}
            </div>

            {showResults && !searching && (
                <div className="results-section">
                    <h2>Search Results</h2>
                    {searchResults.length === 0 ? (
                        <p className="no-results">No matching companies found.</p>
                    ) : (
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Company Name</th>
                                    <th>Website</th>
                                    <th>Location</th>
                                    <th>Industry</th>
                                    <th>Match</th>
                                    <th>Logo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.map((result, index) => (
                                    <tr
                                        key={index}
                                        onClick={() => handleRowClick(result)}
                                        className="clickable-row"
                                    >
                                        <td>{result.company_name}</td>
                                        <td>
                                            {result.website_url && (
                                                <a
                                                    href={result.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {result.website_url}
                                                </a>
                                            )}
                                        </td>
                                        <td>
                                            {result.location_city && result.location_state
                                                ? `${result.location_city}, ${result.location_state}`
                                                : result.location_city || result.location_state || ''}
                                        </td>
                                        <td>{result.industry}</td>
                                        <td>{result.match_score}%</td>
                                        <td>
                                            {result.company_logo_url ? (
                                                <img
                                                    src={result.company_logo_url}
                                                    alt={`${result.company_name} logo`}
                                                    style={{ height: '40px', width: 'auto' }}
                                                    onError={(e) => {
                                                        console.error('Logo failed to load:', result.company_logo_url);
                                                        e.target.alt = 'Logo unavailable';
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '10px', color: '#999' }}>
                                                    {result.company_logo_url === undefined ? 'undefined' : result.company_logo_url === null ? 'null' : 'empty'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {researching && (
                <div className="research-section">
                    <p className="research-message">
                        Now that the correct company is verified, I'll start to do some deep research...
                    </p>
                </div>
            )}

            {researchComplete && (
                <div className="research-section">
                    <p className="research-message">
                        Now that the correct company is verified, I'll start to do some deep research...
                        <span className="complete-text"> complete!</span>
                    </p>
                    <p className="report-ready-message">
                        Your comprehensive company report is now ready for you.
                    </p>
                    <div className="display-report-container">
                        <button onClick={handleDisplayReport} className="display-report-btn">
                            Display Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyResearch;
