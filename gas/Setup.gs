/** Creates every sheet, header and initial demo row required by Beppo. Run once. */
function setupSpreadsheet() {
  var ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss)ss=SpreadsheetApp.create("Beppo 注文管理");PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID",ss.getId());
  var schemas={};
  schemas[SHEETS_.BUSINESS]=["営業日","営業状態","提供予定数","モバイル注文数","店頭販売数","取り置き数","残り食数","受付開始時間","受付終了時間","店主コメント","本日のメニュー名","本日のメニュー説明","本日の副菜","ビーガン対応可否","メイン画像URL","備考","更新日時"];
  schemas[SHEETS_.ORDERS]=["注文日時","注文番号","営業日","clientRequestId","氏名","電話番号","商品ID","商品名","数量","辛さ","ビーガン対応","トッピング","デザート","ドリンク","受取時間","商品金額","追加金額","合計金額","注文ステータス","流入元","備考","アレルギー情報","個人情報同意","更新日時"];
  schemas[SHEETS_.MENU]=["商品ID","商品名","商品説明","価格","販売中","ビーガン対応可","画像URL","表示順"];
  schemas[SHEETS_.TOPPINGS]=["トッピングID","トッピング名","価格","販売中","在庫制限","残数","表示順"];
  schemas[SHEETS_.EXTRAS]=["商品ID","区分","商品名","商品説明","単品価格","セット価格","温冷区分","販売中","画像URL","表示順"];
  schemas[SHEETS_.SLOTS]=["営業日","時間枠","上限件数","現在件数","受付状態"];
  schemas[SHEETS_.SETTINGS]=["設定キー","設定値","説明"];
  schemas[SHEETS_.SESSIONS]=["セッショントークンハッシュ","発行日時","有効期限","最終利用日時","無効化日時"];
  schemas[SHEETS_.LOGS]=["日時","レベル","処理","エラーコード","メッセージ","注文番号","個人情報を含まない補足情報"];
  Object.keys(schemas).forEach(function(name){createOrResetHeader_(ss,name,schemas[name]);});
  seedIfEmpty_(SHEETS_.MENU,[
    ["curry","Sri Lankan Rice & Curry","本日のカレーと副菜を古いうつわで。",1200,true,true,"",1],
    ["rice-half","ごはんだけハーフ","ごはんを少なめに。",1100,true,true,"",2],
    ["half","ハーフサイズ","軽めのお食事に。",800,true,true,"",3]
  ]);
  seedIfEmpty_(SHEETS_.TOPPINGS,[
    ["tandoori","タンドリーチキン",300,true,false,"",1],["chicken-curry","チキンカリー",450,true,false,"",2],["egg","ゆで玉子",150,true,true,10,3],["omelette","オムレツ",250,true,true,10,4],["cheese-omelette","チーズオムレツ",350,true,true,8,5],["large-rice","ごはん大盛り",100,true,false,"",6],["refill","おかわり",100,true,false,"",7]
  ]);
  seedIfEmpty_(SHEETS_.EXTRAS,[
    ["watalappan","dessert","ワタラッパン","スリランカのココナッツプリン",450,350,"冷",true,"",1],["kiripani","dessert","豆乳キリパニ","",400,300,"冷",true,"",2],["vanilla","dessert","バニラアイス","",400,300,"冷",true,"",3],["watalappan-ice","dessert","ワタラッパン＆アイス","",600,500,"冷",true,"",4],
    ["coffee","drink","コーヒー","",550,450,"温冷",true,"",10],["ceylon-tea","drink","セイロンティー","",400,300,"温冷",true,"",11],["samahan","drink","サマハン","",350,250,"温",true,"",12],["soy-milk","drink","ふわふわホットソイミルク","",500,400,"温",true,"",13],["plum","drink","自家製梅ジュース","",500,400,"冷",true,"",14],["ginger","drink","自家製ジンジャーエール","",550,450,"冷",true,"",15],["chai","drink","豆乳マサラチャイ","",550,450,"温",true,"",16],["lassi","drink","豆乳黒糖ラッシー","",550,450,"冷",true,"",17],["float","drink","コーヒーフロート","",700,600,"冷",true,"",18]
  ]);
  seedSettings_();findTodayBusinessRow_();formatSheets_();return ss.getUrl();
}
function createOrResetHeader_(ss,name,headers){var sheet=ss.getSheetByName(name)||ss.insertSheet(name);if(sheet.getLastRow()===0)sheet.getRange(1,1,1,headers.length).setValues([headers]);else{var current=sheet.getRange(1,1,1,headers.length).getValues()[0];if(current.join("|")!==headers.join("|"))sheet.getRange(1,1,1,headers.length).setValues([headers]);}sheet.setFrozenRows(1);}
function seedIfEmpty_(name,rows){var sheet=sheet_(name);if(sheet.getLastRow()<=1&&rows.length)sheet.getRange(2,1,rows.length,rows[0].length).setValues(rows);}
function seedSettings_(){var rows=[
  ["STORE_NAME","Beppo","店舗名"],["STORE_SUBTITLE","スリランカカレーとうつわのお店","店舗副題"],["STORE_PHONE","093-000-0000","公開前に変更"],["STORE_ADDRESS","福岡県北九州市小倉北区（公開前に変更）","公開前に変更"],["BUSINESS_HOURS","11:30–14:00","営業時間"],["CLOSED_DAY","不定休","店休日"],["INSTAGRAM_URL","https://www.instagram.com/beppo_kitakyu","Instagram"],["MAP_URL","https://maps.google.com/?q=北九州市小倉北区","GoogleマップURL"],
  ["CHAT_WEBHOOK_URL","","秘密値はScript Properties推奨"],["NOTIFICATION_EMAIL","","通知先"],["ADMIN_PIN_HASH","","秘密値はScript Propertiesへ設定"],["ADMIN_SESSION_HOURS",8,"管理セッション時間"],["DEFAULT_STOCK",15,"初期提供予定数"],["LOW_STOCK_THRESHOLD",3,"残りわずか基準"],["MAX_ORDER_QUANTITY",3,"1注文の最大食数"],["ORDER_COOLDOWN_MINUTES",2,"同一電話番号の連続注文制限"],["TIMEZONE","Asia/Tokyo","タイムゾーン"],["HERO_IMAGE_URL","","ヒーロー画像"],["SHOP_IMAGE_URL","","店舗画像"]
  ];seedIfEmpty_(SHEETS_.SETTINGS,rows);}
