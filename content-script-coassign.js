// Load configuration or use defaults
const OFFSET_MINUTES = (typeof CONFIG !== 'undefined' && CONFIG.OFFSET_MINUTES) || 5;
const OFFSET_60_MINUTES = (typeof CONFIG !== 'undefined' && CONFIG.OFFSET_60_MINUTES) || 60;
const TIMETRACKING_BASE_URL = (typeof CONFIG !== 'undefined' && CONFIG.TIMETRACKING_BASE_URL) || 'https://blueship.co-assign.com/worksheet';
const DEBUG_MODE = true; // デバッグモード（trueにするとログが出力される） - TODO: 問題解決後にfalseに戻す
var display_ready = false;

// デバッグログ用のヘルパー関数
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log('[CA-Utils]', ...args);
  }
}

// 安全なDOM要素取得のヘルパー関数
function safeQuerySelector(parent, selector) {
  try {
    return parent ? parent.querySelector(selector) : null;
  } catch (e) {
    console.warn(`safeQuerySelector error: ${e.message}`, { parent, selector });
    return null;
  }
}

// 安全な配列アクセスのヘルパー関数
function safeArrayAccess(array, index) {
  try {
    return array && array.length > index ? array[index] : null;
  } catch (e) {
    console.warn(`safeArrayAccess error: ${e.message}`, { array, index });
    return null;
  }
}

// 安全なテキスト取得のヘルパー関数
function safeGetText(element) {
  try {
    return element ? element.textContent || element.innerText || '' : '';
  } catch (e) {
    console.warn(`safeGetText error: ${e.message}`, { element });
    return '';
  }
}

// 安全なHTML取得のヘルパー関数
function safeGetHTML(element) {
  try {
    return element ? element.innerHTML || '' : '';
  } catch (e) {
    console.warn(`safeGetHTML error: ${e.message}`, { element });
    return '';
  }
}

// 拡張機能のコンテキストが有効かどうかをチェックする関数
function isExtensionContextValid() {
  try {
    // chrome.runtimeが存在し、IDにアクセスできるかチェック
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch (e) {
    console.warn('[CA-Utils] 拡張機能のコンテキストが無効です:', e.message);
    return false;
  }
}

// URLがworksheetページかどうかをチェックする関数
function isWorksheetPage() {
  try {
    return window.location.href.includes('/worksheet');
  } catch (e) {
    console.warn('URLチェックエラー:', e.message);
    return false;
  }
}

// 画面上の情報をクリーンアップする関数
function cleanupDisplay() {
  try {
    // メッセージボックスを削除
    const messageBox = document.getElementById('chrome-extension-message-box');
    if (messageBox) {
      messageBox.remove();
    }

    // ハイライトされた行の色をリセット
    document.querySelectorAll('#CA-Utils_ERROR_ROW').forEach(item => {
      item.style.backgroundColor = "";
      item.id = '';
    });

    // ハイライトされたセルの枠線をリセット
    document.querySelectorAll('#CA-Utils_ERROR_CELL').forEach(item => {
      item.style.border = "";
      item.id = '';
    });

    // 追加されたボタンを削除
    const hrmosButton = document.getElementById('getHrmosWorkTimeButton');
    if (hrmosButton) {
      hrmosButton.remove();
    }

    // 工数入力画面のボタンを削除
    document.querySelectorAll('[id^="getOperationTimeButton-"]').forEach(button => {
      button.remove();
    });

    document.querySelectorAll('[id^="addTimeButton-"]').forEach(button => {
      button.remove();
    });

    // ボタンエリアを削除
    document.querySelectorAll('#operationTimeButtonArea').forEach(area => {
      area.remove();
    });

    // カレンダーiframeを削除
    const calendarIframe = document.getElementById('calendarIframe');
    if (calendarIframe) {
      calendarIframe.remove();
    }

    // カレンダーボタンを削除
    const calendarButton = document.getElementById('calendarButton');
    if (calendarButton) {
      calendarButton.remove();
    }

    // 勤務時間差分ボタンを削除
    const diffButton = document.getElementById('diffWorkTimeButton');
    if (diffButton) {
      diffButton.remove();
    }

    debugLog('画面クリーンアップ完了');
  } catch (e) {
    console.warn('画面クリーンアップエラー:', e.message);
  }
}

// MutationObserverでDOMの変更を監視
const observer = new MutationObserver((mutations) => {
  try {
    // worksheetページでない場合は処理をスキップ
    if (!isWorksheetPage()) {
      return;
    }

    mutations.forEach(mutation => {
      
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // 追加されたノードに対して処理を行う
        const addedNodesArray = [...mutation.addedNodes];
        

        // Elementノードのみを対象にする
        const elementNodes = addedNodesArray.filter(node => node.nodeType === Node.ELEMENT_NODE);
        // console.log(elementNodes);
        if (elementNodes.length > 0) {
          // 画面を開いた時の処理
          elementNodes.forEach(node => {
            try {
              const ml6Element = safeQuerySelector(node, '.table-fixed');
              if (ml6Element) {
                debugLog('稼働管理画面を開きました');
                display_ready = true;
                highlightUnenteredOperationTime();
                refreshDisplay();
              }
            } catch (e) {
              console.warn('画面開処理エラー:', e.message);
            }
          });
          if (!display_ready) {
            return;
          }

          // 工数入力画面を開いた時の処理
          try {
            if (elementNodes.some(node =>
              Array.from(node.children || []).some(child =>
                child && child.classList && child.classList.contains('page-title') && 
                safeGetText(child).trim().startsWith('稼働入力')
              )
            )) {
              console.log("drawerが表示されました");
              refreshDisplay();
            }
          } catch (e) {
            console.warn('工数入力画面開処理エラー:', e.message);
          }

          // 工数入力画面を閉じた時の処理
          try {
            if (elementNodes.some(node => node.classList && node.classList.contains('v-move'))) {
              //console.log('工数入力画面を閉じました');
              highlightUnenteredOperationTime();
            }
          } catch (e) {
            console.warn('工数入力画面閉処理エラー:', e.message);
          }
        }
      }
    });
  } catch (e) {
    console.error('MutationObserver error:', e.message);
  }
});

//監視を開始
try {
  // worksheetページの場合のみ監視を開始
  if (isWorksheetPage()) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
} catch (e) {
  console.error('Observer start error:', e.message);
}

// 初期読み込み時に実行する処理
//refreshDisplay();
try {
  // worksheetページの場合のみ初期処理を実行
  if (isWorksheetPage()) {
    addButtonCalendar();
    addButtonShowDiffWorkTime();
  } else {
    // worksheetページでない場合はクリーンアップを実行
    cleanupDisplay();
  }
} catch (e) {
  console.error('初期処理エラー:', e.message);
}

// URL変更を監視してクリーンアップを実行
let currentUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  try {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      
      if (!isWorksheetPage()) {
        // worksheetページでなくなった場合はクリーンアップを実行
        cleanupDisplay();
        // 監視を停止
        observer.disconnect();
      } else {
        // worksheetページになった場合は監視を再開
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        // 初期処理を実行
        addButtonCalendar();
        addButtonShowDiffWorkTime();
      }
    }
  } catch (e) {
    console.warn('URL変更監視エラー:', e.message);
  }
});

// URL変更監視を開始
try {
  urlObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
} catch (e) {
  console.error('URL監視開始エラー:', e.message);
}

// 以下は共通関数 //

// HRMOSでは勤怠データが入力されているが工数が未入力の行をハイライトする関数
function highlightUnenteredOperationTime() {
  try {
    // 拡張機能のコンテキストが有効かチェック
    if (!isExtensionContextValid()) {
      console.warn('[CA-Utils] 拡張機能のコンテキストが無効なため、処理をスキップします');
      return;
    }

    chrome.runtime.sendMessage({ action: 'getDateFromHRMOS' }, (response) => {
      try {
        // レスポンスを受け取った時点で再度コンテキストをチェック
        if (!isExtensionContextValid()) {
          console.warn('[CA-Utils] レスポンス受信時に拡張機能のコンテキストが無効です');
          return;
        }
        getOperationTime(response);
      } catch (e) {
        console.error('getOperationTime error:', e.message);
        if (isExtensionContextValid()) {
          showMessage('工数チェック処理でエラーが発生しました: ' + e.message, "error");
        }
      }
    });
  } catch (e) {
    console.error('highlightUnenteredOperationTime error:', e.message);
    if (isExtensionContextValid()) {
      showMessage(e.message, "error");
    }
  }
}

