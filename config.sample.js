// Configuration file for Co-Assign Utils
// Copy this file to config.js and update with your settings

const CONFIG = {
    // Co-Assign base URL
    TIMETRACKING_BASE_URL: 'https://your-company.co-assign.com/worksheet',

    // HRMOS URL pattern
    HR_SYSTEM_URL_PATTERN: 'https://p.ieyasu.co/works/*',

    // GitHub repository (for updates)
    GITHUB_REPO: 'your-username/your-repo',

    // Time adjustment settings
    OFFSET_MINUTES: 5,
    OFFSET_60_MINUTES: 60
};

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