function seedSlotsForDate_(date){var sheet=sheet_(SHEETS_.SLOTS),existing=rowsAsObjects_(SHEETS_.SLOTS).some(function(r){return dateValueKey_(r["営業日"])===date;});if(existing)return;var defs=[["11:30",2],["11:45",2],["12:00",3],["12:15",3],["12:30",3],["12:45",2],["13:00",2],["13:15",2]];sheet.getRange(sheet.getLastRow()+1,1,defs.length,5).setValues(defs.map(function(x){return[date,x[0],x[1],0,"受付中"];}));}
function formatSheets_(){var ss=spreadsheet_();Object.keys(SHEETS_).forEach(function(key){var sheet=ss.getSheetByName(SHEETS_[key]);if(!sheet)return;var lastCol=sheet.getLastColumn();sheet.getRange(1,1,1,lastCol).setBackground("#24231f").setFontColor("#f5f0e5").setFontWeight("bold");sheet.autoResizeColumns(1,lastCol);sheet.getDataRange().setVerticalAlignment("middle");});}

/** Run once after setupSpreadsheet to store a secure PIN hash. */
function setAdminPin(pin){if(!/^\d{4,10}$/.test(String(pin)))throw new Error("PINは4〜10桁の数字にしてください");PropertiesService.getScriptProperties().setProperty("ADMIN_PIN_HASH",generateAdminPinHash(pin));}

/** Optional helper that installs both the privacy trigger and tomorrow's business row. */
function installDailyMaintenance(){installPrivacyTrigger();ScriptApp.newTrigger("prepareNextBusinessDay").timeBased().everyDays(1).atHour(4).create();}
function prepareNextBusinessDay(){var timezone=settings_().TIMEZONE||"Asia/Tokyo",tomorrow=new Date(Date.now()+24*60*60*1000),date=Utilities.formatDate(tomorrow,timezone,"yyyy-MM-dd"),exists=rowsAsObjects_(SHEETS_.BUSINESS).some(function(r){return dateValueKey_(r["営業日"])===date;});if(!exists){var stock=settingNumber_("DEFAULT_STOCK",15);sheet_(SHEETS_.BUSINESS).appendRow([date,"準備中",stock,0,0,0,stock,"10:30","13:15","本日も丁寧にお作りします。","Sri Lankan Rice & Curry","野菜、ココナッツ、スパイスを生かした本日の一皿。","ジャスミンライス,パリップ,キリホディ",true,"","",new Date()]);seedSlotsForDate_(date);}}
