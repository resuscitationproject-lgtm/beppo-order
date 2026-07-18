# GitHubへ手動でアップロードする手順

コマンド操作を使わずに `beppo-order` の内容をGitHub Pagesへ公開する手順です。管理PIN、PINハッシュ、Webhookなどの秘密情報はGitHubへ保存しないでください。

## 1. 公開前の準備

1. 画面確認だけなら `js/config.js` の `demoMode: true` を保ちます。
2. 本番ではGAS Webアプリの `/exec` URLを `apiUrl` に設定し、`demoMode: false` にします。
3. 使用許諾済みの写真を `assets/images/` に置き、`js/config.js` の画像パスを変更します。
4. 仮の住所、電話、営業時間、地図URLはスプレッドシートの「店舗設定」で変更します。

## 2. リポジトリ作成とアップロード

1. GitHub右上の `+` → `New repository` で新規リポジトリを作成します。
2. リポジトリ画面で `Add file` → `Upload files` を選びます。
3. Windowsで `beppo-order` を開き、その中のファイルとフォルダをすべてドラッグします。
4. `css`、`js`、`assets`、`gas`、`docs` の階層が保たれていることを確認します。
5. `Commit changes` を押します。

公開する `index.html` はリポジトリ直下に置きます。`beppo-order/beppo-order/index.html` のような二重フォルダにしないでください。

## 3. GitHub Pages設定

1. `Settings` → `Pages` を開きます。
2. Sourceで `Deploy from a branch` を選びます。
3. Branchに `main`、フォルダに `/ (root)` を選び、`Save` を押します。
4. 数分後に表示される公開URLで `index.html` と `admin.html` を確認します。

## 4. QRコード

設置場所ごとに公開URLへ `src` を付けます。

- 店内：`https://ユーザー名.github.io/リポジトリ名/?src=shop`
- 市役所：`...?src=cityhall`
- 区役所：`...?src=wardoffice`
- イベント：`...?src=event`
- チラシ：`...?src=flyer`

印刷前に実機で読み取り、正しいページから注文確認画面まで進めることを確認してください。

## 5. 更新と再アップロード

1. 変更したファイルを同じパスへアップロードして `Commit changes` を押します。
2. `js/config.js` の変更時も同名ファイルを上書きします。
3. HTML、CSS、JavaScriptを更新したら、`service-worker.js` の `CACHE_VERSION` を `beppo-shell-v3` のように変更します。
4. 公開後にSafariを再読み込みします。ホーム画面版が古い場合は終了して再起動し、必要ならホーム画面から削除して再追加します。

写真だけの差し替えでもキャッシュが残ることがあります。確実に切り替える場合は写真のファイル名と `js/config.js` のパスを一緒に変更します。

## 6. 公開後チェック

- 営業状態、残り食数、メニューを表示できる
- 注文入力、確認、完了まで進める
- 本番注文がスプレッドシートへ1件だけ登録される
- iPad管理画面で注文、店頭販売、Undo、状態変更を操作できる
- 売り切れ、休業、満枠、オフライン時に注文できない
- iPhone / iPad Safariでホーム画面へ追加できる

問題がある場合は、`js/config.js` の `apiUrl` と `demoMode`、GASの最新デプロイ、Pagesの公開元が `main` / `/ (root)` であることを確認してください。
