import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import apiService from '../../services/api';
import './InterviewReview.css';

const InterviewReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchInterviewReview();
        }
    }, [id]);

    const handleBack = () => {
        const jobId = searchParams.get('job_id');
        if (jobId) {
            navigate(`/job-details/${jobId}`);
        } else {
            navigate('/interviews');
        }
    };

    const fetchInterviewReview = async () => {
        try {
            setLoading(true);
            const data = await apiService.getInterviewReview(id);
            setReviewData(data);
        } catch (err) {
            console.error('Error fetching interview review:', err);
            setError(err.message || 'Failed to load interview review');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Group questions by category and track question numbers
    const renderQuestions = () => {
        if (!reviewData?.questions || reviewData.questions.length === 0) {
            return <p className="no-questions">No questions recorded for this interview.</p>;
        }

        const elements = [];
        let currentCategory = null;
        let questionNumber = 0;

        reviewData.questions.forEach((question, index) => {
            // Check if category changed
            if (question.category !== currentCategory) {
                currentCategory = question.category;
                elements.push(
                    <div key={`category-${index}`} className="category-header">
                        <span className="category-label">Category:</span>
                        <span className="category-name">{currentCategory}</span>
                    </div>
                );
            }

            // Determine if this is a follow-up question
            const isFollowUp = question.parent_question_id !== null && question.parent_question_id !== undefined;

            // Increment question number only for main questions
            if (!isFollowUp) {
                questionNumber++;
            }

            // Get the parent question number for follow-ups
            let parentQuestionNumber = questionNumber;
            if (isFollowUp) {
                // Find the parent question's number
                let tempNum = 0;
                for (let i = 0; i < index; i++) {
                    const q = reviewData.questions[i];
                    if (!q.parent_question_id) {
                        tempNum++;
                    }
                    if (q.question_id === question.parent_question_id) {
                        parentQuestionNumber = tempNum;
                        break;
                    }
                }
            }

            elements.push(
                <div key={question.question_id} className={`question-block ${isFollowUp ? 'follow-up' : ''}`}>
                    {/* Question */}
                    <div className="question-row">
                        <span className="row-label">
                            {isFollowUp ? `Follow-up on ${parentQuestionNumber}:` : `Question ${questionNumber}:`}
                        </span>
                        <span className="row-value">{question.question}</span>
                    </div>

                    {/* Answer */}
                    <div className="answer-row">
                        <span className="row-label">
                            {isFollowUp ? `Cont. Answer ${parentQuestionNumber}:` : `Answer ${questionNumber}:`}
                        </span>
                        <span className="row-value">{question.answer || 'No answer recorded'}</span>
                    </div>

                    {/* Scoring Table */}
                    <div className="scoring-row">
                        <span className="row-label">Scoring:</span>
                        <table className={`scoring-table ${isFollowUp ? 'follow-up-table' : ''}`}>
                            <thead>
                                <tr>
                                    <th>Completeness</th>
                                    <th>Correctness</th>
                                    <th>Insight</th>
                                    <th>Clarity</th>
                                    <th>Understanding</th>
                                    <th>Bonus</th>
                                    <th className="answer-score-header">Answer Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{question.completeness ?? '-'}</td>
                                    <td>{question.correctness ?? '-'}</td>
                                    <td>{question.insight ?? '-'}</td>
                                    <td>{question.clarity ?? '-'}</td>
                                    <td>{question.understanding ?? '-'}</td>
                                    <td>{question.bonus ?? '-'}</td>
                                    <td className="answer-score-cell">{question.answer_score ?? '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Feedback */}
                    <div className="feedback-row">
                        <span className="row-label feedback-label">Feedback:</span>
                        <span className="row-value feedback-value">{question.feedback_note || 'No feedback provided'}</span>
                    </div>
                </div>
            );
        });

        return elements;
    };

    const CHART_COLORS = [
        '#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6',
        '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#00bcd4'
    ];

    const METRICS = [
        { key: 'completeness', label: 'Completeness' },
        { key: 'correctness',  label: 'Correctness' },
        { key: 'insight',      label: 'Insight' },
        { key: 'clarity',      label: 'Clarity' },
        { key: 'understanding',label: 'Understanding' },
        { key: 'bonus',        label: 'Bonus' },
        { key: 'answer_score', label: 'Answer Score' },
    ];

    const buildChartData = () => {
        if (!reviewData?.questions || reviewData.questions.length === 0) return null;

        // Assign a short label to each question (Q1, Q2, F2 for follow-ups, etc.)
        let qNum = 0;
        const questionLabels = reviewData.questions.map((q) => {
            if (!q.parent_question_id) {
                qNum++;
                return `Q${qNum}`;
            }
            return `F${qNum}`;
        });

        // Build one data point per metric; each question becomes a keyed value
        const chartData = METRICS.map(({ key, label }) => {
            const point = { metric: label };
            reviewData.questions.forEach((q, idx) => {
                point[questionLabels[idx]] = q[key] ?? null;
            });
            return point;
        });

        return { chartData, questionLabels };
    };

    const renderScoreChart = () => {
        const result = buildChartData();
        if (!result) return null;
        const { chartData, questionLabels } = result;

        return (
            <div className="score-chart-section">
                <h2 className="breakdown-title">Score Comparison</h2>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        {questionLabels.map((label, idx) => (
                            <Line
                                key={label}
                                type="monotone"
                                dataKey={label}
                                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                connectNulls={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="interview-review-page">
                <div className="header-container">
                    <div className="page-title-container">
                        <button className="back-button" onClick={handleBack}>←</button>
                        <h1 className="page-title">Interview Review</h1>
                    </div>
                </div>
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading interview review...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="interview-review-page">
                <div className="header-container">
                    <div className="page-title-container">
                        <button className="back-button" onClick={handleBack}>←</button>
                        <h1 className="page-title">Interview Review</h1>
                    </div>
                </div>
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button className="action-button" onClick={() => navigate('/interviews')}>
                        Back to Interviews
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="interview-review-page">
            <div className="header-container">
                <div className="page-title-container">
                    <button className="back-button" onClick={handleBack}>←</button>
                    <h1 className="page-title">Interview Review</h1>
                </div>
            </div>

            <div className="review-content">
                {/* Summary Section */}
                <div className="summary-section">
                    <div className="summary-row">
                        <div className="summary-left">
                            <span className="summary-highlight-label">Company:</span>
                            <span className="summary-highlight-value">{reviewData?.company_name || '-'}</span>
                        </div>
                        <div className="summary-right">
                            <span className="summary-highlight-label">Job Title:</span>
                            <span className="summary-highlight-value">{reviewData?.job_title || '-'}</span>
                        </div>
                    </div>
                    <div className="summary-row">
                        <div className="summary-left">
                            <span className="summary-label">Outcome:</span>
                            <span className="summary-value outcome-value">{reviewData?.hiring_decision || 'Pending'}</span>
                        </div>
                        <div className="summary-right">
                            <span className="summary-label">Overall Interview Score:</span>
                            <span className="summary-value score-value">{reviewData?.interview_score ?? '-'}</span>
                        </div>
                    </div>
                    <div className="summary-row">
                        <div className="summary-left">
                            <span className="summary-label feedback-title">Interview Feedback:</span>
                        </div>
                        <div className="summary-right">
                            <span className="summary-label">Date Taken:</span>
                            <span className="summary-value">{formatDate(reviewData?.interview_created)}</span>
                        </div>
                    </div>
                    <div className="feedback-content">
                        {reviewData?.interview_feedback || 'No feedback available'}
                    </div>
                </div>

                {/* Interview Breakdown Section */}
                <div className="breakdown-section">
                    <h2 className="breakdown-title">Interview Breakdown</h2>
                    {renderQuestions()}
                </div>

                {/* Score Comparison Chart */}
                {renderScoreChart()}
            </div>
        </div>
    );
};

export default InterviewReview;
