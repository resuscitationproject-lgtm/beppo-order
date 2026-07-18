function logSystem_(level, operation, code, message, orderNumber, details) {
  try { sheet_(SHEETS_.LOGS).appendRow([new Date(),level,operation,code,String(message||"").slice(0,300),orderNumber||"",JSON.stringify(details||{}).slice(0,500)]); }
  catch (_) { /* Logging must never expose or interrupt customer data handling. */ }
}
