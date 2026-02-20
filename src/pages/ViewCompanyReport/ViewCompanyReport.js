import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../../services/api';
import './ViewCompanyReport.css';

const ViewCompanyReport = () => {
    const { id } = useParams(); // company_id from URL
    const navigate = useNavigate();
    const location = useLocation();
    const [reportHtml, setReportHtml] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(true);

    // Get jobId from location state if navigated from Job Details
    const jobId = location.state?.jobId;

    const fetchCompanyReport = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getCompany(id);

            console.log('Company report response:', response);
            console.log('Report HTML length:', response.report_html?.length);
            console.log('Report HTML preview:', response.report_html?.substring(0, 200));

            setReportHtml(response.report_html || '<p>No report available</p>');
            setCompanyName(response.company_name || 'Company');
        } catch (error) {
            console.error('Error fetching company report:', error);
            alert('Failed to load company report. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCompanyReport();
    }, [fetchCompanyReport]);

    const handleDownloadReport = async () => {
        if (!reportHtml) {
            alert('No report content to download');
            return;
        }

        try {
            const response = await apiService.downloadCompanyReport(id);
            const filename = response.file_name;

            // Download file with authentication
            await apiService.downloadFile(`/v1/files/reports/${filename}`, filename);

            console.log('Report downloaded successfully');
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report. Please try again.');
        }
    };

    const handleGoBack = () => {
        if (jobId) {
            // If we came from Job Details, navigate back there
            navigate(`/job-details/${jobId}`);
        } else {
            // Otherwise, navigate to Documents page
            navigate('/documents');
        }
    };

    if (loading) {
        return (
            <div className="view-company-report-container">
                <h1>View Company Report</h1>
                <div className="loading">Loading company report...</div>
            </div>
        );
    }

    return (
        <div className="view-company-report-container">
            <div className="header-section">
                <div className="header-left">
                    <button onClick={handleGoBack} className="back-button">
                        ←
                    </button>
                    <h1>View Company Report - {companyName}</h1>
                </div>
                <button onClick={handleDownloadReport} className="action-button">
                    Download Report
                </button>
            </div>

            <div className="report-content" dangerouslySetInnerHTML={{ __html: reportHtml }} />
        </div>
    );
};

export default ViewCompanyReport;
