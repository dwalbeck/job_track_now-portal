import logger from '../utils/logger';
import {API_BASE_URL} from '../config';
import {getAccessToken, clearAccessToken, isTokenExpired, getCurrentUserId} from '../utils/oauth';

class ApiService {
    get baseURL() {
        return API_BASE_URL;
    }

    /**
     * Handle authentication failure - clear token and redirect to login
     */
    handleAuthFailure() {
        logger.warning('Authentication failed - clearing token and redirecting to login');
        clearAccessToken();
        // Only redirect if not already on login page (prevents infinite loop)
        if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
        }
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const method = options.method || 'GET';
        const startTime = performance.now();

        // Extract custom timeout (default: 30 seconds, or use options.timeout)
        const timeout = options.timeout || 30000;

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Only set Content-Type for requests with a body (POST, PUT, PATCH)
        const headers = {};
        if (method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
            headers['Content-Type'] = 'application/json';
        }

        // Add Authorization header if access token exists and is not expired
        const accessToken = getAccessToken();
        if (accessToken) {
            // Check if token is expired before making the request
            if (isTokenExpired(accessToken)) {
                logger.warning('Token expired before API request', { endpoint });
                clearTimeout(timeoutId);
                this.handleAuthFailure();
                return Promise.reject(new Error('Token expired'));
            }
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const config = {
            headers: {
                ...headers,
                ...options.headers,
            },
            signal: controller.signal,
            ...options,
        };

        // Remove timeout from options so it doesn't get passed to fetch
        delete config.timeout;

        // Log the request
        if (endpoint !== '/health') {
            logger.logAPIRequest(method, endpoint, options.body);
        }

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId); // Clear timeout on successful response
            const duration = performance.now() - startTime;

            // Log the response
            if (endpoint !== '/health') {
                logger.logAPIResponse(method, endpoint, response.status, duration);
            }

