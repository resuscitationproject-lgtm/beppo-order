function maskExpiredPersonalData() {
  var sheet=sheet_(SHEETS_.ORDERS),values=sheet.getDataRange().getValues(),headers=values[0].map(String),dateCol=headers.indexOf("注文日時"),nameCol=headers.indexOf("氏名"),phoneCol=headers.indexOf("電話番号"),cutoff=Date.now()-90*24*60*60*1000,changed=0;
  for(var i=1;i<values.length;i++){var stamp=new Date(values[i][dateCol]).getTime();if(stamp&&stamp<cutoff&&String(values[i][nameCol])!=="削除済み"){sheet.getRange(i+1,nameCol+1).setValue("削除済み");sheet.getRange(i+1,phoneCol+1).setValue(maskExpiredPhone_(values[i][phoneCol]));changed++;}}
  logSystem_("INFO","maskExpiredPersonalData","",changed+"件を匿名化","",{count:changed});return changed;
}
function maskExpiredPhone_(phone){var p=normalizePhone_(phone);return p.length>=7?p.slice(0,3)+"****"+p.slice(-4):"********";}
function installPrivacyTrigger(){ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==="maskExpiredPersonalData";}).forEach(ScriptApp.deleteTrigger);ScriptApp.newTrigger("maskExpiredPersonalData").timeBased().everyDays(1).atHour(3).create();}