function getOperationTime(response, getDiff = false) {
  try {
    if (!response || !response.value) {
      showMessage("HRMOSからのレスポンスがありません。", "warn");
      if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
      return;
    }
    if (response && response.value) {
      // HRMOSが開かれていない場合
      if (response.value === 'HRMOS not found' || response.value == '') {
        showMessage("現在別タブでHRMOSが開かれていません。", "warn");
        if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
        return;
      } else {
        // HRMOSで勤怠データが存在する日付を取得
        const dataExistsHRMOS = response.value.map(item => item.date);
        if (!dataExistsHRMOS || dataExistsHRMOS.length === 0) {
          showMessage("HRMOSから日付データを取得できませんでした。", "warn");
          if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
          return;
        }
        
        let hrmosMonth = '';
        try {
          hrmosMonth = dataExistsHRMOS[0].split("-")[1];
        } catch (e) {
          console.warn('HRMOS月取得エラー:', e.message);
          showMessage("HRMOSの月データを取得できませんでした。", "warn");
          if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
          return;
        }

        // Co-assignで勤怠データが存在する日付を取得
        const tbody = safeQuerySelector(document, 'tbody');
        if (tbody == null) {
          showMessage("テーブルが見つかりません。", "warn");
          if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
          return;
        }
        
        const rows = [...tbody.querySelectorAll('tr')];
        if (!rows || rows.length === 0) {
          showMessage("テーブル行が見つかりません。", "warn");
          if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
          return;
        }

        const dataExistsCARows = rows.filter(item => {
          try {
            const child2 = safeArrayAccess(item.childNodes, 2);
            const child3 = safeArrayAccess(item.childNodes, 3);
            return child2 && child3 &&
                   safeGetText(child2).trim() == "-" &&
                   safeGetText(child3).trim() == "-";
          } catch (e) {
            console.warn('dataExistsCARows filter error:', e.message);
            return false;
          }
        });

        debugLog('工数未入力の行数（土日含む）:', dataExistsCARows.length);

        const dataExistsCA = dataExistsCARows.map(item => {
          try {
            const child0 = safeArrayAccess(item.children, 0);
            const dayText = safeGetText(child0);
            const day = extractDay(dayText);
            debugLog('未入力行の日付:', dayText, '-> 抽出:', day);
            return {
              "day": day,
              "element": item
            };
          } catch (e) {
            console.warn('dataExistsCA map error:', e.message);
            return null;
          }
        }).filter(item => item !== null);

        debugLog('dataExistsCA:', dataExistsCA.length, '件');

        const timeDiffCA = rows
          .filter(item => {
            try {
              const child4 = safeArrayAccess(item.children, 4);
              const child5 = safeArrayAccess(item.children, 5);
              return child4 && child5 && 
                     safeGetText(child4) != '-' &&
                     safeGetText(child4) != safeGetText(child5);
            } catch (e) {
              console.warn('timeDiffCA filter error:', e.message);
              return false;
            }
          })
          .map(item => {
            try {
              const child0 = safeArrayAccess(item.children, 0);
              return { 
                "day": extractDay(safeGetText(child0)), 
                "element": item 
              };
            } catch (e) {
              console.warn('timeDiffCA map error:', e.message);
              return null;
            }
          }).filter(item => item !== null);

        const addWorkTimeCARows = rows.filter(item => {
          try {
            const child5 = safeArrayAccess(item.childNodes, 5);
            return child5 && safeGetText(child5).trim() != "-";
          } catch (e) {
            console.warn('addWorkTimeCARows filter error:', e.message);
            return false;
          }
        });
        
        const addWorkTimeCA = addWorkTimeCARows.map(item => {
          try {
            // <td>内の<div>のテキスト（例: 4:18）を取得
            const td = safeArrayAccess(item.children, 5);
            if (!td) return '';
            
            const timeDiv = safeQuerySelector(td, 'div div');
            return timeDiv ? timeDiv.textContent.trim() : '';
          } catch (e) {
            console.warn('addWorkTimeCA map error:', e.message);
            return '';
          }
        }).filter(time => time !== '');

        let diffTime = {};
        // 本日までのCAの合計時間
        // console.log(addWorkTimeCA);
        try {
          diffTime.sumTimeCA = sumTimes(addWorkTimeCA);
        } catch (e) {
          console.warn('sumTimeCA error:', e.message);
          diffTime.sumTimeCA = '0:00';
        }

        // URLから年と月を取得
        let target = '';
        let caMonth = '';
        try {
          const urlObj = new URL(window.location.href);
          const path = urlObj.pathname;
          const parts = path.split('/');

          // 配列の中から「YYYY-MM」を含む最初の要素を取得
          target = parts.find(part => part.match(/^\d{4}-\d{2}$/));
          if (!target) {
            showMessage("URLから年月を取得できませんでした。", "warn");
            if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
            return;
          }
          caMonth = target.slice(-2); // Co-Assign で開いている月
        } catch (e) {
          console.warn('URL解析エラー:', e.message);
          showMessage("URLの解析に失敗しました。", "warn");
          if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
          return;
        }

        // Co-AssignとHRMOSで開いてる月が違う場合はwarnを出す
        if (caMonth != hrmosMonth) {
          showMessage("HRMOSとCo-Assignで異なる月のページが開かれています。", "warn");
          if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
          return;
        }

        // 月情報を付加して新しい配列を作成
        const dataExistsCAformat = dataExistsCA.map(row => {
          try {
            // 既に月が含まれている場合はそのまま
            if (row.day && row.day.includes("月")) {
              return target + "-" + row.day.slice(-2);
            }
            // 含まれていない場合は月を追加
            return target + "-" + row.day;
          } catch (e) {
            console.warn('dataExistsCAformat map error:', e.message);
            return null;
          }
        }).filter(item => item !== null);

        debugLog('HRMOSのデータ:', dataExistsHRMOS);
        debugLog('Co-Assignフォーマット:', dataExistsCAformat);

        // `dataExistsCAformat` をもとに、対応する `dataExistsCA` の要素を取得
        const needActionRows = dataExistsHRMOS.map(date => {
          try {
            if (dataExistsCAformat.includes(date)) {
              // 日付が `dataExistsCAformat` に含まれている場合、その日付と対応する HTML 要素を取得
              const matchedRow = dataExistsCA.find(row => (target + "-" + row.day) === date);
              debugLog('マッチング:', date, '-> matchedRow:', matchedRow ? '見つかった' : 'null');
              return matchedRow ? { "date": date, "element": matchedRow.element } : { "date": date, "element": null };
            }
            return null;
          } catch (e) {
            console.warn('needActionRows map error:', e.message);
            return null;
          }
        }).filter(row => row !== null);

        debugLog('needActionRows（ハイライト対象）:', needActionRows.length, '件');

        if (getDiff) {
          try {
            const workTimeHRMOS = response.value.map(item => item.workTime);
            // console.log(workTimeHRMOS);
            diffTime.sumTimeHRMOS = sumTimes(workTimeHRMOS);
            return diffTime;
          } catch (e) {
            console.warn('getDiff error:', e.message);
            return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
          }
        }

        // 既にハイライトされた行の色を一旦リセット
        try {
          document.querySelectorAll('#CA-Utils_ERROR_ROW').forEach(item => {
            item.style.backgroundColor = "";
            item.id = '';
          });

          document.querySelectorAll('#CA-Utils_ERROR_CELL').forEach(item => {
            item.style.border = "";
            item.id = '';
          });
        } catch (e) {
          console.warn('ハイライトリセットエラー:', e.message);
        }

        // 工数が未入力の行が無い場合
        if (needActionRows.length != 0) {
          showMessage("未入力の工数があります。", "warn");

          // 工数が未入力の行をハイライトする
          for (const errorRow of needActionRows) {
            try {
              if (errorRow.element) {
                errorRow.element.title = "[CA-Utils]HRMOS上で打刻時間が入力されていますが、Co-Assignの工数が入力されていません。"
                errorRow.element.style.backgroundColor = '#fd7e00';
                errorRow.element.id = 'CA-Utils_ERROR_ROW';
              }
            } catch (e) {
              console.warn('エラー行ハイライトエラー:', e.message);
            }
          }
        }
        else if (timeDiffCA.length != 0) {
          showMessage("勤務時間と稼働時間が一致していない行があります（赤枠部）。", "warn");

          for (const errorRow of timeDiffCA) {
            try {
              if (errorRow.element) {
                const child4 = safeArrayAccess(errorRow.element.children, 4);
                const child5 = safeArrayAccess(errorRow.element.children, 5);
                if (child4 && child5) {
                  child4.style.border = "2px solid red";
                  child5.style.border = "2px solid red";
                  child4.id = "CA-Utils_ERROR_CELL";
                  child5.id = "CA-Utils_ERROR_CELL";
                }
              }
            } catch (e) {
              console.warn('時間差エラー行ハイライトエラー:', e.message);
            }
          }
        }
        else {
          // メッセージを表示する例
          showMessage("全ての工数が入力されています。その調子！");
        }

        // 日付から日を抽出する関数
        function extractDay(dateStr) {
          try {
            if (!dateStr) return null;
            const match = dateStr.match(/(\d{2})日/);
            return match ? match[1] : null;
          } catch (e) {
            console.warn('extractDay error:', e.message);
            return null;
          }
        }
      }
    }
  } catch (e) {
    console.error('getOperationTime main error:', e.message);
    showMessage('工数処理でエラーが発生しました: ' + e.message, "error");
    if (getDiff) return { sumTimeCA: '0:00', sumTimeHRMOS: '0:00' };
  }
}

