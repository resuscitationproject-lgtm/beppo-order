# Beppo mobile order

北九州市小倉北区の「Beppo スリランカカレーとうつわのお店」向けに作成した、1日15食ほどのカレーを来店前に取り置く小さなWebアプリです。顧客画面、iPad管理画面、PWA、Google Apps Script API、Googleスプレッドシート管理を含みます。

## 1. システム概要

- 顧客画面：GitHub Pages / HTML / CSS / Vanilla JavaScript
- 管理画面：`admin.html`（iPad Safariの横向きを優先、縦向き対応）
- API：Google Apps Script Webアプリ
- データ：Googleスプレッドシート
- 通知：管理画面ポーリング、Web Audio通知音、Google Chat、Gmail
- 決済：店舗支払いのみ

`js/config.js` の `demoMode` は初期状態で `true` です。APIなしでも全画面と注文フローを確認できます。デモ管理PINは `1234` です。本番ではデモPINは使われず、GASのScript Propertiesに保存したハッシュだけで認証します。

## 2. デザインコンセプト

チャコール、生成り、マスタード、オリーブを使い、黒板、木、古いうつわを感じる静かな見た目です。料理写真が中心になるよう余白と写真面積を確保し、ファストフード型の商品一覧にはしていません。外部フォントや有料サービスへの必須依存はありません。

## 3. 構成

```text
GitHub Pages ── fetch ── GAS Web API ── Googleスプレッドシート
      │                         ├── Google Chat
      └── PWA / Service Worker  └── Gmail
```

公開画面からスプレッドシートへ直接アクセスしません。営業状況、在庫、注文、管理APIはService Workerでキャッシュしません。

## 4. 主なファイル

- `index.html`：ランディングページと営業状況
- `order.html` → `confirm.html` → `complete.html`：注文フロー
- `admin.html`：iPad管理画面
- `privacy.html` / `offline.html`：個人情報案内とオフライン案内
- `gas/`：GASへ同名ファイルとして追加するサーバーコード
- `docs/`：API、シート、運用、テスト資料

## 5. Googleスプレッドシート作成

1. Googleドライブで空のスプレッドシートを作成します。
2. 「拡張機能」→「Apps Script」を開きます。
3. `gas/` 内の `.gs` ファイルを、同名のスクリプトファイルとしてすべて追加します。
4. Apps Scriptで `setupSpreadsheet` を選択して実行し、権限を許可します。
5. 9シート、見出し、初期メニュー、当日の営業行、受取枠が作成されたことを確認します。

既存行は削除しません。見出しが異なる場合のみ仕様の見出しへ揃えます。

## 6. Script Properties

Apps Scriptの「プロジェクトの設定」→「スクリプト プロパティ」で設定します。

| キー | 内容 | 必須 |
|---|---|---|
| `SPREADSHEET_ID` | `setupSpreadsheet` が自動設定 | 自動 |
| `ADMIN_PIN_HASH` | 管理PINのSHA-256ハッシュ | 必須 |
| `CHAT_WEBHOOK_URL` | Google Chat Incoming Webhook | 任意 |
| `NOTIFICATION_EMAIL` | 通知先メール | 任意 |

秘密情報は「店舗設定」シートへ入れず、Script Propertiesへ保存することを推奨します。

## 7. 管理PINの作成

Apps Scriptエディタで一時的に次の関数を実行します。

```javascript
function configurePinOnce() {
  setAdminPin("任意の4〜10桁の数字");
}
```

実行後、`configurePinOnce` は削除してください。平文PINをGitHubやフロント側へ置かないでください。

## 8. GAS Webアプリの公開

1. Apps Script右上の「デプロイ」→「新しいデプロイ」。
2. 種類は「ウェブアプリ」。
3. 実行するユーザーは「自分」。
4. アクセスできるユーザーは、注文客が利用できる公開範囲にします。
5. 発行された `/exec` URLを控えます。
6. `js/config.js` の `apiUrl` にURLを設定し、`demoMode` を `false` にします。

GASはレスポンス内の `success` と `code` で成否を判定します。POSTはプリフライトを避けやすい `text/plain` JSONで送信します。

## 9. GitHub Pages公開

1. `beppo-order` の内容をリポジトリ直下へ置きます。
2. GitHubの Settings → Pages で公開ブランチと `/ (root)` を選びます。
3. 公開URLで `index.html` と `admin.html` を確認します。
4. `js/config.js` 以外に秘密情報がないことを確認します。API URLは公開情報として扱います。

`file://` ではService Workerが動かないため、ローカル確認もHTTPサーバー経由で行ってください。

