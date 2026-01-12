import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import Tools from './Tools';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api', () => ({
    getJobList: jest.fn(),
    rewriteText: jest.fn(),
    createPitch: jest.fn(),
}));

// Mock console methods
const originalConsoleError = console.error;

describe('Tools Component', () => {
    const mockJobs = [
        {
            job_id: 1,
            job_title: 'Software Engineer',
            company: 'Tech Corp',
        },
        {
            job_id: 2,
            job_title: 'Senior Developer',
            company: 'Startup Inc',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('Component Rendering', () => {
        test('renders tools page with title', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);

            render(<Tools/>);

            expect(screen.getByText('Tools')).toBeInTheDocument();
        });

        test('renders rewrite text section', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);

            render(<Tools/>);

            expect(screen.getByText('Rewrite Text Chunk')).toBeInTheDocument();
            expect(screen.getByText(/If you need a sentence or paragraph/)).toBeInTheDocument();
        });

        test('renders elevator pitch section', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);

            render(<Tools/>);

            await waitFor(() => {
                expect(screen.getByText('Elevator Pitch')).toBeInTheDocument();
            });
            expect(screen.getByText(/Your sales pitch to market yourself/)).toBeInTheDocument();
        });

        test('renders all form elements', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);

            render(<Tools/>);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter text to rewrite...')).toBeInTheDocument();
            });
            expect(screen.getByText('Re-write')).toBeInTheDocument();
            expect(screen.getByText('Create Pitch')).toBeInTheDocument();
            expect(screen.getByText('For Specific Job Posting')).toBeInTheDocument();
        });
    });

    describe('Data Fetching', () => {
        test('fetches jobs on mount', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);

            render(<Tools/>);

            await waitFor(() => {
                expect(apiService.getJobList).toHaveBeenCalledTimes(1);
            });
        });

        test('populates job dropdown with fetched jobs', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);

            render(<Tools/>);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp - Software Engineer')).toBeInTheDocument();
            });
            expect(screen.getByText('Startup Inc - Senior Developer')).toBeInTheDocument();
        });

        test('handles empty jobs list', async () => {
            apiService.getJobList.mockResolvedValue([]);

            render(<Tools/>);

            await waitFor(() => {
                const select = screen.getByRole('combobox');
                expect(select).toBeInTheDocument();
            });

            // Should only have the default option
            const options = screen.getAllByRole('option');
            expect(options).toHaveLength(1);
            expect(options[0]).toHaveTextContent('-- Select a job (optional) --');
        });

        test('handles jobs fetch error', async () => {
            apiService.getJobList.mockRejectedValue(new Error('Network error'));

            render(<Tools/>);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching jobs:',
                    expect.any(Error)
                );
            });
        });
    });

    describe('Rewrite Text Functionality', () => {
        test('submits text for rewriting', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.rewriteText.mockResolvedValue({
                original_text_blob: 'Original text',
                new_text_blob: 'Improved text',
                explanation: 'Made it better',
            });

            render(<Tools/>);

            const textarea = screen.getByPlaceholderText('Enter text to rewrite...');
            const submitButton = screen.getByText('Re-write');

            fireEvent.change(textarea, {target: {value: 'Original text'}});
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.rewriteText).toHaveBeenCalledWith('Original text');
            });
        });

        test('displays rewrite results', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.rewriteText.mockResolvedValue({
                original_text_blob: 'Original text',
                new_text_blob: 'Improved text',
                explanation: 'Enhanced clarity and professionalism',
            });

            render(<Tools/>);

            const textarea = screen.getByPlaceholderText('Enter text to rewrite...');
            const submitButton = screen.getByText('Re-write');

            fireEvent.change(textarea, {target: {value: 'Original text'}});
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Original Text')).toBeInTheDocument();
            });
            expect(screen.getByText('Improved Rendition')).toBeInTheDocument();
            expect(screen.getByText('Enhanced clarity and professionalism')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Improved text')).toBeInTheDocument();
        });

        test('clears input textbox after successful rewrite', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.rewriteText.mockResolvedValue({
                original_text_blob: 'Original text',
                new_text_blob: 'Improved text',
                explanation: 'Made it better',
            });

            render(<Tools/>);

            const textarea = screen.getByPlaceholderText('Enter text to rewrite...');
            const submitButton = screen.getByText('Re-write');

            fireEvent.change(textarea, {target: {value: 'Original text'}});
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(textarea.value).toBe('');
            });
        });

        test('shows error when submitting empty text', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);

            render(<Tools/>);

            const submitButton = screen.getByText('Re-write');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Please enter some text to rewrite')).toBeInTheDocument();
            });
            expect(apiService.rewriteText).not.toHaveBeenCalled();
        });

        test('shows error when submitting whitespace only', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);

            render(<Tools/>);

            const textarea = screen.getByPlaceholderText('Enter text to rewrite...');
            const submitButton = screen.getByText('Re-write');

            fireEvent.change(textarea, {target: {value: '   '}});
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Please enter some text to rewrite')).toBeInTheDocument();
            });
            expect(apiService.rewriteText).not.toHaveBeenCalled();
        });

        test('handles rewrite API error', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.rewriteText.mockRejectedValue(new Error('API error'));

            render(<Tools/>);

            const textarea = screen.getByPlaceholderText('Enter text to rewrite...');
            const submitButton = screen.getByText('Re-write');

            fireEvent.change(textarea, {target: {value: 'Some text'}});
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('API error')).toBeInTheDocument();
            });
        });

        test('disables button during rewrite request', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.rewriteText.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(<Tools/>);

            const textarea = screen.getByPlaceholderText('Enter text to rewrite...');
            const submitButton = screen.getByText('Re-write');

            fireEvent.change(textarea, {target: {value: 'Some text'}});
            fireEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(submitButton).toHaveTextContent('Processing...');
        });

        test('replaces results when submitting again', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.rewriteText.mockResolvedValueOnce({
                original_text_blob: 'First text',
                new_text_blob: 'First improved',
                explanation: 'First explanation',
            }).mockResolvedValueOnce({
                original_text_blob: 'Second text',
                new_text_blob: 'Second improved',
                explanation: 'Second explanation',
            });

            render(<Tools/>);

            const textarea = screen.getByPlaceholderText('Enter text to rewrite...');
            const submitButton = screen.getByText('Re-write');

            // First submission
            fireEvent.change(textarea, {target: {value: 'First text'}});
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('First explanation')).toBeInTheDocument();
            });

            // Second submission
            fireEvent.change(textarea, {target: {value: 'Second text'}});
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Second explanation')).toBeInTheDocument();
            });
            expect(screen.queryByText('First explanation')).not.toBeInTheDocument();
        });
    });

    describe('Elevator Pitch Functionality', () => {
        test('submits pitch request without job selection', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.createPitch.mockResolvedValue({
                pitch: 'Great elevator pitch',
            });

            render(<Tools/>);

            await waitFor(() => {
                const submitButton = screen.getByText('Create Pitch');
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(apiService.createPitch).toHaveBeenCalledWith(null);
            });
        });

        test('submits pitch request with selected job', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.createPitch.mockResolvedValue({
                pitch: 'Tailored elevator pitch',
            });

            render(<Tools/>);

            // Wait for jobs to load first
            await waitFor(() => {
                expect(screen.getByText('Tech Corp - Software Engineer')).toBeInTheDocument();
            });

            const select = screen.getByRole('combobox');
            fireEvent.change(select, {target: {value: '1'}});

            const submitButton = screen.getByText('Create Pitch');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.createPitch).toHaveBeenCalledWith('1');
            });
        });

        test('displays pitch result', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.createPitch.mockResolvedValue({
                pitch: 'I am a skilled professional with expertise in software development...',
            });

            render(<Tools/>);

            await waitFor(() => {
                const submitButton = screen.getByText('Create Pitch');
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(screen.getByText('The Pitch')).toBeInTheDocument();
            });
            expect(screen.getByDisplayValue(/I am a skilled professional/)).toBeInTheDocument();
        });

        test('handles pitch API error', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.createPitch.mockRejectedValue(new Error('Pitch generation failed'));

            render(<Tools/>);

            await waitFor(() => {
                const submitButton = screen.getByText('Create Pitch');
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Pitch generation failed')).toBeInTheDocument();
            });
        });

        test('disables button during pitch request', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.createPitch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(<Tools/>);

            await waitFor(() => {
                const submitButton = screen.getByText('Create Pitch');
                fireEvent.click(submitButton);

                expect(submitButton).toBeDisabled();
                expect(submitButton).toHaveTextContent('Creating...');
            });
        });

        test('replaces pitch when submitting again', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.createPitch.mockResolvedValueOnce({
                pitch: 'First pitch',
            }).mockResolvedValueOnce({
                pitch: 'Second pitch',
            });

            render(<Tools/>);

            await waitFor(() => {
                const submitButton = screen.getByText('Create Pitch');

                // First submission
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(screen.getByDisplayValue('First pitch')).toBeInTheDocument();
            });

            const submitButton = screen.getByText('Create Pitch');
            // Second submission
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByDisplayValue('Second pitch')).toBeInTheDocument();
            });
            expect(screen.queryByDisplayValue('First pitch')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        test('handles null jobs response', async () => {
            apiService.getJobList.mockResolvedValue(null);

            render(<Tools/>);

            await waitFor(() => {
                const select = screen.getByRole('combobox');
                expect(select).toBeInTheDocument();
            });
        });

        test('result textareas are read-only', async () => {
            apiService.getJobList.mockResolvedValue(mockJobs);
            apiService.rewriteText.mockResolvedValue({
                original_text_blob: 'Original',
                new_text_blob: 'New',
                explanation: 'Explanation',
            });

            render(<Tools/>);

            const textarea = screen.getByPlaceholderText('Enter text to rewrite...');
            fireEvent.change(textarea, {target: {value: 'Text'}});
            fireEvent.click(screen.getByText('Re-write'));

            await waitFor(() => {
                const originalTextArea = screen.getByDisplayValue('Original');
                const improvedTextArea = screen.getByDisplayValue('New');

                expect(originalTextArea).toHaveAttribute('readonly');
                expect(improvedTextArea).toHaveAttribute('readonly');
            });
        });
    });
});
