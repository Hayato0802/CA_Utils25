// Load configuration - デフォルト設定
// 重要: GITHUB_REPOは機密情報のため、必ずconfig.jsで設定してください
let CONFIG = {
  GITHUB_REPO: null,  // config.jsで設定必須
  HR_SYSTEM_URL_PATTERN: 'https://p.ieyasu.co/works/*',
  TIMETRACKING_BASE_URL: 'https://blueship.co-assign.com/worksheet',
  OFFSET_MINUTES: 5,
  OFFSET_60_MINUTES: 60
};

// config.jsをインポート（必須）
try {
  importScripts('config.js');
  console.log('[CA-Utils] config.js loaded successfully');
  if (!CONFIG.GITHUB_REPO) {
    console.error('[CA-Utils] GITHUB_REPO is not set in config.js. Update check will not work.');
  }
} catch (e) {
  console.error('[CA-Utils] config.js not found. Please create config.js from config.sample.js');
}

// バージョンチェック用の定数
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24時間

// 拡張機能起動時にバージョンチェック
chrome.runtime.onInstalled.addListener(() => {
  checkForUpdates();
});

// 定期的なバージョンチェック
chrome.alarms.create('versionCheck', { periodInMinutes: 1440 }); // 24時間ごと
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'versionCheck') {
    checkForUpdates();
  }
});