            // Handle 401 Unauthorized - token is invalid or expired
            if (response.status === 401) {
                logger.warning('Received 401 Unauthorized response', { endpoint, method });
                this.handleAuthFailure();
                const error = new Error('Unauthorized - session expired');
                error.status = 401;
                error.isAuthError = true;
                throw error;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
                const error = new Error(errorMessage);
                error.status = response.status;
                error.detail = errorData.detail;
                throw error;
            }
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId); // Clear timeout on error

            // Don't re-process auth errors (already handled above)
            if (error.isAuthError) {
                throw error;
            }

            const duration = performance.now() - startTime;

            // Handle timeout errors more clearly
            if (error.name === 'AbortError') {
                const timeoutError = new Error(`Request timeout after ${timeout}ms`);
                timeoutError.isTimeout = true;
                logger.logAPIResponse(method, endpoint, 0, duration);
                logger.logError(timeoutError, `API request to ${endpoint}`);
                throw timeoutError;
            }

            logger.logAPIResponse(method, endpoint, 0, duration);
            logger.logError(error, `API request to ${endpoint}`);
            throw error;
        }
    }

    /**
     * Download a file with authentication and trigger browser download
     * @param {string} endpoint - The file endpoint (e.g., '/v1/files/resumes/file.docx')
     * @param {string} fileName - The name to save the file as
     */
    async downloadFile(endpoint, fileName) {
        const url = `${API_BASE_URL}${endpoint}`;
        const startTime = performance.now();

        // Add Authorization header
        const headers = {};
        const accessToken = getAccessToken();
        if (accessToken) {
            if (isTokenExpired(accessToken)) {
                logger.warning('Token expired before file download', { endpoint });
                this.handleAuthFailure();
                return Promise.reject(new Error('Token expired'));
            }
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        logger.logAPIRequest('GET', endpoint, null);

        try {
            const response = await fetch(url, { headers });
            const duration = performance.now() - startTime;
            logger.logAPIResponse('GET', endpoint, response.status, duration);

            if (response.status === 401) {
                logger.warning('Received 401 Unauthorized response during file download', { endpoint });
                this.handleAuthFailure();
                const error = new Error('Unauthorized - session expired');
                error.status = 401;
                error.isAuthError = true;
                throw error;
            }

            if (!response.ok) {
                const error = new Error(`HTTP error! status: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            // Get the blob and create download link
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;

            // Extract filename from Content-Disposition header if available
            const contentDisposition = response.headers.get('Content-Disposition');
            let downloadFileName = fileName; // fallback to passed filename
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    downloadFileName = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            link.download = downloadFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            return { success: true, fileName: downloadFileName };
        } catch (error) {
            const duration = performance.now() - startTime;
            logger.logAPIResponse('GET', endpoint, 0, duration);
            logger.logError(error, `File download from ${endpoint}`);
            throw error;
        }
    }


    // ***** calendar ***************************************************************************
    async getCalendarMonth(date) {
        return this.request(`/v1/calendar/month?date=${date}`);
    }

    async getCalendarWeek(date) {
        return this.request(`/v1/calendar/week?date=${date}`);
    }

    async getCalendarDay(date) {
        return this.request(`/v1/calendar/day?date=${date}`);
    }

    async getCalendarEvent(calendarId) {
        return this.request(`/v1/calendar/${calendarId}`);
    }

    async getAppointments(id) {
        return this.request(`/v1/calendar/appt?job_id=${id}`)
    }

    async createCalendarEvent(eventData) {
        return this.request('/v1/calendar', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    }

    async updateCalendarEvent(eventData) {
        return this.request('/v1/calendar', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    }

    async deleteCalendarEvent(calendarId) {
        return this.request(`/v1/calendar/${calendarId}`, {
            method: 'DELETE',
        });
    }

    async deleteCalendarAppointment(appointmentId) {
        return this.request(`/v1/calendar/appt?appointment_id=${appointmentId}`, {
            method: 'DELETE',
        });
    }

    // ----- reminder ----------------------------
    async saveReminder(reminderData) {
        return this.request('/v1/reminder', {
            method: 'POST',
            body: JSON.stringify(reminderData),
        });
    }

    async deleteReminder(reminderId) {
        return this.request(`/v1/reminder?reminder_id=${reminderId}`, {
            method: 'DELETE',
        });
    }

    async getReminderList(listRequest) {
        return this.request('/v1/reminder/list', {
            method: 'POST',
            body: JSON.stringify(listRequest),
        });
    }

    // ***** contacts ***************************************************************************
    async getAllContacts(jobId = null) {
        const queryParam = jobId ? `?job_id=${jobId}` : '';
        return this.request(`/v1/contacts${queryParam}`);
    }

    async getContact(contactId) {
        return this.request(`/v1/contact/${contactId}`);
    }

    async createContact(contactData) {
        return this.request('/v1/contact', {
            method: 'POST',
            body: JSON.stringify(contactData),
        });
    }

    async updateContact(contactData) {
        return this.request('/v1/contact', {
            method: 'POST',
            body: JSON.stringify(contactData),
        });
    }

    async deleteContact(contactId) {
        return this.request(`/v1/contact/${contactId}`, {
            method: 'DELETE',
        });
    }

    // ***** cover letter ***********************************************************************
    async getLetterList() {
        return this.request('/v1/letter/list');
    }

    async getLetter(coverId) {
        return this.request(`/v1/letter?cover_id=${coverId}`);
    }

    async saveLetter(letterData) {
        return this.request('/v1/letter', {
            method: 'POST',
            body: JSON.stringify(letterData),
        });
    }

    async deleteLetter(coverId) {
        return this.request(`/v1/letter?cover_id=${coverId}`, {
            method: 'DELETE',
        });
    }

    async writeLetter(coverId) {
        return this.request('/v1/letter/write', {
            method: 'POST',
            body: JSON.stringify({cover_id: coverId}),
            timeout: 90000, // 90 second timeout for AI letter writing
        });
    }

    async convertLetter(coverId, format) {
        return this.request('/v1/letter/convert', {
            method: 'POST',
            body: JSON.stringify({cover_id: coverId, format: format}),
        });
    }


    // ***** jobs ***************************************************************************
    async getAllJobs() {
        return this.request('/v1/jobs');
    }

    async getJob(jobId) {
        return this.request(`/v1/job/${jobId}`);
    }

    async createJob(jobData) {
        return this.request('/v1/job', {
            method: 'POST',
            body: JSON.stringify(jobData),
        });
    }

    async updateJob(jobData) {
        return this.request('/v1/job', {
            method: 'POST',
            body: JSON.stringify(jobData),
        });
    }

    async deleteJob(jobId) {
        return this.request(`/v1/job/${jobId}`, {
            method: 'DELETE',
        });
    }

    async getJobList() {
        return this.request('/v1/job/list');
    }

    async extractJobData(jobId) {
        return this.request('/v1/job/extract', {
            method: 'POST',
            body: JSON.stringify({job_id: jobId}),
            timeout: 90000, // 90 second timeout for AI job extraction
        });
    }

    // ***** notes ***************************************************************************
    async getNotes(jobId = null) {
        const queryParam = jobId ? `?job_id=${jobId}` : '';
        return this.request(`/v1/notes${queryParam}`);
    }

    async createNote(noteData) {
        return this.request('/v1/notes', {
            method: 'POST',
            body: JSON.stringify(noteData),
        });
    }

    async updateNote(noteData) {
        return this.request('/v1/notes', {
            method: 'POST',
            body: JSON.stringify(noteData),
        });
    }

    async deleteNote(noteId) {
        return this.request(`/v1/note/${noteId}`, {
            method: 'DELETE',
        });
    }

    // ***** user ***************************************************************************
    async getUser(userId) {
        return this.request(`/v1/user?user_id=${userId}`);
    }

    async getUserByUsername(username) {
        return this.request(`/v1/user/lookup?username=${encodeURIComponent(username)}`);
    }

    async saveUser(userData) {
        return this.request('/v1/user', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async getUserSetting(userId) {
        return this.request(`/v1/user/setting?user_id=${userId}`);
    }

    async getCurrentUserSettings() {
        // Get user_id from JWT token and call the existing endpoint
        const userId = getCurrentUserId();
        if (!userId) {
            throw new Error('Not authenticated');
        }
        return this.request(`/v1/user/setting?user_id=${userId}`);
    }

    async saveUserSetting(settingData) {
        return this.request('/v1/user/setting', {
            method: 'POST',
            body: JSON.stringify(settingData),
        });
    }

    async checkUsersEmpty() {
        return this.request('/v1/user/empty');
    }

    // ***** resume ***************************************************************************
    async getBaselineResumeList() {
        return this.request('/v1/resume/baseline/list');
    }

    async getBaselineResumes() {
        return this.request('/v1/resume/baseline');
    }

    async getJobResumes() {
        return this.request('/v1/resume/job');
    }

    async cloneResume(resumeId) {
        return this.request('/v1/resume/clone', {
            method: 'POST',
            body: JSON.stringify({ resume_id: resumeId }),
        });
    }

    async deleteResume(resumeId) {
        return this.request(`/v1/resume?resume_id=${resumeId}`, {
            method: 'DELETE',
        });
    }

    async getResume(resumeId) {
        return this.request(`/v1/resume/${resumeId}`);
    }

    async updateResume(resumeData) {
        return this.request('/v1/resume', {
            method: 'PUT',
            body: JSON.stringify(resumeData),
        });
    }

    async resumeFull(jobId, baselineResumeId, keywordFinal, focusFinal) {
        return this.request('/v1/resume/full', {
            method: 'POST',
            body: JSON.stringify({
                baseline_resume_id: baselineResumeId,
                job_id: jobId,
                keyword_final: keywordFinal,
                focus_final: focusFinal,
            }),
        });
    }

    async rewriteResume(jobId) {
        // Step 1: Initiate the resume rewrite process
        return await this.request('/v1/resume/rewrite', {
            method: 'POST',
            body: JSON.stringify({
                job_id: jobId,
            }),
            timeout: 30000, // 30 second timeout for initiating the process
        });
    }

    async updateResumeDetail(detailData) {
        return this.request('/v1/resume/detail', {
            method: 'POST',
            body: JSON.stringify(detailData),
        });
    }

    async getResumeDetail(resumeId) {
        return this.request(`/v1/resume/detail/${resumeId}`);
    }

    async extractResume(formData) {
        return this.request('/v1/resume/extract', {
            method: 'POST',
            body: JSON.stringify(formData),
            timeout: 150000, // 150 second (2.5 min) timeout for AI resume extraction
        });
    }

    // ***** convert **************************************************************************

    async convertHtmlToDocx(jobId) {
        return this.request(`/v1/convert/html2docx?job_id=${jobId}`);
    }

    async convertXxxToMarkdown(format, fileName) {
        return this.request(`/v1/convert/${format}2md`, {
            method: 'POST',
            body: JSON.stringify({ file_name: fileName }),
        });
    }

    async convertXxxToHtml(format, fileName) {
        return this.request(`/v1/convert/${format}2html`, {
            method: 'POST',
            body: JSON.stringify({file_name: fileName})
        });
    }

    async convertFinal(body) {
        return this.request(`/v1/convert/final`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async convertFile(resumeId, sourceFormat, targetFormat) {
        return this.request(`/v1/convert/file`, {
            method: 'POST',
            body: JSON.stringify({
                resume_id: resumeId,
                source_format: sourceFormat,
                target_format: targetFormat
            })
        });
    }

    // ***** export ***************************************************************************
    async exportJobs() {
        return this.request('/v1/export/job');
    }

    async exportContacts() {
        return this.request('/v1/export/contacts');
    }

    async exportNotes() {
        return this.request('/v1/export/notes');
    }

    async exportCalendar() {
        return this.request('/v1/export/calendar');
    }

    async exportResumes() {
        return this.request('/v1/export/resumes');
    }

    // ***** company ***************************************************************************
    async createCompany(companyData) {
        return this.request('/v1/company', {
            method: 'POST',
            body: JSON.stringify(companyData),
        });
    }

    async updateCompany(companyData) {
        return this.request('/v1/company', {
            method: 'PUT',
            body: JSON.stringify(companyData),
        });
    }

    async getCompany(companyId) {
        return this.request(`/v1/company/${companyId}`);
    }

    async getCompanyByJob(jobId) {
        return this.request(`/v1/company/job/${jobId}`);
    }

    async searchCompany(companyId) {
        return this.request(`/v1/company/search/${companyId}`);
    }

    async researchCompany(companyId) {
        return this.request(`/v1/company/research/${companyId}`);
    }

    async getCompanyList() {
        return this.request('/v1/company/list');
    }

    async deleteCompany(companyId) {
        return this.request(`/v1/company/${companyId}`, {
            method: 'DELETE',
        });
    }

    async downloadCompanyReport(companyId) {
        return this.request(`/v1/company/download/${companyId}`);
    }

    async getLLMModels() {
        return this.request('/v1/openai/llm');
    }

    // ***** tools **************************************************************************
    async rewriteText(textBlob) {
        return this.request('/v1/tools/rewrite', {
            method: 'POST',
            body: JSON.stringify({text_blob: textBlob}),
        });
    }

    async createPitch(jobId = null) {
        return this.request('/v1/tools/pitch', {
            method: 'POST',
            body: JSON.stringify({job_id: jobId}),
        });
    }

    // ***** interview *************************************************************************
    async getCompanyCulture(companyId) {
        console.log('[API] getCompanyCulture called with companyId:', companyId);
        const result = await this.request(`/v1/company/culture/${companyId}`, {
            timeout: 120000, // 2 minute timeout for AI culture report generation
        });
        console.log('[API] getCompanyCulture result:', result);
        return result;
    }

    async createInterviewQuestions(jobId, companyId) {
        return this.request('/v1/interview/question', {
            method: 'POST',
            body: JSON.stringify({
                job_id: jobId,
                company_id: companyId
            }),
            timeout: 120000, // 2 minute timeout for AI question generation
        });
    }

    async getQuestionAudio(interviewId, questionId, isStatement = false) {
        const url = `${API_BASE_URL}/v1/interview/question/audio`;
        const startTime = performance.now();

        const headers = {
            'Content-Type': 'application/json'
        };
        const accessToken = getAccessToken();
        if (accessToken) {
            if (isTokenExpired(accessToken)) {
                this.handleAuthFailure();
                return Promise.reject(new Error('Token expired'));
            }
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        logger.logAPIRequest('POST', '/v1/interview/question/audio', { interviewId, questionId, isStatement });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    interview_id: interviewId,
                    question_id: questionId,
                    statement: isStatement
                })
            });

            const duration = performance.now() - startTime;
            logger.logAPIResponse('POST', '/v1/interview/question/audio', response.status, duration);

            if (response.status === 401) {
                this.handleAuthFailure();
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.blob();
        } catch (error) {
            logger.logError(error, 'getQuestionAudio');
            throw error;
        }
    }

    async transcribeAudio(audioBlob, questionId) {
        const url = `${API_BASE_URL}/v1/interview/transcribe`;
        const startTime = performance.now();

        const formData = new FormData();
        formData.append('upload_file', audioBlob, 'recording.webm');
        formData.append('question_id', questionId);

        const headers = {};
        const accessToken = getAccessToken();
        if (accessToken) {
            if (isTokenExpired(accessToken)) {
                this.handleAuthFailure();
                return Promise.reject(new Error('Token expired'));
            }
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        logger.logAPIRequest('POST', '/v1/interview/transcribe', { questionId });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData
            });

            const duration = performance.now() - startTime;
            logger.logAPIResponse('POST', '/v1/interview/transcribe', response.status, duration);

            if (response.status === 401) {
                this.handleAuthFailure();
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            logger.logError(error, 'transcribeAudio');
            throw error;
        }
    }

    async submitInterviewAnswer(interviewId, questionId, answer) {
        return this.request('/v1/interview/answer', {
            method: 'POST',
            body: JSON.stringify({
                interview_id: interviewId,
                question_id: questionId,
                answer: answer
            }),
            timeout: 90000, // 90 second timeout for AI answer evaluation
        });
    }

    async getInterviewReview(interviewId) {
        return this.request(`/v1/interview/${interviewId}`, {
            timeout: 120000, // 2 minute timeout for AI review
        });
    }

    async getInterviewList() {
        return this.request('/v1/interview/list');
    }

    async getInterviewQuestionList(interviewId) {
        return this.request(`/v1/interview/question/list/${interviewId}`);
    }

    async pollProcess(processId) {
        return this.request(`/v1/process/poll/${processId}`, {
            method: 'GET',
            timeout: 10000
        });
    }
}

const apiService = new ApiService();
export default apiService;