// 画面更新時に動作する関数
function refreshDisplay() {
  try {
    addButtonHRMOS();
    addButtonOperationTime();
  } catch (e) {
    console.error('refreshDisplay error:', e.message);
    showMessage('画面更新処理でエラーが発生しました: ' + e.message, "error");
  }

  // 工数入力のテーブルにボタンを追加する処理
  function addButtonOperationTime() {
    try {
      debugLog('addButtonOperationTime() が呼ばれました');

      // 工数入力のテーブル要素を取得（複数の方法で探す）
      let operationTimeTable = null;

      // 方法1: .p-4 内の .table-fixed
      operationTimeTable = safeQuerySelector(document, '.p-4 .table-fixed');

      // 方法2: .p-2.md:p-4 内の .table-fixed（新しい構造）
      if (!operationTimeTable) {
        const containers = document.querySelectorAll('[class*="p-2"], [class*="p-4"]');
        for (const container of containers) {
          const table = container.querySelector('.table-fixed');
          if (table) {
            operationTimeTable = table;
            debugLog('テーブルを発見（p-2/p-4コンテナ内）');
            break;
          }
        }
      }

      // 方法3: .table-fixed を直接探す
      if (!operationTimeTable) {
        operationTimeTable = safeQuerySelector(document, '.table-fixed');
        if (operationTimeTable) {
          debugLog('テーブルを発見（直接検索）');
        }
      }

      if (!operationTimeTable) {
        debugLog('工数テーブルが見つかりません');
        return;
      }

      debugLog('テーブル発見:', operationTimeTable);

      // ボタン用のエリア（カラム：CA Utils）が既に存在するか確認
      if (!document.getElementById('operationTimeButtonArea')) {
        try {
          // ヘッダー行を取得
          const headerRow = safeQuerySelector(operationTimeTable, 'thead tr');
          if (!headerRow) {
            debugLog('ヘッダー行が見つかりません');
            return;
          }

          debugLog('ヘッダー行を発見');

          // 「稼働時間」ヘッダーを探す（複数の方法で）
          let operationTimeColumn = null;
          const headers = headerRow.querySelectorAll('th');

          debugLog('ヘッダー数:', headers.length);

          // 全てのヘッダーのテキストをログ出力
          headers.forEach((th, index) => {
            const text = safeGetText(th);
            debugLog(`ヘッダー[${index}]: "${text}"`);
          });

          // 方法1: テキストで「稼働時間」を探す
          headers.forEach((th, index) => {
            const text = safeGetText(th);
            if (text.includes('稼働時間')) {
              operationTimeColumn = th;
              debugLog('稼働時間ヘッダーを発見（テキスト検索、', index, '番目）');
            }
          });

          // 方法2: テキストに「時間」を含むヘッダーを探す（より柔軟）
          if (!operationTimeColumn) {
            headers.forEach((th, index) => {
              const text = safeGetText(th);
              if (text.includes('時間') && th.className.includes('text-right')) {
                operationTimeColumn = th;
                debugLog('時間ヘッダーを発見（部分一致、', index, '番目）:', text);
              }
            });
          }

          // 方法3: クラスで探す（フォールバック）
          if (!operationTimeColumn) {
            operationTimeColumn = Array.from(headers).find(th =>
              th.className.includes('w-1/12') && th.className.includes('text-right')
            );
            if (operationTimeColumn) {
              debugLog('稼働時間ヘッダーを発見（クラス検索）');
            }
          }

          // 方法4: 4番目のヘッダーを使用（HTMLの構造から判断）
          if (!operationTimeColumn && headers.length >= 4) {
            operationTimeColumn = headers[3]; // 0-indexed, 4番目の列
            debugLog('4番目のヘッダーを使用（フォールバック）');
          }

          if (!operationTimeColumn) {
            debugLog('稼働時間ヘッダーが見つかりません');
            debugLog('利用可能なヘッダー:', Array.from(headers).map(h => safeGetText(h)));
            return;
          }

          // ボタンエリアを作成
          const buttonArea = document.createElement('th');
          buttonArea.className = operationTimeColumn.className; // 既存ヘッダーと同じクラスを使用
          buttonArea.id = 'operationTimeButtonArea';
          buttonArea.innerText = 'CA Utils';
          buttonArea.title = 'Co-Assign Utils：拡張ボタン';

          // 稼働時間列の後ろにボタンエリアを追加
          headerRow.insertBefore(buttonArea, operationTimeColumn.nextSibling);
          debugLog('ヘッダーにボタンエリアを追加しました');
        } catch (e) {
          console.warn('ボタンエリア作成エラー:', e.message);
        }
      }

      // プロジェクト名の行数分だけボタンを作成
      const projectRows = document.querySelectorAll('.w-full .tr-normal');
      debugLog('プロジェクト行数:', projectRows.length);

      if (!projectRows || projectRows.length === 0) return;

      projectRows.forEach((row, index) => {
        try {
          // ボタンが既に存在するか確認
          if (row.querySelector('#getOperationTimeButton-' + index)) {
            debugLog(`行${index}: ボタンは既に存在します`);
            return;
          }

          // 稼働時間の入力欄を探す（複数の方法で）
          let operationTimeCell = null;
          const rowCells = row.querySelectorAll('.td-normal');

          debugLog(`行${index}: セル数=${rowCells.length}`);

          // 方法1: .hs-dropdown input を含むセルを探す
          rowCells.forEach((cell, cellIndex) => {
            const input = cell.querySelector('.hs-dropdown input[type="text"]');
            if (input && !operationTimeCell) {
              operationTimeCell = cell;
              debugLog(`行${index}: 稼働時間セルを発見（セル${cellIndex}）`);
            }
          });

          // 方法2: input.input-text を含むセルを探す
          if (!operationTimeCell) {
            rowCells.forEach((cell, cellIndex) => {
              const input = cell.querySelector('input.input-text[type="text"]');
              if (input && !operationTimeCell) {
                operationTimeCell = cell;
                debugLog(`行${index}: 稼働時間セルを発見（input.input-text、セル${cellIndex}）`);
              }
            });
          }

          if (!operationTimeCell) {
            debugLog(`行${index}: 稼働時間セルが見つかりません`);
            return;
          }

          // ボタン表示用エリアを作成
          const buttonArea = document.createElement('td');
          buttonArea.className = operationTimeCell.className; // 既存セルと同じクラスを使用
          buttonArea.style.padding = "0pt";
          buttonArea.style.textAlign = "right";

          // 稼働時間の列の後ろにボタンエリアを追加
          row.insertBefore(buttonArea, operationTimeCell.nextSibling);
          debugLog(`行${index}: ボタンエリアを追加しました`);

          // 「+」ボタンを作成
          const addTimeButton = document.createElement('button');
          addTimeButton.id = 'addTimeButton-' + index;
          addTimeButton.textContent = "+";
          addTimeButton.style.margin = "1px";
          addTimeButton.title = "[左クリック]+" + OFFSET_MINUTES + "分：[右クリック]+" + OFFSET_60_MINUTES + "分";
          addTimeButton.style.width = "15px";
          addTimeButton.style.height = "30px";
          setCSS(addTimeButton, "0pt");
          buttonArea.appendChild(addTimeButton);
          
          // 「-」ボタンを作成
          const subtractTimeButton = document.createElement('button');
          subtractTimeButton.id = 'addTimeButton-' + index;
          subtractTimeButton.textContent = "-";
          subtractTimeButton.style.margin = "1px";
          subtractTimeButton.title = "[左クリック]-" + OFFSET_MINUTES + "分：[右クリック]-" + OFFSET_60_MINUTES + "分";
          subtractTimeButton.style.width = "15px";
          subtractTimeButton.style.height = "30px";
          setCSS(subtractTimeButton, "0pt");
          buttonArea.appendChild(subtractTimeButton);

          // 「過不足を調整」ボタンを作成
          const unenteredTimeButton = document.createElement('button');
          unenteredTimeButton.id = 'getOperationTimeButton-' + index;
          unenteredTimeButton.textContent = "🕒";
          unenteredTimeButton.style.margin = "5px";
          unenteredTimeButton.title = "過不足を調整";
          setCSS(unenteredTimeButton);
          buttonArea.appendChild(unenteredTimeButton);

          // ボタンをクリックしたときの動作
          unenteredTimeButton.addEventListener('click', () => {
            try {
              // 新しいHTML構造に対応: テーブル形式から労働時間と稼働時間を取得
              let operationTimeValue = null;
              let totalOperationTimeElmValue = null;

              // 労働時間・稼働時間のテーブルを探す
              const timeTable = safeQuerySelector(document, 'table tbody');
              if (timeTable) {
                const cells = timeTable.querySelectorAll('td');

                for (let i = 0; i < cells.length; i++) {
                  const cellText = safeGetText(cells[i]);

                  // 労働時間を探す
                  if (cellText.includes('労働時間') && i + 1 < cells.length) {
                    operationTimeValue = safeGetText(cells[i + 1]);
                  }

                  // 稼働時間を探す
                  if (cellText.includes('稼働時間') && i + 1 < cells.length) {
                    totalOperationTimeElmValue = safeGetText(cells[i + 1]);
                  }
                }
              }

              // もし見つからなかった場合、別の方法で探す
              if (!operationTimeValue || !totalOperationTimeElmValue) {
                // グループ要素内のテーブルを探す
                const groupElement = safeQuerySelector(document, '.group.relative');
                if (groupElement) {
                  const tableCells = groupElement.querySelectorAll('td');

                  for (let i = 0; i < tableCells.length; i++) {
                    const cellText = safeGetText(tableCells[i]);

                    if (cellText.includes('労働時間') && i + 1 < tableCells.length) {
                      operationTimeValue = safeGetText(tableCells[i + 1]);
                    }

                    if (cellText.includes('稼働時間') && i + 1 < tableCells.length) {
                      totalOperationTimeElmValue = safeGetText(tableCells[i + 1]);
                    }
                  }
                }
              }

              if (!operationTimeValue) {
                showMessage("労働時間が見つかりません。", "warn");
                return;
              }

              if (!totalOperationTimeElmValue) {
                showMessage("稼働時間が見つかりません。", "warn");
                return;
              }

              // 現在入力している時間を取得
              const inputTimeElm = safeQuerySelector(row, '.input-text.pr-3.text-right');
              if (!inputTimeElm) {
                showMessage("入力時間の要素が見つかりません。", "warn");
                return;
              }
              
              const inputTimeElmValue = inputTimeElm.value || '';

              // 時間を分に変換
              const minutes1 = timeToMinutes(operationTimeValue);       // 労働時間
              const minutes2 = timeToMinutes(totalOperationTimeElmValue);    // 合計時間
              const minutes3 = timeToMinutes(inputTimeElmValue);             // 現在入力している時間

              // 労働時間 から 合計時間（現在入力している行の時労働時間は含まない）を引いた時間が未入力時間
              const differenceInMinutes = minutes1 - (minutes2 - minutes3);

              // 結果を時間と分に変換
              const result = minutesToTime(differenceInMinutes);

              // 稼働時間にコピーする
              const operationTimeInput = safeQuerySelector(row, '.w-20 #hs-dropdown-default');
              if (!operationTimeInput) {
                showMessage("稼働時間入力欄が見つかりません。", "warn");
                return;
              }
              
              operationTimeInput.value = result;
              // 稼働時間の欄にフォーカスを当てて、その後外すことで労働時間を更新させる
              operationTimeInput.focus();
              document.activeElement.blur();
            } catch (e) {
              console.error('過不足調整ボタンクリックエラー:', e.message);
              showMessage('過不足調整処理でエラーが発生しました: ' + e.message, "error");
            }
          });

          // +ボタンをクリックしたときの動作
          addTimeButton.addEventListener('click', () => {
            try {
              offsetTime(row, 'add', OFFSET_MINUTES);
            } catch (e) {
              console.error('+ボタンクリックエラー:', e.message);
              showMessage('時間追加処理でエラーが発生しました: ' + e.message, "error");
            }
          });
          
          // +ボタンを右クリックしたときの動作
          addTimeButton.addEventListener('contextmenu', (event) => {
            try {
              event.preventDefault(); // コンテキストメニューを表示しないようにする
              offsetTime(row, 'add', OFFSET_60_MINUTES);
            } catch (e) {
              console.error('+ボタン右クリックエラー:', e.message);
              showMessage('時間追加処理でエラーが発生しました: ' + e.message, "error");
            }
          });
          
          // -ボタンをクリックしたときの動作
          subtractTimeButton.addEventListener('click', () => {
            try {
              offsetTime(row, 'subtract', OFFSET_MINUTES);
            } catch (e) {
              console.error('-ボタンクリックエラー:', e.message);
              showMessage('時間減算処理でエラーが発生しました: ' + e.message, "error");
            }
          });
          
          // -ボタンを右クリックしたときの動作
          subtractTimeButton.addEventListener('contextmenu', (event) => {
            try {
              event.preventDefault(); // コンテキストメニューを表示しないようにする
              offsetTime(row, 'subtract', OFFSET_60_MINUTES);
            } catch (e) {
              console.error('-ボタン右クリックエラー:', e.message);
              showMessage('時間減算処理でエラーが発生しました: ' + e.message, "error");
            }
          });

          function offsetTime(row, offsetType, offsetMinutes) {
            try {
              // 現在入力している時間を取得
              const inputTimeElm = safeQuerySelector(row, '.input-text.pr-3.text-right');
              if (!inputTimeElm) {
                showMessage("入力時間の要素が見つかりません。", "warn");
                return;
              }
              
              const inputTimeElmValue = inputTimeElm.value || '';
              const minutes = timeToMinutes(inputTimeElmValue);             // 現在入力している時間

              // 結果を時間と分に変換
              let differenceInMinutes;
              if (offsetType === 'add') {
                differenceInMinutes = minutes + offsetMinutes;
              } else {
                differenceInMinutes = minutes - offsetMinutes;
                // 結果がマイナスの場合は終了
                if (differenceInMinutes < 0) {
                  return;
                }
              }

              // 結果を時間と分に変換
              const result = minutesToTime(differenceInMinutes);

              // 稼働時間に加算する
              const operationTimeInput = safeQuerySelector(row, '.w-20 #hs-dropdown-default');
              if (!operationTimeInput) {
                showMessage("稼働時間入力欄が見つかりません。", "warn");
                return;
              }
              
              operationTimeInput.value = result;
              // 稼働時間の欄にフォーカスを当てて、その後外すことで労働時間を更新させる
              operationTimeInput.focus();
              document.activeElement.blur();
            } catch (e) {
              console.error('offsetTime error:', e.message);
              showMessage('時間調整処理でエラーが発生しました: ' + e.message, "error");
            }
          }
        } catch (e) {
          console.error('ボタン作成エラー:', e.message);
        }
      });
    } catch (e) {
      console.error('addButtonOperationTime error:', e.message);
    }
  }

  // 勤務時間取得を取得するボタンを追加する処理
  function addButtonHRMOS() {
    try {
      debugLog('addButtonHRMOS() が呼ばれました');

      // ボタンが既に存在するか確認（既に存在する場合は処理をスキップ）
      if (document.getElementById('getHrmosWorkTimeButton')) {
        debugLog('HRMOSボタンは既に存在します');
        return;
      }

      // まずdrawer（稼働入力画面）が開いているか確認
      // 複数の方法でdrawerの存在を確認（サイト更新に対応）
      let drawerOpen = false;
      let drawerContainer = null;

      // 方法1: .page-title要素で「稼働入力」を探す
      const pageTitles = document.querySelectorAll('.page-title');
      debugLog('.page-title要素の数:', pageTitles.length);

      pageTitles.forEach((title, i) => {
        const titleText = safeGetText(title).trim();
        debugLog(`.page-title[${i}]:`, titleText);
        if (titleText.includes('稼働入力')) {
          debugLog('方法1: .page-titleで稼働入力画面を発見');
          drawerOpen = true;
          // drawerのコンテナ要素を親要素から探す
          let parent = title.parentElement;
          let depth = 0;
          while (parent && depth < 15) {
            // drawerのコンテナは通常、大きなコンテナ要素
            if (parent.querySelector('.p-5') || parent.classList.contains('drawer') ||
                parent.getAttribute('role') === 'dialog') {
              drawerContainer = parent;
              debugLog('drawerコンテナを発見（深さ:', depth, '）');
              break;
            }
            parent = parent.parentElement;
            depth++;
          }
        }
      });

      // 方法2: role="dialog"でdrawerを探す（モーダル/drawer要素の標準属性）
      if (!drawerOpen) {
        const dialogs = document.querySelectorAll('[role="dialog"]');
        debugLog('role="dialog"要素の数:', dialogs.length);
        dialogs.forEach((dialog, i) => {
          const dialogText = safeGetText(dialog);
          if (dialogText.includes('稼働入力') || dialogText.includes('勤務時間')) {
            debugLog('方法2: role="dialog"で稼働入力画面を発見（', i, '番目）');
            drawerOpen = true;
            drawerContainer = dialog;
          }
        });
      }

      // 方法3: 「勤務時間」ラベルの存在で判定（最終手段）
      if (!drawerOpen) {
        const labels = document.querySelectorAll('.input-label');
        labels.forEach(label => {
          if (label.textContent.includes('勤務時間')) {
            debugLog('方法3: 勤務時間ラベルで稼働入力画面を発見');
            drawerOpen = true;
            // ラベルから親要素を辿ってdrawerコンテナを探す
            let parent = label.parentElement;
            let depth = 0;
            while (parent && depth < 15) {
              if (parent.querySelector('.p-5')) {
                drawerContainer = parent;
                debugLog('drawerコンテナを発見（深さ:', depth, '）');
                break;
              }
              parent = parent.parentElement;
              depth++;
            }
          }
        });
      }

      if (!drawerOpen) {
        debugLog('drawer（稼働入力画面）が開いていないため、HRMOSボタンは配置しません');
        return;
      }

      // 勤務時間取得ボタンを作成
      const button = document.createElement('button');
      button.id = 'getHrmosWorkTimeButton';
      button.textContent = "HRMOSから勤務時間取得";
      button.style.margin = "5px 0px 0px 0px";
      setCSS(button);

      // 複数の方法で配置場所を探す（サイト更新に対応）
      let targetElement = null;

      // drawerコンテナが見つかっている場合、その中で探す
      const searchArea = drawerContainer || document;
      debugLog('検索範囲:', drawerContainer ? 'drawerコンテナ内' : 'document全体');

      // 方法1: 「勤務時間」ラベルを探して、その親要素に配置
      const labels = searchArea.querySelectorAll('.input-label, label, [class*="label"]');
      debugLog('ラベル要素の数:', labels.length);
      labels.forEach((label, i) => {
        const labelText = safeGetText(label);
        if (labelText.includes('勤務時間')) {
          debugLog('方法1: 勤務時間ラベルを発見（', i, '番目）');
          // ラベルの親要素を取得
          targetElement = label.parentElement;
          debugLog('配置先: 勤務時間ラベルの親要素');
        }
      });

      // 方法2: .hs-dropdown input を含む要素の祖先を探す
      if (!targetElement) {
        debugLog('方法2: .hs-dropdown inputの祖先要素を探す');
        const inputs = searchArea.querySelectorAll('.hs-dropdown input[type="text"]');
        if (inputs.length >= 2) {
          debugLog('.hs-dropdown inputを', inputs.length, '個発見');
          // 最初のinputから親要素を辿る
          let parent = inputs[0].parentElement;
          let depth = 0;
          while (parent && depth < 10) {
            // inputを2つ以上含む親要素を探す
            const inputsInParent = parent.querySelectorAll('.hs-dropdown input[type="text"]');
            if (inputsInParent.length >= 2) {
              targetElement = parent;
              debugLog('配置先: inputを含む親要素（深さ:', depth, '）');
              break;
            }
            parent = parent.parentElement;
            depth++;
          }
        }
      }

      // 方法3: .p-5エリアをフォールバック
      if (!targetElement) {
        debugLog('方法3: .p-5エリアを探す');
        const p5Area = searchArea.querySelector('.p-5');
        if (p5Area) {
          targetElement = p5Area;
          debugLog('配置先: .p-5エリア');
        }
      }

      if (targetElement) {
        debugLog('HRMOSボタンを配置します');
        targetElement.append(button);
      } else {
        console.warn('[CA-Utils] HRMOSボタンの配置場所が見つかりませんでした');
      }

      // ボタンをクリックしたときの動作
      button.addEventListener('click', () => {
        try {
          // 拡張機能のコンテキストが有効かチェック
          if (!isExtensionContextValid()) {
            console.warn('[CA-Utils] 拡張機能が再読み込みされました。ページを再読み込みしてください。');
            alert('拡張機能が更新されました。ページを再読み込みしてください。');
            return;
          }

          chrome.runtime.sendMessage({ action: 'getDateFromHRMOS' }, (response) => {
            try {
              // レスポンス受信時にもコンテキストをチェック
              if (!isExtensionContextValid()) {
                console.warn('[CA-Utils] レスポンス受信時に拡張機能のコンテキストが無効です');
                return;
              }

              if (response && response.value) {
                //console.log('response:', response);
                // HRMOSが開かれていない場合
                if (response.value === 'HRMOS not found' || response.value == '') {
                  showMessage('HRMOSの日次勤怠ページが見つかりませんでした。\n別タブでHRMOSの日次勤怠ページを開いてください。', 'warn');
                  return;
                }

                // response.valueには取得した全ての日付が入っているため、開いているページと同じ日付のデータを取得する //
                // co-assignのURLの末尾から対象の日付を取得
                const url = new URL(window.location.href);
                const datePattern = /\d{4}-\d{2}-\d{2}$/;
                const dateMatch = url.pathname.match(datePattern);

                // 日付が取得できなかった場合
                if (!dateMatch) {
                  alert("エラーが発生しました。");
                  return;
                }
                // 日付が取得できた場合
                else {
                  // 取得した日付と一致するデータをresponseから取得
                  const currentDate = dateMatch[0];
                  const matchingDate = response.value.find(row => row.date == currentDate);
                  // 一致するデータが見つからなかった場合
                  if (!matchingDate) {
                    alert(currentDate + "の勤怠データがHRMOS上で見つかりませんでした。");
                    return;
                  }
                  
                  // 複数の方法で入力欄を探す
                  debugLog('入力欄を探索開始');

                  let timeInputs = [];

                  // 方法1: 勤務時間ラベルを探して、その直後のinput要素を取得
                  const labels = document.querySelectorAll('.input-label');
                  labels.forEach(label => {
                    if (label.textContent.includes('勤務時間')) {
                      debugLog('勤務時間ラベルを発見');
                      // ラベルの次の要素（flexコンテナ）を探す
                      let next = label.nextElementSibling;
                      if (next) {
                        // .hs-dropdown内のinput要素を探す
                        const inputs = next.querySelectorAll('.hs-dropdown input[type="text"]');
                        timeInputs = Array.from(inputs);
                        debugLog('方法1 (勤務時間ラベル配下):', timeInputs.length, '個');
                      }
                    }
                  });

                  // 方法2: .p-5エリア内の.hs-dropdown input を直接探す
                  if (timeInputs.length < 2) {
                    timeInputs = Array.from(document.querySelectorAll('.p-5 .hs-dropdown input[type="text"]'));
                    debugLog('方法2 (.p-5 .hs-dropdown input):', timeInputs.length, '個');
                  }

                  // 方法3: class="input-text"でtype="text"の要素を探す
                  if (timeInputs.length < 2) {
                    timeInputs = Array.from(document.querySelectorAll('.p-5 input.input-text[type="text"]'));
                    debugLog('方法3 (.p-5 input.input-text):', timeInputs.length, '個');
                  }

                  // デバッグ: 最初の数個の入力欄の情報を出力
                  debugLog('見つかった入力欄の詳細:');
                  Array.from(timeInputs).slice(0, 5).forEach((input, i) => {
                    debugLog(`  [${i}] id="${input.id}" class="${input.className}" value="${input.value}" placeholder="${input.placeholder}"`);
                  });

                  if (!timeInputs || timeInputs.length < 2) {
                    showMessage("開始・終了時刻の入力欄が見つかりません。詳細はコンソールを確認してください。", "warn");
                    debugLog('入力欄が不足しています');
                    // デバッグ用：.p-5エリアの構造を出力
                    const p5Area = document.querySelector('.p-5');
                    if (p5Area) {
                      debugLog('.p-5エリアのHTML（最初の500文字）:');
                      debugLog(p5Area.innerHTML.substring(0, 500));
                    }
                    return;
                  }

                  debugLog('使用する入力欄数:', timeInputs.length);

                  // 入力欄に値を設定する汎用関数
                  const setInputValue = (input, value, label) => {
                    debugLog(`${label}を設定:`, value);

                    // 値を設定
                    input.value = value;

                    // 複数のイベントを発火（フレームワーク対応）
                    ['input', 'change', 'blur', 'keyup'].forEach(eventType => {
                      input.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
                    });

                    // フォーカス操作
                    input.focus();
                    input.select();

                    // クリックイベントも試す
                    input.dispatchEvent(new MouseEvent('click', { bubbles: true }));

                    setTimeout(() => {
                      document.activeElement.blur();
                    }, 50);
                  };

                  // 開始時刻の設定（最初の要素）
                  try {
                    let startTime = matchingDate.startTime;
                    if (!startTime) {
                      showMessage("開始時刻のデータが見つかりません。", "warn");
                      return;
                    }

                    const startInput = timeInputs[0];
                    setInputValue(startInput, startTime, '開始時刻');
                  } catch (e) {
                    console.error('[CA-Utils] 開始時刻設定エラー:', e);
                    showMessage("開始時刻の設定でエラーが発生しました。", "error");
                  }

                  // 終了時刻の設定（2番目の要素）
                  setTimeout(() => {
                    try {
                      let endTime = matchingDate.endTime;
                      if (!endTime) {
                        showMessage("終了時刻のデータが見つかりません。", "warn");
                        return;
                      }

                      // 翌が含まれる場合、24時間足す
                      if (endTime && endTime.includes("翌")) {
                        // 改行で分割し、時間部分を取得
                        const lines = endTime.split("\n");
                        const time = lines[1] ? lines[1].trim() : null;
                        if (time) {
                          endTime = add24Hours(time);
                        }
                      }

                      const endInput = timeInputs[1];
                      setInputValue(endInput, endTime, '終了時刻');

                      setTimeout(() => {

                        // 時間を入力した後、休憩時間追加ボタンをクリックする
                        setTimeout(() => {
                          const restTime = document.querySelectorAll('.w-64 .material-symbols-outlined');

                          // 休憩時間が表示されているときに表示されるバツボタンの有無で休憩時間が表示されているかを判断
                          const cancelButton = Array.from(restTime).find(icon => icon.textContent.trim() === 'cancel');

                          // 休憩時間が表示されていない場合
                          if (!cancelButton) {
                            // add_circleアイコンを探す（休憩時間追加ボタン）
                            const addButton = Array.from(restTime).find(icon => icon.textContent.trim() === 'add_circle');
                            if (addButton) {
                              debugLog('休憩時間追加ボタンをクリック');
                              addButton.click();

                              // 休憩時間が1時間ではない場合、警告を表示
                              if (matchingDate.restTime && matchingDate.restTime !== '1:00') {
                                setTimeout(() => {
                                  alert('HRMOS上の休憩時間が1時間ではありません。\nCo-Assignの休憩時間を手動で調整してください。\n' + currentDate + 'の休憩時間：' + matchingDate.restTime);
                                }, 500);
                              }
                            } else {
                              console.warn('[CA-Utils] 休憩時間追加ボタンが見つかりません');
                            }
                          } else {
                            debugLog('休憩時間はすでに表示されています');

                            // 休憩時間が1時間ではない場合、警告を表示
                            if (matchingDate.restTime && matchingDate.restTime !== '1:00') {
                              alert('HRMOS上の休憩時間が1時間ではありません。\nCo-Assignの休憩時間を手動で調整してください。\n' + currentDate + 'の休憩時間：' + matchingDate.restTime);
                            }
                          }
                        }, 300);
                      }, 200);
                    } catch (e) {
                      console.error('[CA-Utils] 終了時刻設定エラー:', e);
                      showMessage("終了時刻の設定でエラーが発生しました。", "error");
                    }
                  }, 200);
                }
              } else {
                alert('HRMOSの日次勤怠ページを開いてください');
              }
            } catch (e) {
              console.error('HRMOSボタンクリック処理エラー:', e.message);
              showMessage('HRMOS処理でエラーが発生しました: ' + e.message, "error");
            }
          });
        } catch (error) {
          console.error('An error occurred:', error);
          showMessage('HRMOS通信でエラーが発生しました: ' + error.message, "error");
        }
      });
    } catch (e) {
      console.error('addButtonHRMOS error:', e.message);
    }
  }
}

