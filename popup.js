// ストレージキー
const EMAIL_KEY = 'userEmail';
const DEBUG_MODE_KEY = 'debugMode';

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

// デバッグモードのチェックボックスイベント
document.getElementById('debugMode').addEventListener('change', function() {
    const isDebugMode = this.checked;

    // デバッグモードをChromeストレージに保存
    chrome.storage.sync.set({ [DEBUG_MODE_KEY]: isDebugMode }, function() {
        console.log('デバッグモードが' + (isDebugMode ? '有効' : '無効') + 'になりました');

        // すべてのタブにデバッグモード変更を通知
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateDebugMode',
                    debugMode: isDebugMode
                }).catch(() => {
                    // エラーは無視（拡張機能が動作していないタブもあるため）
                });
            });
        });
    });
});

// 拡張機能のポップアップが開かれた時に実行
document.addEventListener('DOMContentLoaded', function() {
    // 保存されたメールアドレスを取得して表示
    chrome.storage.sync.get([EMAIL_KEY, DEBUG_MODE_KEY], function(data) {
        if (data[EMAIL_KEY]) {
            document.getElementById('emailInput').value = data[EMAIL_KEY];
        }

        // デバッグモードの状態を復元
        if (data[DEBUG_MODE_KEY] !== undefined) {
            document.getElementById('debugMode').checked = data[DEBUG_MODE_KEY];
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
        const originalText = btn.textContent;
        const resultSpan = document.getElementById('checkResult');

        btn.disabled = true;
        btn.textContent = '確認中...';
        resultSpan.style.display = 'none';

        console.log('[Popup] 更新確認ボタンがクリックされました');

        chrome.runtime.sendMessage({ action: 'checkForUpdates' }, (response) => {
            console.log('[Popup] レスポンス受信:', response);

            // エラーチェック
            if (chrome.runtime.lastError) {
                console.error('[Popup] エラー:', chrome.runtime.lastError);
                resultSpan.textContent = '❌ エラーが発生しました';
                resultSpan.className = 'error';
                resultSpan.style.display = 'block';
                btn.disabled = false;
                btn.textContent = '🔄 更新を確認';
                return;
            }

            setTimeout(() => {
                checkForUpdates((hasUpdate) => {
                    btn.disabled = false;
                    btn.textContent = '🔄 更新を確認';

                    // 結果表示
                    if (hasUpdate) {
                        resultSpan.textContent = '🎉 新しいバージョンが利用可能です！';
                        resultSpan.className = 'success';
                    } else {
                        resultSpan.textContent = '✅ 最新バージョンを使用中です';
                        resultSpan.className = 'success';
                    }
                    resultSpan.style.display = 'block';

                    // 5秒後に非表示
                    setTimeout(() => {
                        resultSpan.style.display = 'none';
                    }, 5000);

                    console.log('[Popup] 更新チェック完了');
                });
            }, 1000);
        });
    });
});

// 更新チェック関数
function checkForUpdates(callback) {
    console.log('[Popup] checkForUpdates() 実行');
    chrome.runtime.sendMessage({ action: 'getUpdateInfo' }, (response) => {
        console.log('[Popup] getUpdateInfo レスポンス:', response);

        if (chrome.runtime.lastError) {
            console.error('[Popup] getUpdateInfo エラー:', chrome.runtime.lastError);
            if (callback) callback(false);
            return;
        }

        if (response && response.updateAvailable) {
            console.log('[Popup] 新バージョンあり:', response.latestVersion);
            const notification = document.getElementById('updateNotification');
            const updateMessage = document.getElementById('updateMessage');
            const downloadLink = document.getElementById('downloadLink');

            updateMessage.textContent = `バージョン ${response.latestVersion} が利用可能です`;
            downloadLink.href = response.downloadUrl;
            notification.classList.add('show');

            // バッジをクリア
            chrome.action.setBadgeText({ text: '' });

            if (callback) callback(true);
        } else {
            console.log('[Popup] 更新なし、または更新情報取得失敗');
            if (callback) callback(false);
        }
    });
}