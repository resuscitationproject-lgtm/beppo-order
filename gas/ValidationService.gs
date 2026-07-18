function validateOrderInput_(body) {
  var quantity=Number(body.quantity), max=settingNumber_("MAX_ORDER_QUANTITY",3);
  if (!body.clientRequestId || !/^[a-zA-Z0-9-]{8,80}$/.test(String(body.clientRequestId))) throw apiException_("送信内容を確認してください", "INVALID_REQUEST_ID");
  if (!body.customerName || String(body.customerName).trim().length>60) throw apiException_("お名前を確認してください", "INVALID_NAME");
  body.phone=normalizePhone_(body.phone); if(!/^0\d{9,10}$/.test(body.phone)) throw apiException_("電話番号を確認してください", "INVALID_PHONE");
  if(!Number.isInteger(quantity)||quantity<1||quantity>max) throw apiException_("注文数を確認してください", "INVALID_QUANTITY");
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.pickupTime||""))) throw apiException_("受取時間を確認してください", "INVALID_PICKUP_TIME");
  if(body.privacyConsent!==true) throw apiException_("個人情報の利用目的をご確認ください", "PRIVACY_CONSENT_REQUIRED");
  body.customerName=sanitizeText_(body.customerName,60);body.notes=sanitizeText_(body.notes,500);body.allergies=sanitizeText_(body.allergies,500);body.quantity=quantity;body.source=normalizeSource_(body.source);return body;
}
function normalizePhone_(value) { var digits=String(value||"").replace(/\D/g,"");return digits.indexOf("81")===0?"0"+digits.slice(2):digits; }
function sanitizeText_(value,max) { return String(value||"").replace(/[<>]/g,"").trim().slice(0,max); }
function normalizeSource_(value) { var allowed=["shop","cityhall","wardoffice","instagram","event","flyer","direct"];value=String(value||"direct").toLowerCase();return allowed.indexOf(value)>=0?value:"other"; }
function validateEnum_(value,allowed,code) { if(allowed.indexOf(String(value))<0)throw apiException_("入力内容を確認してください",code||"INVALID_VALUE");return String(value); }
