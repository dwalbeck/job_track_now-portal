import React, {useState, useEffect} from 'react';
import logger from '../../utils/logger';
import './Screenshots.css';

const screenshotData = [
    {
        section: "Job Posting",
        items: [
            {
                filename: "job-add_new.png",
                title: "Add Job Posting",
                description: "The form used for adding and editing job postings. The only required fields are the Company and Job Title, both of which are needed by the tool for other purposes. You have freedom " +
                    "with most fields, for example on the Salary field, you have the ability to enter any of these examples: $150,000.00 or 150K - 200K or $80/hr or 5 chicken/day. Additionally you can rate your " +
                    "interest level on a scale of 1 to 10, which will be applied to scoring."
            },
            {
                filename: "job-list.png",
                title: "List of Jobs",
                description: "The job listing page provides summary cards for each job posting, which contain information that is updated on each page load. This page is also searchable using dynamic interactive " +
                    "searching, as well as is where new jobs are added into the system. Clicking on any job summary card will take you to the Job Details page. Each summary card will show the Job Title and Company " +
                    "name, the average score, days since last communication and the time since the job was created."
            },
            {
                filename: "job_detail.png",
                title: "Job Details",
                description: "The job details page is your command center for the job posting, with all information available in a single view. Bulky items, such as the Posting URL and Job Description aren't " +
                    "displayed by default to save valuable space, but are easily accessible to view by using the buttons found on the right. All actions can be triggered from this page, such as creating an appointment, " +
                    "adding a contact, setting a reminder, making a note entry, optimizing a resume with a rewrite, creating a cover letter, generating a company report and more."
            },
            {
                filename: "job_analysis.png",
                title: "Job Analysis",
                description: "The job analysis page displays extracted qualifications from the job posting with AI-identified keywords highlighted. Users can click keywords to promote them to focus keywords " +
                    "(shown in green) or click twice to remove them. Additional words can be selected to add as keywords. This interactive keyword selection process ensures the resume rewrite targets the most relevant " +
                    "terms for the position."
            }
        ]
    },
    {
        section: "Resume",
        items: [
            {
                filename: "resume-add_new.png",
                title: "Add Baseline Resume",
                description: "Upload your existing resume to create a baseline version that serves as the starting point for job-specific customizations. Supported formats include DOCX, ODT, PDF, and HTML. The " +
                    "uploaded resume is converted to HTML and Markdown for AI processing while preserving the original formatting as much as possible."
            },
            {
                filename: "resume-list.png",
                title: "Resume List",
                description: "View and manage all your baseline resumes in one place. Each resume card shows the title and upload date. You can set a default resume to be used automatically when optimizing for job " +
                    "postings, or select a specific resume for each job. Multiple baseline resumes allow you to maintain different versions tailored to various job types or industries."
            },
            {
                filename: "resume_preview.png",
                title: "Resume Viewer",
                description: "Preview your resume in a clean, formatted view. The viewer displays the HTML-rendered version of your resume, allowing you to verify how it appears after conversion. From here you can " +
                    "download the resume in various formats or proceed to editing if changes are needed."
            },
            {
                filename: "resume_edit.png",
                title: "Edit Resume",
                description: "Make manual adjustments to your resume using the built-in editor. You can edit the HTML source directly or use the optional TinyMCE WYSIWYG editor for a more intuitive editing experience. " +
                    "Changes are saved and can be applied to future job applications."
            },
            {
                filename: "resume_comparison.png",
                title: "Resume Comparison",
                description: "After AI rewrites your resume, this side-by-side comparison view shows the original baseline on the left and the modified version on the right. Changes are highlighted in orange, and " +
                    "removed content appears in red. Click any highlighted change to revert it, giving you complete control over the final resume content."
            }
        ]
    },
    {
        section: "Cover Letter",
        items: [
            {
                filename: "cover_letter-new.png",
                title: "Create Cover Letter",
                description: "Generate a customized cover letter using AI that analyzes the job posting and your resume. Select from different tones (professional, casual, enthusiastic, informational) and lengths " +
                    "(short, medium, long) to match your preferences. Add optional custom instructions to guide the AI in creating the perfect cover letter for your application."
            },
            {
                filename: "cover_letter-list.png",
                title: "Cover Letter List",
                description: "Browse all generated cover letters organized by job posting. Each entry shows the associated company and creation date. Cover letters can be viewed, downloaded in various formats, or " +
                    "regenerated with different settings if the original doesn't meet your needs."
            }
        ]
    },
    {
        section: "Calendar",
        items: [
            {
                filename: "calendar-month.png",
                title: "Month View",
                description: "The monthly calendar view provides a broad overview of all scheduled appointments and reminders. Each day cell shows appointment indicators, making it easy to identify busy periods and " +
                    "available time slots at a glance. Click any day to view details or add new appointments."
            },
            {
                filename: "calendar-week.png",
                title: "Week View",
                description: "The weekly view displays appointments in a time-grid format, showing the duration and timing of each event. This view is ideal for planning your week and ensuring you don't have scheduling " +
                    "conflicts. Appointments are color-coded by type for quick identification."
            },
            {
                filename: "calendar-day.png",
                title: "Day View",
                description: "The daily view provides the most detailed look at your schedule, displaying each appointment with full details including participants, description, and video meeting links. Perfect for " +
                    "day-of preparation and reviewing upcoming interviews or calls."
            },
            {
                filename: "appointment-new.png",
                title: "Add Appointment",
                description: "Schedule interviews, phone calls, and other job-related appointments. Link appointments to specific job postings, add participants, set duration, and include video meeting links. After " +
                    "the appointment, record outcome scores and notes to track your interview performance over time."
            },
            {
                filename: "reminder-new.png",
                title: "Add Reminder",
                description: "Set reminders for important follow-ups, application deadlines, or any job search related tasks. Reminders can be linked to specific jobs or set as general reminders. When a reminder " +
                    "is due, a notification alert appears that must be acknowledged before continuing."
            }
        ]
    },
    {
        section: "Notes",
        items: [
            {
                filename: "note-new.png",
                title: "Add Note",
                description: "Create notes to track important information about your job search. Notes can be attached to specific job postings to maintain a chronological record of communications, insights, or " +
                    "action items. Keep detailed records of phone calls, emails, and any relevant observations."
            },
            {
                filename: "note-list.png",
                title: "Note List",
                description: "View all notes across your job search or filter by specific job posting. Notes are displayed with timestamps and associated job information, making it easy to review your history " +
                    "with any company. Use the dynamic search to quickly find specific notes."
            }
        ]
    },
    {
        section: "Contacts",
        items: [
            {
                filename: "contact-new.png",
                title: "Add Contact",
                description: "Add contacts you encounter during your job search, including recruiters, hiring managers, HR representatives, and other company employees. Store their contact information, role, " +
                    "and preferred communication method. Link contacts to specific job postings for easy reference."
            },
            {
                filename: "contact-list.png",
                title: "Contact List",
                description: "Access your complete directory of job search contacts. View contact details, associated companies, and communication history. The dynamic search makes finding specific contacts " +
                    "quick and easy, even with a large contact list."
            }
        ]
    },
    {
        section: "Documents",
        items: [
            {
                filename: "document-list.png",
                title: "Document List",
                description: "Access all your job search documents including resumes, cover letters, and company reports. Documents are organized by type and associated job posting. Download documents in " +
                    "your preferred format or view them directly in the browser."
            },
            {
                filename: "report-match.png",
                title: "Company Match",
                description: "Before generating a company report, verify the correct company match. The system searches for company information and presents potential matches with basic details. Select the " +
                    "correct company to ensure the generated report contains accurate and relevant information."
            },
            {
                filename: "company_report.png",
                title: "Company Report",
                description: "View AI-generated company research reports containing financial information, technology stack, company history, recent news, and interview preparation tips. Reports include " +
                    "STAR-formatted examples and suggested questions to ask during interviews, helping you prepare thoroughly."
            }
        ]
    },
    {
        section: "Interview",
        items: [
            {
                filename: "interview-mic_test.png",
                title: "Interview Mic Test",
                description: "After permission has been granted to use the users microphone, the screen is switched to a page where the mic can be verified.  Real-time visual feedback is displayed, so that the end user " +
                    "can verify that the mic that is selected is set for an adequate mic level and everything is actively working."
            },
            {
                filename: "interview-question.png",
                title: "Interview Question",
                description: "Each question for the interview process is spoken and heard through the users audio output.  Again visual real-time feedback is displayed while the question is being played as well as " +
                    "display in text for reference.  The user has control options to pause, stop or end the interview and additionally the record button is lit during recording of the users spoken answer. " +
                    "The recording is setup to detect a 2.5 second pause and will automatically stop and submit the answer for review.  Feedback is given and optionally may ask a follow-up question"
            },
            {
                filename: "interview_review.png",
                title: "Interview Review Report",
                description: "After completing the interview, a detailed report is generated, which includes each of the questions asked, the answer given and scoring on 6 different characteristics of the answer - those " +
                    "being: completeness, correctness, insight, clarity, understanding and bonus (extra points given for exceptional answers).  These tally to an overall score given for each question or follow-up question. " +
                    "All question are graphed at the end of the report as an aid to try and find trends for answers.  Feedback is also provided for each answer given."
            },
        ]
    },
];