// バージョンチェック関数
async function checkForUpdates() {
  console.log('[CA-Utils] checkForUpdates() 開始');
  console.log('[CA-Utils] GITHUB_REPO:', CONFIG.GITHUB_REPO);

  // GITHUB_REPOが設定されていない場合
  if (!CONFIG.GITHUB_REPO) {
    console.error('[CA-Utils] GITHUB_REPO が設定されていません。config.js を確認してください。');
    return;
  }

  try {
    // まずReleasesをチェック
    let apiUrl = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/releases/latest`;
    console.log('[CA-Utils] GitHub Releases API URL:', apiUrl);

    let response = await fetch(apiUrl);
    console.log('[CA-Utils] Releases API レスポンス status:', response.status);

    let latestVersion = null;
    let downloadUrl = null;

    // Releasesが存在する場合
    if (response.ok) {
      const data = await response.json();
      console.log('[CA-Utils] Releases データ:', data);

      if (data && data.tag_name) {
        latestVersion = data.tag_name.replace('v', '');
        downloadUrl = data.html_url;
        console.log('[CA-Utils] Releaseから取得:', latestVersion);
      }
    } else {
      // Releasesがない場合はTagsをチェック
      console.log('[CA-Utils] Releasesが見つかりません。Tagsをチェックします。');
      apiUrl = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/tags`;
      console.log('[CA-Utils] GitHub Tags API URL:', apiUrl);

      response = await fetch(apiUrl);
      console.log('[CA-Utils] Tags API レスポンス status:', response.status);

      if (!response.ok) {
        console.warn('[CA-Utils] Tags API response not OK:', response.status, response.statusText);
        return;
      }

      const tags = await response.json();
      console.log('[CA-Utils] Tags データ（最初の3件）:', tags.slice(0, 3));

      if (!tags || tags.length === 0) {
        console.warn('[CA-Utils] タグが見つかりません');
        return;
      }

      // 最新のタグを取得（配列の最初の要素）
      latestVersion = tags[0].name.replace('v', '');
      downloadUrl = `https://github.com/${CONFIG.GITHUB_REPO}/releases/tag/${tags[0].name}`;
      console.log('[CA-Utils] Tagから取得:', latestVersion);
    }

    if (!latestVersion) {
      console.warn('[CA-Utils] バージョン情報を取得できませんでした');
      return;
    }

    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;

    console.log('[CA-Utils] 現在のバージョン:', currentVersion);
    console.log('[CA-Utils] 最新バージョン:', latestVersion);

    // latestVersion > currentVersion の場合に正の値を返す
    const compareResult = compareVersions(latestVersion, currentVersion);
    console.log('[CA-Utils] バージョン比較結果:', compareResult, '(正の値=更新あり)');

    if (compareResult > 0) {
      console.log('[CA-Utils] 新しいバージョンが利用可能です');
      // 新しいバージョンが利用可能
      chrome.storage.local.set({
        updateAvailable: true,
        latestVersion: latestVersion,
        downloadUrl: downloadUrl
      });

      // バッジを表示
      chrome.action.setBadgeText({ text: 'NEW' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } else {
      console.log('[CA-Utils] 最新バージョンを使用中、または更新なし');
      // 更新がない場合もストレージをクリア
      chrome.storage.local.set({
        updateAvailable: false
      });
    }
  } catch (error) {
    console.error('[CA-Utils] Update check failed:', error);
    console.error('[CA-Utils] エラー詳細:', error.message, error.stack);
  }
}

// バージョン比較関数
function compareVersions(v1, v2) {
  // 引数のバリデーション
  if (!v1 || !v2) {
    console.warn('Invalid version strings:', v1, v2);
    return 0;
  }
  
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // content-script-coassign.js からデータを取得する
  if (message.action === 'getDateFromHRMOS') {
    (async () => {
      try {
        console.log('[CA-Utils] HRMOSタブ検索開始');
        console.log('[CA-Utils] URLパターン:', CONFIG.HR_SYSTEM_URL_PATTERN);

        // 別タブでHRMOSが開かれている場合に、content-script-hrmos.js を実行する
      // 複数のURLパターンを試す
      const urlPatterns = [
        CONFIG.HR_SYSTEM_URL_PATTERN,
        'https://*.ieyasu.co/*',
        'https://p.ieyasu.co/*',
        '*://p.ieyasu.co/*'
      ];
      
      console.log('[CA-Utils] 検索するURLパターン:', urlPatterns);
      
      // 全てのタブを取得して手動でフィルタリング
      chrome.tabs.query({}, async (allTabs) => {
        console.log('[CA-Utils] 全タブ数:', allTabs.length);
        
        // HRMOSのタブを探す
        const hrTabs = allTabs.filter(tab => {
          const url = tab.url || '';
          // ieyasu.coドメインを含むかチェック
          return url.includes('ieyasu.co') || url.includes('hr.example.com');
        });
        
        console.log('[CA-Utils] HRMOS候補タブ数:', hrTabs.length);
        if (hrTabs.length > 0) {
          console.log('[CA-Utils] HRMOSタブURL:', hrTabs.map(t => t.url));
        }
        
        if (hrTabs.length > 0) {
          let targetTab = hrTabs[0];
          try {
            const injectionResults = await chrome.scripting.executeScript({
              target: { tabId: targetTab.id },
              files: ['content-script-hrmos.js']
            });
            console.log('[CA-Utils] スクリプト実行結果:', injectionResults);
            for (const frameResult of injectionResults) {
              console.log('[CA-Utils] HRMOSから取得したデータ件数:', frameResult.result?.length || 0);
              if (frameResult.result && frameResult.result.length > 0) {
                console.log('[CA-Utils] サンプルデータ（最初の3件）:', frameResult.result.slice(0, 3));
              }
              sendResponse({ value: frameResult.result });
            }
          } catch (injectError) {
            console.error('[CA-Utils] スクリプト注入エラー:', injectError);
            sendResponse({ value: 'HRMOS not found' });
          }
        } else {
          console.warn('[CA-Utils] HRMOSタブが見つかりません');
          sendResponse({ value: 'HRMOS not found' });
        }
      });
      } catch (error) {
        console.error('[CA-Utils] エラー:', error);
        sendResponse({ value: 'HRMOS not found' });
      }
    })();
    // 非同期での応答を待つため、true を返す
    return true;
  }
  
  // バージョン情報を取得
  if (message.action === 'getUpdateInfo') {
    console.log('[CA-Utils] getUpdateInfo リクエスト受信');
    chrome.storage.local.get(['updateAvailable', 'latestVersion', 'downloadUrl'], (data) => {
      console.log('[CA-Utils] ストレージから取得:', data);
      sendResponse(data);
    });
    return true;
  }

  // 更新チェックを手動実行
  if (message.action === 'checkForUpdates') {
    console.log('[CA-Utils] checkForUpdates リクエスト受信');
    checkForUpdates().then(() => {
      console.log('[CA-Utils] checkForUpdates 完了、ストレージから情報取得');
      chrome.storage.local.get(['updateAvailable', 'latestVersion', 'downloadUrl'], (data) => {
        console.log('[CA-Utils] 更新情報:', data);
        sendResponse(data);
      });
    }).catch((error) => {
      console.error('[CA-Utils] checkForUpdates エラー:', error);
      sendResponse({ error: error.message });
    });
    return true;
  }
});