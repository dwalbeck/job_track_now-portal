import React, {useState, useEffect, useRef, useCallback} from 'react';
import logger from '../../utils/logger';
import './Documentation.css';

const tocData = [
    {
        id: 'quick-start',
        title: 'Quick Start with Docker',
        children: [
            {id: 'prerequisites', title: 'Prerequisites'},
            {id: 'step-by-step', title: 'Step-by-Step Setup'}
        ]
    },
    {
        id: 'usage',
        title: 'Usage',
        children: [
            {id: 'first-steps', title: 'First Steps'},
            {id: 'job-posting', title: 'Job Posting'},
            {id: 'resume', title: 'Resume'},
            {id: 'cover-letter', title: 'Cover Letter'},
            {id: 'and-the-rest', title: 'And the Rest'}
        ]
    },
    {
        id: 'service-details',
        title: 'Service Details',
        children: [
            {id: 'frontend-service', title: 'Frontend Service'},
            {id: 'backend-service', title: 'Backend Service'},
            {id: 'database', title: 'Database'}
        ]
    },
    {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        children: []
    },
    {
        id: 'tips',
        title: 'Tips',
        children: []
    }
];

// Flatten TOC to get all section IDs in order
const getAllSectionIds = () => {
    const ids = [];
    tocData.forEach(section => {
        ids.push(section.id);
        section.children.forEach(child => {
            ids.push(child.id);
        });
    });
    return ids;
};

const allSectionIds = getAllSectionIds();

