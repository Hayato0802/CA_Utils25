// メールアドレスを保存するキー
const EMAIL_KEY = 'userEmail';

// 保存ボタンのクリックイベント
document.getElementById('saveEmail').addEventListener('click', function() {
    const email = document.getElementById('emailInput').value;
    
    // メールアドレスをChromeストレージに保存
    chrome.storage.sync.set({ [EMAIL_KEY]: email }, function() {
        console.log('メールアドレスが保存されました: ' + email);
        
        // 保存完了のフィードバック
        const button = document.getElementById('saveEmail');
        const originalText = button.textContent;
        button.textContent = '保存しました！';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    });
});

// 拡張機能のポップアップが開かれた時に実行
document.addEventListener('DOMContentLoaded', function() {
    // 保存されたメールアドレスを取得して表示
    chrome.storage.sync.get(EMAIL_KEY, function(data) {
        if (data[EMAIL_KEY]) {
            document.getElementById('emailInput').value = data[EMAIL_KEY];
        }
    });
    
    // 現在のバージョンを表示
    const manifest = chrome.runtime.getManifest();
    document.getElementById('currentVersion').textContent = manifest.version;
    
    // 更新情報を確認
    checkForUpdates();
    
    // 更新確認ボタンのイベント
    document.getElementById('checkUpdatesBtn').addEventListener('click', function() {
        const btn = this;
        btn.disabled = true;
        btn.textContent = '確認中...';
        
        chrome.runtime.sendMessage({ action: 'checkForUpdates' }, (response) => {
            checkForUpdates();
            btn.disabled = false;
            btn.textContent = '更新を確認';
        });
    });
});

// 更新チェック関数
function checkForUpdates() {
    chrome.runtime.sendMessage({ action: 'getUpdateInfo' }, (response) => {
        if (response && response.updateAvailable) {
            const notification = document.getElementById('updateNotification');
            const updateMessage = document.getElementById('updateMessage');
            const downloadLink = document.getElementById('downloadLink');
            
            updateMessage.textContent = `バージョン ${response.latestVersion} が利用可能です`;
            downloadLink.href = response.downloadUrl;
            notification.classList.add('show');
            
            // バッジをクリア
            chrome.action.setBadgeText({ text: '' });
        }
    });
}