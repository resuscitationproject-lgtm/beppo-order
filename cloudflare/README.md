# Beppo mobile order (Cloudflare)

Spreadsheet/GASを使わず、Cloudflare Workers + D1 + Static Assets + LINE Messaging APIで運用するBeppo向けモバイルオーダーの初期実装です。

## 開発構成

- `public/`: 顧客画面とadmin画面のHTML/JavaScript
- `src/worker.js`: API、D1操作、CSV、LINE通知
- `src/domain.js`: 注文金額・集計・CSVの純粋関数
- `migrations/0001_init.sql`: D1スキーマ
- `test/domain.test.js`: ローカル検証

## Cloudflare設定

1. D1データベースを作成し、`wrangler.jsonc` の `database_id` を設定。
2. `wrangler d1 migrations apply beppo-db --local` でローカルDBを初期化。
3. `LINE_CHANNEL_ACCESS_TOKEN` と `LINE_STORE_USER_ID` をSecretとして登録。
4. `wrangler dev` で起動。

admin APIは初期段階では `ADMIN_TOKEN` SecretとBearerトークンで保護します。公開前にCloudflare Accessまたは管理者認証へ置き換えます。

## 集計基準

受取完了の注文を売上として、受取日基準で日計・月曜始まりの週計を出力します。原価は注文時点のスナップショットを使うため、後日の原価変更で過去の粗利は変わりません。
