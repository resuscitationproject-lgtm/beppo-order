export function calculateOrderTotal(items) {
  return items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
}

export function calculateCostTotal(items) {
  return items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
}

export function calculateGrossProfit(items) {
  return calculateOrderTotal(items) - calculateCostTotal(items);
}

export function openingCashSummary(expected, denominations) {
  const actual = Object.entries(denominations).reduce((sum, [value, count]) => sum + Number(value) * Number(count), 0);
  return { expected: Number(expected), actual, variance: actual - Number(expected) };
}

export function aggregateCompletedOrders(rows) {
  return rows.reduce((result, row) => {
    const key = row.completedAt.slice(0, 10);
    const bucket = result[key] ||= { date: key, orders: 0, quantity: 0, sales: 0, cost: 0, grossProfit: 0 };
    bucket.orders += 1;
    bucket.quantity += Number(row.quantity);
    bucket.sales += Number(row.sales);
    bucket.cost += Number(row.cost);
    bucket.grossProfit += Number(row.sales) - Number(row.cost);
    return result;
  }, {});
}

export function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows, headers) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
