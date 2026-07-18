/** Beppo Web API entry points. Deploy as "execute as me / anyone". */
function doGet(e) {
  try { return jsonOutput_(routeGet_(e && e.parameter ? e.parameter : {})); }
  catch (error) { return jsonOutput_(handleApiError_(error, "doGet")); }
}

function doPost(e) {
  try {
    var body = parseRequestBody_(e);
    return jsonOutput_(routePost_(body));
  } catch (error) { return jsonOutput_(handleApiError_(error, "doPost")); }
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function parseRequestBody_(e) {
  var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
  if (raw.length > 100000) throw apiException_("リクエストが大きすぎます", "PAYLOAD_TOO_LARGE");
  try { return JSON.parse(raw); }
  catch (_) { throw apiException_("送信内容を確認してください", "INVALID_JSON"); }
}
