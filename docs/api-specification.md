# GAS API仕様

すべて `{ success, data, message, code? }` のJSONを返します。HTTPステータスだけで判定しません。

## GET

- `action=getStatus`：営業状態、残食数、公開店舗設定
- `action=getMenu`：基本メニュー、トッピング、追加商品、本日の状態
- `action=getPickupSlots`：本日の受取枠
- `action=getOrder`：注文番号または推測困難な `clientRequestId` による送信結果確認

GETの追加値は `payload` にJSON文字列をURLエンコードして渡します。

## POST

`Content-Type: text/plain;charset=utf-8` のJSON本文で `action` と各値を送ります。

- `createOrder`
- `adminLogin` / `adminLogout`
- `getAdminDashboard`
- `updateBusinessStatus`
- `updateDailyMenu`
- `updateStock`
- `registerCounterSale` / `undoCounterSale`
- `updateReservationCount`
- `updatePickupSlot`
- `updateOrderStatus`

管理APIはログインで発行された `token` が毎回必要です。

主なエラーコード：`INVALID_*`, `STOCK_SHORTAGE`, `SLOT_FULL`, `ITEM_UNAVAILABLE`, `ORDER_COOLDOWN`, `RATE_LIMITED`, `AUTH_REQUIRED`, `AUTH_FAILED`, `SESSION_EXPIRED`, `BUSY`, `NOT_CONFIGURED`, `INTERNAL_ERROR`。
