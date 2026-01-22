import React, { useState } from 'react';
import './Features.css';

const featuresData = [
    {
        title: "Job posting tracking and organization through 4 universal stages",
        description: "All job postings are organized by 4 classifications, which are: Applied, Interviewing, Rejected and No Response. Jobs are each represented by a summary card that contains key information, allowing for quick reference across many jobs at a glance. As a job is added, it is automatically placed into the first category, \"Applied\" and each job summary card can easily be dragged and dropped between columns at any time. Each summary card contains information that is automatically updated, such days from last communication, appointment dates and more."
    },
    {
        title: "Job qualifications and keywords extracted and individually selectable for approval / removal",
        description: "The first step in rewriting a resume, will have AI extract job qualifications from the job posting, and then select keywords from the qualifications. The user is then presented with the qualifications with each keyword highlighted, where they have the opportunity to click on any keyword to upgrade it to a focused keyword or click on it twice to remove it. Users can also add unselected word(s) to add them as keywords. Keywords are used as points of intentional effort to include in the resume rewrite."
    },
    {
        title: "Resume custom modified from baseline by AI and tailored to the Job Posting with reversible edits",
        description: "Once the keywords are settled and approved, AI then goes to work rewriting the resume to include those keywords within the content seamlessly. When completed, the user is presented with two views of the resume side-by-side, on the left is the original baseline and next to it is the modified version. Each change made is highlighted in orange and can be clicked on to revert back to its original state. Additionally content that was removed is highlighted in red, which can also be clicked on to add it back in. This gives users complete control over any changes and content of their resume."
    },
    {
        title: "Automatic AI generated cover letter creation specific to Job posting",
        description: "A cover letter can be generated automatically by AI, where it is written specifically for that job posting. Users can select from several different tones and lengths that the letter will be written conforming to. The user also has the ability to give any additional instruction to the AI to be applied in the writing of the cover letter. The cover letter is then displayed and can be downloaded or directly copied from the viewer."
    },
    {
        title: "AI researched company information report generation with interview tips",
        description: "For each job posting, you have the option to have a report generated and researched on the company. This report includes information on company financials, technology stack, history and recent news, along with likely question or interview situations and how to handle them. It also includes several STARS formatted example, as well as questions you can bring up. It's not only information on the company, but an interview guide to help prepare the user."
    },
    {
        title: "AI tools that will rewrite sentences and paragraphs with full explanation of alterations",
        description: "One of the tools available, is the ability to enter a sentence or paragraph and have AI word it to be clear, concise and use professional terminology. It retains the meaning and intent of the original text, while refining it to be presented in an easily consumable language that uses correct grammar and what would be considered to be well spoken."
    },
    {
        title: "AI generated elevator pitch using job posting description and resume content",
        description: "Another tool available is the elevator pitch, where AI will read through your resume and optionally the job posting, to write a hyper focused sales pitch that can be delivered if asked \"why should we hire you?\". Also great if you find yourself with a decision makers attention, but only a short amount of time to show your value and what you can contribute to that company."
    },
    {
        title: "All data is exportable per section",
        description: "Each section of the tool has the ability to export the data from the database into a CSV file. This includes job postings, contacts, notes, calendar appointments and resumes, which can be used as a backup or applied however the user wants to use it. Know that efforts taken to track various data points in your job search, is not locked into having to use this tool."
    },
    {
        title: "Supports docx, odt, pdf and html file formats",
        description: "File conversion is a necessary part of this process in order to be able to display changes to the end user, as well as be able to have AI easily consume content. Conversions from various formats to HTML and Markdown are not equal and the only commonality across formats is that varying degrees of styling is lost in conversion. This tool works with the common formats of Docx, Odt, PDF and HTML (Docx is recommended) and allows the method of conversion to be changed to the users preference in the settings. Third party solutions are also available to use with subscription key, that can be more accurate."
    },
    {
        title: "Wysiwyg editor for making manual changes and adjustments to resume or cover letters",
        description: "By default this tool allows for direct editing of the HTML source code, which isn't as friendly or intuitive to do as it would be using an editor. TinyMCE is one of the available online text editors with full HTML formatting support and can be used for any editing of resumes or cover letters. TinyMCE does have a 30-day free trial period for a risk free evaluation of whether it's worth paying for to have the ease of editing available."
    },
    {
        title: "Configurable use with multiple conversion methods, including third party services",
        description: "Each conversion method has varying degrees of competency, but none are 100% with the end result. Rather than forcing a method that I personally deemed to be the best, I set my pick as the default, but allowed the user to use whatever method they feel is best. If a resume uses a lot of tables or graphics, then some methods are going to shine, while others fail miserably."
    },
    {
        title: "Automated configurable rotation of job posting status after given number of weeks",
        description: "Another setting that can be custom set is the number of weeks with no contact on a job posting, before that posting is then to be considered as \"No Response\". It's not uncommon for a company to automatically filter candidates out without notifying them and leave no point of contact to ask for status updates. It's also cumbersome to have to move a bunch of job cards from one column to another, so jobs are automatically moved following the time period that is set."
    },
    {
        title: "Contacts available both globally and per Job Posting",
        description: "The user can track contacts specific to a job and company, as well as become available in a contacts directory that includes all contacts. Contacts are also easily searchable using the dynamic search used throughout the sections. With each letter that is typed into the search box, non-matching entries are stripped away from the view, so that only matching entries remain. This makes searches highly effective and interactive to find the entry your looking for."
    },
    {
        title: "Generic notes used both globally and per Job Posting",
        description: "Notes can be created that contain any information that you want tracked. Maybe it's mentioning an email or phone call that took place, but having a chronological record that is attached to the job, definitely comes in handy and helps to keep the user well informed quickly. It's easy to get companies and jobs confused, especially when your actively interacting with several at once."
    },
    {
        title: "Calendar appointment both global and per Job",
        description: "Interviews can be scheduled on the calendar, where the users available becomes easily identifiable in a single view. Each appointment can help track participants and link used for video meetings and is a great place to make general notes specific to the interview. Appointments are shown on the Job Details page for job specific entries."
    },
    {
        title: "Calendar reminders with notification alerts",
        description: "Additionally the calendar can also have reminders set by the user that can be job specific or just general in nature. The user is notified when reminders are due and must be acknowledged before any site action can be resumed. While this isn't a perfect exactly timed system, it is enough to get help in remembering important items specific to a time/date."
    },
    {
        title: "Running job score total tracked using average across interview scores and posting score given",
        description: "Each interview can include a score, given by the user on a scale of 1 - 10, which works with the optional interest level that can be added with each job posting when added. Together these scores are averaged out to give an overall score for the job. This score can be used as a general indicator for a job and likelihood of it being a good match-up that results in a hiring offer."
    },
    {
        title: "Unlimited baseline resumes can be created and used",
        description: "The user can upload their current resume, which is converted into HTML and Markdown. This is then considered a baseline resume that acts as the starting point before modifying it to be tailored specific to a job posting. Users may have different versions of the resume that are each catered to specific job titles. Any baseline resume can be applied to any job posting or the designated default entry is used unless otherwise overridden."
    },
    {
        title: "Selection of LLM models to use for different actions is configurable to your preference",
        description: "All large language models (LLM) operate at different levels of capability, efficiency, cost and execution speed. Most of the tasks that use AI are configurable, allowing the user to select their model preference for each task. Currently this is limited to the LLM's available through OpenAI."
    },
    {
        title: "Intuitive, clean and easy to read display of information across all pages",
        description: "Great efforts were taken to try and make this tool just do what you would expect it to do in most cases, with the goal being that a user could use this tool without reading any instruction. It features many operational integrations, with each providing visual feedback, such as clickable items changing color or size and switching the pointer to a hand."
    },
    {
        title: "Dynamic searches that update display per character entered, makes identifying entries quick and easy",
        description: "Searching within the various sections becomes a real-time interactive experience for the user. As each letter is typed into the search box, any entry on the page that does not match the search text is removed from being displayed, leaving only the relevant entries. This makes searches quick and efficient to find the entry that your looking for. Clicking the box with the X will reset the page back to displaying all entries."
    },
    {
        title: "Free stuffed animal! ... I mean, you can use it with your favorite stuffed animal",
        description: null
    }
];

const Features = () => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    return (
        <div className="features-page">
            <div className="features-header">
                <h1 className="page-title">Features</h1>
            </div>

            <div className="features-list">
                {featuresData.map((feature, index) => (
                    <div
                        key={index}
                        className="feature-item"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <div className="feature-title">
                            <span className="feature-bullet"></span>
                            {feature.title}
                        </div>
                        {feature.description && (
                            <div className={`feature-description ${hoveredIndex === index ? 'visible' : ''}`}>
                                {feature.description}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Features;