function addButtonCalendar() {
  try {
    // 既にボタンが存在するかチェック（IDベースで検索）
    const existingButton = document.getElementById('calendarButton');
    if (existingButton) {
      return; // 既に存在する場合は処理をスキップ
    }

    // サイドメニューを探す - 稼働管理リンクを基準に
    let menuDiv = null;

    // 常に表示される「稼働管理」リンクを探す
    const worksheetLink = document.querySelector('a[href*="/worksheet/"]');

    if (worksheetLink) {
      debugLog('稼働管理リンクを発見');

      // 稼働管理リンクの親要素を遡り、メニューコンテナを探す
      let parent = worksheetLink.parentElement;
      let depth = 0;

      while (parent && parent !== document.body && depth < 10) {
        const directChildren = Array.from(parent.children);

        // リンクまたはボタンを2つ以上含むdivを探す
        const menuItemCount = directChildren.filter(child =>
          child.tagName === 'A' ||
          child.tagName === 'BUTTON' ||
          (child.tagName === 'DIV' && (child.querySelector('a') || child.querySelector('button')))
        ).length;

        if (menuItemCount >= 2) {
          menuDiv = parent;
          debugLog('メニューコンテナを発見:', {
            tagName: parent.tagName,
            className: parent.className,
            childCount: directChildren.length,
            menuItemCount: menuItemCount
          });
          break;
        }

        parent = parent.parentElement;
        depth++;
      }
    }

    // フォールバック: IDで探す（古い構造）
    if (!menuDiv) {
      debugLog('稼働管理リンクからメニューが見つかりませんでした。IDで探します。');
      const sidemenu = document.getElementById('sidemenu');
      if (sidemenu) {
        menuDiv = sidemenu.querySelector("div");
        debugLog('IDベースのsidemenuを使用');
      }
    }

    if (!menuDiv) {
      console.warn('[CA-Utils] サイドメニューが見つかりません。カレンダーボタンの追加をスキップします。');
      return;
    }

    debugLog('サイドメニューを発見しました');

    // 既存のメニュー項目のスタイルを確認
    const existingMenuItem = menuDiv.querySelector('a, button');
    let buttonStyle = 'flex';

    if (existingMenuItem) {
      // 既存のメニュー項目のクラスをコピー
      const classes = existingMenuItem.className;
      debugLog('既存メニューのクラス:', classes);
      buttonStyle = classes || 'flex';
    }

    // ボタンを作成（aタグとして作成して既存のメニューと統一）
    const showButton = document.createElement('a');
    showButton.id = 'calendarButton';
    showButton.href = '#';
    showButton.title = "[CA-Utils] Google Calendarを表示します（ベータ機能）";
    showButton.className = buttonStyle;
    showButton.style.cursor = 'pointer';

    // 内部構造を既存メニューと同じにする
    const flexDiv = document.createElement('div');
    flexDiv.className = 'flex';

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined notranslate';
    icon.setAttribute('translate', 'no');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'calendar_month';

    const textSpan = document.createElement('span');
    textSpan.className = 'my-auto ml-1';
    textSpan.textContent = '[Beta]Show Calendar';

    flexDiv.appendChild(icon);
    flexDiv.appendChild(textSpan);
    showButton.appendChild(flexDiv);

    menuDiv.appendChild(showButton);
    showButton.addEventListener('click', function (e) {
      e.preventDefault(); // ページ遷移を防ぐ
      try {
        if (!document.getElementById('calendarIframe')) {
          chrome.storage.sync.get('userEmail', function (data) {
            try {
              if (data['userEmail']) {
                let userEmail = data['userEmail'];
                const iframe = document.createElement('iframe');
                showButton.textContent = "Hide Calendar";
                let today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
                today = today + "/" + today;
                iframe.src = "https://calendar.google.com/calendar/embed?height=450&wkst=1&ctz=Asia%2FTokyo&showPrint=0&mode=AGENDA&dates=" + today + "&showTz=0&showCalendars=0&showTitle=0&src=" + encodeURIComponent(userEmail) + "&color=%230083c6";
                iframe.width = "450";
                iframe.height = "300";
                iframe.id = 'calendarIframe';
                iframe.style.position = "fixed";
                iframe.style.left = "0";
                iframe.style.top = "auto";
                iframe.style.bottom = "0";
                iframe.style.backgroundColor = "#2693FF";
                iframe.style.padding = "10pt 2pt 2pt 2pt";
                iframe.style.borderRadius = "5pt";
                iframe.style.zIndex = "99999999999999999999";
                iframe.style.cursor = "move";
                document.body.appendChild(iframe);
                
                // ドラッグ機能の実装
                let isDragging = false;
                let startX;
                let startY;
                let startLeft;
                let startTop;
                
                function dragStart(e) {
                  isDragging = true;
                  
                  // 初回ドラッグ時にbottomを解除してtopベースに切り替え
                  if (iframe.style.bottom !== 'auto') {
                    const rect = iframe.getBoundingClientRect();
                    iframe.style.top = rect.top + 'px';
                    iframe.style.bottom = 'auto';
                    iframe.style.left = rect.left + 'px';
                  }
                  
                  // マウスまたはタッチの開始位置を取得
                  if (e.type === "touchstart") {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                  } else {
                    startX = e.clientX;
                    startY = e.clientY;
                  }
                  
                  // 要素の開始位置を取得
                  startLeft = parseInt(iframe.style.left) || 0;
                  startTop = parseInt(iframe.style.top) || 0;
                  
                  e.preventDefault();
                }
                
                function drag(e) {
                  if (!isDragging) return;
                  
                  e.preventDefault();
                  
                  let currentX, currentY;
                  
                  // 現在のマウスまたはタッチ位置を取得
                  if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX;
                    currentY = e.touches[0].clientY;
                  } else {
                    currentX = e.clientX;
                    currentY = e.clientY;
                  }
                  
                  // 移動量を計算
                  const deltaX = currentX - startX;
                  const deltaY = currentY - startY;
                  
                  // 新しい位置を計算
                  let newLeft = startLeft + deltaX;
                  let newTop = startTop + deltaY;
                  
                  // 画面内に収まるように制限
                  const maxX = window.innerWidth - iframe.offsetWidth;
                  const maxY = window.innerHeight - iframe.offsetHeight;
                  
                  newLeft = Math.min(Math.max(0, newLeft), maxX);
                  newTop = Math.min(Math.max(0, newTop), maxY);
                  
                  // 位置を更新
                  iframe.style.left = newLeft + 'px';
                  iframe.style.top = newTop + 'px';
                }
                
                function dragEnd(e) {
                  isDragging = false;
                }
                
                // マウスイベント
                iframe.addEventListener("mousedown", dragStart);
                document.addEventListener("mousemove", drag);
                document.addEventListener("mouseup", dragEnd);
                
                // タッチイベント（モバイル対応）
                iframe.addEventListener("touchstart", dragStart, { passive: false });
                document.addEventListener("touchmove", drag, { passive: false });
                document.addEventListener("touchend", dragEnd);
                
                // iframeのIDを保存してクリーンアップ時に使用
                iframe.dataset.cleanupId = 'calendarIframe';
              } else {
                alert("メールアドレスが未設定です。\n拡張機能アイコンをクリックし、メールアドレスを入力して保存してください。");
              }
            } catch (e) {
              alert('カレンダー表示エラー: ' + e.message);
            }
          });
        } else {
          if (document.getElementById('calendarIframe').style.display == 'none') {
            document.getElementById('calendarIframe').style.display = 'block';
            showButton.textContent = "Hide Calendar";
          } else {
            document.getElementById('calendarIframe').style.display = 'none';
            showButton.textContent = "[Beta]Show Calendar";
          }
        }
      } catch (e) {
        console.error('カレンダーボタンエラー:', e);
      }
    });
  } catch (e) {
    console.error('カレンダーボタン初期化エラー:', e);
  }
}

