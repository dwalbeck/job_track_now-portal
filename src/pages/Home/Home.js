import React, {useEffect} from 'react';
import logger from '../../utils/logger';

const Home = () => {
    useEffect(() => {
        logger.logPageView('Home', '/');
    }, []);

    return (
        <div className="page">
            <div className="header-container">
                <h1 className="page-title">Home</h1>
            </div>

            <p>Welcome to the Job Tracker application.</p>
        </div>
    );
};

export default Home;