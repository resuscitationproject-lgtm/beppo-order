var SHEETS_ = {
  BUSINESS: "営業日管理", ORDERS: "注文履歴", MENU: "メニュー管理", TOPPINGS: "トッピング管理",
  EXTRAS: "追加商品管理", SLOTS: "受取時間管理", SETTINGS: "店舗設定", SESSIONS: "管理セッション", LOGS: "システムログ"
};

function spreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw apiException_("初期設定が完了していません", "NOT_CONFIGURED");
  return SpreadsheetApp.openById(id);
}
function sheet_(name) { var sheet = spreadsheet_().getSheetByName(name); if (!sheet) throw apiException_("初期設定が完了していません", "NOT_CONFIGURED"); return sheet; }
function rowsAsObjects_(name) {
  var values = sheet_(name).getDataRange().getValues(); if (values.length < 2) return [];
  var headers = values[0].map(String); return values.slice(1).filter(function(row){ return row.some(function(v){return v !== "";}); }).map(function(row){ var object={}; headers.forEach(function(h,i){object[h]=row[i];}); return object; });
}
function settings_() {
  var result={}; rowsAsObjects_(SHEETS_.SETTINGS).forEach(function(row){ result[String(row["設定キー"])]=row["設定値"]; });
  var secretKeys=["CHAT_WEBHOOK_URL","NOTIFICATION_EMAIL","ADMIN_PIN_HASH"]; secretKeys.forEach(function(k){var secret=PropertiesService.getScriptProperties().getProperty(k);if(secret)result[k]=secret;}); return result;
}
function settingNumber_(key, fallback) { var value=Number(settings_()[key]); return isFinite(value)?value:fallback; }
function todayKey_() { return Utilities.formatDate(new Date(), settings_().TIMEZONE || "Asia/Tokyo", "yyyy-MM-dd"); }
function dateValueKey_(value) { if (value instanceof Date) return Utilities.formatDate(value, settings_().TIMEZONE || "Asia/Tokyo", "yyyy-MM-dd"); return String(value).slice(0,10); }
function findTodayBusinessRow_() {
  var sheet=sheet_(SHEETS_.BUSINESS), values=sheet.getDataRange().getValues(), today=todayKey_();
  for(var i=1;i<values.length;i++) if(dateValueKey_(values[i][0])===today) return {sheet:sheet,row:i+1,values:values[i]};
  var defaults=[today,"準備中",settingNumber_("DEFAULT_STOCK",15),0,0,0,settingNumber_("DEFAULT_STOCK",15),"10:30","13:15","本日も丁寧にお作りします。","Sri Lankan Rice & Curry","野菜、ココナッツ、スパイスを生かした本日の一皿。","ジャスミンライス,パリップ,キリホディ",true,"","",new Date()]; sheet.appendRow(defaults); seedSlotsForDate_(today); return {sheet:sheet,row:sheet.getLastRow(),values:defaults};
}
function businessObject_(record) { var v=record.values; return { businessStatus:String(v[1]),planned:Number(v[2]),mobileOrders:Number(v[3]),counterSales:Number(v[4]),reservations:Number(v[5]),remaining:Math.max(0,Number(v[2])-Number(v[3])-Number(v[4])-Number(v[5])),ownerComment:String(v[9]||""),menuName:String(v[10]||""),menuDescription:String(v[11]||""),sides:String(v[12]||"").split(/[,、\n]/).map(function(x){return x.trim();}).filter(String),veganAvailable:toBoolean_(v[13]),spiceAdjustable:true,updatedAt:v[16]}; }
function recalculateBusinessRow_(record) { var v=record.values, remaining=Math.max(0,Number(v[2])-Number(v[3])-Number(v[4])-Number(v[5])); record.sheet.getRange(record.row,7).setValue(remaining);record.sheet.getRange(record.row,17).setValue(new Date());record.values[6]=remaining;return remaining; }
function publicSettings_() { var s=settings_(); return {storeName:s.STORE_NAME||"Beppo",subtitle:s.STORE_SUBTITLE||"スリランカカレーとうつわのお店",phone:s.STORE_PHONE||"",address:s.STORE_ADDRESS||"",businessHours:s.BUSINESS_HOURS||"",closedDay:s.CLOSED_DAY||"不定休",instagramUrl:s.INSTAGRAM_URL||"https://www.instagram.com/beppo_kitakyu",mapUrl:s.MAP_URL||"",maxOrderQuantity:Number(s.MAX_ORDER_QUANTITY||3)}; }
function getPublicStatus_() { var record=findTodayBusinessRow_();recalculateBusinessRow_(record);return {status:businessObject_(record),settings:publicSettings_()}; }
function toBoolean_(value) { return value===true || String(value).toLowerCase()==="true" || String(value)==="1" || String(value)==="可"; }
function getPublicMenu_() {
  var status=getPublicStatus_();
  var menus=rowsAsObjects_(SHEETS_.MENU).map(function(r){return{id:String(r["商品ID"]),name:String(r["商品名"]),description:String(r["商品説明"]||""),price:Number(r["価格"]),available:toBoolean_(r["販売中"]),veganAvailable:toBoolean_(r["ビーガン対応可"]),imageUrl:String(r["画像URL"]||"")};});
  var toppings=rowsAsObjects_(SHEETS_.TOPPINGS).map(function(r){var limited=toBoolean_(r["在庫制限"]);return{id:String(r["トッピングID"]),name:String(r["トッピング名"]),price:Number(r["価格"]),available:toBoolean_(r["販売中"])&&(!limited||Number(r["残数"])>0)};});
  var extras=rowsAsObjects_(SHEETS_.EXTRAS).map(function(r){return{id:String(r["商品ID"]),category:String(r["区分"]),name:String(r["商品名"]),description:String(r["商品説明"]||""),singlePrice:Number(r["単品価格"]),setPrice:Number(r["セット価格"]),temperature:String(r["温冷区分"]||""),available:toBoolean_(r["販売中"]),imageUrl:String(r["画像URL"]||"")};});
  return {menus:menus,toppings:toppings,extras:extras,status:status.status,settings:status.settings};
}
function getPublicPickupSlots_() { var today=todayKey_();var slots=rowsAsObjects_(SHEETS_.SLOTS).filter(function(r){return dateValueKey_(r["営業日"])===today;}).map(function(r){var limit=Number(r["上限件数"]),current=Number(r["現在件数"]);return{time:String(r["時間枠"]),limit:limit,current:current,available:String(r["受付状態"])!=="停止"&&current<limit};});return{slots:slots}; }
function updateRowByKey_(sheetName,keyHeader,keyValue,updates) { var sheet=sheet_(sheetName),values=sheet.getDataRange().getValues(),headers=values[0].map(String),keyIndex=headers.indexOf(keyHeader);for(var i=1;i<values.length;i++){if(String(values[i][keyIndex])===String(keyValue)){Object.keys(updates).forEach(function(header){var col=headers.indexOf(header);if(col>=0)sheet.getRange(i+1,col+1).setValue(updates[header]);});return true;}}return false; }
