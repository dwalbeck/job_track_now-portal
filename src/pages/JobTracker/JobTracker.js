import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {DragDropContext, Droppable} from 'react-beautiful-dnd';
import JobCard from '../../components/JobCard/JobCard';
import ExportMenu from '../../components/ExportMenu/ExportMenu';
import apiService from '../../services/api';
import {useJob} from '../../context/JobContext';
import logger from '../../utils/logger';
import './JobTracker.css';

const JobTracker = () => {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [noResponseWeeks, setNoResponseWeeks] = useState(null);
    const [postInterviewModal, setPostInterviewModal] = useState(null); // {job, calendar_id, start_time, end_time}
    const {selectJob} = useJob();
    const navigate = useNavigate();

    /**
     * Formats time from 24-hour string to 12-hour format with am/pm
     * @param {string} timeStr - Time in "HH:MM" or "HH:MM:SS" format
     * @returns {string} Formatted time like "2:30 pm"
     */
    const formatTime12Hour = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const suffix = hour >= 12 ? 'pm' : 'am';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${suffix}`;
    };

    /**
     * Checks if a same-day interview has ended (end_time is in the past)
     * @param {object} job - Job object with calendar data
     * @returns {boolean} True if interview ended today
     */
    const hasInterviewEndedToday = (job) => {
        if (!job.start_date || !job.end_time) return false;

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if appointment is today
        if (job.start_date !== todayStr) return false;

        // Check if end_time has passed
        const now = new Date();
        const [hours, minutes] = job.end_time.split(':');
        const endDateTime = new Date();
        endDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        return now > endDateTime;
    };

    /**
     * Gets the key for localStorage to track dismissed interview prompts
     * @param {number} calendarId - Calendar ID
     * @param {string} date - Date string
     * @returns {string} Storage key
     */
    const getDismissedKey = (calendarId, date) => `interview_dismissed_${calendarId}_${date}`;

    /**
     * Checks if an interview prompt was already dismissed today
     * @param {number} calendarId - Calendar ID
     * @returns {boolean} True if dismissed
     */
    const wasInterviewDismissed = (calendarId) => {
        const todayStr = new Date().toISOString().split('T')[0];
        return localStorage.getItem(getDismissedKey(calendarId, todayStr)) === 'true';
    };

    /**
     * Marks an interview prompt as dismissed for today
     * @param {number} calendarId - Calendar ID
     */
    const dismissInterview = (calendarId) => {
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(getDismissedKey(calendarId, todayStr), 'true');
    };

    /**
     * Checks for completed same-day interviews and shows the scoring prompt
     * @param {Array} jobList - List of jobs to check
     */
    const checkForCompletedInterviews = (jobList) => {
        for (const job of jobList) {
            if (hasInterviewEndedToday(job) && !job.outcome_score && !wasInterviewDismissed(job.calendar_id)) {
                setPostInterviewModal({
                    job: job,
                    calendar_id: job.calendar_id,
                    start_time: job.start_time,
                    end_time: job.end_time
                });
                break; // Show one at a time
            }
        }
    };

    const handleScoreInterview = () => {
        if (postInterviewModal) {
            dismissInterview(postInterviewModal.calendar_id);
            navigate(`/calendar-form/${postInterviewModal.calendar_id}`);
            setPostInterviewModal(null);
        }
    };

    const handleDismissInterviewPrompt = () => {
        if (postInterviewModal) {
            dismissInterview(postInterviewModal.calendar_id);
            setPostInterviewModal(null);
        }
    };

    const columns = [
        {id: 'applied', title: 'Applied'},
        {id: 'interviewing', title: 'Interviewing'},
        {id: 'rejected', title: 'Rejected'},
        {id: 'no response', title: 'No Response'}
    ];

    useEffect(() => {
        logger.logPageView('Job Posting', '/job-tracker');
        fetchUserSettings();
    }, []);

    useEffect(() => {
        if (noResponseWeeks !== null) {
            fetchJobs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noResponseWeeks]);

    const fetchUserSettings = async () => {
        try {
            const settings = await apiService.getCurrentUserSettings();
            setNoResponseWeeks(settings.no_response_week || 6);
        } catch (error) {
            console.error('Error fetching user settings:', error);
            // Default to 6 weeks if settings can't be fetched
            setNoResponseWeeks(6);
        }
    };

    useEffect(() => {
        if (searchTerm) {
            const filtered = jobs.filter(job =>
                job.company.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredJobs(filtered);
        } else {
            setFilteredJobs(jobs);
        }
    }, [searchTerm, jobs]);

    const isJobOlderThanThreshold = (lastActivity, weeks) => {
        if (!lastActivity || !weeks) return false;

        const lastActivityDate = new Date(lastActivity);
        const today = new Date();
        const diffTime = Math.abs(today - lastActivityDate);
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

        return diffWeeks >= weeks;
    };

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllJobs();

            // Auto-move old jobs to "no response" if threshold is set
            if (noResponseWeeks && response) {
                const updatedJobs = await Promise.all(response.map(async (job) => {
                    // Only check jobs that aren't already in "no response" or "rejected" status
                    if (job.job_status !== 'no response' &&
                        job.job_status !== 'rejected' &&
                        isJobOlderThanThreshold(job.last_activity, noResponseWeeks)) {

                        try {
                            // Update job status to "no response"
                            await apiService.updateJob({
                                ...job,
                                job_status: 'no response'
                            });

                            return {...job, job_status: 'no response'};
                        } catch (error) {
                            console.error(`Error updating job ${job.job_id}:`, error);
                            return job;
                        }
                    }
                    return job;
                }));

                setJobs(updatedJobs);
                // Check for completed same-day interviews after a short delay
                setTimeout(() => checkForCompletedInterviews(updatedJobs), 500);
            } else {
                setJobs(response || []);
                // Check for completed same-day interviews after a short delay
                setTimeout(() => checkForCompletedInterviews(response || []), 500);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const getJobsByStatus = (status) => {
        return filteredJobs.filter(job => job.job_status === status);
    };

    const handleJobClick = (job) => {
        selectJob(job.job_id);
        navigate(`/job-details/${job.job_id}`);
    };

    const handleAddJob = () => {
        navigate('/job-form');
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const {draggableId, destination} = result;
        const jobId = parseInt(draggableId);
        const newStatus = destination.droppableId;

        const jobToUpdate = jobs.find(job => job.job_id === jobId);
        if (jobToUpdate && jobToUpdate.job_status !== newStatus) {
            try {
                await apiService.updateJob({
                    ...jobToUpdate,
                    job_status: newStatus
                });

                setJobs(jobs.map(job =>
                    job.job_id === jobId
                        ? {...job, job_status: newStatus}
                        : job
                ));
            } catch (error) {
                console.error('Error updating job status:', error);
            }
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleExport = async () => {
        try {
            const response = await apiService.exportJobs();
            const { job_export_file } = response;

            // Download file with authentication
            await apiService.downloadFile(`/v1/files/exports/${job_export_file}`, job_export_file);

        } catch (error) {
            console.error('Error exporting jobs:', error);
            alert('Failed to export jobs');
        }
    };

    return (
        <div className="page">
            <div className="header-container">
                <h1 className="page-title">Job Posting</h1>
                <div className="header-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button onClick={clearSearch} className="clear-search">
                                ✕
                            </button>
                        )}
                    </div>
                    <button onClick={handleAddJob} className="action-button">
                        + Add Job
                    </button>
                    <ExportMenu label="Export Jobs" onExport={handleExport} />
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                {loading ? (
                    <div className="loading">Loading jobs...</div>
                ) : (
                    <div className="job-columns">
                        {columns.map(column => {
                            const columnJobs = getJobsByStatus(column.id);
                            return (
                                <div key={column.id} className="job-column">
                                    <div className="column-header">
                                        <h3>{column.title}</h3>
                                        <span className="job-count">
                      {columnJobs.length} {columnJobs.length === 1 ? 'Job' : 'Jobs'}
                    </span>
                                    </div>
                                    <Droppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`column-content ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                                            >
                                                {columnJobs.map((job, index) => (
                                                    <JobCard
                                                        key={job.job_id}
                                                        job={job}
                                                        index={index}
                                                        onClick={() => handleJobClick(job)}
                                                    />
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DragDropContext>

            {/* Post-Interview Scoring Modal */}
            {postInterviewModal && (
                <div className="modal-overlay">
                    <div className="post-interview-modal">
                        <div className="modal-content">
                            <p>
                                How did your interview go with <strong>{postInterviewModal.job.company}</strong> that
                                you had scheduled from {formatTime12Hour(postInterviewModal.start_time)} - {formatTime12Hour(postInterviewModal.end_time)} today?
                            </p>
                            <p>Would you like to score it?</p>
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleDismissInterviewPrompt} className="modal-btn dismiss-btn">
                                No
                            </button>
                            <button onClick={handleScoreInterview} className="modal-btn score-btn">
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobTracker;