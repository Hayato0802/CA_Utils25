# Co-Assign Utils

Co-AssignとHRMOS（IEYASU）を連携させて、勤怠管理業務を効率化するChrome拡張機能です。

## 概要

この拡張機能は、HRMOS（IEYASU）で入力した勤務時間データを自動的にCo-Assignに転記し、工数入力作業を効率化します。

## 主な機能

### 1. HRMOSからCo-Assignへの勤務時間転記
- HRMOSページから勤務時間データを自動取得
- Co-Assignの稼働入力画面にワンクリックで転記
- 開始時刻、終了時刻、休憩時間を自動入力

### 2. 未入力工数のハイライト
- HRMOSに勤怠データがあるがCo-Assignで未入力の日を自動検出
- 該当する行をオレンジ色でハイライト表示
- 勤務時間と稼働時間の差分を赤枠で表示

### 3. 工数調整ボタン
- **過不足を調整**: 労働時間と稼働時間の差分を自動計算して入力
- **+/-ボタン**: 5分（左クリック）/60分（右クリック）単位で時間を調整

### 4. 勤務時間の差分表示
- Co-AssignとHRMOS間の勤務時間合計を比較
- 月次での差分をワンクリックで確認

### 5. Googleカレンダー表示（ベータ機能）
- Co-Assign画面上にGoogleカレンダーを表示
- ドラッグで位置を移動可能

### 6. 自動更新チェック
- GitHubリポジトリから新バージョンを自動検出
- ポップアップで更新通知を表示

## インストール方法

### 1. ファイルのダウンロード
```bash
# GitHubからクローン
git clone https://github.com/Hayato0802/CA_Utils.git
```

または、ZIPファイルをダウンロードして解凍します。

### 2. Chrome拡張機能として読み込み
1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. ダウンロードしたフォルダを選択

## 初期設定

### 必須設定

#### 1. config.jsの編集
プロジェクトルートの `config.js` ファイルを編集します：

```javascript
const CONFIG = {
    // Co-Assign URLパターン（通常は変更不要）
    TIMETRACKING_BASE_URL: 'https://blueship.co-assign.com/worksheet',

    // HRMOS URLパターン
    HR_SYSTEM_URL_PATTERN: 'https://p.ieyasu.co/works/*',

    // GitHub リポジトリ（自動更新用）
    GITHUB_REPO: 'Hayato0802/CA_Utils',

    // 時間調整の設定
    OFFSET_MINUTES: 5,        // +/-ボタンの増減時間（分）
    OFFSET_60_MINUTES: 60,    // 右クリック時の増減時間（分）
};
```

#### 2. Googleカレンダー機能を使用する場合
1. 拡張機能アイコンをクリック
2. 「カレンダー用アドレス」にGoogleアカウントのメールアドレスを入力
3. 「保存」をクリック

### オプション設定

#### リモートスクリプト機能（高度な設定）
`config.js` でリモートスクリプトのURLを設定できます：

```javascript
// リモートスクリプト設定
REMOTE_SCRIPT_URL: 'https://hayato0802.github.io/CA_Utils/scripts/content-script-coassign.js',
REMOTE_VERSION_URL: 'https://hayato0802.github.io/CA_Utils/version.json',

// キャッシュ設定
CACHE_ENABLED: true,           // キャッシュを有効化
CACHE_DURATION: 3600000,       // 1時間
FORCE_REFRESH: false,          // デバッグ時はtrue
FALLBACK_TO_LOCAL: true        // エラー時はローカル版を使用
```

## 使い方

### 基本的な使い方

1. **HRMOSで勤怠入力**
   - HRMOS（https://p.ieyasu.co）で通常通り勤怠を入力

2. **Co-Assignで工数入力**
   - Co-Assignの稼働入力画面を開く
   - 「HRMOSから勤務時間取得」ボタンをクリック
   - 開始時刻、終了時刻、休憩時間が自動入力される

