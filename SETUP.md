# Co-Assign Utils 初期設定ガイド

このドキュメントでは、Co-Assign Utils拡張機能の初期設定方法を詳しく説明します。

## 目次
1. [インストール](#インストール)
2. [基本設定](#基本設定)
3. [動作確認](#動作確認)
4. [トラブルシューティング](#トラブルシューティング)

---

## インストール

### ステップ1: ファイルの準備

#### 方法A: GitHubからダウンロード
1. https://github.com/Hayato0802/CA_Utils にアクセス
2. 緑色の「Code」ボタンをクリック
3. 「Download ZIP」をクリック
4. ダウンロードしたZIPファイルを解凍

#### 方法B: Gitコマンド（推奨）
```bash
git clone https://github.com/Hayato0802/CA_Utils.git
cd CA_Utils
```

### ステップ2: Chrome拡張機能として読み込み

1. Google Chromeを開く
2. アドレスバーに `chrome://extensions/` と入力してEnter
3. 右上の「デベロッパーモード」トグルをONにする
4. 「パッケージ化されていない拡張機能を読み込む」ボタンをクリック
5. 解凍したフォルダ（`CoAssignUtils`）を選択
6. 「フォルダーの選択」をクリック

### ステップ3: インストール確認

拡張機能が正しくインストールされると：
- Chrome拡張機能一覧に「Co-Assign Utils」が表示される
- ブラウザのツールバーにアイコンが表示される（ピン留めすると便利）
- バージョン番号（例: 1.5.7）が表示される

---

## 基本設定

### 設定ファイル（config.js）の編集

#### 1. ファイルを開く
`config.js` ファイルをテキストエディタで開きます。

場所: `CoAssignUtils/config.js`

#### 2. 基本設定項目

##### 2-1. HRMOSのURL設定
```javascript
HR_SYSTEM_URL_PATTERN: 'https://p.ieyasu.co/works/*',
```

**変更が必要な場合:**
- 会社で異なるHRMOSのドメインを使用している場合は変更
- 例: `https://your-company.ieyasu.co/works/*`

**確認方法:**
1. HRMOSにログイン
2. 勤怠入力ページのURLをコピー
3. URLの `works/` より前の部分を確認

##### 2-2. Co-AssignのURL設定
```javascript
TIMETRACKING_BASE_URL: 'https://blueship.co-assign.com/worksheet',
```

**変更が必要な場合:**
- 会社で異なるCo-Assignのサブドメインを使用している場合は変更
- 例: `https://your-company.co-assign.com/worksheet`

##### 2-3. 時間調整の設定
```javascript
OFFSET_MINUTES: 5,        // +/-ボタンの増減時間（分）
OFFSET_60_MINUTES: 60,    // 右クリック時の増減時間（分）
```

**カスタマイズ例:**
```javascript
OFFSET_MINUTES: 15,       // 15分単位で調整したい場合
OFFSET_60_MINUTES: 30,    // 右クリックで30分単位にしたい場合
```

##### 2-4. GitHub リポジトリ（自動更新用）
```javascript
GITHUB_REPO: 'Hayato0802/CA_Utils',
```

**変更が必要な場合:**
- フォークして独自に管理する場合は、自分のリポジトリ名に変更
- 例: `your-username/CA_Utils`

#### 3. 設定ファイルの保存

1. 変更を保存
2. Chromeで `chrome://extensions/` を開く
3. Co-Assign Utilsの「更新」ボタンをクリック（または再読み込みボタン）

### Googleカレンダー機能の設定（オプション）

カレンダー表示機能を使用する場合のみ設定が必要です。

#### 手順

1. Chromeツールバーの拡張機能アイコンをクリック
2. ポップアップが開く
3. 「カレンダー用アドレス」欄にGoogleアカウントのメールアドレスを入力
   - 例: `your.name@gmail.com`
4. 「保存」ボタンをクリック
5. 「保存しました！」と表示されればOK

---

## 動作確認

### 1. HRMOSページでの動作確認

#### 手順
1. HRMOSにログイン: https://p.ieyasu.co
2. 勤怠入力ページ（日次または月次）を開く
3. F12キーを押して開発者ツールを開く
4. 「Console」タブを選択
5. 以下のようなログが表示されることを確認:
```
[CA-Utils] HRMOSデータ取得開始
[CA-Utils] 現在のURL: https://p.ieyasu.co/works/...
[CA-Utils] 使用する年月: 2025-01
[CA-Utils] 取得した行数: 31
[CA-Utils] 取得した勤務データ数: 20
```

#### エラーが出る場合
- `[CA-Utils] 年月を取得できませんでした` → config.jsのURL設定を確認
- `[CA-Utils] 勤務表の行が見つかりません` → HRMOSの勤怠ページが正しく開いているか確認

### 2. Co-Assignページでの動作確認

#### 手順
1. Co-Assignにログイン
2. 稼働管理ページを開く
3. 以下のボタンが表示されることを確認:
   - 左メニュー: 「[Beta]Show Calendar」
   - 左メニュー: 「勤務時間の差分を表示」

4. 特定の日付の稼働入力画面を開く
5. 以下のボタンが表示されることを確認:
   - 「HRMOSから勤務時間取得」ボタン（右側）
   - 各プロジェクト行に「+」「-」「🕒」ボタン

### 3. データ転記のテスト

#### 手順
1. HRMOSで任意の日付の勤怠データを入力（まだの場合）
2. HRMOSページをブラウザで開いたまま、別タブでCo-Assignを開く
3. Co-Assignで同じ日付の稼働入力画面を開く
4. 「HRMOSから勤務時間取得」ボタンをクリック
5. 以下が自動入力されることを確認:
   - 開始時刻（例: 09:00）
   - 終了時刻（例: 18:00）
   - 休憩時間が1時間の場合、自動的に休憩時間欄が表示される

#### 正常な動作例
```
✓ 開始時刻: 09:00 → 入力される
✓ 終了時刻: 18:00 → 入力される
✓ 休憩時間: 1:00 → 休憩時間欄が追加される
✓ 労働時間: 8:00 → 自動計算される
```

#### エラーメッセージと対処法

| メッセージ | 原因 | 対処法 |
|----------|------|--------|
| HRMOSの日次勤怠ページが見つかりませんでした | HRMOSページが開いていない | 別タブでHRMOSを開く |
| 開始時刻のデータが見つかりません | HRMOSに勤怠データがない | HRMOSで勤怠を入力 |
| HRMOS上の休憩時間が1時間ではありません | 休憩時間が1時間以外 | Co-Assignで手動調整 |
| HRMOSとCo-Assignで異なる月のページが開かれています | 月が一致していない | 同じ月のページを開く |

---

## トラブルシューティング

### Q1: 拡張機能が読み込めない

#### 症状
「パッケージ化されていない拡張機能を読み込む」でエラーが出る

#### 確認項目
1. `manifest.json` ファイルが存在するか
2. 選択したフォルダが正しいか（`CoAssignUtils` フォルダ自体を選択）
3. JSON構文エラーがないか（config.jsを編集した場合）

#### 解決方法
```bash
# フォルダ構成の確認
CoAssignUtils/
├── manifest.json        ← このファイルがあるフォルダを選択
├── config.js
├── background.js
└── ...
```

### Q2: ボタンが表示されない

#### 症状
Co-Assignページで「HRMOSから勤務時間取得」ボタンが表示されない

#### 確認項目
1. URLが `https://*.co-assign.com/worksheet/*` のパターンに一致しているか
2. ページが完全に読み込まれているか
3. 拡張機能が有効になっているか

#### 解決方法
1. ページを再読み込み（F5）
2. chrome://extensions/ で拡張機能が有効か確認
3. 拡張機能を一度無効化→有効化してみる

### Q3: データが取得できない

#### 症状
「HRMOSからのレスポンスがありません」と表示される

#### デバッグ手順
1. HRMOSページで開発者ツール（F12）を開く
2. Consoleタブで以下を実行:
```javascript
// 年月が取得できるか確認
document.querySelector('#select')?.value

// テーブルが検出できるか確認
document.querySelectorAll('table').length

// 勤務データがあるか確認
document.querySelectorAll('tr').length
```

3. ログを確認:
```javascript
// [CA-Utils] で始まるログを探す
// エラーメッセージをメモする
```

4. GitHubのIssuesに報告（ログとスクリーンショット付き）

### Q4: 休憩時間が正しく入力されない

#### 症状
警告「HRMOS上の休憩時間が1時間ではありません」が表示される

#### 理由
現在の実装では休憩時間1時間のみ自動対応

#### 対処法
1. Co-Assignで休憩時間欄の「+」ボタンを押す
2. 手動で休憩時間を調整
3. 労働時間が正しく計算されることを確認

### Q5: 更新通知が消えない

#### 症状
ポップアップに「新しいバージョンが利用可能です」と表示され続ける

#### 解決方法
1. 表示されているバージョンをダウンロード
2. 古いバージョンの拡張機能を削除
3. 新しいバージョンをインストール

または、通知を無視して使用を継続することも可能です。

---

## 高度な設定（オプション）

### リモートスクリプト機能

GitHub PagesからスクリプトをロードしてCDNのように使用できます。

#### 設定例
```javascript
// config.js
REMOTE_SCRIPT_URL: 'https://hayato0802.github.io/CA_Utils/scripts/content-script-coassign.js',
REMOTE_VERSION_URL: 'https://hayato0802.github.io/CA_Utils/version.json',
CACHE_ENABLED: true,
CACHE_DURATION: 3600000,  // 1時間
```

#### メリット
- 拡張機能を再インストールせずに機能を更新できる
- 複数のPCで同じバージョンを使用できる

#### デメリット
- ネットワーク接続が必要
- 初回読み込みが少し遅くなる

### デバッグモード

開発者向けの詳細なログを有効化できます。

#### 有効化方法
`manifest.json` から `update_url` を削除（または存在しない場合）、自動的にデバッグモードになります。

#### 確認方法
```javascript
// Consoleで実行
isDevelopment() // true ならデバッグモード
```

---

## サポート

### ヘルプが必要な場合

1. **README.mdを確認**: 基本的な使い方が記載されています
2. **このSETUP.mdを確認**: 詳細な設定方法が記載されています
3. **GitHubのIssuesを検索**: 同じ問題がすでに報告されているかもしれません
4. **新しいIssueを作成**: https://github.com/Hayato0802/CA_Utils/issues

### Issue作成時に含める情報

```
## 環境
- OS: Windows 10 / macOS など
- Chrome バージョン:
- 拡張機能バージョン:

## 症状
（何が起きているか詳しく記述）

## 再現手順
1.
2.
3.

## エラーメッセージ
（コンソールログをコピー&ペースト）

## スクリーンショット
（可能であれば添付）
```

---

## 次のステップ

設定が完了したら、[README.md](README.md) の「使い方」セクションを参照して、実際に機能を使ってみてください。
