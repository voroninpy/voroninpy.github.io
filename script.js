document.addEventListener('DOMContentLoaded', () => {
    // First, verify that all required constants are available
    const requiredConfigs = ['ACTIVE_START', 'ACTIVE_END', 'WORK_START', 'WORK_END', 'FADE_IN_DURATION', 'VISIBLE_DURATION', 'FADE_OUT_DURATION'];
    const missingConfigs = [];
    
    requiredConfigs.forEach(config => {
        if (typeof window[config] === 'undefined') {
            missingConfigs.push(config);
            console.error(`[Time] Missing required configuration: ${config}`);
        }
    });
    
    if (missingConfigs.length > 0) {
        console.error(`[Time] Missing ${missingConfigs.length} required configurations. Please check config.js file.`);
    }

    // Get DOM elements
    const elements = {
        year: {
            value: document.getElementById('year-value'),
            progress: document.getElementById('year-progress'),
            percentage: document.getElementById('year-percentage')
        },
        month: {
            value: document.getElementById('month-value'),
            progress: document.getElementById('month-progress'),
            percentage: document.getElementById('month-percentage')
        },
        week: {
            value: document.getElementById('week-value'),
            progress: document.getElementById('week-progress'),
            percentage: document.getElementById('week-percentage')
        },
        day: {
            value: document.getElementById('day-value'),
            progress: document.getElementById('day-progress'),
            percentage: document.getElementById('day-percentage')
        },
        hour: {
            value: document.getElementById('hour-value'),
            progress: document.getElementById('hour-progress'),
            percentage: document.getElementById('hour-percentage')
        },
        quote: document.getElementById('time-quote'),
        modeOverlay: document.getElementById('mode-overlay'),
        devControls: document.getElementById('dev-controls'),
        devDate: document.getElementById('dev-date'),
        devTime: document.getElementById('dev-time'),
        devApply: document.getElementById('dev-apply'),
        devReset: document.getElementById('dev-reset'),
        devDebug: null
    };

    // Development mode variables
    let usingCustomTime = false;
    let customTime = null;
    let customTimeStartedAt = null;
    let debugModeActive = false;

    // Initialize development mode
    if (typeof DEV_MODE_ENABLED !== 'undefined' && DEV_MODE_ENABLED) {
        log("Development mode is enabled");
        initDevMode();
    }
    
    // Log time window configurations
    log(`Active window: ${ACTIVE_START} to ${ACTIVE_END}`);
    log(`Work window: ${WORK_START} to ${WORK_END}`);

    // Time quotes to display randomly
    const timeQuotes = [
        "Time flies like an arrow",
        "The future is something which everyone reaches at the rate of sixty minutes an hour",
        "Time is the most valuable thing a person can spend",
        "Time is a created thing. To say 'I don't have time' is to say 'I don't want to'",
        "Time is the wisest counselor of all",
        "The two most powerful warriors are patience and time",
        "Yesterday is history, today is a gift, tomorrow is a mystery",
        "Lost time is never found again",
        "Better three hours too soon than a minute too late",
        "Time waits for no one",
        "The trouble is, you think you have time",
        "Time you enjoy wasting is not wasted time",
        "They always say time changes things, but you actually have to change them yourself",
        "The key is in not spending time, but in investing it",
        "Time is what we want most, but what we use worst",
        "Time heals all wounds",
        "Time is a great teacher, but unfortunately it kills all its students",
        "Time is a valuable commodity, but it's also a valuable commodity",  
    ];

    // Current mode
    let currentModeIndex = 0;

    // Simple console logger
    function log(msg) {
        console.log(`[Time] ${msg}`);
    }

    // Development mode initialization
    function initDevMode() {
        // Show dev controls
        elements.devControls.style.display = 'flex';
        
        // Add debug checkbox
        const debugRow = document.createElement('div');
        debugRow.className = 'dev-control-row';
        
        const debugLabel = document.createElement('label');
        debugLabel.htmlFor = 'dev-debug';
        debugLabel.textContent = 'Debug Mode:';
        
        const debugCheckbox = document.createElement('input');
        debugCheckbox.type = 'checkbox';
        debugCheckbox.id = 'dev-debug';
        
        debugRow.appendChild(debugLabel);
        debugRow.appendChild(debugCheckbox);
        elements.devControls.insertBefore(debugRow, elements.devApply);
        
        elements.devDebug = debugCheckbox;
        
        // Set default values to current date/time
        const now = new Date();
        const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeString = now.toTimeString().slice(0, 5);  // HH:MM
        
        elements.devDate.value = dateString;
        elements.devTime.value = timeString;
        
        // Debug mode toggling
        elements.devDebug.addEventListener('change', (e) => {
            debugModeActive = e.target.checked;
            log(`Debug mode ${debugModeActive ? 'enabled' : 'disabled'}`);
            updateTime();
        });
        
        // Add event listeners
        elements.devApply.addEventListener('click', () => {
            const dateVal = elements.devDate.value;
            const timeVal = elements.devTime.value;
            
            if (dateVal && timeVal) {
                const [hours, minutes] = timeVal.split(':').map(Number);
                const date = new Date(dateVal);
                date.setHours(hours, minutes, 0, 0);
                
                usingCustomTime = true;
                customTime = date;
                customTimeStartedAt = null; // Will be set on first getCurrentTime call
                log(`Custom time set to: ${customTime}`);
                
                // Force immediate update
                updateTime();
            }
        });
        
        elements.devReset.addEventListener('click', () => {
            usingCustomTime = false;
            customTime = null;
            customTimeStartedAt = null;
            log("Reset to system time");
            
            // Reset input values to current time
            const now = new Date();
            elements.devDate.value = now.toISOString().split('T')[0];
            elements.devTime.value = now.toTimeString().slice(0, 5);
            
            // Force immediate update
            updateTime();
        });
    }

    // Calculate progress for ABSOLUTE mode - original algorithm
    function calculateAbsoluteProgress(now, startDate, endDate) {
        return (now - startDate) / (endDate - startDate);
    }

    // Helper function to get seconds within a day
    function getTimeInSeconds(date) {
        return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    }

    // Helper function to get window bounds today
    function getTodayWindow(windowStartStr, windowEndStr) {
        const now = getCurrentTime();
        
        // Parse start time
        const [startHour, startMin] = windowStartStr.split(':').map(Number);
        const windowStart = new Date(now);
        windowStart.setHours(startHour, startMin, 0, 0);
        
        // Parse end time
        const [endHour, endMin] = windowEndStr.split(':').map(Number);
        const windowEnd = new Date(now);
        windowEnd.setHours(endHour, endMin, 0, 0);
        
        return { windowStart, windowEnd };
    }
    
    // Calculate active day progress with better debugging
    function calculateActiveDay(now, startDate, endDate, windowStartStr, windowEndStr) {
        const { windowStart, windowEnd } = getTodayWindow(windowStartStr, windowEndStr);
        
        if (debugModeActive && currentModeIndex === 2) {
            log(`Day: now=${now.toTimeString()}, windowStart=${windowStart.toTimeString()}, windowEnd=${windowEnd.toTimeString()}`);
        }
        
        // Before window start
        if (now < windowStart) return 0;
        
        // After window end
        if (now > windowEnd) return 1;
        
        // Within window
        return (now - windowStart) / (windowEnd - windowStart);
    }
    
    // Calculate active month progress with better debugging
    function calculateActiveMonth(now, startDate, endDate, windowStartStr, windowEndStr) {
        // Get window times for today
        const { windowStart, windowEnd } = getTodayWindow(windowStartStr, windowEndStr);
        
        // Calculate total days in month
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Current day of month
        const dayOfMonth = now.getDate();
        
        // Window duration in milliseconds
        const windowDuration = windowEnd - windowStart;
        
        // Count effective working days for WORK mode (skip weekends)
        let effectiveDaysInMonth = daysInMonth;
        let effectiveDaysPassed = dayOfMonth - 1;
        
        if (currentModeIndex === 2) {
            // For WORK mode, only count weekdays (we need to count the actual weekdays in month)
            effectiveDaysInMonth = 0;
            effectiveDaysPassed = 0;
            
            // Count working days in the month
            const tempDate = new Date(year, month, 1);
            while (tempDate.getMonth() === month) {
                const dayOfWeek = tempDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
                    effectiveDaysInMonth++;
                    
                    // Count days passed before today
                    if (tempDate.getDate() < dayOfMonth) {
                        effectiveDaysPassed++;
                    }
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }
        }
        
        // Total active time (ms)
        const totalActiveTime = effectiveDaysInMonth * windowDuration;
        
        // Calculate active time passed from previous days
        let activeTimePassed = effectiveDaysPassed * windowDuration;
        
        // Check if today is a workday (for WORK mode)
        const isToday = true; // Always add today's contribution
        const dayOfWeek = now.getDay();
        const isTodayWorkday = (currentModeIndex !== 2) || (dayOfWeek !== 0 && dayOfWeek !== 6);
        
        // Add today's contribution if it's a workday
        if (isTodayWorkday && isToday) {
            if (now < windowStart) {
                // Before today's window - nothing to add
            } else if (now > windowEnd) {
                // After today's window - add full window
                activeTimePassed += windowDuration;
            } else {
                // Within today's window - add partial
                activeTimePassed += (now - windowStart);
            }
        }
        
        const progress = (totalActiveTime > 0) ? activeTimePassed / totalActiveTime : 0;
        
        if (debugModeActive && currentModeIndex === 2) {
            log(`Month: day=${dayOfMonth}/${daysInMonth}, effective=${effectiveDaysPassed}/${effectiveDaysInMonth}, workday=${isTodayWorkday}, active=${activeTimePassed}/${totalActiveTime}, progress=${progress}`);
        }
        
        return progress;
    }
    
    // Calculate active year progress with better debugging
    function calculateActiveYear(now, startDate, endDate, windowStartStr, windowEndStr) {
        // Get window times for today
        const { windowStart, windowEnd } = getTodayWindow(windowStartStr, windowEndStr);
        
        // Calculate total days in year
        const year = now.getFullYear();
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;
        
        // Calculate day of year (1-based)
        const startOfYear = new Date(year, 0, 1);
        const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
        
        // Window duration in milliseconds
        const windowDuration = windowEnd - windowStart;
        
        // Count effective working days for WORK mode (skip weekends)
        let effectiveDaysInYear = daysInYear;
        let effectiveDaysPassed = dayOfYear - 1;
        
        if (currentModeIndex === 2) {
            // For WORK mode, estimate weekdays (approx 5/7 of total days)
            effectiveDaysInYear = Math.floor(daysInYear * 5 / 7);
            
            // Calculate working days passed so far (more precise)
            effectiveDaysPassed = 0;
            const tempDate = new Date(year, 0, 1);
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            
            while (tempDate < today) {
                const dayOfWeek = tempDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
                    effectiveDaysPassed++;
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }
        }
        
        // Total active time in the year (ms)
        const totalActiveTime = effectiveDaysInYear * windowDuration;
        
        // Calculate active time passed from previous days
        let activeTimePassed = effectiveDaysPassed * windowDuration;
        
        // Check if today is a workday (for WORK mode)
        const dayOfWeek = now.getDay();
        const isTodayWorkday = (currentModeIndex !== 2) || (dayOfWeek !== 0 && dayOfWeek !== 6);
        
        // Add today's contribution if it's a workday
        if (isTodayWorkday) {
            if (now < windowStart) {
                // Before today's window - nothing to add
            } else if (now > windowEnd) {
                // After today's window - add full window
                activeTimePassed += windowDuration;
            } else {
                // Within today's window - add partial
                activeTimePassed += (now - windowStart);
            }
        }
        
        const progress = activeTimePassed / totalActiveTime;
        
        if (debugModeActive && currentModeIndex === 2) {
            log(`Year: day=${dayOfYear}/${daysInYear}, effective=${effectiveDaysPassed}/${effectiveDaysInYear}, workday=${isTodayWorkday}, window=${windowStart.toTimeString()}-${windowEnd.toTimeString()}, active=${activeTimePassed}/${totalActiveTime}, progress=${progress}`);
        }
        
        return progress;
    }
    
    // Calculate active week progress with better debugging
    function calculateActiveWeek(now, startDate, endDate, windowStartStr, windowEndStr) {
        // Get window times for today
        const { windowStart, windowEnd } = getTodayWindow(windowStartStr, windowEndStr);
        
        // Get day of week (0=Sunday, 1=Monday, etc.)
        let dayOfWeek = now.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7; // Convert Sunday to 7 for easier calculation
        
        // For WORK mode, only count weekdays (1-5)
        const daysToCount = currentModeIndex === 2 ? 5 : 7;
        
        // Window duration in milliseconds
        const windowDuration = windowEnd - windowStart;
        
        // Total active time in the week (ms)
        const totalActiveTime = daysToCount * windowDuration;
        
        // Calculate active time passed
        // For WORK mode: Only count weekdays (1-5)
        // For other modes: Count all days
        const effectiveDayOfWeek = currentModeIndex === 2 ? Math.min(dayOfWeek, 5) : dayOfWeek;
        let activeTimePassed = (effectiveDayOfWeek - 1) * windowDuration;
        
        // Check if today is a workday (for WORK mode)
        const isTodayWorkday = (currentModeIndex !== 2) || (dayOfWeek <= 5);
        
        // Add today's contribution (if it's a counted day)
        if (isTodayWorkday) {
            if (now < windowStart) {
                // Before today's window - nothing to add
            } else if (now > windowEnd) {
                // After today's window - add full window
                activeTimePassed += windowDuration;
            } else {
                // Within today's window - add partial
                activeTimePassed += (now - windowStart);
            }
        }
        
        const progress = activeTimePassed / totalActiveTime;
        
        if (debugModeActive && currentModeIndex === 2) {
            log(`Week: dayOfWeek=${dayOfWeek}, effectiveDay=${effectiveDayOfWeek}, workday=${isTodayWorkday}, active=${activeTimePassed}/${totalActiveTime}, progress=${progress}`);
        }
        
        return progress;
    }
    
    // Calculate progress for a time unit based on the current mode
    function calculateProgress(unit, now, startDate, endDate) {
        if (debugModeActive) {
            const modeNames = ["ABSOLUTE", "ACTIVE", "WORK"];
            log(`Calculating progress for ${unit}, mode=${modeNames[currentModeIndex]}, day=${getDayName(now.getDay())}`);
        }
    
        // ABSOLUTE mode - original calculation
        if (currentModeIndex === 0) {
            return calculateAbsoluteProgress(now, startDate, endDate);
        }
        
        // Check if it's weekend and in WORK mode
        const dayOfWeek = now.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
        
        // For WORK mode on weekends, return 100% for day and week units only
        if (currentModeIndex === 2 && isWeekend && (unit === 'day' || unit === 'week')) {
            if (debugModeActive) {
                log(`Weekend detected (${getDayName(dayOfWeek)}), returning 100% for ${unit}`);
            }
            return 1;
        }
        
        // Get time window based on the mode
        const windowStartStr = currentModeIndex === 1 ? ACTIVE_START : WORK_START;
        const windowEndStr = currentModeIndex === 1 ? ACTIVE_END : WORK_END;
        
        // Hour is always ABSOLUTE
        if (unit === 'hour') {
            return calculateAbsoluteProgress(now, startDate, endDate);
        }
        
        // For day unit
        if (unit === 'day') {
            return calculateActiveDay(now, startDate, endDate, windowStartStr, windowEndStr);
        }
        
        // For week unit
        if (unit === 'week') {
            return calculateActiveWeek(now, startDate, endDate, windowStartStr, windowEndStr);
        }
        
        // For month unit
        if (unit === 'month') {
            return calculateActiveMonth(now, startDate, endDate, windowStartStr, windowEndStr);
        }
        
        // For year unit
        if (unit === 'year') {
            return calculateActiveYear(now, startDate, endDate, windowStartStr, windowEndStr);
        }
        
        // Fallback
        return 0;
    }
    
    // Mode switching function
    function cycleMode() {
        // Move to next mode in cycle
        currentModeIndex = (currentModeIndex + 1) % 3; // Cycle through 0, 1, 2
        
        const modeNames = ["ABSOLUTE", "ACTIVE", "WORK"];
        log(`Switched to ${modeNames[currentModeIndex]} mode`);
        
        // Show mode overlay
        elements.modeOverlay.textContent = modeNames[currentModeIndex];
        elements.modeOverlay.style.opacity = '1';
        elements.modeOverlay.style.visibility = 'visible';
        
        // Force immediate update
        updateTime();
        
        // Hide overlay after delay
        setTimeout(() => {
            elements.modeOverlay.style.opacity = '0';
            setTimeout(() => {
                elements.modeOverlay.style.visibility = 'hidden';
            }, FADE_OUT_DURATION);
        }, VISIBLE_DURATION + FADE_IN_DURATION);
    }
    
    // Get current time - either system time or simulated time
    function getCurrentTime() {
        if (usingCustomTime && customTime) {
            const now = new Date();
            
            // If we have a custom time, calculate how much real time has passed since it was set
            // and add that delta to the custom time
            if (!customTimeStartedAt) {
                customTimeStartedAt = now;
                return new Date(customTime);
            }
            
            const realTimeDeltaMs = now - customTimeStartedAt;
            const simulatedTime = new Date(customTime.getTime() + realTimeDeltaMs);
            
            return simulatedTime;
        }
        return new Date();
    }
    
    // Click anywhere to cycle modes
    document.addEventListener('click', (event) => {
        // Don't cycle mode if clicking on dev controls
        if (elements.devControls && elements.devControls.contains(event.target)) {
            return;
        }
        cycleMode();
    });

    // Change quote periodically
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * timeQuotes.length);
        elements.quote.textContent = timeQuotes[randomIndex];
        elements.quote.style.opacity = 0;
        setTimeout(() => {
            elements.quote.style.opacity = 0.7;
        }, 500);
    }, 100000);

    // Update time function
    function updateTime() {
        const now = getCurrentTime();
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // Year calculations
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        const yearProgress = calculateProgress('year', now, startOfYear, endOfYear);
        
        // Month calculations
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month, daysInMonth, 23, 59, 59, 999);
        const monthProgress = calculateProgress('month', now, startOfMonth, endOfMonth);
        
        // Week calculations (according to requirement, week starts on Monday)
        const dayOfWeek = day || 7; // Convert Sunday (0) to 7
        const mondayOffset = dayOfWeek - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(date - mondayOffset);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const weekProgress = calculateProgress('week', now, startOfWeek, endOfWeek);
        
        // Day calculations
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const dayProgress = calculateProgress('day', now, startOfDay, endOfDay);
        
        // Hour calculations (always absolute)
        const startOfHour = new Date(now);
        startOfHour.setMinutes(0, 0, 0);
        const endOfHour = new Date(now);
        endOfHour.setMinutes(59, 59, 999);
        const hourProgress = calculateProgress('hour', now, startOfHour, endOfHour);

        // Update DOM
        updateElement(elements.year, year, yearProgress);
        updateElement(elements.month, getMonthName(month), monthProgress);
        updateElement(elements.week, `Week ${getWeekNumber(now)}`, weekProgress);
        updateElement(elements.day, getDayName(day), dayProgress);
        updateElement(elements.hour, `${hours}:${minutes.toString().padStart(2, '0')}`, hourProgress);

        // Pulse effect on active progress bars
        addPulseEffect();
    }

    // Helper function to update DOM elements
    function updateElement(element, value, progress) {
        element.value.textContent = value;
        element.progress.style.width = `${progress * 100}%`;
        element.percentage.textContent = `${(progress * 100).toFixed(8)}%`;
        
        // For debugging
        if (debugModeActive) {
            element.percentage.textContent += ` [${progress.toFixed(8)}]`;
        }
    }

    // Helper function to get month name
    function getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
    }

    // Helper function to get day name
    function getDayName(day) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[day];
    }

    // Helper function to get week number
    function getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // Add pulse effect to fastest moving progress bar
    function addPulseEffect() {
        const hourBar = elements.hour.progress;
        hourBar.classList.add('pulse');
        setTimeout(() => {
            hourBar.classList.remove('pulse');
        }, 500);
    }

    // Initialize and update every 100ms for smooth animations
    updateTime();
    setInterval(updateTime, 100);

    // Add animation to stylesheet for pulse effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        
        .pulse {
            animation: pulse 1s infinite;
        }
        
        .progress-bar {
            transition: width 0.1s linear;
        }
    `;
    document.head.appendChild(style);
    
    // Log initialization
    log("Time Progress Visualization initialized");
}); 