3. **未入力工数の確認**
   - Co-Assignの月次画面を開く
   - オレンジ色でハイライトされた行が未入力箇所
   - 赤枠で囲まれたセルは勤務時間と稼働時間の不一致

### 各機能の使い方

#### 過不足調整ボタン（🕒）
- 稼働入力画面の各プロジェクト行に表示
- クリックすると、労働時間と現在の稼働時間の差分を自動計算して入力

#### +/-ボタン
- **左クリック**: 設定した時間（デフォルト5分）を増減
- **右クリック**: 60分を増減

#### 勤務時間の差分表示
- 左メニューの「勤務時間の差分を表示」ボタンをクリック
- Co-AssignとHRMOSの月次合計時間と差分を表示

#### Googleカレンダー表示
- 左メニューの「[Beta]Show Calendar」ボタンをクリック
- カレンダーをドラッグして位置を調整可能
- 再度クリックで非表示

## トラブルシューティング

### HRMOSからデータが取得できない

#### 症状
「HRMOSの日次勤怠ページが見つかりませんでした」と表示される

#### 解決方法
1. HRMOSのページ（https://p.ieyasu.co）が別タブで開いているか確認
2. HRMOSの勤怠ページ（日次・月次）が表示されているか確認
3. ブラウザのコンソール（F12 > Console）で `[CA-Utils]` のログを確認
4. `config.js` の `HR_SYSTEM_URL_PATTERN` が正しいか確認

### データが正しく転記されない

#### デバッグ方法
1. HRMOSページでF12を押して開発者ツールを開く
2. Consoleタブで以下を実行：
```javascript
// テーブル構造を確認
document.querySelectorAll('table').forEach((table, i) => {
  console.log(`テーブル${i+1}:`, table.querySelectorAll('tr').length, '行');
});
```
3. `[CA-Utils]` で始まるログメッセージを確認
4. エラーがあればGitHubのIssuesに報告

### 休憩時間が1時間ではない場合
- 警告が表示されます
- Co-Assign側で手動調整が必要です

## ファイル構成

```
CoAssignUtils/
├── manifest.json              # 拡張機能の設定ファイル
├── config.js                  # ユーザー設定ファイル
├── background.js              # バックグラウンド処理
├── popup.html                 # ポップアップUI
├── popup.js                   # ポップアップのロジック
├── utils.js                   # ユーティリティ関数
├── content-script-coassign.js # Co-Assignページ用スクリプト
├── content-script-hrmos.js    # HRMOSページ用スクリプト
├── images/                    # アイコン画像
│   ├── co_assign_utils_icon_16.png
│   ├── co_assign_utils_icon_48.png
│   └── co_assign_utils_icon_128.png
└── README.md                  # このファイル
```

## 開発者向け情報

### デバッグモード
`utils.js` に開発モード判定関数があります：
```javascript
const isDevelopment = () => {
  return !('update_url' in chrome.runtime.getManifest());
};
```

### ログ出力
開発モードでのみコンソールログが出力されます：
```javascript
log('[CA-Utils] デバッグメッセージ');
warn('[CA-Utils] 警告メッセージ');
error('[CA-Utils] エラーメッセージ');
```

### ビルド・デプロイ
1. コードを修正
2. `manifest.json` のバージョン番号を更新
3. Chromeで拡張機能を再読み込み（chrome://extensions/）

## 更新履歴

### v1.5.7 (最新)
- HRMOSデータ取得の安定性向上
- エラーハンドリングの改善
- デバッグログの追加

## ライセンス

このプロジェクトは個人利用を目的としています。

## サポート

バグ報告や機能要望は、GitHubのIssuesにお願いします：
https://github.com/Hayato0802/CA_Utils/issues

## 注意事項

- この拡張機能は非公式ツールです
- Co-AssignおよびHRMOSの仕様変更により動作しなくなる可能性があります
- 勤怠データの正確性は必ずご自身で確認してください
- 自己責任でご利用ください
