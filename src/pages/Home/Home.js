import React, { useEffect } from 'react';
import logger from '../../utils/logger';
import './Home.css';

const Home = () => {
    useEffect(() => {
        logger.logPageView('Home', '/');
    }, []);

    return (
        <div className="page">

            {/* ── Welcome Header ────────────────────────────────── */}
            <div className="home-header">
                <div className="home-title-block">
                    <span className="home-welcome-text">Welcome to</span>
                    <img src="/job_track_now-lg.png" alt="Job Track Now" className="job-track-now" />
                </div>
                <img src="/logo_only.png" alt="Job Track Now" className="home-logo" />
            </div>

            {/* ── Content Sections ──────────────────────────────── */}
            <div className="home-content">

                {/* Section 1 ── What even is this thing? */}
                <div className="home-section">
                    <h2 className="home-section-title">What even is this thing?</h2>
                    <div className="home-section-body">
                        <img src="/job_tool.png" alt="Job tracking tool" className="home-img-right" />
                        <p className="p-block">
                            This is a comprehensive job tracking application tool built with a React frontend,
                            FastAPI Python backend, and PostgreSQL database.  This full-stack application helps
                            you manage job opportunities throughout the hiring process with features for tracking
                            applications, managing contacts, scheduling interviews, and organizing notes. It also
                            includes a number of AI assistance for presenting your best self, which includes:
                            resume rewriting tailored to job, cover letters, and researched company reporting,
                            resume feedback and tips and other tools. Highly customizable to suit your personal
                            preference and easily executed all within a Docker stack on any platform OS.
                        </p>
                    </div>
                </div>

                {/* Section 2 ── The current state of things */}
                <div className="home-section">
                    <h2 className="home-section-title">The current state of things</h2>
                    <div className="home-section-body">
                        <img src="/ats_wheel.png" alt="Applicant Tracking System" className="home-img-left" />
                        <p className="p-block">
                            These are strange times and AI has made a big impact in the hiring process for
                            software engineer positions. Every company posting a job opportunity receives thousands
                            of applicants, due to so many job hunting services that use AI to rewrite resumes and
                            do mass submissions.  Often this results in completely unqualified candidates submitted
                            with false information and incapable of doing the job posted.  So companies have had
                            to adapt in order to handle the volume of processing through submissions and all of
                            the noise to find the real talent. Companies have taken a few different approaches to
                            solve this problem, but I would say the majority of companies at least start with also employing an AI solution that involves
                            Applicant Tracking System (ATS), which will collect, scan, rank and filter job
                            applications based on keywords and qualifications. This is an automated step that
                            removes 90% or more of the job applicants from being considered for the job position.
                            If you have the skills and just want to get to the point where you have the
                            opportunity to talk to an actual person, then this is the tool that can help make that
                            happen.  On the other hand, if your trying to present yourself as something more than
                            you really are, you will struggle with this tool and it would be unlikely you succeed.
                            If you are using the same resume for every job submission, you'll likely see a contact
                            rate of around 3-5% of the total jobs submitted to.  How can I even say that not
                            knowing what your resume looks like?  You can be extremely talented with tons of
                            experience, but you can only fit so many words into a resume.  If you don't score at
                            least 90% or higher, why would a company bother talking to you when they are plenty
                            that do.
                        </p>
                    </div>
                </div>

                {/* Section 3 ── What this tool actually does */}
                <div className="home-section">
                    <h2 className="home-section-title">What this tool actually does</h2>
                    <div className="home-section-body">
                        <img src="/job_search-cloud.png" alt="Job search" className="home-img-right" />
                        <p className="p-block">
                            This tool was created with two main goals in mind, the first and obvious thing is
                            that it helps you organize and keep track of all the communications, interviews and
                            details that are part of the hiring process.  Especially with such a low callback
                            rate, submitting to more jobs increases your odds of getting hired, and it can get
                            confusing keeping track of information on each company your talking to.  The second
                            thing it does, which in the ways things are now, is absolutely essential for any hope
                            in getting hired - which is that it not only helps present the best representation of
                            you, but also insures your key skills that align with what a company is looking for,
                            are brought to the front and highlighted.  It helps with wording to include keywords
                            from the job posting, so that you do have the opportunity to talk with someone.  It
                            can customize your resume so that it is tailored specifically to target a job posting.
                            It will leverage AI to use more professional wording to clearly convey your skills and
                            capabilities. While it does have specific instruction not to fabricate or manufacture
                            experience beyond that incuded in your resume, it can widen areas that are included.
                            The goal of this tool is to simply get you started talking with someone
                            and keep all the data points easily referenced for progressing through the hiring
                            process.  Ultimately, it's still up to you, but this will hopefully get you seen and
                            basking in the glow of a perfect light.
                        </p>

                    </div>
                </div>

                {/* Section 4 ── Professional services do the same thing */}
                <div className="home-section">
                    <h2 className="home-section-title">Professional services do the same thing</h2>
                    <div className="home-section-body">
                        <img src="/consulting.jpg" alt="Professional consulting" className="home-img-left" />
                        <p className="p-block">
                            You can definitely opt to try one of the many professional services out there and
                            they will rewrite your resume for you and give you a detailed list of things to change
                            on LinkedIn and do mass mailings to contacts in hundreds of companies.  It might work
                            out great for you and if you have the funds available, then it certainly couldn't hurt
                            to try... well, other than time... and money... and... I know I tried a professional
                            service like that, with my own assigned agent.  They had some good insights and tips,
                            but after all is
                            said and done, the only thing I really valued was their tool for tracking jobs.  I
                            ended up re-writing my resume, which nobody knows my work history as well as I do,
                            after which I immediately got more call backs.  I took the things I liked best about
                            their job tracking tool and then took it further and added things I thought were
                            missing from it.  I tried a couple of these professional services and they are a
                            business trying to make a profit like everyone else and you proportionally get what
                            you pay for.  With some service costing upwards of $5000, for me personally, it
                            wasn't worth the cost, and that cost comes at the worst possible timing, as your
                            revenue stream is gone and all you have is your nest egg.  I would recommend getting
                            help anywhere you can, but also don't let that help eat up your time and efforts.  If
                            your not getting anything out of it, move on to something that will.
                        </p>
                    </div>
                </div>

                {/* Section 5 ── What I hope you get out of this */}
                <div className="home-section">
                    <h2 className="home-section-title">What I hope you get out of this</h2>
                    <div className="home-section-body">
                        <img src="/overwhelmed.jpg" alt="Job search stress" className="home-img-right" />
                        <p className="p-block">
                            Searching for a job sucks, there is little difference of opinion on that topic.  I
                            takes a lot of time and effort submitting to jobs and interviewing with countless
                            people or taking tests about problems that have absolutely nothing to do with the real
                            world.  It is a full time job, only the stress level is higher and you don't get paid
                            for all your efforts.  I created this tool because I needed and used these resource
                            that this provides and found it to be invalueable for me.  I hope that it makes this
                            job search process less painful for you and helps you to meet your professional goals.
                            I wish you every good fortune and prosperous opportunies your way, best of luck and
                            keep plugging away and it will pay off.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Home;
