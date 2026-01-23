import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {JobProvider} from './context/JobContext';
import {ReminderProvider, useReminder} from './context/ReminderContext';
import Navigation from './components/Navigation/Navigation';
import TopBar from './components/TopBar/TopBar';
import ReminderAlert from './components/ReminderAlert/ReminderAlert';
import Home from './pages/Home/Home';
import JobTracker from './pages/JobTracker/JobTracker';
import JobDetails from './pages/JobDetails/JobDetails';
import JobForm from './components/JobForm/JobForm';
import Contacts from './pages/Contacts/Contacts';
import ContactDetails from './pages/ContactDetails/ContactDetails';
import ContactForm from './components/ContactForm/ContactForm';
import Calendar from './pages/Calendar/Calendar';
import CalendarForm from './components/CalendarForm/CalendarForm';
import Notes from './pages/Notes/Notes';
import NotesForm from './components/NotesForm/NotesForm';
import Documents from './pages/Documents/Documents';
import Resume from './pages/Resume/Resume';
import ResumeForm from './pages/ResumeForm/ResumeForm';
import ViewResume from './pages/ViewResume/ViewResume';
import EditResume from './pages/EditResume/EditResume';
import ManuallyEditResume from './pages/ManuallyEditResume/ManuallyEditResume';
import CoverLetter from './pages/CoverLetter/CoverLetter';
import CreateCoverLetter from './pages/CreateCoverLetter/CreateCoverLetter';
import Personal from './pages/Personal/Personal';
import Tools from './pages/Tools/Tools';
import UserSettings from './pages/UserSettings/UserSettings';
import GeneralSettings from './pages/GeneralSettings/GeneralSettings';
import JobAnalysis from './pages/JobAnalysis/JobAnalysis';
import OptimizedResume from './pages/OptimizedResume/OptimizedResume';
import CompanyResearch from './pages/CompanyResearch/CompanyResearch';
import ViewCompanyReport from './pages/ViewCompanyReport/ViewCompanyReport';
import Login from './pages/Login/Login';
import Callback from './pages/Callback/Callback';
import Features from './pages/Features/Features';
import Screenshots from './pages/Screenshots/Screenshots';
import Documentation from './pages/Documentation/Documentation';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import logger from './utils/logger';
import './styles/App.css';

const AppContent = () => {
    const {activeReminder, dismissReminder} = useReminder();

    return (
        <Router>
            <div className="app">
                <Navigation/>
                <div className="app-right">
                    <TopBar/>
                    <div className="main-content">
                        <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/callback" element={<Callback/>}/>
                        <Route path="/" element={<Home/>}/>
                        <Route path="/home/features" element={<Features/>}/>
                        <Route path="/home/screenshots" element={<Screenshots/>}/>
                        <Route path="/home/documentation" element={<Documentation/>}/>

                        {/* Protected routes */}
                        <Route path="/job-tracker" element={<PrivateRoute><JobTracker/></PrivateRoute>}/>
                        <Route path="/job-details/:id" element={<PrivateRoute><JobDetails/></PrivateRoute>}/>
                        <Route path="/job-form" element={<PrivateRoute><JobForm/></PrivateRoute>}/>
                        <Route path="/job-form/:id" element={<PrivateRoute><JobForm/></PrivateRoute>}/>
                        <Route path="/contacts" element={<PrivateRoute><Contacts/></PrivateRoute>}/>
                        <Route path="/contact-details/:id" element={<PrivateRoute><ContactDetails/></PrivateRoute>}/>
                        <Route path="/contact-form" element={<PrivateRoute><ContactForm/></PrivateRoute>}/>
                        <Route path="/contact-form/:id" element={<PrivateRoute><ContactForm/></PrivateRoute>}/>
                        <Route path="/calendar" element={<PrivateRoute><Calendar/></PrivateRoute>}/>
                        <Route path="/calendar-form" element={<PrivateRoute><CalendarForm/></PrivateRoute>}/>
                        <Route path="/calendar-form/:id" element={<PrivateRoute><CalendarForm/></PrivateRoute>}/>
                        <Route path="/notes" element={<PrivateRoute><Notes/></PrivateRoute>}/>
                        <Route path="/notes-form" element={<PrivateRoute><NotesForm/></PrivateRoute>}/>
                        <Route path="/notes-form/:id" element={<PrivateRoute><NotesForm/></PrivateRoute>}/>
                        <Route path="/documents" element={<PrivateRoute><Documents/></PrivateRoute>}/>
                        <Route path="/resume" element={<PrivateRoute><Resume/></PrivateRoute>}/>
                        <Route path="/resume-form" element={<PrivateRoute><ResumeForm/></PrivateRoute>}/>
                        <Route path="/resume-form/:id" element={<PrivateRoute><ResumeForm/></PrivateRoute>}/>
                        <Route path="/view-resume" element={<PrivateRoute><ViewResume/></PrivateRoute>}/>
                        <Route path="/edit-resume" element={<PrivateRoute><EditResume/></PrivateRoute>}/>
                        <Route path="/manually-edit-resume" element={<PrivateRoute><ManuallyEditResume/></PrivateRoute>}/>
                        <Route path="/cover-letter" element={<PrivateRoute><CoverLetter/></PrivateRoute>}/>
                        <Route path="/create-cover-letter" element={<PrivateRoute><CreateCoverLetter/></PrivateRoute>}/>
                        <Route path="/personal" element={<PrivateRoute><Personal/></PrivateRoute>}/>
                        <Route path="/tools" element={<PrivateRoute><Tools/></PrivateRoute>}/>
                        <Route path="/job-analysis/:id" element={<PrivateRoute><JobAnalysis/></PrivateRoute>}/>
                        <Route path="/optimized-resume/:id" element={<PrivateRoute><OptimizedResume/></PrivateRoute>}/>
                        <Route path="/company-research" element={<PrivateRoute><CompanyResearch/></PrivateRoute>}/>
                        <Route path="/company-report/:id" element={<PrivateRoute><ViewCompanyReport/></PrivateRoute>}/>
                        <Route path="/settings/user" element={<PrivateRoute><UserSettings/></PrivateRoute>}/>
                        <Route path="/settings/general" element={<PrivateRoute><GeneralSettings/></PrivateRoute>}/>
                        </Routes>
                    </div>
                </div>

                {activeReminder && (
                    <ReminderAlert
                        reminder={activeReminder}
                        onDismiss={dismissReminder}
                    />
                )}
            </div>
        </Router>
    );
};

function App() {
    useEffect(() => {
        logger.info('Job Tracker Portal application started', {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });

        // Log any unhandled errors
        const handleError = (event) => {
            logger.logError(event.error, 'Unhandled application error');
        };

        const handleUnhandledRejection = (event) => {
            logger.error('Unhandled promise rejection', {
                reason: event.reason,
                type: 'unhandled_rejection'
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    return (
        <JobProvider>
            <ReminderProvider>
                <AppContent/>
            </ReminderProvider>
        </JobProvider>
    );
}

export default App;