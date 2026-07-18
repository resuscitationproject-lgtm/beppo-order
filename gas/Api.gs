var PUBLIC_GET_ACTIONS_ = ["getStatus", "getMenu", "getPickupSlots", "getOrder"];
var ADMIN_ACTIONS_ = ["adminLogout", "getAdminDashboard", "updateBusinessStatus", "updateDailyMenu", "updateStock", "registerCounterSale", "undoCounterSale", "updateReservationCount", "updatePickupSlot", "updateOrderStatus"];

function routeGet_(params) {
  var action = String(params.action || "getStatus");
  if (PUBLIC_GET_ACTIONS_.indexOf(action) < 0) throw apiException_("不正な操作です", "INVALID_ACTION");
  var payload = {};
  if (params.payload) { try { payload = JSON.parse(params.payload); } catch (_) {} }
  if (action === "getStatus") return success_(getPublicStatus_());
  if (action === "getMenu") return success_(getPublicMenu_());
  if (action === "getPickupSlots") return success_(getPublicPickupSlots_());
  if (action === "getOrder") return success_(getOrder_(payload));
  throw apiException_("不正な操作です", "INVALID_ACTION");
}

function routePost_(body) {
  var action = String(body.action || "");
  enforceRateLimit_(action || "unknown", 60, 60);
  if (action === "createOrder") return success_(createOrder_(body));
  if (action === "adminLogin") return success_(adminLogin_(body.pin));
  if (ADMIN_ACTIONS_.indexOf(action) >= 0) {
    var session = validateAdminSession_(body.token);
    if (action === "adminLogout") return success_(adminLogout_(body.token));
    if (action === "getAdminDashboard") return success_(getAdminDashboard_(session));
    if (action === "updateBusinessStatus") return success_(updateBusinessStatus_(body));
    if (action === "updateDailyMenu") return success_(updateDailyMenu_(body));
    if (action === "updateStock") return success_(updateStock_(body));
    if (action === "registerCounterSale") return success_(registerCounterSale_(body));
    if (action === "undoCounterSale") return success_(undoCounterSale_(body));
    if (action === "updateReservationCount") return success_(updateReservationCount_(body));
    if (action === "updatePickupSlot") return success_(updatePickupSlot_(body));
    if (action === "updateOrderStatus") return success_(updateOrderStatus_(body));
  }
  throw apiException_("不正な操作です", "INVALID_ACTION");
}

function success_(data, message) { return { success: true, data: data || {}, message: message || "" }; }
function failure_(message, code) { return { success: false, data: null, message: message || "処理を完了できませんでした", code: code || "INTERNAL_ERROR" }; }
function apiException_(message, code) { var error = new Error(message); error.apiCode = code; return error; }
function handleApiError_(error, operation) {
  var code = error && error.apiCode ? error.apiCode : "INTERNAL_ERROR";
  if (code === "INTERNAL_ERROR") logSystem_("ERROR", operation, code, error && error.message ? error.message : "Unknown error", "", {});
  var safeMessages = { INTERNAL_ERROR: "ただいま処理できません。時間をおいてもう一度お試しください。" };
  return failure_(safeMessages[code] || error.message, code);
}
