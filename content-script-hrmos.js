(function () {
  try {
    // デバッグ情報を追加
    console.log('[CA-Utils] HRMOSデータ取得開始');
    console.log('[CA-Utils] 現在のURL:', window.location.href);

    // 年月の取得を複数の方法で試す
    let year_month = '';

    // 方法1: #select要素から取得
    const selectElement = document.querySelector('#select');
    if (selectElement) {
      year_month = selectElement.value;
      console.log('[CA-Utils] #selectから年月を取得:', year_month);
    }

    // 方法2: select要素全体を検索
    if (!year_month) {
      const allSelects = document.querySelectorAll('select');
      console.log('[CA-Utils] ページ内のselect要素数:', allSelects.length);
      for (const select of allSelects) {
        if (select.value && select.value.match(/^\d{4}-\d{2}$/)) {
          year_month = select.value;
          console.log('[CA-Utils] selectから年月を取得:', year_month);
          break;
        }
      }
    }

    // 方法3: URLから取得
    if (!year_month) {
      const urlMatch = window.location.href.match(/(\d{4})-(\d{2})/);
      if (urlMatch) {
        year_month = `${urlMatch[1]}-${urlMatch[2]}`;
        console.log('[CA-Utils] URLから年月を取得:', year_month);
      }
    }

    // 方法4: ページ内のテキストから取得
    if (!year_month) {
      const bodyText = document.body.textContent;
      const textMatch = bodyText.match(/(\d{4})年\s*(\d{1,2})月/);
      if (textMatch) {
        year_month = `${textMatch[1]}-${textMatch[2].padStart(2, '0')}`;
        console.log('[CA-Utils] テキストから年月を取得:', year_month);
      }
    }

    if (!year_month) {
      console.error('[CA-Utils] 年月を取得できませんでした');
      // デバッグ用：ページ内のselect要素とinput要素を出力
      const selects = document.querySelectorAll('select');
      const inputs = document.querySelectorAll('input[type="text"], input[type="month"]');
      console.log('[CA-Utils] select要素:', Array.from(selects).map(s => ({ id: s.id, value: s.value, name: s.name })));
      console.log('[CA-Utils] input要素:', Array.from(inputs).slice(0, 10).map(i => ({ id: i.id, value: i.value, name: i.name })));
      return [];
    }

    console.log('[CA-Utils] 使用する年月:', year_month);

    // 取得したいDOM要素を選択
    let workTimes = [];

    // 勤務表の行を取得 - より汎用的なセレクタを使用
    let rows = [];

    // まず特定のクラス名で試す
    rows = document.querySelectorAll('tr.noColor, tr.dayBlue, tr.dayRed, tr[class*="day"]');

    // 見つからない場合は、テーブル内の全行を取得
    if (rows.length === 0) {
      const tables = document.querySelectorAll('table');
      console.log('[CA-Utils] ページ内のテーブル数:', tables.length);

      // 各テーブルの構造を確認
      tables.forEach((table, index) => {
        const tableRows = table.querySelectorAll('tr');
        console.log(`[CA-Utils] テーブル${index + 1}:`, {
          className: table.className,
          id: table.id,
          rows: tableRows.length,
          columns: tableRows[0] ? tableRows[0].querySelectorAll('td, th').length : 0
        });

        // 勤務表と思われるテーブルを探す（日付列がありそうなもの）
        if (tableRows.length > 5 && rows.length === 0) {
          const firstRow = tableRows[0];
          const headerText = firstRow.textContent;
          // ヘッダーに「日付」「出勤」「退勤」「勤務時間」などが含まれているか確認
          if (headerText.includes('日') || headerText.includes('出') || headerText.includes('勤務')) {
            rows = Array.from(tableRows).slice(1); // ヘッダー行を除外
            console.log('[CA-Utils] 勤務表テーブルを発見:', index + 1, '行数:', rows.length);
          }
        }
      });
    }

    console.log('[CA-Utils] 取得した行数:', rows.length);

    if (rows.length === 0) {
      console.warn('[CA-Utils] 勤務表の行が見つかりません');
      return [];
    }
    
    rows.forEach((row, index) => {
      try {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return; // ヘッダー行などをスキップ

        // 最初の数行で構造をデバッグ
        if (index < 3) {
          console.log(`[CA-Utils] 行${index + 1} セル数:`, cells.length);
          console.log(`[CA-Utils] 行${index + 1} セル内容:`, Array.from(cells).map(cell => cell.textContent.trim().substring(0, 20)));
        }

        // 日付セルの取得方法を複数試す
        let dateText = '';
        const dateCell = row.querySelector('.cellDate span') ||
                        row.querySelector('.cellDate') ||
                        cells[0]; // 1列目が日付の可能性が高い

        if (dateCell) {
          dateText = (dateCell.innerText || dateCell.textContent || '').trim();
          // 日付から数字のみを抽出（例: "1日" -> "1", "01" -> "01"）
          const dayMatch = dateText.match(/(\d{1,2})/);
          if (dayMatch) {
            dateText = dayMatch[1];
          }
        }

        let date = dateText ? year_month + "-" + dateText.padStart(2, '0') : '';

        // 時刻セルの取得 - クラス名とセル位置の両方で試す
        let startTime = '';
        let endTime = '';
        let restTime = '';
        let workTime = '';

        // 方法1: クラス名で探す
        const startCell = row.querySelector('.cellTime01 .item01') || row.querySelector('.cellTime01');
        const endCell = row.querySelector('.cellTime02 .item01') || row.querySelector('.cellTime02');
        const restCell = row.querySelector('.cellTime07');
        const workCell = row.querySelector('.cellTime08');

        if (startCell) startTime = (startCell.innerText || startCell.textContent || '').trim();
        if (endCell) endTime = (endCell.innerText || endCell.textContent || '').trim();
        if (restCell) restTime = (restCell.innerText || restCell.textContent || '').trim();
        if (workCell) workTime = (workCell.innerText || workCell.textContent || '').trim();

        // 方法2: クラス名で見つからない場合、セルの位置で判断
        if (!startTime || !endTime) {
          // 各セルを確認して時刻パターンに一致するものを探す
          const timePattern = /^\d{1,2}:\d{2}$/; // "9:00" や "18:30" など
          const nextDayPattern = /翌/; // "翌" を含むかチェック

          for (let i = 0; i < cells.length; i++) {
            const cellText = (cells[i].innerText || cells[i].textContent || '').trim();

            // 時刻パターンにマッチするか確認
            if (timePattern.test(cellText) || nextDayPattern.test(cellText)) {
              if (!startTime) {
                startTime = cellText;
              } else if (!endTime) {
                endTime = cellText;
              } else if (!restTime && i > 2) {
                restTime = cellText;
              } else if (!workTime && i > 3) {
                workTime = cellText;
              }
            }
          }
        }

        // デバッグ情報
        if (index < 5) {
          console.log(`[CA-Utils] 行${index + 1}: date=${date}, start=${startTime}, end=${endTime}, rest=${restTime}, work=${workTime}`);
        }

        // 開始時刻、終了時刻の両方が取得でき、かつ有効な値の場合のみworkTimesに追加
        // "-" や空の値、"0:00"は除外（土日や未入力の日は除外される）
        const isValidTime = (time) => {
          if (!time || time.trim() === '') return false;
          if (time === '-' || time === '--:--') return false;
          if (time === '0:00' || time === '00:00') return false;
          // 時刻形式であることを確認
          return time.includes(':') || time.includes('翌');
        };

        if (date && isValidTime(startTime) && isValidTime(endTime)) {
          console.log(`[CA-Utils] 有効な勤務データ: ${date} (${startTime} - ${endTime})`);
          workTimes.push({ date, startTime, endTime, restTime, workTime });
        } else if (date && index < 10) {
          console.log(`[CA-Utils] スキップ: ${date} (start=${startTime}, end=${endTime})`);
        }
      } catch (rowError) {
        console.error(`[CA-Utils] 行${index + 1}の処理中にエラー:`, rowError);
      }
    });

    console.log('[CA-Utils] 取得した勤務データ数:', workTimes.length);
    if (workTimes.length > 0) {
      console.log('[CA-Utils] サンプルデータ:', workTimes[0]);
    }
    
    return workTimes;
  } catch (error) {
    console.error('[CA-Utils] HRMOSデータ取得エラー:', error);
    return [];
  }
})()