// 稼働時間の差を表示するボタンを追加する処理
function addButtonShowDiffWorkTime() {
  try {
    // 既にボタンが存在するかチェック（IDベースで検索）
    const existingButton = document.getElementById('diffWorkTimeButton');
    if (existingButton) {
      return; // 既に存在する場合は処理をスキップ
    }

    // サイドメニューを探す - 稼働管理リンクを基準に
    let menuDiv = null;

    // 常に表示される「稼働管理」リンクを探す
    const worksheetLink = document.querySelector('a[href*="/worksheet/"]');

    if (worksheetLink) {
      debugLog('稼働管理リンクを発見（差分ボタン用）');

      // 稼働管理リンクの親要素を遡り、メニューコンテナを探す
      let parent = worksheetLink.parentElement;
      let depth = 0;

      while (parent && parent !== document.body && depth < 10) {
        const directChildren = Array.from(parent.children);

        // リンクまたはボタンを2つ以上含むdivを探す
        const menuItemCount = directChildren.filter(child =>
          child.tagName === 'A' ||
          child.tagName === 'BUTTON' ||
          (child.tagName === 'DIV' && (child.querySelector('a') || child.querySelector('button')))
        ).length;

        if (menuItemCount >= 2) {
          menuDiv = parent;
          debugLog('メニューコンテナを発見（差分ボタン用）');
          break;
        }

        parent = parent.parentElement;
        depth++;
      }
    }

    // フォールバック: IDで探す（古い構造）
    if (!menuDiv) {
      debugLog('稼働管理リンクからメニューが見つかりませんでした。IDで探します。');
      const sidemenu = document.getElementById('sidemenu');
      if (sidemenu) {
        menuDiv = sidemenu.querySelector("div");
      }
    }

    if (!menuDiv) {
      console.warn('[CA-Utils] サイドメニューが見つかりません。勤務時間差分ボタンの追加をスキップします。');
      return;
    }

    console.log('[CA-Utils] サイドメニューを発見しました（差分ボタン用）');

    // 既存のメニュー項目のスタイルを確認
    const existingMenuItem = menuDiv.querySelector('a, button');
    let buttonStyle = 'flex';

    if (existingMenuItem) {
      const classes = existingMenuItem.className;
      buttonStyle = classes || 'flex';
    }

    // ボタンを作成（aタグとして作成して既存のメニューと統一）
    const showButton = document.createElement('a');
    showButton.id = 'diffWorkTimeButton';
    showButton.href = '#';
    showButton.title = "[CA-Utils] HRMOS⇔Co-assign間の勤務時間の差を表示します（ベータ機能）";
    showButton.className = buttonStyle;
    showButton.style.cursor = 'pointer';

    // 内部構造を既存メニューと同じにする
    const flexDiv = document.createElement('div');
    flexDiv.className = 'flex';

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined notranslate';
    icon.setAttribute('translate', 'no');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'query_stats';

    const textSpan = document.createElement('span');
    textSpan.className = 'my-auto ml-1';
    textSpan.textContent = '勤務時間の差を表示';

    flexDiv.appendChild(icon);
    flexDiv.appendChild(textSpan);
    showButton.appendChild(flexDiv);

    menuDiv.appendChild(showButton);
    showButton.addEventListener('click', function (e) {
      e.preventDefault(); // ページ遷移を防ぐ
      try {
        // 拡張機能のコンテキストが有効かチェック
        if (!isExtensionContextValid()) {
          console.warn('[CA-Utils] 拡張機能が再読み込みされました。ページを再読み込みしてください。');
          alert('拡張機能が更新されました。ページを再読み込みしてください。');
          return;
        }

        chrome.runtime.sendMessage({ action: 'getDateFromHRMOS' }, (response) => {
          try {
            // レスポンス受信時にもコンテキストをチェック
            if (!isExtensionContextValid()) {
              console.warn('[CA-Utils] レスポンス受信時に拡張機能のコンテキストが無効です');
              return;
            }

            let diffTime = {};
            diffTime = getOperationTime(response, true);
            let msg = 'Co-Assign上の勤務時間合計：' + diffTime.sumTimeCA +
              '\nHRMOS上の勤務時間合計：' + diffTime.sumTimeHRMOS +
              '\n差分：' + (diffTime.sumTimeCA == diffTime.sumTimeHRMOS ? '無し！' : 'あり！');
            alert(msg);
          } catch (e) {
            if (isExtensionContextValid()) {
              showMessage('勤務時間差分表示でエラーが発生しました: ' + e.message, "error");
            }
          }
        });
      } catch (e) {
        if (isExtensionContextValid()) {
          showMessage('勤務時間差分ボタンでエラーが発生しました: ' + e.message, "error");
        }
      }
    });
  } catch (e) {
    showMessage('勤務時間差分ボタン初期化でエラーが発生しました: ' + e.message, "error");
  }
}

