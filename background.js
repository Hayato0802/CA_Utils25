// Load configuration
let CONFIG = {
  GITHUB_REPO: 'organization/extension-repo',
  HR_SYSTEM_URL_PATTERN: 'https://hr.example.com/works/*'
};

// config.jsの読み込みをPromiseで管理
const loadConfig = () => {
  return new Promise((resolve) => {
    try {
      chrome.runtime.getPackageDirectoryEntry((root) => {
        root.getFile('config.js', {}, (fileEntry) => {
          fileEntry.file((file) => {
            const reader = new FileReader();
            reader.onloadend = function() {
              try {
                eval(reader.result);
                console.log('[CA-Utils] config.js loaded successfully');
                console.log('[CA-Utils] HR_SYSTEM_URL_PATTERN:', CONFIG.HR_SYSTEM_URL_PATTERN);
                resolve();
              } catch (e) {
                console.warn('[CA-Utils] Failed to parse config.js:', e);
                resolve();
              }
            };
            reader.readAsText(file);
          }, (error) => {
            console.warn('[CA-Utils] config.js not found, using defaults');
            resolve();
          });
        }, (error) => {
          console.warn('[CA-Utils] config.js not found, using defaults');
          resolve();
        });
      });
    } catch (e) {
      console.warn('[CA-Utils] Using default configuration');
      resolve();
    }
  });
};

// 初期化時にconfig.jsを読み込む
loadConfig();

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
  try {
    const response = await fetch(`https://api.github.com/repos/${CONFIG.GITHUB_REPO}/releases/latest`);
    
    // レスポンスが正常でない場合の処理
    if (!response.ok) {
      console.warn('GitHub API response not OK:', response.status);
      return;
    }
    
    const data = await response.json();
    
    // tag_nameが存在しない場合の処理
    if (!data || !data.tag_name) {
      console.warn('No tag_name in GitHub API response');
      return;
    }
    
    const latestVersion = data.tag_name.replace('v', '');
    
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    
    if (compareVersions(latestVersion, currentVersion) > 0) {
      // 新しいバージョンが利用可能
      chrome.storage.local.set({
        updateAvailable: true,
        latestVersion: latestVersion,
        downloadUrl: data.html_url
      });
      
      // バッジを表示
      chrome.action.setBadgeText({ text: 'NEW' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    }
  } catch (error) {
    console.error('Update check failed:', error);
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
        
        // まずconfig.jsが読み込まれているか確認
        await loadConfig();
        
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
    chrome.storage.local.get(['updateAvailable', 'latestVersion', 'downloadUrl'], (data) => {
      sendResponse(data);
    });
    return true;
  }
  
  // 更新チェックを手動実行
  if (message.action === 'checkForUpdates') {
    checkForUpdates().then(() => {
      chrome.storage.local.get(['updateAvailable', 'latestVersion', 'downloadUrl'], (data) => {
        sendResponse(data);
      });
    });
    return true;
  }
});