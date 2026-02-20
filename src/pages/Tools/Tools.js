import React, {useState, useEffect} from 'react';
import apiService from '../../services/api';
import './Tools.css';

const Tools = () => {
    const [rewriteInput, setRewriteInput] = useState('');
    const [rewriteResult, setRewriteResult] = useState(null);
    const [rewriteLoading, setRewriteLoading] = useState(false);
    const [rewriteError, setRewriteError] = useState(null);

    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [pitchResult, setPitchResult] = useState(null);
    const [pitchLoading, setPitchLoading] = useState(false);
    const [pitchError, setPitchError] = useState(null);
    const [jobsLoading, setJobsLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, []);

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

    const handleRewriteSubmit = async () => {
        if (!rewriteInput.trim()) {
            setRewriteError('Please enter some text to rewrite');
            return;
        }

        try {
            setRewriteLoading(true);
            setRewriteError(null);
            const result = await apiService.rewriteText(rewriteInput);
            setRewriteResult(result);
            setRewriteInput(''); // Clear the input textbox
        } catch (error) {
            setRewriteError(error.message || 'Error rewriting text');
            console.error('Error rewriting text:', error);
        } finally {
            setRewriteLoading(false);
        }
    };

    const handlePitchSubmit = async () => {
        try {
            setPitchLoading(true);
            setPitchError(null);
            const jobId = selectedJobId || null;
            const result = await apiService.createPitch(jobId);
            setPitchResult(result);
        } catch (error) {
            setPitchError(error.message || 'Error creating pitch');
            console.error('Error creating pitch:', error);
        } finally {
            setPitchLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="header-container">
                <h1 className="page-title">Tools</h1>
            </div>

            {/* Rewrite Text Section */}
            <div className="tools-section">
                <h2 className="page-section-heading">Rewrite Text Chunk</h2>
                <p className="tools-instruction">
                    If you need a sentence or paragraph of your resume reworded to be more professional sounding and clearly stated
                </p>

                <textarea
                    className="tools-textarea"
                    rows="4"
                    value={rewriteInput}
                    onChange={(e) => setRewriteInput(e.target.value)}
                    placeholder="Enter text to rewrite..."
                />

                {rewriteError && (
                    <div className="tools-error">{rewriteError}</div>
                )}

                <div className="tools-button-container">
                    <button
                        className="action-button"
                        onClick={handleRewriteSubmit}
                        disabled={rewriteLoading}
                    >
                        {rewriteLoading ? 'Processing...' : 'Re-write'}
                    </button>
                </div>

                {rewriteResult && (
                    <div className="tools-result">
                        <h3 className="tools-result-label">Original Text</h3>
                        <textarea
                            className="tools-textarea"
                            rows="4"
                            value={rewriteResult.original_text_blob}
                            readOnly
                        />

                        <h3 className="tools-result-label">Improved Rendition</h3>
                        <textarea
                            className="tools-textarea"
                            rows="4"
                            value={rewriteResult.new_text_blob}
                            readOnly
                        />

                        <p className="tools-explanation">{rewriteResult.explanation}</p>
                    </div>
                )}
            </div>

            {/* Elevator Pitch Section */}
            <div className="tools-section tools-section-spacing">
                <h2 className="page-section-heading">Elevator Pitch</h2>
                <p className="tools-instruction">
                    Your sales pitch to market yourself to a company decision maker on an open job position
                </p>

                <div className="tools-form-group">
                    <label className="tools-label">For Specific Job Posting</label>
                    <select
                        className="tools-select"
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

                {pitchError && (
                    <div className="tools-error">{pitchError}</div>
                )}

                <div className="tools-button-container">
                    <button
                        className="action-button"
                        onClick={handlePitchSubmit}
                        disabled={pitchLoading}
                    >
                        {pitchLoading ? 'Creating...' : 'Create Pitch'}
                    </button>
                </div>

                {pitchResult && (
                    <div className="tools-result">
                        <h3 className="tools-result-label">The Pitch</h3>
                        <textarea
                            className="tools-textarea"
                            rows="8"
                            value={pitchResult.pitch}
                            readOnly
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tools;