// Flatten the data for easy navigation
const getAllScreenshots = () => {
    const allScreenshots = [];
    screenshotData.forEach(section => {
        section.items.forEach(item => {
            allScreenshots.push({
                ...item,
                section: section.section
            });
        });
    });
    return allScreenshots;
};

const Screenshots = () => {
    const allScreenshots = getAllScreenshots();
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentScreenshot = allScreenshots[currentIndex];
    const totalScreenshots = allScreenshots.length;

    useEffect(() => {
        logger.logPageView('Screenshots', '/home/screenshots');
    }, []);

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const goToNext = () => {
        if (currentIndex < totalScreenshots - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleListItemClick = (flatIndex) => {
        setCurrentIndex(flatIndex);
    };

    // Calculate flat index for list items
    const getFlatIndex = (sectionIndex, itemIndex) => {
        let flatIndex = 0;
        for (let i = 0; i < sectionIndex; i++) {
            flatIndex += screenshotData[i].items.length;
        }
        return flatIndex + itemIndex;
    };

    return (
        <div className="page">
            <div className="header-container">
                <h1 className="page-title">Screenshots</h1>
            </div>

            <div className="screenshots-content">
                <div className="screenshots-list">
                    {screenshotData.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="screenshot-section">
                            <div className="section-title">{section.section}</div>
                            {section.items.map((item, itemIndex) => {
                                const flatIndex = getFlatIndex(sectionIndex, itemIndex);
                                return (
                                    <div
                                        key={itemIndex}
                                        className={`screenshot-list-item ${flatIndex === currentIndex ? 'active' : ''}`}
                                        onClick={() => handleListItemClick(flatIndex)}
                                    >
                                        {item.title}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="screenshot-viewer">
                    <div className="screenshot-title">{currentScreenshot.title}</div>

                    <div className="screenshot-image-container">
                        {currentIndex > 0 && (
                            <div className="nav-hover-zone nav-hover-zone-left" onClick={goToPrevious}>
                                <img
                                    src="/left_arrow.png"
                                    alt="Previous"
                                    className="nav-arrow"
                                />
                            </div>
                        )}

                        <img
                            src={`/screenshots/${currentScreenshot.filename}`}
                            alt={currentScreenshot.title}
                            className="screenshot-image"
                        />

                        {currentIndex < totalScreenshots - 1 && (
                            <div className="nav-hover-zone nav-hover-zone-right" onClick={goToNext}>
                                <img
                                    src="/right_arrow.png"
                                    alt="Next"
                                    className="nav-arrow"
                                />
                            </div>
                        )}
                    </div>

                    <div className="screenshot-counter">
                        {currentIndex + 1} of {totalScreenshots}
                    </div>

                    <div className="screenshot-description">
                        {currentScreenshot.description}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Screenshots;
