# Co-Assign Utils プロジェクト固有ルール

## コミット時のルール

### 重要: コミットはユーザー確認後のみ
コミットは自動で行わない。改修完了後は必ず**ユーザーにコミットを行うか質問**すること。

```
例: 「修正が完了しました。コミットしますか？」
```

### 必須: README.mdの更新
バージョンアップを伴うコミットを行う場合、必ず `README.md` の更新履歴セクションも更新すること。

```markdown
## 更新履歴

### vX.X.X (最新)
- 変更内容1
- 変更内容2
```

### コミットの流れ
1. コード修正
2. `manifest.json` のバージョン番号を更新
3. `README.md` の更新履歴を追加
4. コミット

## 命名規則

### DOM要素ID
キャメルケースで `caUtils` プレフィックスを使用:
- `caUtilsErrorRow`
- `caUtilsCalendarButton`
- `caUtilsHrmosButton`

### 変数・関数名
キャメルケースを使用

## ファイル構成
- `utils.js` - 共通関数（findSideMenuContainer など）
- `content-script-coassign.js` - メインのコンテンツスクリプト
- `background.js` - バックグラウンド処理
- `popup.js` - ポップアップUI

## 配布用ZIPの作成

ユーザーから「zip化」等の指示があった場合、以下のPowerShellコマンドをプロジェクトフォルダで実行する。

```powershell
$desktop = [Environment]::GetFolderPath("Desktop")
$zipPath = Join-Path $desktop "CoAssignUtils.zip"
Compress-Archive -Path manifest.json,config.js,config.sample.js,background.js,popup.html,popup.js,utils.js,content-script-coassign.js,content-script-hrmos.js,images,README.md -DestinationPath $zipPath -Force
Write-Host "作成完了: $zipPath"
```

### 含まれるファイル
- `manifest.json`, `config.js`, `config.sample.js`, `*.js`, `popup.html`, `images/`, `README.md`

### 除外されるファイル
- `.git/`, `.claude/`, その他の隠しファイル・フォルダ
