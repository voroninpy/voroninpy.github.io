# Time Progress Visualization

A responsive single-page web application that visualizes the passing of time. The application shows current time units (year, month, week, day, hour) along with their progress bars and precise percentages to demonstrate how quickly time passes.

## Features

- Displays current year, month, week, day, and hour
- Shows progress bars and percentages with 8 decimal points precision
- Three calculation modes: Absolute, Active, and Work
- Click anywhere to cycle between time modes
- Responsive design optimized for iPad Safari in vertical mode
- Dynamic animations to represent the flow of time
- No scrolling required - content fills the available space
- Random time-related quotes that change periodically
- Development mode for testing and time simulation

## Time Modes

The application supports three different time calculation modes:

| Mode      | Description                                              | Window                                       |
|-----------|----------------------------------------------------------|----------------------------------------------|
| ABSOLUTE  | Calendar time progress (default)                         | Full 24 hours (00:00-23:59)                  |
| ACTIVE    | Progress during active/waking hours                      | 07:00-22:00 (customizable)                   |
| WORK      | Progress during work hours (weekdays only)               | 09:00-17:00 (customizable)                   |

Time mode settings can be customized in `config.js`.

## Usage

This application is designed to be hosted on GitHub Pages. To use it:

1. Visit the <https://voroninpy.github.io/> for this repository
2. For best experience, view on an iPad in portrait mode
3. Click anywhere on the screen to cycle between time modes
4. Add `?mode=absolute|active|work` to the URL to start in a specific mode

## Development Mode

The application includes a development mode for testing and debugging:

- Set `DEV_MODE_ENABLED` to `true` in `config.js` to enable
- When enabled, development controls appear at the bottom of the screen
- Features include:
  - Set custom date and time for testing
  - Enable debug mode for detailed progress calculations
  - Reset to system time
  - View detailed calculation logs in the browser console

To disable development mode for production, set `DEV_MODE_ENABLED` to `false` in `config.js`.

## Technical Details

- Pure HTML, CSS, and JavaScript
- No external dependencies
- Responsive design that adapts to different screen sizes
- Real-time calculations of time progress with high precision
- Visual effects to emphasize the passage of time