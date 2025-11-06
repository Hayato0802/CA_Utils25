// Configuration file for Co-Assign Utils
// Copy this file to config.js and update with your settings
//
// ⚠️ 重要: このファイルをコピーして config.js を作成してください
// config.js は .gitignore に含まれており、リポジトリにコミットされません

// ⚠️ 重要: background.jsで既にCONFIGが定義されているため、
// constではなく代入で上書きします
CONFIG = {
    // Co-Assign base URL
    TIMETRACKING_BASE_URL: 'https://your-company.co-assign.com/worksheet',

    // HRMOS URL pattern
    HR_SYSTEM_URL_PATTERN: 'https://p.ieyasu.co/works/*',

    // ⚠️ 機密情報: GitHubリポジトリ名（必ず config.js のみに記載してください）
    // 自動更新チェック機能に使用されます
    // 例: 'your-username/your-repo-name'
    GITHUB_REPO: 'YOUR_USERNAME/YOUR_REPO',

    // Time adjustment settings
    OFFSET_MINUTES: 5,
    OFFSET_60_MINUTES: 60
};
