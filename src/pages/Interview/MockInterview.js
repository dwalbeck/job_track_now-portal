import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import hark from 'hark';
import apiService from '../../services/api';
import './MockInterview.css';

// Interview states
const STATES = {
    PREPARING: 'preparing',
    MIC_TEST: 'mic_test',
    READY: 'ready',
    PLAYING_QUESTION: 'playing_question',
    RECORDING: 'recording',
    PROCESSING: 'processing',
    PLAYING_RESPONSE: 'playing_response',
    COMPLETED: 'completed',
    ERROR: 'error'
};

const MockInterview = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const jobId = searchParams.get('job_id');
    const companyId = searchParams.get('company_id');
    const resumeId = searchParams.get('resume_id');

    // State management
    const [interviewState, setInterviewState] = useState(STATES.PREPARING);
    const [preparationMessage, setPreparationMessage] = useState('Doing preparation work for an interview... please stand by');
    const [error, setError] = useState(null);
    const [interviewId, setInterviewId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [wasStopped, setWasStopped] = useState(false);
    const [exitHovered, setExitHovered] = useState(false);
    const [wasRecordingWhenPaused, setWasRecordingWhenPaused] = useState(false);
    const [micLevel, setMicLevel] = useState(0);
    const [micDeviceName, setMicDeviceName] = useState('');

    // Refs
    const audioRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);           // For audio playback visualization
    const micAnalyserRef = useRef(null);        // For mic silence detection (not connected to speakers)
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const recordingTimeoutRef = useRef(null);
    const recordingChunksRef = useRef([]);
    const harkRef = useRef(null);
    const transcriptionPromisesRef = useRef([]);
    const streamRef = useRef(null);
    const chunkIntervalRef = useRef(null);
    const wordDisplayIntervalRef = useRef(null);
    const wordDisplayIndexRef = useRef(0);
    const wordDisplayWordsRef = useRef([]);
    const sourceNodeRef = useRef(null);
    const questionsRef = useRef([]);
    const currentQuestionIndexRef = useRef(0);
    const interviewIdRef = useRef(null);
    const pendingResponseRef = useRef(null);
    const preparationStartedRef = useRef(false);
    const isStoppingRef = useRef(false);
    const micTestAnimationRef = useRef(null);
    const micTestAnalyserRef = useRef(null);
    const micTestSourceRef = useRef(null);

    // Keep refs in sync with state
    useEffect(() => {
        questionsRef.current = questions;
    }, [questions]);

    useEffect(() => {
        currentQuestionIndexRef.current = currentQuestionIndex;
    }, [currentQuestionIndex]);

    useEffect(() => {
        interviewIdRef.current = interviewId;
    }, [interviewId]);

    // Current question helper
    const currentQuestion = questions[currentQuestionIndex];

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupResources();
        };
    }, []);

    const cleanupResources = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (micTestAnimationRef.current) {
            cancelAnimationFrame(micTestAnimationRef.current);
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
        if (recordingTimeoutRef.current) {
            clearTimeout(recordingTimeoutRef.current);
        }
        if (chunkIntervalRef.current) {
            clearTimeout(chunkIntervalRef.current);
        }
        if (wordDisplayIntervalRef.current) {
            clearInterval(wordDisplayIntervalRef.current);
        }
        if (harkRef.current) {
            harkRef.current.stop();
            harkRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    };

    // Preparation phase - run on mount
    useEffect(() => {
        if (jobId && companyId && resumeId) {
            runPreparation();
        } else {
            setError('Missing required parameters: job_id, company_id, or resume_id');
            setInterviewState(STATES.ERROR);
        }
    }, [jobId, companyId, resumeId]);

    const runPreparation = async () => {
        // Guard against multiple calls
        if (preparationStartedRef.current) {
            console.log('[Interview] Preparation already started, skipping duplicate call');
            return;
        }
        preparationStartedRef.current = true;

        try {
            console.log('[Interview] Starting preparation with:', { jobId, companyId, resumeId });

            // Step 1: Check if company exists
            setPreparationMessage('Checking company information...');
            console.log('[Interview] Step 1: Checking company...');
            let companyData = null;
            try {
                companyData = await apiService.getCompany(companyId);
                console.log('[Interview] Company exists:', companyData);
            } catch (err) {
                console.log('[Interview] getCompany error:', err, 'status:', err.status);
                // If company doesn't exist, that's a problem since JobDetails should have validated it
                // The user should run Company Report first
                throw new Error('Company information not found. Please run Company Report from the Job Details page first.');
            }

            // Step 2: Generate company culture report
            setPreparationMessage('Generating company culture report...');
            console.log('[Interview] Step 2: Generating culture report...');
            const cultureResult = await apiService.getCompanyCulture(companyId);
            console.log('[Interview] Culture report result:', cultureResult);

            // Step 3: Convert resume to markdown
            setPreparationMessage('Preparing resume data...');
            console.log('[Interview] Step 3: Converting resume to markdown...');
            const convertResult = await apiService.convertFile(resumeId, 'html', 'md');
            console.log('[Interview] Convert result:', convertResult);

            // Step 4: Generate interview questions (async with polling)
            setPreparationMessage('Generating interview questions...');
            console.log('[Interview] Step 4: Generating interview questions...');
            const initResponse = await apiService.createInterviewQuestions(jobId, companyId);
            console.log('[Interview] Question generation initiated:', initResponse);

            const { process_id, interview_id } = initResponse;
            setInterviewId(interview_id);
            interviewIdRef.current = interview_id;

            // Poll for question generation completion
            setPreparationMessage('AI is generating interview questions... Please wait.');
            const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
            let attempts = 0;
            let questionGenerationComplete = false;

            while (!questionGenerationComplete && attempts < maxAttempts) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

                try {
                    const pollResponse = await apiService.pollProcess(process_id);
                    console.log('[Interview] Poll response:', pollResponse);

                    if (pollResponse.process_state === 'complete' || pollResponse.process_state === 'confirmed') {
                        questionGenerationComplete = true;
                        console.log('[Interview] Question generation complete');
                    } else if (pollResponse.process_state === 'failed') {
                        throw new Error('Question generation failed. Please try again.');
                    }
                } catch (pollErr) {
                    console.error('[Interview] Poll error:', pollErr);
                    throw new Error('Failed to check question generation status. Please try again.');
                }
            }

            if (!questionGenerationComplete) {
                throw new Error('Question generation timed out. Please try again.');
            }

            // Fetch the generated questions
            setPreparationMessage('Loading interview questions...');
            console.log('[Interview] Fetching questions list...');
            const questionsList = await apiService.getInterviewQuestionList(interview_id);
            console.log('[Interview] Questions list:', questionsList);

            setQuestions(questionsList);
            questionsRef.current = questionsList;

            // Step 5: Request microphone permission
            setPreparationMessage('Requesting microphone access...');
            console.log('[Interview] Step 5: Requesting microphone permission...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                // Get microphone device name
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) {
                    setMicDeviceName(audioTracks[0].label || 'Unknown Microphone');
                    console.log('[Interview] Microphone:', audioTracks[0].label);
                }
                console.log('[Interview] Microphone access granted');
            } catch (micErr) {
                console.error('[Interview] Microphone access denied:', micErr);
                throw new Error('Microphone access is required for the interview. Please allow microphone access and try again.');
            }

            // Go to mic test state
            console.log('[Interview] Preparation complete, starting mic test');
            setInterviewState(STATES.MIC_TEST);
            startMicTest();
        } catch (err) {
            console.error('[Interview] Preparation error:', err);
            console.error('[Interview] Error details:', {
                message: err.message,
                status: err.status,
                detail: err.detail,
                stack: err.stack
            });
            setError(err.message || 'Failed to prepare interview');
            setInterviewState(STATES.ERROR);
        }
    };

    // Initialize audio context
    const initAudioContext = async () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            console.log('[Interview] Creating new AudioContext');
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            // Reset source node since old one is invalid with new context
            sourceNodeRef.current = null;
        }
        if (audioContextRef.current.state === 'suspended') {
            console.log('[Interview] Resuming suspended AudioContext');
            await audioContextRef.current.resume();
        }
        // Ensure analysers exist (may not if context was created during mic test)
        if (!analyserRef.current) {
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }
        if (!micAnalyserRef.current) {
            micAnalyserRef.current = audioContextRef.current.createAnalyser();
            micAnalyserRef.current.fftSize = 256;
        }
    };

    // Start microphone test - shows real-time level meter
    const startMicTest = async () => {
        try {
            const stream = streamRef.current;
            if (!stream) {
                console.error('[Interview] No stream available for mic test');
                return;
            }

            // Create audio context if needed
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            // Create analyser for mic test
            micTestAnalyserRef.current = audioContextRef.current.createAnalyser();
            micTestAnalyserRef.current.fftSize = 256;
            micTestAnalyserRef.current.smoothingTimeConstant = 0.8;

            // Create source from mic stream
            micTestSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            micTestSourceRef.current.connect(micTestAnalyserRef.current);
            // Note: NOT connected to destination, so no audio plays through speakers

            console.log('[Interview] Mic test started');

            // Start level monitoring
            const updateLevel = () => {
                if (!micTestAnalyserRef.current) return;

                const dataArray = new Uint8Array(micTestAnalyserRef.current.frequencyBinCount);
                micTestAnalyserRef.current.getByteFrequencyData(dataArray);

                // Calculate average level (0-255) and normalize to 0-100
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                const normalizedLevel = Math.min(100, (average / 255) * 100 * 2); // Amplify for better visibility

                setMicLevel(normalizedLevel);

                micTestAnimationRef.current = requestAnimationFrame(updateLevel);
            };

            micTestAnimationRef.current = requestAnimationFrame(updateLevel);
        } catch (err) {
            console.error('[Interview] Error starting mic test:', err);
        }
    };

    // Stop microphone test
    const stopMicTest = () => {
        if (micTestAnimationRef.current) {
            cancelAnimationFrame(micTestAnimationRef.current);
            micTestAnimationRef.current = null;
        }
        // Don't disconnect the source - we'll reuse the stream for recording
        micTestSourceRef.current = null;
        micTestAnalyserRef.current = null;
        setMicLevel(0);
        console.log('[Interview] Mic test stopped');
    };

    // User confirms mic is working, proceed to ready state
    const confirmMicTest = () => {
        stopMicTest();
        setInterviewState(STATES.READY);
    };

    // Start the interview
    const startInterview = async () => {
        try {
            // Microphone access was already granted during preparation
            await initAudioContext();

            // Start with first question
            await playQuestion(0);
        } catch (err) {
            console.error('Error starting interview:', err);
            setError('Failed to start interview. Please try again.');
            setInterviewState(STATES.ERROR);
        }
    };

    // Play question audio
    const playQuestion = async (questionIndex) => {
        console.log('[Interview] playQuestion called', { questionIndex, interviewId: interviewIdRef.current });
        const question = questionsRef.current[questionIndex];
        if (!question) {
            console.log('[Interview] No question found at index, marking complete');
            // All questions completed
            setInterviewState(STATES.COMPLETED);
            return;
        }

        console.log('[Interview] Playing question:', question.question_id);
        setInterviewState(STATES.PLAYING_QUESTION);
        setDisplayedText('');

        try {
            await initAudioContext();

            // Fetch question audio
            console.log('[Interview] Fetching audio for question:', question.question_id);
            const audioBlob = await apiService.getQuestionAudio(
                interviewIdRef.current,
                question.question_id,
                false
            );
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.src = audioUrl;

                // Create audio source for visualization if not already created
                if (!sourceNodeRef.current) {
                    sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                    sourceNodeRef.current.connect(analyserRef.current);
                    analyserRef.current.connect(audioContextRef.current.destination);
                }

                await audioRef.current.play();
                setIsPlaying(true);

                // Start displaying text word by word
                startWordDisplay(question.question);

                // Start visualization
                startVisualization();
            }
        } catch (err) {
            console.error('Error playing question:', err);
            setError('Failed to play question audio');
            setInterviewState(STATES.ERROR);
        }
    };

    // Display words one at a time (5 words per second = 200ms per word)
    const startWordDisplay = (text, resumeFromIndex = 0) => {
        if (wordDisplayIntervalRef.current) {
            clearInterval(wordDisplayIntervalRef.current);
        }

        // Filter out empty strings and trim the text
        const words = text.trim().split(' ').filter(word => word.length > 0);
        wordDisplayWordsRef.current = words;

        // If resuming, start from saved index; otherwise start fresh
        let wordIndex = resumeFromIndex;
        wordDisplayIndexRef.current = wordIndex;

        // Set initial text based on starting point
        if (wordIndex === 0 && words.length > 0) {
            setDisplayedText(words[0]);
            wordIndex = 1;
            wordDisplayIndexRef.current = 1;
        } else if (words.length === 0) {
            setDisplayedText('');
            return;
        }

        wordDisplayIntervalRef.current = setInterval(() => {
            if (wordDisplayIndexRef.current < wordDisplayWordsRef.current.length) {
                const word = wordDisplayWordsRef.current[wordDisplayIndexRef.current];
                if (word) {
                    setDisplayedText(prev => prev + ' ' + word);
                }
                wordDisplayIndexRef.current++;
            } else {
                clearInterval(wordDisplayIntervalRef.current);
                wordDisplayIntervalRef.current = null;
            }
        }, 333); // 3 words per second
    };

    // Resume word display from where it was paused
    const resumeWordDisplay = () => {
        if (wordDisplayWordsRef.current.length > 0 && wordDisplayIndexRef.current < wordDisplayWordsRef.current.length) {
            wordDisplayIntervalRef.current = setInterval(() => {
                if (wordDisplayIndexRef.current < wordDisplayWordsRef.current.length) {
                    const word = wordDisplayWordsRef.current[wordDisplayIndexRef.current];
                    if (word) {
                        setDisplayedText(prev => prev + ' ' + word);
                    }
                    wordDisplayIndexRef.current++;
                } else {
                    clearInterval(wordDisplayIntervalRef.current);
                    wordDisplayIntervalRef.current = null;
                }
            }, 333); // 3 words per second
        }
    };

    // Audio visualization
    const startVisualization = () => {
        const canvas = canvasRef.current;
        if (!canvas || !analyserRef.current) return;

        const ctx = canvas.getContext('2d');
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                ctx.fillStyle = 'rgb(100, 149, 237)';
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        draw();
    };

    // Handle audio ended
    const handleAudioEnded = async () => {
        setIsPlaying(false);
        if (wordDisplayIntervalRef.current) {
            clearInterval(wordDisplayIntervalRef.current);
        }

        if (interviewState === STATES.PLAYING_QUESTION) {
            // Show full question text
            const question = questionsRef.current[currentQuestionIndexRef.current];
            if (question) {
                setDisplayedText(question.question);
            }
            // Start recording user's answer
            startRecording();
        } else if (interviewState === STATES.PLAYING_RESPONSE) {
            // Show full response statement text
            if (pendingResponseRef.current && pendingResponseRef.current.response_statement) {
                setDisplayedText(pendingResponseRef.current.response_statement);
            }
            // Check if there was a pending follow-up question
            if (pendingResponseRef.current && pendingResponseRef.current.question) {
                insertFollowupQuestion(pendingResponseRef.current);
            }
            pendingResponseRef.current = null;
            // Move to next question (follow-up if one was inserted, otherwise next in list)
            moveToNextQuestion();
        }
    };

    // Schedule the next chunk cut at 15-second intervals
    const scheduleNextChunkCut = () => {
        if (chunkIntervalRef.current) {
            clearTimeout(chunkIntervalRef.current);
        }
        chunkIntervalRef.current = setTimeout(() => {
            performChunkCut();
        }, 15000);
    };

    // Stop the current recorder session, transcribe the complete chunk, then immediately
    // start a fresh recorder session. Each new MediaRecorder produces a full WebM file
    // with its own EBML header, making every chunk valid for Whisper transcription.
    const performChunkCut = async () => {
        if (isStoppingRef.current) return;

        const prevRecorder = mediaRecorderRef.current;
        if (!prevRecorder || prevRecorder.state !== 'recording') return;

        console.log('[Interview] Chunk cut: stopping current session for transcription');

        // Wait for the final ondataavailable to fire before building the blob
        await new Promise(resolve => {
            prevRecorder.onstop = resolve;
            prevRecorder.stop();
        });

        // Transcribe the complete, self-contained chunk
        sendChunkForTranscription();

        // Guard: if stopRecording was called while we were cutting, don't restart
        if (isStoppingRef.current || !streamRef.current) return;

        // Start a fresh recorder session — new EBML header, fully valid WebM
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        const newRecorder = new MediaRecorder(streamRef.current, { mimeType });

        newRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordingChunksRef.current.push(event.data);
                console.log('[Interview] New session chunk, size:', event.data.size);
            }
        };

        mediaRecorderRef.current = newRecorder;
        newRecorder.start(1000);
        console.log('[Interview] Fresh recorder session started after chunk cut');

        // Schedule the next cut
        scheduleNextChunkCut();
    };

    // Start recording user's answer
    const startRecording = async () => {
        isStoppingRef.current = false; // Reset the stopping guard
        setInterviewState(STATES.RECORDING);
        transcriptionPromisesRef.current = [];
        recordingChunksRef.current = [];

        // Stop the visualization (don't show mic input)
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        try {
            const stream = streamRef.current;
            if (!stream) {
                throw new Error('No microphone stream available');
            }

            // Debug: Check stream state
            const audioTracks = stream.getAudioTracks();
            console.log('[Interview] Stream audio tracks:', audioTracks.length);
            audioTracks.forEach((track, i) => {
                console.log(`[Interview] Track ${i}: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}, label=${track.label}`);
            });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            console.log('[Interview] Using MIME type:', mimeType);

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordingChunksRef.current.push(event.data);
                    console.log('[Interview] Chunk received, size:', event.data.size, 'total chunks:', recordingChunksRef.current.length);
                }
            };

            mediaRecorderRef.current.start(1000); // Collect data every second
            console.log('[Interview] MediaRecorder started, state:', mediaRecorderRef.current.state);

            // Set up hark for voice activity detection
            setupHarkDetection(stream);

            // Schedule first chunk cut at 15 seconds
            scheduleNextChunkCut();

            // Fallback timeout: stop recording after 120 seconds max
            recordingTimeoutRef.current = setTimeout(() => {
                console.log('[Interview] Recording timeout reached (120s), stopping recording');
                if (!isStoppingRef.current) {
                    stopRecording();
                }
            }, 120000);
        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Failed to start recording');
            setInterviewState(STATES.ERROR);
        }
    };

    // Resume recording after pause (doesn't reset transcription promises)
    const resumeRecording = async () => {
        isStoppingRef.current = false;
        setInterviewState(STATES.RECORDING);
        recordingChunksRef.current = []; // Only reset recording buffer, keep transcription promises

        try {
            const stream = streamRef.current;
            if (!stream) {
                throw new Error('No microphone stream available');
            }

            // Debug: Check stream state
            const audioTracks = stream.getAudioTracks();
            console.log('[Interview] Resume - Stream audio tracks:', audioTracks.length);
            audioTracks.forEach((track, i) => {
                console.log(`[Interview] Resume - Track ${i}: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
            });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordingChunksRef.current.push(event.data);
                    console.log('[Interview] Resume - Chunk received, size:', event.data.size);
                }
            };

            mediaRecorderRef.current.start(1000);
            console.log('[Interview] Resume - MediaRecorder started');

            // Set up hark for voice activity detection
            setupHarkDetection(stream);

            // Schedule first chunk cut at 15 seconds for this resumed session
            scheduleNextChunkCut();

            // Fallback timeout: stop recording after 120 seconds max
            recordingTimeoutRef.current = setTimeout(() => {
                console.log('[Interview] Recording timeout reached (120s), stopping recording');
                if (!isStoppingRef.current) {
                    stopRecording();
                }
            }, 120000);
        } catch (err) {
            console.error('Error resuming recording:', err);
            setError('Failed to resume recording');
            setInterviewState(STATES.ERROR);
        }
    };

    // Send audio chunk for background transcription
    // Creates a promise that resolves with transcribed text, tracks it for ordered assembly
    const sendChunkForTranscription = () => {
        if (recordingChunksRef.current.length === 0) return;

        const chunks = [...recordingChunksRef.current];
        recordingChunksRef.current = []; // Clear for next chunk

        const audioBlob = new Blob(chunks, {
            type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });

        const question = questionsRef.current[currentQuestionIndexRef.current];
        if (!question) return;

        console.log('[Interview] Sending chunk for transcription, size:', audioBlob.size);

        const promise = apiService.transcribeAudio(audioBlob, question.question_id)
            .then(result => {
                if (result.text) {
                    const wordCount = result.text.trim().split(/\s+/).length;
                    console.log('[Interview] Transcription received:', wordCount, 'words');
                    return result.text;
                }
                console.log('[Interview] Transcription returned empty');
                return '';
            })
            .catch(err => {
                console.error('[Interview] Transcription error:', err);
                return '';
            });

        transcriptionPromisesRef.current.push(promise);
    };

    // Set up hark for voice activity detection
    const setupHarkDetection = (stream) => {
        // Clean up previous hark instance if exists
        if (harkRef.current) {
            harkRef.current.stop();
            harkRef.current = null;
        }

        // Create hark instance with options
        // threshold: minimum audio level to consider as speaking (default -50dB)
        // Lower values (e.g., -70) = more sensitive, higher values (e.g., -40) = less sensitive
        // interval: how often to check audio levels in ms
        const speechEvents = hark(stream, {
            threshold: -65,  // More sensitive for distant mics like webcams
            interval: 100    // Check every 100ms
        });

        console.log('[Interview] Hark initialized with threshold -65dB');

        let hasSpeaking = false;
        let silenceTimeout = null;

        speechEvents.on('speaking', () => {
            console.log('[Interview] Hark: Speaking detected');
            hasSpeaking = true;
            // Clear any pending silence timeout
            if (silenceTimeout) {
                clearTimeout(silenceTimeout);
                silenceTimeout = null;
            }
        });

        speechEvents.on('stopped_speaking', () => {
            console.log('[Interview] Hark: Stopped speaking');
            // Only trigger silence detection if user has spoken at least once
            if (hasSpeaking && !isStoppingRef.current) {
                // Wait 2.5 seconds of silence before stopping
                silenceTimeout = setTimeout(() => {
                    if (!isStoppingRef.current) {
                        console.log('[Interview] Hark: 2.5s silence after speech, stopping recording');
                        stopRecording();
                    }
                }, 2500);
            }
        });

        // Store reference for cleanup
        harkRef.current = speechEvents;
        // Also store silence timeout ref for cleanup
        silenceTimerRef.current = silenceTimeout;
    };

    // Stop recording and submit answer
    const stopRecording = async () => {
        // Guard against multiple calls
        if (isStoppingRef.current) {
            console.log('[Interview] stopRecording already in progress, skipping');
            return;
        }
        isStoppingRef.current = true;

        try {
            // Clean up hark
            if (harkRef.current) {
                harkRef.current.stop();
                harkRef.current = null;
            }

            // Clear recording timeout
            if (recordingTimeoutRef.current) {
                clearTimeout(recordingTimeoutRef.current);
                recordingTimeoutRef.current = null;
            }

            // Clear silence timer
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }

            if (chunkIntervalRef.current) {
                clearTimeout(chunkIntervalRef.current);
                chunkIntervalRef.current = null;
            }

            // Wait for the recorder to fully stop so the final ondataavailable fires
            // before we build the transcription blob — otherwise the last chunk is lost
            await new Promise(resolve => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.onstop = resolve;
                    mediaRecorderRef.current.stop();
                } else {
                    resolve();
                }
            });

            setInterviewState(STATES.PROCESSING);

            // Transcribe the complete recording session as one valid audio file
            sendChunkForTranscription();

            // Wait for all transcription promises (one per recording session)
            const results = await Promise.all(transcriptionPromisesRef.current);
            const fullAnswer = results.filter(Boolean).join(' ').trim();

            if (!fullAnswer) {
                // No answer detected, move to next question
                moveToNextQuestion();
                return;
            }

            // Submit answer
            await submitAnswer(fullAnswer);
        } catch (err) {
            console.error('[Interview] Error in stopRecording:', err);
            // On error, still try to move to next question to avoid getting stuck
            moveToNextQuestion();
        } finally {
            isStoppingRef.current = false;
        }
    };

    // Submit answer to backend
    const submitAnswer = async (answer) => {
        const question = questionsRef.current[currentQuestionIndexRef.current];
        if (!question) return;

        try {
            const result = await apiService.submitInterviewAnswer(
                interviewIdRef.current,
                question.question_id,
                answer
            );

            // Check if there's a response statement to play
            if (result.response_audio_file) {
                pendingResponseRef.current = result;
                await playResponseStatement(result);
            } else if (result.question) {
                // Follow-up question - insert into questions array
                insertFollowupQuestion(result);
                moveToNextQuestion();
            } else {
                // Move to next question
                moveToNextQuestion();
            }
        } catch (err) {
            console.error('Error submitting answer:', err);
            // Don't lock the interview on a transient network error.
            // The backend likely processed the answer successfully,
            // so move to the next question to keep the interview going.
            console.warn('[Interview] Answer submission failed, skipping to next question');
            moveToNextQuestion();
        }
    };

    // Play response statement
    const playResponseStatement = async (result) => {
        setInterviewState(STATES.PLAYING_RESPONSE);

        try {
            // Use parent_question_id (the answered question) to fetch response audio
            const audioBlob = await apiService.getQuestionAudio(
                interviewIdRef.current,
                result.parent_question_id,
                true // statement = true
            );
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.src = audioUrl;

                // Reuse the existing source node if available, otherwise create one
                if (!sourceNodeRef.current) {
                    sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                    sourceNodeRef.current.connect(analyserRef.current);
                    analyserRef.current.connect(audioContextRef.current.destination);
                }

                await audioRef.current.play();
                setIsPlaying(true);

                // Display response statement text word by word
                if (result.response_statement) {
                    startWordDisplay(result.response_statement);
                }

                startVisualization();
            }
        } catch (err) {
            console.error('Error playing response:', err);
            // Continue anyway
            if (result.question) {
                insertFollowupQuestion(result);
            }
            moveToNextQuestion();
        }
    };

    // Insert follow-up question into array
    const insertFollowupQuestion = (result) => {
        if (!result.question_id) {
            console.warn('[Interview] Ignoring follow-up with no question_id');
            return;
        }

        const newQuestion = {
            question_id: result.question_id,
            question_order: result.question_order,
            question: result.question,
            sound_file: result.sound_file,
            parent_question_id: result.parent_question_id,
            category: questionsRef.current[currentQuestionIndexRef.current]?.category || 'follow-up'
        };

        setQuestions(prev => {
            const updated = [...prev];
            updated.splice(currentQuestionIndexRef.current + 1, 0, newQuestion);
            questionsRef.current = updated;
            return updated;
        });
    };

    // Move to next question
    const moveToNextQuestion = () => {
        const nextIndex = currentQuestionIndexRef.current + 1;
        if (nextIndex >= questionsRef.current.length) {
            // Interview complete - clean up resources
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            setInterviewState(STATES.COMPLETED);
        } else {
            setCurrentQuestionIndex(nextIndex);
            currentQuestionIndexRef.current = nextIndex;
            playQuestion(nextIndex);
        }
    };

    // Control handlers
    const handlePlay = async () => {
        console.log('[Interview] handlePlay called', {
            interviewState,
            isPaused,
            wasRecordingWhenPaused,
            questionsLength: questionsRef.current.length,
            currentIndex: currentQuestionIndexRef.current
        });
        setWasStopped(false); // Clear stopped state when play is pressed

        // Resume recording if we were recording when paused
        if (isPaused && wasRecordingWhenPaused) {
            console.log('[Interview] Resuming recording after pause');
            setIsPaused(false);
            setWasRecordingWhenPaused(false);
            // Restart recording (don't reset transcribed chunks - keep accumulating)
            await resumeRecording();
            return;
        }

        if (interviewState === STATES.READY) {
            // If we have questions and a current index, resume from there
            // Otherwise start from the beginning
            if (questionsRef.current.length > 0) {
                console.log('[Interview] Playing question from READY state');
                await initAudioContext();
                await playQuestion(currentQuestionIndexRef.current);
            } else {
                console.log('[Interview] Starting interview (no questions yet)');
                startInterview();
            }
        } else if (isPaused && audioRef.current) {
            // Resume audio
            audioRef.current.play();

            // Resume word display from where it left off
            resumeWordDisplay();

            // Resume visualization
            startVisualization();

            setIsPaused(false);
            setIsPlaying(true);
        }
    };

    const handlePause = async () => {
        // If already paused, treat as resume (toggle behavior)
        if (isPaused) {
            handlePlay();
            return;
        }

        // Handle pause during recording
        if (interviewState === STATES.RECORDING) {
            console.log('[Interview] Pausing during recording');

            // Clean up hark
            if (harkRef.current) {
                harkRef.current.stop();
                harkRef.current = null;
            }

            // Clear silence timer
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }

            // Clear recording timeout
            if (recordingTimeoutRef.current) {
                clearTimeout(recordingTimeoutRef.current);
                recordingTimeoutRef.current = null;
            }

            // Stop the chunk interval
            if (chunkIntervalRef.current) {
                clearTimeout(chunkIntervalRef.current);
                chunkIntervalRef.current = null;
            }

            // Wait for the recorder to fully stop so the final ondataavailable fires
            // before we build the transcription blob — otherwise the last chunk is lost
            await new Promise(resolve => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.onstop = resolve;
                    mediaRecorderRef.current.stop();
                } else {
                    resolve();
                }
            });

            // Transcribe the complete recording session captured so far
            sendChunkForTranscription();

            setWasRecordingWhenPaused(true);
            setIsPaused(true);
            setInterviewState(STATES.READY); // Go to ready state while paused
            return;
        }

        // Handle pause during audio playback
        if (audioRef.current && isPlaying) {
            // Pause audio
            audioRef.current.pause();

            // Stop word display interval (but keep the index for resume)
            if (wordDisplayIntervalRef.current) {
                clearInterval(wordDisplayIntervalRef.current);
                wordDisplayIntervalRef.current = null;
            }

            // Stop visualization
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            setIsPaused(true);
            setIsPlaying(false);
        }
    };

    const handleStop = () => {
        // Stop visualization
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Stop word display
        if (wordDisplayIntervalRef.current) {
            clearInterval(wordDisplayIntervalRef.current);
            wordDisplayIntervalRef.current = null;
        }

        // Stop any playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // Clean up hark
        if (harkRef.current) {
            harkRef.current.stop();
            harkRef.current = null;
        }

        // Stop recording if active (without submitting)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (chunkIntervalRef.current) {
            clearTimeout(chunkIntervalRef.current);
            chunkIntervalRef.current = null;
        }

        // Clear recording timeouts
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (recordingTimeoutRef.current) {
            clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = null;
        }

        // Clear any pending transcription
        transcriptionPromisesRef.current = [];
        recordingChunksRef.current = [];

        setIsPlaying(false);
        setIsPaused(false);
        setWasStopped(true); // Mark that stop was pressed
        setWasRecordingWhenPaused(false); // Clear recording pause state

        // Go to READY state so user can click play to restart current question
        setInterviewState(STATES.READY);
    };

    // Handle rec button click - stops recording and submits answer
    const handleRecClick = () => {
        if (interviewState === STATES.RECORDING) {
            console.log('[Interview] Rec button clicked - stopping recording manually');
            stopRecording();
        }
    };

    const handleExit = () => {
        // Stop visualization
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Stop word display
        if (wordDisplayIntervalRef.current) {
            clearInterval(wordDisplayIntervalRef.current);
            wordDisplayIntervalRef.current = null;
        }

        // Stop any playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // Stop recording if active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (chunkIntervalRef.current) {
            clearTimeout(chunkIntervalRef.current);
            chunkIntervalRef.current = null;
        }

        // Stop microphone stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }

        setIsPlaying(false);
        setIsPaused(false);
        setInterviewState(STATES.COMPLETED);
    };

    // Get question label for display
    const getQuestionLabel = () => {
        if (!currentQuestion) return 'Question 1';

        // Check if this is a follow-up question
        if (currentQuestion.parent_question_id) {
            // Find the parent question's number
            const parentIndex = questions.findIndex(q => q.question_id === currentQuestion.parent_question_id);
            if (parentIndex >= 0) {
                let parentNum = 0;
                for (let i = 0; i <= parentIndex; i++) {
                    if (!questions[i].parent_question_id) {
                        parentNum++;
                    }
                }
                return `Follow-up to Question ${parentNum}`;
            }
            return 'Follow-up Question';
        }

        // Count main questions (those without a parent)
        let count = 0;
        for (let i = 0; i <= currentQuestionIndex; i++) {
            if (!questions[i].parent_question_id) {
                count++;
            }
        }
        return `Question ${count}`;
    };

    // Render preparation state
    if (interviewState === STATES.PREPARING) {
        return (
            <div className="page">
                <div className="header-container">
                    <h1 className="page-title">Mock Interview</h1>
                </div>
                <div className="interview-preparation">
                    <div className="preparation-message">
                        <div className="spinner"></div>
                        <p>{preparationMessage}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Render mic test state
    if (interviewState === STATES.MIC_TEST) {
        // Calculate which bars should be active (10 bars total)
        const totalBars = 10;
        const activeBars = Math.ceil((micLevel / 100) * totalBars);

        return (
            <div className="interview-container">
                <div className="header-container">
                    <h1 className="page-title">Mock Interview</h1>
                </div>
                <div className="mic-test-container">
                    <h2>Microphone Test</h2>
                    <p className="mic-device-name">Using: {micDeviceName}</p>
                    <p className="mic-test-instructions">
                        Speak into your microphone to verify it's working correctly.
                        You should see the level meter respond to your voice.
                    </p>

                    {/* Level meter */}
                    <div className="mic-level-container">
                        <span className="mic-level-label">−</span>
                        <div className="mic-level-meter">
                            {[...Array(totalBars)].map((_, index) => (
                                <div
                                    key={index}
                                    className={`mic-level-bar ${index < activeBars ? 'active' : ''} ${index >= 7 ? 'high' : index >= 4 ? 'medium' : 'low'}`}
                                />
                            ))}
                        </div>
                        <span className="mic-level-label">+</span>
                    </div>

                    {/* Numeric level display */}
                    <p className="mic-level-value">Level: {Math.round(micLevel)}%</p>

                    {/* Status message */}
                    <p className={`mic-status ${micLevel > 20 ? 'mic-status-good' : 'mic-status-low'}`}>
                        {micLevel > 20
                            ? '✓ Microphone is picking up sound'
                            : 'Speak louder or move closer to the microphone'}
                    </p>

                    {/* Continue button */}
                    <button
                        className="action-button"
                        onClick={confirmMicTest}
                    >
                        Continue to Interview
                    </button>

                    <p className="mic-test-note">
                        Tip: If the level is too low, check your system microphone settings
                        or try using a headset microphone.
                    </p>
                </div>
            </div>
        );
    }

    // Recover from error: move to next question (or finish if on the last one)
    const handleContinueInterview = () => {
        setError(null);
        moveToNextQuestion();
    };

    // Recover from error: retry the current question from the start
    const handleRetryQuestion = () => {
        setError(null);
        setInterviewState(STATES.READY);
    };

    // Render error state
    if (interviewState === STATES.ERROR) {
        return (
            <div className="interview-container">
                <div className="header-container">
                    <h1 className="page-title">Mock Interview</h1>
                </div>
                <div className="interview-error">
                    <p>{error}</p>
                    {interviewId && questions.length > 0 ? (
                        <div className="error-actions">
                            <button className="action-button" onClick={handleRetryQuestion}>
                                Retry Question
                            </button>
                            <button className="action-button" onClick={handleContinueInterview}>
                                Skip to Next Question
                            </button>
                            <button className="action-button" onClick={() => navigate(`/interview-review/${interviewId}${jobId ? `?job_id=${jobId}` : ''}`)}>
                                End &amp; View Results
                            </button>
                        </div>
                    ) : (
                        <button className="action-button" onClick={() => window.location.reload()}>
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Render completed state
    if (interviewState === STATES.COMPLETED) {
        return (
            <div className="interview-container">
                <div className="header-container">
                    <h1 className="page-title">Mock Interview</h1>
                </div>
                <div className="interview-completed">
                    <h2>Interview Completed</h2>
                    <p>Thank you for completing the practice interview.</p>
                    <button
                        className="action-button"
                        onClick={() => navigate(`/interview-review/${interviewId}${jobId ? `?job_id=${jobId}` : ''}`)}
                    >
                        View Results
                    </button>
                </div>
            </div>
        );
    }

    // Render main interview interface
    return (
        <div className="interview-container">
            <div className="header-container">
                <h1 className="page-title">Mock Interview</h1>
            </div>

            <audio ref={audioRef} onEnded={handleAudioEnded} />

            <div className="interview-content">
                {/* Visualizer Box */}
                <div className="visualizer-container">
                    <canvas ref={canvasRef} className="visualizer-canvas" width="600" height="150" />
                </div>

                {/* Control Buttons */}
                <div className="controls-row">
                    {/* Rec Button - far left, clickable when recording to stop */}
                    <button
                        className="control-button rec-button"
                        onClick={handleRecClick}
                        disabled={interviewState !== STATES.RECORDING}
                        title={interviewState === STATES.RECORDING ? "Click to stop recording" : ""}
                    >
                        <img
                            src={interviewState === STATES.RECORDING ? "/rec2.png" : "/rec.png"}
                            alt="Rec"
                            className="control-icon"
                        />
                    </button>

                    {/* Center group: Pause, Play, Stop */}
                    <div className="controls-center">
                        {/* Pause Button - enabled when playing, recording, or paused (toggle) */}
                        <button
                            className="control-button"
                            onClick={handlePause}
                            disabled={!isPlaying && !isPaused && interviewState !== STATES.RECORDING}
                        >
                            <img
                                src={isPaused ? "/pause2.png" : "/pause.png"}
                                alt="Pause"
                                className="control-icon"
                            />
                        </button>
                        {/* Play Button - active when playing */}
                        <button
                            className="control-button"
                            onClick={handlePlay}
                            disabled={isPlaying && !isPaused}
                        >
                            <img
                                src={isPlaying && !isPaused ? "/play2.png" : "/play.png"}
                                alt="Play"
                                className="control-icon"
                            />
                        </button>
                        {/* Stop Button - active when stopped */}
                        <button
                            className="control-button"
                            onClick={handleStop}
                            disabled={interviewState === STATES.READY && !wasStopped}
                        >
                            <img
                                src={wasStopped ? "/stop2.png" : "/stop.png"}
                                alt="Stop"
                                className="control-icon"
                            />
                        </button>
                    </div>

                    {/* Exit Button - far right, active on hover */}
                    <button
                        className="control-button exit-button"
                        onClick={handleExit}
                        onMouseEnter={() => setExitHovered(true)}
                        onMouseLeave={() => setExitHovered(false)}
                    >
                        <img
                            src={exitHovered ? "/exit2.png" : "/exit.png"}
                            alt="Exit"
                            className="control-icon"
                        />
                    </button>
                </div>

                {/* Status indicator */}
                <div className="status-indicator">
                    {interviewState === STATES.READY && (
                        <p className="ready-message">Ready? Click play to start the interview</p>
                    )}
                    {interviewState === STATES.PLAYING_QUESTION && (
                        <p>Listening to question...</p>
                    )}
                    {interviewState === STATES.RECORDING && (
                        <p className="recording-status">Recording your answer...</p>
                    )}
                    {interviewState === STATES.PROCESSING && (
                        <p>Processing your answer...</p>
                    )}
                    {interviewState === STATES.PLAYING_RESPONSE && (
                        <p>Interviewer response...</p>
                    )}
                </div>

                {/* Question Display */}
                {(currentQuestion || interviewState === STATES.PLAYING_RESPONSE) && (
                    <div className="question-display">
                        <h3 className="question-label">
                            {interviewState === STATES.PLAYING_RESPONSE
                                ? 'Interviewer Response'
                                : getQuestionLabel()}
                        </h3>
                        <div className="question-text-box">
                            <p className="question-text">{displayedText}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MockInterview;