画面操作を含む詳しい手順、更新時のキャッシュ注意点、QRコード用URLの例は [`docs/github-manual-upload.md`](docs/github-manual-upload.md) にまとめています。

## 10. 店舗設定

「店舗設定」シートで店舗名、電話、住所、営業時間、店休日、Instagram、地図URL、在庫基準などを変更します。初期の電話・住所・営業時間は仮値です。本番公開前に必ず差し替えてください。

## 11. Google Chat / Gmail

- Google Chat：スペースのIncoming Webhook URLを `CHAT_WEBHOOK_URL` に設定します。
- Gmail：通知先を `NOTIFICATION_EMAIL` に設定します。

通知に失敗しても注文は成功し、「システムログ」に個人情報を含まないエラーだけを記録します。

## 12. 写真とPWAアイコン

店舗から利用許諾を得たWebP画像を `assets/images/` に配置し、`js/config.js` の `images` を実ファイルへ変更します。heroは1600px以下、商品写真は1200px以下、各300KB程度が目安です。Instagram画像の自動取得や転載はしません。

SVGアイコンはプレースホルダーです。本番では192px / 512pxのPNGを用意し、`manifest.json` と `apple-touch-icon` の参照を変更するとiOSで安定します。

## 13. iPhone / iPadのホーム画面追加

Safariで共有ボタンを押し、「ホーム画面に追加」→右上の「追加」を選びます。管理画面は名前を「Beppo管理」にします。standalone起動中は追加ボタンが自動で消えます。Androidは対応ブラウザのインストール確認を表示します。

## 14. iPad運用

横向きでは左35%に在庫・営業操作、右65%に受取予定・注文一覧を表示します。縦向きと分割表示では1カラムへ切り替わります。通知音はSafariの制約により、営業開始時に「通知音 OFF」を1回タップしてONにしてください。音が使えない場合も新規注文バナーとカード強調は動作します。

### 営業開始前

1. 管理画面へPINでログイン。
2. 提供予定数、取り置き数、本日の内容を更新。
3. 「営業開始」をタップ。
4. 通知音をONにし、同期状態が「オンライン」か確認。

### 店頭販売

「店頭販売 −1食」をタップします。誤操作時は5秒以内に「1食戻す」をタップします。

### 注文受取

注文カードを開き、「調理を開始する」→「受取待ちにする」→「受取完了」と更新します。

### 営業終了

残注文を確認して「営業終了」を選びます。売り切れ、休業、キャンセルにも確認画面が出ます。

## 15. 個人情報マスキング

`installPrivacyTrigger` を1回実行すると、毎日午前3時ごろに `maskExpiredPersonalData` が動きます。注文から90日を過ぎた氏名は「削除済み」、電話番号は `090****5678` 形式になります。トリガーはApps Scriptの「トリガー」画面でも確認してください。

## 16. 動作確認

1. `js/config.js` をデモモードにして顧客注文を完了。
2. 管理画面へデモPIN `1234` で入り、店頭販売、Undo、注文状態を確認。
3. 本番API設定後、1食だけテスト注文し、シート・在庫・受取枠・通知を確認。
4. iPhone Safari、Android、iPad横・縦、ホーム画面起動、オフラインを確認。

詳細は `docs/test-plan.md` を参照してください。

## 17. 本番公開前チェック

- 店舗名がすべて「Beppo」である
- 仮の住所、電話、営業時間、地図URLを変更した
- 実写真とPNGアイコンを用意した
- `demoMode: false` と正しいGAS URLを設定した
- PINハッシュと通知先をScript Propertiesへ設定した
- 1食時の同時注文、満枠、売り切れをテストした
- 個人情報マスキングトリガーを有効にした
- iPadを充電・自動ロック設定の運用方針に合わせた

## 18. トラブルシューティング

- 「初期設定が完了していません」：`setupSpreadsheet` を実行し、`SPREADSHEET_ID` を確認。
- 管理ログイン不可：`ADMIN_PIN_HASH` をScript Propertiesで確認し、必要なら `setAdminPin` を再実行。
- GitHub Pagesから通信不可：GASのデプロイ権限、`/exec` URL、最新デプロイを確認。
- 更新されない：GASのコード変更後はデプロイを新バージョンへ更新。
- PWAが古い：Safariを終了し再起動。必要ならホーム画面アイコンを削除して再追加。
- 通知音が鳴らない：画面上の通知音ボタンをユーザー操作でONにする。消音モード・音量も確認。

## 19. 安全上の注意

この構成は小規模店舗向けの簡易PIN認証です。管理URLの共有範囲を限定し、PINを定期的に変更してください。公開前に、店舗のプライバシーポリシーと保存期間が実際の運用・法令に合うか責任者が確認してください。
