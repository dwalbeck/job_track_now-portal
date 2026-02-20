import React from 'react';
import {Draggable} from 'react-beautiful-dnd';
import {calculateDateSpan, calculateLastContact} from '../../utils/dateUtils';
import './JobCard.css';

const JobCard = ({job, index, onClick}) => {
    /**
     * Formats time from 24-hour to 12-hour format with am/pm
     * @param {string} hours - Hours in 24-hour format
     * @param {string} minutes - Minutes
     * @returns {string} Formatted time like "2:30pm" or "10:00am"
     */
    const formatTime12Hour = (hours, minutes) => {
        const hour = parseInt(hours, 10);
        const suffix = hour >= 12 ? 'pm' : 'am';
        const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight, and 13-23 to 1-11
        return `${hour12}:${minutes}${suffix}`;
    };

    /**
     * Determines if the appointment is upcoming and formats the display text
     * @returns {string|null} Formatted appointment text or null if no upcoming appointment
     */
    const getAppointmentReminder = () => {
        if (!job.start_date) {
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day for date comparison

        // Parse date without timezone conversion by splitting the date string
        const [year, month, day] = job.start_date.split('-').map(num => parseInt(num, 10));
        const appointmentDate = new Date(year, month - 1, day); // month is 0-indexed

        // Check if date is valid
        if (isNaN(appointmentDate.getTime())) {
            return null;
        }

        // Check if appointment is in the past
        if (appointmentDate < today) {
            return null;
        }

        // Check if appointment is today
        if (appointmentDate.getTime() === today.getTime()) {
            // For same-day appointments, always show the time (even if it has passed)
            // This keeps the interview visible on the card throughout the day
            if (job.start_time) {
                const [hours, minutes] = job.start_time.split(':');
                // Format time in 12-hour format with am/pm
                return `appt ${formatTime12Hour(hours, minutes)}`;
            }
            // If no time specified, show as today's appointment
            return 'appt today';
        }

        // Appointment is in the future - show date
        return `appt ${month}/${day}`;
    };

    const appointmentText = getAppointmentReminder();

    return (
        <Draggable draggableId={job.job_id.toString()} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`job-card ${snapshot.isDragging ? 'dragging' : ''}`}
                    onClick={onClick}
                >
                    <div className="title-row">
                        <div className="job-title">{job.job_title}</div>
                        {(job.starred || appointmentText) && (
                            <div className="appointment-reminder">
                                {job.starred && (
                                    <img src="/star-on.png" alt="Starred" className="card-star" />
                                )}
                                {job.starred && appointmentText && (
                                    <span className="card-star-spacer"> </span>
                                )}
                                {appointmentText && appointmentText}
                            </div>
                        )}
                    </div>
                    <div className="company-name">{job.company}</div>
                    <div className="last-contact">{calculateLastContact(job.last_activity)}</div>
                    <div className="bottom-row">
                        <div className="score-average">
                            {job.average_score !== null && job.average_score !== undefined
                                ? `Avg Score: ${job.average_score}`
                                : ''}
                        </div>
                        <div className="date-span">{calculateDateSpan(job.date_applied)}</div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default JobCard;