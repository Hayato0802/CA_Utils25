// Utility functions for production/development mode

// Check if extension is in development mode
const isDevelopment = () => {
  return !('update_url' in chrome.runtime.getManifest());
};

// Safe console logging that only works in development
const log = (...args) => {
  if (isDevelopment()) {
    console.log(...args);
  }
};

const warn = (...args) => {
  if (isDevelopment()) {
    console.warn(...args);
  }
};

const error = (...args) => {
  // Always log errors, but with less detail in production
  if (isDevelopment()) {
    console.error(...args);
  } else {
    console.error('An error occurred');
  }
};

// サイドメニューコンテナを検索する共通関数
function findSideMenuContainer() {
  // 「稼働管理」リンクを基準にメニューコンテナを探す
  const worksheetLink = document.querySelector('a[href*="/worksheet/"]');
  if (!worksheetLink) {
    // フォールバック: IDで探す（古い構造）
    const sidemenu = document.getElementById('sidemenu');
    return sidemenu ? sidemenu.querySelector('div') : null;
  }

  let parent = worksheetLink.parentElement;
  let depth = 0;
  while (parent && parent !== document.body && depth < 10) {
    const directChildren = Array.from(parent.children);
    const menuItemCount = directChildren.filter(child =>
      child.tagName === 'A' ||
      child.tagName === 'BUTTON' ||
      (child.tagName === 'DIV' && (child.querySelector('a') || child.querySelector('button')))
    ).length;

    if (menuItemCount >= 2) {
      return parent;
    }
    parent = parent.parentElement;
    depth++;
  }

  // フォールバック: IDで探す（古い構造）
  const sidemenu = document.getElementById('sidemenu');
  return sidemenu ? sidemenu.querySelector('div') : null;
}

// Drawer（稼働入力画面）のコンテナを検索する共通関数
function findDrawerContainer() {
  // 方法1: .page-title で「稼働入力」を探す
  const pageTitles = document.querySelectorAll('.page-title');
  for (const title of pageTitles) {
    if (title.textContent && title.textContent.includes('稼働入力')) {
      let parent = title.parentElement;
      for (let i = 0; i < 15 && parent; i++) {
        if (parent.querySelector('.p-5') ||
            parent.classList.contains('drawer') ||
            parent.getAttribute('role') === 'dialog') {
          return parent;
        }
        parent = parent.parentElement;
      }
    }
  }

  // 方法2: role="dialog" で稼働入力を含むものを探す
  const dialogs = document.querySelectorAll('[role="dialog"]');
  for (const dialog of dialogs) {
    if (dialog.textContent &&
        (dialog.textContent.includes('稼働入力') || dialog.textContent.includes('勤務時間'))) {
      return dialog;
    }
  }

  // 方法3: 勤務時間ラベルから親を辿る
  const labels = document.querySelectorAll('.input-label');
  for (const label of labels) {
    if (label.textContent && label.textContent.includes('勤務時間')) {
      let parent = label.parentElement;
      for (let i = 0; i < 15 && parent; i++) {
        if (parent.querySelector('.p-5')) {
          return parent;
        }
        parent = parent.parentElement;
      }
    }
  }

  return null;
}