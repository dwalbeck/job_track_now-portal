import React, { useState, useEffect, useRef } from 'react';
import './TimePickerModal.css';

const TimePickerModal = ({ isOpen, onClose, initialTime, inheritPeriodFrom, onSelect }) => {
    const [mode, setMode] = useState('hour'); // 'hour' or 'minute'
    const [hour, setHour] = useState(12);
    const [minute, setMinute] = useState(0);
    const [period, setPeriod] = useState('PM');
    const [hoveredValue, setHoveredValue] = useState(null);
    const [keyboardInput, setKeyboardInput] = useState('');
    const modalRef = useRef(null);
    const clockRef = useRef(null);

    useEffect(() => {
        if (isOpen && initialTime) {
            // Parse initialTime (format: "HH:MM")
            const [hours, minutes] = initialTime.split(':').map(Number);
            const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

            setHour(displayHour);
            setMinute(minutes);

            // If inheritPeriodFrom is provided (for end time), use that period
            if (inheritPeriodFrom) {
                const [inheritHours] = inheritPeriodFrom.split(':').map(Number);
                const inheritPM = inheritHours >= 12;
                setPeriod(inheritPM ? 'PM' : 'AM');
            } else {
                // Otherwise use the period from initialTime (or default to PM)
                const isPM = hours >= 12;
                setPeriod(isPM ? 'PM' : 'AM');
            }

            setMode('hour');
            setHoveredValue(null);
            setKeyboardInput('');
        }
    }, [isOpen, initialTime, inheritPeriodFrom]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            // Prevent default behavior and stop propagation for all modal key events
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'Backspace' || (e.key >= '0' && e.key <= '9')) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (e.key === 'Escape') {
                handleCancel();
            } else if (e.key === 'Enter') {
                if (mode === 'hour') {
                    // Zero-pad single digit hour before advancing
                    if (keyboardInput.length === 1) {
                        // Already has the value set, just clear input and advance
                        setKeyboardInput('');
                    }
                    handleHourSelect(hour);
                } else {
                    handleOk();
                }
            } else if (e.key === 'Backspace') {
                handleBackspace();
            } else if (e.key >= '0' && e.key <= '9') {
                handleKeyboardInput(e.key);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode, hour, minute, keyboardInput]);

    const handleKeyboardInput = (digit) => {
        if (mode === 'hour') {
            if (keyboardInput.length === 0) {
                // First digit
                if (digit === '1') {
                    // Could be 1, 10, 11, or 12 - wait for next digit
                    setKeyboardInput('1');
                    setHour(1);
                } else if (digit === '0') {
                    // 0 is not valid for hours, ignore
                    return;
                } else {
                    // 2-9: single digit hour
                    const value = parseInt(digit);
                    setHour(value);
                    setKeyboardInput(digit);
                }
            } else if (keyboardInput === '1') {
                // Second digit after 1
                if (digit === '0' || digit === '1' || digit === '2') {
                    // Valid: 10, 11, 12
                    const value = parseInt('1' + digit);
                    setHour(value);
                    setKeyboardInput('');
                } else {
                    // Invalid - reset and use new digit
                    if (digit === '0' || digit === '1') {
                        // These would make invalid hours, ignore
                        setKeyboardInput('');
                        return;
                    }
                    const value = parseInt(digit);
                    setHour(value);
                    setKeyboardInput(digit);
                }
            } else {
                // Already have a complete hour, replace with new digit
                if (digit === '1') {
                    setKeyboardInput('1');
                    setHour(1);
                } else if (digit === '0') {
                    return;
                } else {
                    const value = parseInt(digit);
                    setHour(value);
                    setKeyboardInput(digit);
                }
            }
        } else {
            // Minute mode
            if (keyboardInput.length === 0) {
                // First digit
                const value = parseInt(digit);
                setMinute(value);
                setKeyboardInput(digit);
            } else if (keyboardInput.length === 1) {
                const firstDigit = parseInt(keyboardInput);
                if (firstDigit >= 0 && firstDigit <= 5) {
                    // 0-5: can have second digit
                    const value = parseInt(keyboardInput + digit);
                    setMinute(value);
                    setKeyboardInput('');
                } else {
                    // 6-9: second digit replaces first
                    const value = parseInt(digit);
                    setMinute(value);
                    setKeyboardInput(digit);
                }
            } else {
                // Third digit - reset and use new digit
                const value = parseInt(digit);
                setMinute(value);
                setKeyboardInput(digit);
            }
        }
    };

    const handleBackspace = () => {
        if (keyboardInput.length > 0) {
            const newInput = keyboardInput.slice(0, -1);
            setKeyboardInput(newInput);

            if (mode === 'hour') {
                if (newInput.length === 0) {
                    // Show 0 when no input
                    setHour(12); // Default to 12 for hours
                } else {
                    setHour(parseInt(newInput));
                }
            } else {
                // Minute mode
                if (newInput.length === 0) {
                    // Show 0 when no input
                    setMinute(0);
                } else {
                    setMinute(parseInt(newInput));
                }
            }
        }
    };

    const handleHourSelect = (selectedHour) => {
        setHour(selectedHour);
        setMode('minute');
        setHoveredValue(null);
        setKeyboardInput('');
    };

    const handleMinuteSelect = (selectedMinute) => {
        setMinute(selectedMinute);
        // Pass the selected minute directly to avoid state update race condition
        handleOk(selectedMinute);
    };

    const handleCancel = () => {
        setKeyboardInput('');
        onClose();
    };

    const handleOk = (overrideMinute = null) => {
        // Validate hour
        const validHour = !isNaN(hour) && hour >= 1 && hour <= 12 ? hour : 12;

        // Convert to 24-hour format
        let hours24 = validHour;
        if (period === 'PM' && validHour !== 12) {
            hours24 = validHour + 12;
        } else if (period === 'AM' && validHour === 12) {
            hours24 = 0;
        }

        // Use overrideMinute if provided (for immediate minute selection), otherwise use state
        let finalMinute = overrideMinute !== null ? overrideMinute : minute;

        // Validate minute - ensure it's a number and in valid range
        if (isNaN(finalMinute) || finalMinute < 0 || finalMinute > 59) {
            finalMinute = 0;
        }

        const timeString = `${String(hours24).padStart(2, '0')}:${String(finalMinute).padStart(2, '0')}`;
        onSelect(timeString);
        setKeyboardInput('');
        onClose();
    };

    const handleClockClick = (value) => {
        if (mode === 'hour') {
            handleHourSelect(value);
        } else {
            handleMinuteSelect(value);
        }
    };

    const getClockHandAngle = () => {
        if (mode === 'hour') {
            // Priority: keyboard input > hover > current value
            const displayHour = hoveredValue !== null && keyboardInput.length === 0 ? hoveredValue : hour;
            // Validate displayHour to prevent NaN
            const validHour = !isNaN(displayHour) && displayHour >= 1 && displayHour <= 12 ? displayHour : 12;
            return ((validHour % 12) * 30) - 90;
        } else {
            // Priority: keyboard input > hover > current value
            const displayMinute = hoveredValue !== null && keyboardInput.length === 0 ? hoveredValue : minute;
            // Validate displayMinute to prevent NaN
            const validMinute = !isNaN(displayMinute) && displayMinute >= 0 && displayMinute <= 59 ? displayMinute : 0;
            return (validMinute * 6) - 90;
        }
    };

    const renderHourClock = () => {
        const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        return hours.map((h, index) => {
            const angle = (index * 30 - 90) * (Math.PI / 180);
            const radius = 90;
            const x = 120 + radius * Math.cos(angle);
            const y = 120 + radius * Math.sin(angle);

            // Priority: keyboard input > hover > current value
            const currentHour = hoveredValue !== null && keyboardInput.length === 0 ? hoveredValue : hour;
            const isSelected = currentHour === h;

            return (
                <div
                    key={h}
                    className={`clock-number ${isSelected ? 'selected' : ''}`}
                    style={{
                        left: `${x}px`,
                        top: `${y}px`
                    }}
                    onMouseEnter={() => setHoveredValue(h)}
                    onClick={() => handleClockClick(h)}
                >
                    {h}
                </div>
            );
        });
    };

    const renderMinuteClock = () => {
        const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
        return minutes.map((m, index) => {
            const angle = (index * 30 - 90) * (Math.PI / 180);
            const radius = 90;
            const x = 120 + radius * Math.cos(angle);
            const y = 120 + radius * Math.sin(angle);

            // Priority: keyboard input > hover > current value
            const currentMinute = hoveredValue !== null && keyboardInput.length === 0 ? hoveredValue : minute;
            const isSelected = currentMinute === m;

            return (
                <div
                    key={m}
                    className={`clock-number ${isSelected ? 'selected' : ''}`}
                    style={{
                        left: `${x}px`,
                        top: `${y}px`
                    }}
                    onMouseEnter={() => setHoveredValue(m)}
                    onClick={() => handleClockClick(m)}
                >
                    {String(m).padStart(2, '0')}
                </div>
            );
        });
    };

    if (!isOpen) return null;

    // Priority: keyboard input > hover > current value
    // If user is typing (keyboardInput has content), ignore hover
    const displayHour = mode === 'hour' && hoveredValue !== null && keyboardInput.length === 0 ? hoveredValue : hour;
    const displayMinute = mode === 'minute' && hoveredValue !== null && keyboardInput.length === 0 ? hoveredValue : minute;

    return (
        <div className="time-picker-overlay" onClick={handleCancel}>
            <div
                className="time-picker-modal"
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="time-picker-header">Select time</div>

                <div className="time-display">
                    <div className="time-segments">
                        <div
                            className={`time-segment ${mode === 'hour' ? 'active' : ''}`}
                            onClick={() => setMode('hour')}
                        >
                            {String(displayHour).padStart(2, '0')}
                        </div>
                        <div className="time-separator">:</div>
                        <div
                            className={`time-segment ${mode === 'minute' ? 'active' : ''}`}
                            onClick={() => setMode('minute')}
                        >
                            {String(displayMinute).padStart(2, '0')}
                        </div>
                    </div>
                    <div className="period-selector">
                        <button
                            className={`period-button ${period === 'AM' ? 'active' : ''}`}
                            onClick={() => setPeriod('AM')}
                        >
                            AM
                        </button>
                        <button
                            className={`period-button ${period === 'PM' ? 'active' : ''}`}
                            onClick={() => setPeriod('PM')}
                        >
                            PM
                        </button>
                    </div>
                </div>

                <div
                    className="clock-container"
                    ref={clockRef}
                    onMouseLeave={() => setHoveredValue(null)}
                >
                    <svg className="clock-face" viewBox="0 0 240 240">
                        <circle cx="120" cy="120" r="110" fill="#E8EAF6" />
                        <line
                            x1="120"
                            y1="120"
                            x2={120 + 80 * Math.cos(getClockHandAngle() * Math.PI / 180)}
                            y2={120 + 80 * Math.sin(getClockHandAngle() * Math.PI / 180)}
                            stroke="#3949AB"
                            strokeWidth="2"
                        />
                        <circle
                            cx={120 + 80 * Math.cos(getClockHandAngle() * Math.PI / 180)}
                            cy={120 + 80 * Math.sin(getClockHandAngle() * Math.PI / 180)}
                            r="20"
                            fill="#3949AB"
                        />
                        <circle cx="120" cy="120" r="4" fill="#3949AB" />
                    </svg>
                    {mode === 'hour' ? renderHourClock() : renderMinuteClock()}
                </div>

                <div className="time-picker-actions">
                    <button className="picker-cancel" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button className="picker-ok" onClick={() => handleOk()}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimePickerModal;