const Documentation = () => {
    const [activeSection, setActiveSection] = useState('quick-start');
    const contentRef = useRef(null);
    const isScrollingToSection = useRef(false);

    useEffect(() => {
        logger.logPageView('Documentation', '/home/documentation');
    }, []);

    // Handle scroll to detect current section
    const handleScroll = useCallback(() => {
        if (isScrollingToSection.current || !contentRef.current) return;

        const container = contentRef.current;
        const containerRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;

        // Find the section that is currently most visible
        let currentSection = allSectionIds[0];
        let minDistance = Infinity;

        for (const sectionId of allSectionIds) {
            const element = document.getElementById(sectionId);
            if (!element) continue;

            const elementTop = element.offsetTop - scrollTop;

            // Check if section is near the top of the visible area (within top 30%)
            const threshold = containerHeight * 0.3;

            if (elementTop <= threshold && elementTop > -element.offsetHeight) {
                const distance = Math.abs(elementTop);
                if (distance < minDistance) {
                    minDistance = distance;
                    currentSection = sectionId;
                }
            }
        }

        // If we're near the bottom, activate the last section
        if (scrollTop + containerHeight >= container.scrollHeight - 50) {
            currentSection = allSectionIds[allSectionIds.length - 1];
        }

        if (currentSection !== activeSection) {
            setActiveSection(currentSection);
        }
    }, [activeSection]);

    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
        isScrollingToSection.current = true;

        const element = document.getElementById(sectionId);
        if (element && contentRef.current) {
            const containerTop = contentRef.current.getBoundingClientRect().top;
            const elementTop = element.getBoundingClientRect().top;
            const offset = elementTop - containerTop + contentRef.current.scrollTop - 20;
            contentRef.current.scrollTo({top: offset, behavior: 'smooth'});

            // Reset the flag after scrolling completes
            setTimeout(() => {
                isScrollingToSection.current = false;
            }, 500);
        } else {
            isScrollingToSection.current = false;
        }
    };

    return (
        <div className="page">
            <div className="header-container">
                <h1 className="page-title">Documentation</h1>
            </div>

            <div className="documentation-content">
                <div className="doc-sidebar">
                    <nav className="doc-toc">
                        {tocData.map(section => (
                            <div key={section.id} className="toc-section">
                                <div
                                    className={`toc-item toc-parent ${activeSection === section.id ? 'active' : ''}`}
                                    onClick={() => scrollToSection(section.id)}
                                >
                                    {section.title}
                                </div>
                                {section.children.map(child => (
                                    <div
                                        key={child.id}
                                        className={`toc-item toc-child ${activeSection === child.id ? 'active' : ''}`}
                                        onClick={() => scrollToSection(child.id)}
                                    >
                                        {child.title}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </nav>
                    <div className="doc-logo">
                        <img src="/job_track_now.png" alt="Job Track Now" />
                    </div>
                </div>

                <div className="doc-main" ref={contentRef}>
                    {/* Quick Start with Docker */}
                    <section id="quick-start">
                        <h2>Quick Start with Docker</h2>

                        <div id="prerequisites">
                            <h3>Prerequisites</h3>

                            <h4>Software</h4>
                            <ul>
                                <li><strong>Docker</strong> (v20.10+) or <strong>Docker Desktop</strong> (4.43.2)</li>
                                <li><strong>Docker Compose</strong> (v2.0+) (Included in Docker Desktop)</li>
                                <li><strong>Git</strong> (for cloning the repository or you can just download the zip file)</li>
                            </ul>

                            <h4>Service Subscriptions</h4>
                            <ul>
                                <li>
                                    <strong>OpenAI Key</strong> (for customizing resume/cover letters) A fair amount of functionality will require having this key, but you can sign-up for an account and only put $5 towards
                                    it and it will last for well over a month. Create an account at <a href="https://auth.openai.com/create-account/" target="_blank" rel="noopener noreferrer">OpenAI website</a>, during
                                    which you can also create an API key. If you lost, skipped or forgot your API key, you can create new ones at
                                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API Keys</a>
                                </li>
                                <li>
                                    <strong>ConvertAPI</strong> (optional) is a method for converting between formats. It is by far the most accurate and best conversion method from a <strong>docx</strong> source that
                                    I've found. While they claim to convert between a large number of formats, honestly I would only recommend it for docx files. Other formats either don't work or are such poor quality
                                    conversion that you won't want to use it. Using docx and this method will produce the best conversions by far. You can sign-up for a 30-day free trial at
                                    <a href="https://www.convertapi.com/a/signup" target="_blank" rel="noopener noreferrer">ConvertApi</a> and you can find the API key at
                                    <a href="https://www.convertapi.com/a/authentication" target="_blank" rel="noopener noreferrer">ConvertApi API key</a> where you can use pre-existing keys made or create a new one - any will work.
                                </li>
                                <li>
                                    <strong>TinyMCE</strong> (optional) is a great wysiwyg text editor. At one point this was free to use, but I guess those days are gone. You do however get a 30-day free trial to use,
                                    which I recommend doing. Sign-up at <a href="https://www.tiny.cloud/" target="_blank" rel="noopener noreferrer">TinyMCE</a>, after which you will need to generate a key to use at
                                    <a href="https://www.tiny.cloud/my-account/jwt/" target="_blank" rel="noopener noreferrer">Tiny JWT</a>. If you want to make small edits to your resume or cover letters, then I highly
                                    recommend using this tool.
                                </li>
                            </ul>
                        </div>

                        <div id="step-by-step">
                            <h3>Step-by-Step Setup</h3>

                            <p><strong>1. Clone the Repository</strong></p>
                            <pre><code>git clone git@github.com:dwalbeck/job_track_now.git
cd job_track_now</code></pre>

                            <p><strong>2. Configure Environment Variables</strong></p>
                            <pre><code>cp ./job_track_now-api/env.example ./job_track_now-api/.env
cp ./job_track_now-portal/env.example ./job_track_now-portal/.env
# for Windows and Mac users
cp ./job_track_now-api/env.example-win ./job_track_now-api/.env
cp ./job_track_now-portal/env.example-win ./job_track_now-portal/.env</code></pre>

                            <p><strong>3. Customize Configuration</strong></p>
                            <p>Use your preferred text editor to modify the settings to your preference. Everything is setup to simply work for your OS based on which env.example file you used. Changing URL's, DB name,
                                DB user, DB password can potentially break things, so make sure it's worth it and that you understand how to fix things should things go bad. Remember, you can also change any setting you
                                want later at any time as well.</p>

                            <p><strong>4. Build and Start All Services</strong></p>
                            <pre><code># To both build the services and start them
docker compose up --build -d

# Or you can do my preference, which is build then start
docker compose build
docker compose up -d

# Or for Windows OS and MacOS
docker compose -f docker-compose-win.yml up --build -d

# or separately
docker compose -f docker-compose-win.yml build
docker compose -f docker-compose-win.yml up -d</code></pre>

                            <p><strong>5. Edit DNS Routing</strong></p>
                            <pre><code># Skip this step for Windows and MacOS
echo "172.20.0.5      jobtracknow.com
172.20.0.10     api.jobtracknow.com
172.20.0.15     psql.jobtracknow.com" &gt;&gt; /etc/hosts</code></pre>

                            <p><strong>6. Verify Services are Running</strong></p>
                            <pre><code>docker compose ps

# You should see the following:
api.jobtracknow.com      job_track_now-backend    "python -m uvicorn a..."   Up (healthy)
portal.jobtracknow.com   job_track_now-frontend   "/usr/local/bin/dock..."   Up (healthy)
psql.jobtracknow.com     postgres:12              "docker-entrypoint.s..."   Up (healthy)</code></pre>

                            <p><strong>7. Access the Application</strong></p>
                            <p>For Linux:</p>
                            <ul>
                                <li><strong>Frontend</strong>: https://jobtracknow.com</li>
                                <li><strong>Backend API</strong>: https://api.jobtracknow.com</li>
                                <li><strong>API Documentation</strong>: https://api.jobtracknow.com/docs</li>
                            </ul>
                            <p>For Windows and MacOS:</p>
                            <ul>
                                <li><strong>Frontend</strong>: http://localhost (preferred) or http://localhost:3000</li>
                                <li><strong>Backend API</strong>: http://localhost:8000</li>
                                <li><strong>API Documentation</strong>: http://localhost:8000/docs</li>
                            </ul>
                        </div>
                    </section>

                    {/* Usage */}
                    <section id="usage">
                        <h2>Usage</h2>
                        <p>This section will quickly cover some key points for operation and functional capabilities for each of the pages. It would be good to read through the <strong>First Steps</strong> listing and the
                            remaining pages can be read should you have a question on a page, but you could skip reading the rest and still be able to operate things.</p>

                        <div id="first-steps">
                            <h3>First Steps</h3>
                            <ul>
                                <li>Upon first starting up the application, your DB will be empty and you won't be able to login. So creating a new user account is pretty simple. On the left side menu at the bottom you'll
                                    see <strong>Settings</strong>, where you'll move your mouse cursor to be, and then select <strong>User</strong> from the sub-menu.</li>
                                <li>Once you create a user, you will no longer be able to access this page without being logged in, so make sure you at the bare minimum fill in the <strong>username</strong> and
                                    <strong>password</strong> fields.</li>
                                <li>You should now be able to login using the credentials that you defined in your profile.</li>
                                <li>Many pages and features are dependent upon having a valid OpenAI AI key, so in the <strong>Settings</strong> sub-menu click on <strong>General</strong> and be sure to add your OpenAI API
                                    Key. Optionally you can add other keys for upgraded capabilities as well.</li>
                                <li>Next you'll need to upload your current resume (referred to as a baseline resume), which can be formatted as odt, docx, pdf or html. The formatting of my resume worked best as docx, but
                                    this will be dependent on how yours is formatted. A baseline resume is the starting point, which is then modified to cater to a job posting. You can create a baseline resume by selecting
                                    the <strong>Resume</strong> menu option in the left side navigation menu.</li>
                                <li>While not required, I recommend editing your converted resume (which will be HTML formatted) to insure that it is styled the way you want.</li>
                                <li>You are now ready to start adding Job Postings, which is pretty straight forward, and your off to the races.</li>
                            </ul>
                        </div>

                        <div id="job-posting">
                            <h3>Job Posting</h3>
                            <p>The Job Posting page is the main page that you'll use. Here you will add new jobs, which are automatically placed in the <strong>Applied</strong> column. You can drag and drop each card to any
                                column you want. Each of the four columns keeps a count at the top for reference. When using the search box, you'll notice that with each letter typed non-matching cards are removed. Each card
                                displays the time difference between when it was created and now, as well as the difference from the last contact. Job scoring is based on two things, the <strong>interest level</strong> and
                                <strong>outcome score</strong> from an interview, which is averaged for the score value.</p>
                            <p>Clicking on any card will take you to the Job Details page, where you have a summary of job information entered when you created the job. Once you customize a resume for the job, you'll
                                additionally see some stats. <strong>Keywords</strong> are skills or technologies, found in your resume and the job posting description. Keywords can also become <strong>Focused Keywords</strong>,
                                which are basically the same things, but given a bit more attention when rewriting your resume. The <strong>Baseline Score</strong> is the percentage of matching keywords from your baseline
                                resume and the job posting. Your <strong>Rewrite Score</strong> is the percentage after your resume has be rewritten. You can also add and view calendar appointments, contacts, reminders and
                                notes that are specifically related to the job posting. You can also edit or delete the job posting.</p>
                        </div>

                        <div id="resume">
                            <h3>Resume</h3>
                            <p>You can optimize your resume from the Job Details page by clicking on the <strong>Optimize Resume</strong> button. You'll notice that to the left of that button is the baseline resume that will be
                                used (your selected default), but should you wish to use a different one, simply click on it and select the one you want to use. The application will then pull the qualifications from the job
                                posting and grab all the keywords from it. This is then displayed on the next page and each keyword is highlighted in orange. Click on it once to make it a "focused keyword" and once more to
                                remove it from being selected. You can also select non-highlighted word(s) to add them as keywords. Once your happy with the keywords, click <strong>Finalize</strong> to have it start rewriting
                                your resume. Depending on the LLM model chosen, this can take a while to complete, so be patient. Upon completion, you be shown your baseline resume on the left and rewritten resume on the right.
                                Changes are highlighted in green on the right, and items removed are shown highlighted in orange on the left side. Click on any highlighted text to remove it and revert it back to it's original
                                state. Finally, click <strong>Accept Changes</strong> and your resume is complete and ready to be downloaded, which you can do from the Job Details page.</p>
                            <p>The Resume section, is for managing all your resumes, which are separated into two groups - <strong>Baseline</strong> and <strong>Customized for Jobs</strong>. Regardless of the file format for a
                                resume you upload, it is converted into a markdown version. This makes it easier for the LLM models to interact with, and you can directly edit the markdown for baseline resumes. Resumes can be
                                <strong>cloned</strong> (copied) or deleted and the <strong>Tailor</strong> option let's you re-pick the keywords you want applied and then rewrites the resume again (overwriting the previous version).</p>
                        </div>

                        <div id="cover-letter">
                            <h3>Cover Letter</h3>
                            <p>On the Job Details page, you can select the <strong>Create Cover Letter</strong> button to generate a cover letter specific for that job posting. You can select the length that you want it,
                                as well as the overall tone of the letter. You also have the option to type in any additional instruction that you want included, for example: "Make three bullet points with examples on why
                                I'm the best fit for this job". You can generate or re-generate cover letters at will.</p>
                        </div>

                        <div id="and-the-rest">
                            <h3>And the Rest</h3>
                            <p>The Contacts, Calendar and Notes pages are all pretty self-explanatory and intuitive to use. On the Calendar pages, there will be a green dot on interviews that you have updated with an outcome
                                score. This is so you can easily view if you missed scoring an appointment. The Documents page is where your company reports are kept, but are also accessible from the Job Details page. You can
                                however request a company report for companies that do not have a job posting.</p>
                            <p>For the sections <strong>Job Posting</strong>, <strong>Contacts</strong>, <strong>Calendar</strong>, <strong>Notes</strong> and <strong>Resume</strong> you have the ability to export all the
                                records from the DB, for whatever reason. You can do this by clicking on the 3 dot collapsed menu icon on the top right of the page and then selecting the export option. This will dump the DB
                                contents to a CSV file that will automatically start downloading upon selection.</p>
                        </div>
                    </section>

                    {/* Service Details */}
                    <section id="service-details">
                        <h2>Service Details</h2>

                        <div id="frontend-service">
                            <h3>Frontend Service</h3>
                            <p><strong>What it does:</strong></p>
                            <ul>
                                <li>Serves the React application through the reverse proxy Nginx (Linux only)</li>
                                <li>Application is ran by using uvicorn with 4 workers on port 3000 (Windows and Mac)</li>
                                <li>Provides the user interface for all job tracking features</li>
                                <li>Handles client-side routing and state management</li>
                                <li>Manages authentication and validation</li>
                            </ul>
                            <p><strong>How it works:</strong></p>
                            <ul>
                                <li>For Linux users, the frontend uses the encrypted HTTPS layer and a fake domain using self-signed certificates. The website is accessed directly through Nginx, which simply points to
                                    the compiled files that are served up. Communication is done through HTTPS requests from the frontend application to the backend API, which can also connect to the DB and provides
                                    all the data and logic</li>
                                <li>For Windows and Mac users, the frontend runs using the React web server, which run on port 3000. This port is mapped to port 80 on your host machine so that it can be accessed without
                                    specifying the port. It communicates with the backend API service directly from the running Python service using port 8000.</li>
                            </ul>
                            <p><strong>Key Features:</strong></p>
                            <ul>
                                <li>Job management with drag-and-drop interface</li>
                                <li>Contact management and relationship tracking</li>
                                <li>Calendar scheduling for interviews and reminders</li>
                                <li>Notes and document organization</li>
                                <li>Real-time search and filtering</li>
                                <li>Resume customization and management</li>
                                <li>Cover letter generation</li>
                                <li>Company research report generation and interview tips</li>
                            </ul>
                        </div>

                        <div id="backend-service">
                            <h3>Backend Service</h3>
                            <p><strong>What it does:</strong></p>
                            <ul>
                                <li>Provides RESTful API endpoints for all data operations</li>
                                <li>Handles business logic and data validation</li>
                                <li>Manages database connections and transactions</li>
                                <li>Enforces authentication and validation for session management</li>
                            </ul>
                            <p><strong>How it works:</strong></p>
                            <ul>
                                <li>For Linux users, the API service is ran using uvicorn on port 7080. It also has Nginx setup as a reverse proxy that handles the fake domain name routing, as well as the SSL
                                    certificate, enabling all communications to be done over HTTPS.</li>
                                <li>For Windows and Mac users, the API service is accessed directly from the uvicorn process running on port 7080.</li>
                                <li>Common use on both setups is that it's able to connect to the DB and manages all data interactions. It also can connect to the OpenAI API to make requests to their large
                                    language models to have directed work completed. All requests return the necessary data back to the frontend, where it is then organized and displayed for consumption.</li>
                            </ul>
                        </div>

                        <div id="database">
                            <h3>Database</h3>
                            <p><strong>What it does:</strong></p>
                            <ul>
                                <li>Stores all application data in PostgreSQL tables</li>
                                <li>Provides ACID compliance for data integrity</li>
                                <li>Handles complex queries and relationships</li>
                                <li>Referenced across multi-stage OAuth2 workflow</li>
                            </ul>
                            <p><strong>How it works:</strong></p>
                            <ul>
                                <li><strong>Initialization</strong>: Automatically runs schema.sql on first startup</li>
                                <li><strong>Data Storage</strong>: Persistent storage using Docker volumes</li>
                                <li><strong>Connections</strong>: Accepts connections from backend service and is mapped to localhost:5432</li>
                            </ul>
                        </div>
                    </section>

                    {/* Troubleshooting */}
                    <section id="troubleshooting">
                        <h2>Troubleshooting</h2>
                        <h3>Common Issues</h3>

                        <p><strong>Page not found or just won't load</strong></p>
                        <p>So I didn't want to mess around with SSL certificates, which self-signed certs still have to be manually added or accepted in order to work. This application doesn't store anything
                            secret, so there isn't any need to do big security implementations. This being the case, access to the services uses standard non-encrypted HTTP. You may find that your browser has
                            automatically added the "S", which won't work, as the application isn't configured to use SSL. So verify that your using <strong>http://</strong> and NOT <strong>https://</strong></p>
                        <p>If you still are having issues, verify that all 3 services are actively running. More than likely you'll find that one failed to start. Still can't pull up the page? Try looking at
                            the logs files, they can provide some insight.</p>

                        <p><strong>Port Conflicts</strong></p>
                        <p>Insure that you don't have a locally installed version of PostgreSQL or another container running with PostgreSQL installed on it. Also make sure that you don't have a local install
                            of Apache2 or Nginx running, as by default they both bind to port 80 and likely other additional ports.</p>
                        <pre><code># Check what's using ports (Linux and MacOS)
lsof -i :80
lsof -i :8000
lsof -i :3000
lsof -i :5432

# On Windows you can execute the following from terminal or powershell
netstat -aon | findstr :80
netstat -aon | findstr :8000
netstat -aon | findstr :3000
netstat -aon | findstr :5432
# The last column displayed should be the process ID number or PID
tasklist | findstr &lt;PID&gt;</code></pre>

                        <p><strong>Database apiuser can't authenticate</strong></p>
                        <p>If you wisely decided to change the default password to use your own given password, it was the smart thing to do, however the Docker PostgreSQL image didn't seem to always set
                            the apiuser password correctly. This being the case, I added setting the password directly to the DB schema SQL that gets executed on creation. So it's quite likely that the
                            apiuser got set with the password of "change_me", but since you changed the password, it's trying to connect with a different value.</p>
                        <pre><code># Shell into the DB container
docker exec -it &lt;container_id&gt; bash

# Connect to PostgreSQL
psql -U apiuser jobtracker

# Change the password
ALTER ROLE apiuser WITH PASSWORD '&lt;your_password&gt;';</code></pre>

                        <p><strong>Database Connection Issues</strong></p>
                        <pre><code># Check if the Database is running
docker compose ps

# Check database logs for errors
docker compose logs db

# Restart database
docker compose restart db</code></pre>

                        <p><strong>Frontend Build Issues</strong></p>
                        <pre><code># Rebuild frontend
docker compose build --no-cache frontend

# For Windows and MacOS users
docker compose -f docker-compose-win.yml build --no-cache frontend</code></pre>

                        <p><strong>Backend Build Issues</strong></p>
                        <pre><code># Rebuild backend
docker compose build --no-cache backend

# For Windows and MacOS users
docker compose -f docker-compose-win.yml build --no-cache backend</code></pre>

                        <p><strong>Reset Everything</strong></p>
                        <pre><code># Stop all services
docker compose down

# Remove volumes (WARNING: This deletes all data)
docker compose down -v

# Rebuild from scratch
docker compose up --build</code></pre>
                    </section>

                    {/* Tips */}
                    <section id="tips">
                        <h2>Tips</h2>
                        <ul>
                            <li>Conversion between file formats is never 100% and whatever format you upload your first baseline resume in matters. I've found that if it's formatted as <strong>docx</strong>,
                                that file conversion works best. Regardless of the format it needs to be converted to markdown, which works better with the LLM models.</li>
                            <li>Your original resume file is also used as a template for formatting your modified resume (if downloading the docx format)</li>
                            <li>After your original resume has been formatted to markdown, I recommend manually editing the markdown to insure it's formatted as you want.</li>
                            <li>Play around with using different language models, as you'll notice a big difference in the time it takes to execute between the different versions. You can change the LLM used
                                for different operations in the <strong>Personal</strong> section</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Documentation;