// ボタンのスタイルを設定する関数
function setCSS(button, paddingSize = "5px") {
  button.style.backgroundColor = '#2693FF';
  button.style.color = '#FFFFFF';
  button.style.borderRadius = "5px";
  button.style.padding = paddingSize;
  // ホバー時のスタイル
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#1a75d1';
    button.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
  });

  // ホバーが外れた時のスタイル
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#2693FF';
    button.style.boxShadow = 'none';
  });

  // アクティブ時のスタイル
  button.addEventListener('mousedown', () => {
    button.style.backgroundColor = '#004080';
    button.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.2)';
  });

  // アクティブ状態が解除された時のスタイル
  button.addEventListener('mouseup', () => {
    button.style.backgroundColor = '#1a75d1'; // ホバー状態の背景色に戻す
    button.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)'; // ホバー状態のシャドウに戻す
  });
}

// 時間を分に変換する関数
function timeToMinutes(time) {
  try {
    if (!time || typeof time !== 'string' || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  } catch (e) {
    console.warn('timeToMinutes error:', e.message, time);
    return 0;
  }
}

// 分を時間と分に変換する関数
function minutesToTime(minutes) {
  try {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  } catch (e) {
    console.warn('minutesToTime error:', e.message, minutes);
    return '0:00';
  }
}

// メッセージボックスを作成して表示する関数
function showMessage(message, type = 'info') {
  try {
    // 既存のメッセージボックスがある場合は削除
    const existingBox = document.getElementById('chrome-extension-message-box');
    if (existingBox) {
      existingBox.remove();
    }

    // メッセージボックスの要素を作成
    const messageBox = document.createElement('div');
    messageBox.id = 'chrome-extension-message-box';
    messageBox.style.display = 'flex';  // ✖ボタンを右端に配置するためにフレックスボックスを使用
    messageBox.style.alignItems = 'center';

    // メッセージ部分の要素を作成
    const messageText = document.createElement('span');
    
    // XSS対策: 安全なテキスト表示
    if (message.includes('<a href=') && message.includes('</a>')) {
      // HRMOSリンクを含む特別なケースの処理
      const linkMatch = message.match(/<a href=['"]([^'"]+)['"][^>]*>([^<]+)<\/a>/);
      if (linkMatch) {
        const beforeLink = message.substring(0, message.indexOf('<a'));
        const afterLink = message.substring(message.indexOf('</a>') + 4);
        
        messageText.textContent = beforeLink;
        const link = document.createElement('a');
        link.href = linkMatch[1];
        link.target = '_blank';
        link.style.color = '#0066cc';
        link.style.textDecoration = 'underline';
        link.textContent = linkMatch[2];
        messageText.appendChild(link);
        messageText.appendChild(document.createTextNode(afterLink));
      } else {
        // その他の場合はテキストとして表示
        messageText.textContent = message.replace(/<[^>]*>/g, '');
      }
    } else {
      messageText.textContent = message;
    }

    // ✖ボタンの作成
    const closeButton = document.createElement('button');
    closeButton.textContent = '　×　';
    closeButton.style.marginLeft = 'auto';  // ボタンを右端に配置
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';

    // ✖ボタンがクリックされたときにメッセージボックスを削除
    closeButton.addEventListener('click', () => {
      messageBox.remove();
    });

    // スタイル設定
    messageBox.style.position = 'fixed';
    messageBox.style.top = '0';
    messageBox.style.left = '50%';
    messageBox.style.transform = 'translateX(-50%)';
    messageBox.style.padding = '10px 20px';
    messageBox.style.zIndex = '10000';
    messageBox.style.color = '#fff';
    messageBox.style.borderRadius = '5px';
    messageBox.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
    messageBox.style.fontSize = '14px';
    messageBox.style.fontFamily = 'Arial, sans-serif';

    // 背景色の設定
    switch (type) {
      case 'error':
        messageBox.style.backgroundColor = '#ff4d4f'; // エラーは赤
        break;
      case 'warn':
        messageBox.style.backgroundColor = '#fd7e00'; // 警告はオレンジ
        messageBox.style.color = '#000'; // 黒文字に変更（読みやすくするため）
        break;
      case 'info':
      default:
        messageBox.style.backgroundColor = '#2196f3'; // 情報は青
        break;
    }

    // メッセージボックスにメッセージと✖ボタンを追加
    messageBox.appendChild(messageText);
    messageBox.appendChild(closeButton);

    // メッセージボックスをドキュメントに追加
    document.body.appendChild(messageBox);
  } catch (e) {
    alert('メッセージ表示エラー: ' + e.message + '\n' + (message || ''));
  }
}

// hh:mm形式の時間に24時間を足す
function add24Hours(timeString) {
  try {
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '';
    const [hours, minutes] = timeString.split(":").map(Number); // 時間と分を分割して数値に変換
    if (isNaN(hours) || isNaN(minutes)) return '';
    const newHours = hours + 24; // 24時間を足す
    return `${newHours}:${minutes.toString().padStart(2, "0")}`; // 再度文字列にして返す
  } catch (e) {
    console.warn('add24Hours error:', e.message, timeString);
    return '';
  }
}

// hh:mm形式の時間の配列を受け取り合計時間を計算する
function sumTimes(timeArray) {
  try {
    if (!Array.isArray(timeArray)) return '0:00';
    let totalMinutes = 0;
    // 各時間を分単位に変換して合計する
    timeArray.forEach((time) => {
      if (!time || typeof time !== 'string' || !time.includes(':')) return;
      const [hours, minutes] = time.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return;
      totalMinutes += hours * 60 + minutes;
    });
    // 合計時間をhh:mm形式に変換
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${totalHours}:${remainingMinutes.toString().padStart(2, "0")}`;
  } catch (e) {
    console.warn('sumTimes error:', e.message, timeArray);
    return '0:00';
  }
}
