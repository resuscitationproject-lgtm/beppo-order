(function () {
  "use strict";
  const allowedSources = new Set(["shop", "cityhall", "wardoffice", "instagram", "event", "flyer", "direct"]);
  function normalizePhone(value) { const digits = String(value || "").replace(/\D/g, ""); return digits.startsWith("81") ? "0" + digits.slice(2) : digits; }
  function isPhone(value) { return /^0\d{9,10}$/.test(normalizePhone(value)); }
  function source(value) { const normalized = String(value || "direct").toLowerCase(); return allowedSources.has(normalized) ? normalized : "other"; }
  function text(value, max) { return String(value || "").trim().replace(/[<>]/g, "").slice(0, max || 500); }
  function order(order) {
    const errors = {};
    if (!text(order.customerName, 60)) errors.customerName = "お名前を入力してください";
    if (!isPhone(order.phone)) errors.phone = "電話番号を正しく入力してください";
    if (!order.pickupTime) errors.pickupTime = "受取時間を選んでください";
    if (!order.privacyConsent) errors.privacyConsent = "個人情報の利用目的をご確認ください";
    if (!(Number(order.quantity) >= 1)) errors.quantity = "数量を選んでください";
    return errors;
  }
  window.BeppoValidation = { normalizePhone, isPhone, source, text, order };
})();
