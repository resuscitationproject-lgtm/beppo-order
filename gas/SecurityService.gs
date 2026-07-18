function hashText_(value) {
  var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8);
  return bytes.map(function(b){var v=b<0?b+256:b;return ("0"+v.toString(16)).slice(-2);}).join("");
}
function generateAdminPinHash(pin) { return hashText_(String(pin)); }
function secureEquals_(a,b) { a=String(a||"");b=String(b||"");if(a.length!==b.length)return false;var mismatch=0;for(var i=0;i<a.length;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);return mismatch===0; }
function enforceRateLimit_(key, limit, seconds) {
  var cache=CacheService.getScriptCache(), cacheKey="rate_"+hashText_(key).slice(0,24), count=Number(cache.get(cacheKey)||0)+1;
  if(count>limit)throw apiException_("短時間に操作が集中しています。しばらくお待ちください", "RATE_LIMITED");cache.put(cacheKey,String(count),seconds);
}
function adminLogin_(pin) {
  enforceRateLimit_("adminLogin",10,300);var expected=PropertiesService.getScriptProperties().getProperty("ADMIN_PIN_HASH")||settings_().ADMIN_PIN_HASH;
  if(!expected)throw apiException_("管理PINが未設定です", "NOT_CONFIGURED");
  if(!secureEquals_(hashText_(String(pin||"")),expected)){Utilities.sleep(350);throw apiException_("PINが正しくありません", "AUTH_FAILED");}
  var token=Utilities.getUuid()+Utilities.getUuid(),now=new Date(),hours=settingNumber_("ADMIN_SESSION_HOURS",8),expires=new Date(now.getTime()+hours*3600000);
  sheet_(SHEETS_.SESSIONS).appendRow([hashText_(token),now,expires,now,""]);return{token:token,expiresAt:expires.toISOString()};
}
function validateAdminSession_(token) {
  if(!token)throw apiException_("認証が必要です", "AUTH_REQUIRED");var hash=hashText_(token),sheet=sheet_(SHEETS_.SESSIONS),values=sheet.getDataRange().getValues(),now=new Date();
  for(var i=1;i<values.length;i++){if(secureEquals_(String(values[i][0]),hash)){if(values[i][4]||new Date(values[i][2]).getTime()<=now.getTime())throw apiException_("セッションの有効期限が切れました", "SESSION_EXPIRED");sheet.getRange(i+1,4).setValue(now);return{row:i+1,tokenHash:hash};}}
  throw apiException_("認証が必要です", "AUTH_REQUIRED");
}
function adminLogout_(token) { var hash=hashText_(token),sheet=sheet_(SHEETS_.SESSIONS),values=sheet.getDataRange().getValues();for(var i=1;i<values.length;i++)if(secureEquals_(String(values[i][0]),hash)){sheet.getRange(i+1,5).setValue(new Date());break;}return{}; }
