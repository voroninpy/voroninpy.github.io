document.addEventListener('DOMContentLoaded', () => {
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
        quote: document.getElementById('time-quote')
    };

    // Time quotes to display randomly
    const timeQuotes = [
        "Time flies like an arrow",
        "The future is something which everyone reaches at the rate of sixty minutes an hour",
        "Time is the most valuable thing a person can spend",
        "Yesterday is gone. Tomorrow has not yet come. We have only today",
        "Time is a created thing. To say 'I don't have time' is to say 'I don't want to'",
        "Time is the wisest counselor of all",
        "The two most powerful warriors are patience and time",
        "Yesterday is history, today is a gift, tomorrow is a mystery.",
        "Lost time is never found again.",
        "Better three hours too soon than a minute too late.",
        "Time waits for no one.",
        "The trouble is, you think you have time.",
        "Time you enjoy wasting is not wasted time.",
        "They always say time changes things, but you actually have to change them yourself.",
        "The key is in not spending time, but in investing it."
    ];

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
        const now = new Date();
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
        const yearProgress = (now - startOfYear) / (daysInYear * 24 * 60 * 60 * 1000);
        
        // Month calculations
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOfMonth = new Date(year, month, 1);
        const monthProgress = (now - startOfMonth) / (daysInMonth * 24 * 60 * 60 * 1000);
        
        // Week calculations (week starts on Sunday, 0)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(date - day);
        startOfWeek.setHours(0, 0, 0, 0);
        const weekProgress = (now - startOfWeek) / (7 * 24 * 60 * 60 * 1000);
        
        // Day calculations
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const dayProgress = (now - startOfDay) / (24 * 60 * 60 * 1000);
        
        // Hour calculations
        const startOfHour = new Date(now);
        startOfHour.setMinutes(0, 0, 0);
        const hourProgress = (now - startOfHour) / (60 * 60 * 1000);

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
}); 