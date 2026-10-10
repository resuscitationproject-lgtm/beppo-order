import { calculateOrderTotal, toCsv } from './domain.js';

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());

function authorized(request, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) return false;
  return request.headers.get('authorization') === `Bearer ${expected}`;
}

async function notifyLine(env, order) {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN || !env.LINE_STORE_USER_ID) return { skipped: true };
  const retryKey = crypto.randomUUID();
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'content-type': 'application/json', 'x-line-retry-key': retryKey },
    body: JSON.stringify({ to: env.LINE_STORE_USER_ID, messages: [{ type: 'text', text: `新規注文 ${order.orderNumber}\n${order.customerName}様\n受取 ${order.pickupTime}\n合計 ¥${order.totalAmount.toLocaleString('ja-JP')}` }] })
  });
  if (!response.ok) throw new Error(`LINE notification failed: ${response.status}`);
  return { sent: true };
}

async function createOrder(request, env) {
  const body = await request.json();
  if (!body.clientRequestId || !Array.isArray(body.items) || !body.items.length || !body.customerName || !body.pickupTime) return json({ error: 'INVALID_ORDER' }, 400);
  const duplicate = await env.DB.prepare('SELECT order_number AS orderNumber, total_amount AS totalAmount FROM orders WHERE client_request_id = ?').bind(body.clientRequestId).first();
  if (duplicate) return json({ order: duplicate, duplicate: true });
  const businessDate = body.businessDate || today();
  const products = [];
  for (const item of body.items) {
    const product = await env.DB.prepare(`SELECT p.id, p.name, p.sale_price AS salePrice, COALESCE((SELECT cost_price FROM product_cost_history c WHERE c.product_id=p.id AND c.effective_from <= ? ORDER BY c.effective_from DESC LIMIT 1), 0) AS costPrice FROM products p WHERE p.id=? AND p.active=1`).bind(new Date().toISOString(), item.productId).first();
    if (!product) return json({ error: 'ITEM_UNAVAILABLE' }, 409);
    products.push({ ...product, quantity: Number(item.quantity) });
  }
  const quantity = products.reduce((sum, item) => sum + item.quantity, 0);
  const number = `B${businessDate.replaceAll('-', '').slice(2)}-${String(Date.now()).slice(-3)}`;
  const totalAmount = calculateOrderTotal(products);
  const existing = await env.DB.prepare('SELECT mobile_quantity, planned_quantity, reservation_quantity, counter_quantity FROM business_days WHERE business_date=?').bind(businessDate).first();
  if (!existing) return json({ error: 'BUSINESS_DAY_NOT_CONFIGURED' }, 409);
  if (existing.planned_quantity - existing.mobile_quantity - existing.reservation_quantity - existing.counter_quantity < quantity) return json({ error: 'STOCK_SHORTAGE' }, 409);
  const statements = [
    env.DB.prepare('INSERT INTO orders(order_number,client_request_id,business_date,pickup_time,customer_name,phone,total_amount,source,notes,allergies) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(number, body.clientRequestId, businessDate, body.pickupTime, body.customerName, body.phone || '', totalAmount, body.source || 'direct', body.notes || '', body.allergies || ''),
    env.DB.prepare('UPDATE business_days SET mobile_quantity=mobile_quantity+?,updated_at=CURRENT_TIMESTAMP WHERE business_date=? AND planned_quantity-mobile_quantity-reservation_quantity-counter_quantity>=?').bind(quantity, businessDate, quantity)
  ];
  const batch = await env.DB.batch(statements);
  if (!batch[1]?.meta?.changes) return json({ error: 'STOCK_SHORTAGE' }, 409);
  const order = { orderNumber: number, customerName: body.customerName, pickupTime: body.pickupTime, totalAmount };
  const inserted = await env.DB.prepare('SELECT id FROM orders WHERE order_number=?').bind(number).first();
  for (const item of products) await env.DB.prepare('INSERT INTO order_items(order_id,product_id,product_name_snapshot,quantity,sale_price,cost_price_snapshot,subtotal) VALUES(?,?,?,?,?,?,?)').bind(inserted.id, item.id, item.name, item.quantity, item.salePrice, item.costPrice, item.salePrice * item.quantity).run();
  try { await notifyLine(env, order); } catch (error) { console.error(error.message); }
  return json({ order });
}

async function admin(request, env, path) {
  if (!authorized(request, env)) return json({ error: 'UNAUTHORIZED' }, 401);
  if (path === '/api/admin/opening-cash' && request.method === 'POST') {
    const body = await request.json();
    const actual = Object.entries(body.denominations || {}).reduce((sum, [value, count]) => sum + Number(value) * Number(count), 0);
    const expected = Number(body.expectedAmount || 0);
    await env.DB.prepare(`INSERT INTO cash_sessions(business_date,expected_amount,actual_amount,variance,denomination_json,note,confirmed_by,confirmed_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(business_date) DO UPDATE SET expected_amount=excluded.expected_amount,actual_amount=excluded.actual_amount,variance=excluded.variance,denomination_json=excluded.denomination_json,note=excluded.note,confirmed_by=excluded.confirmed_by,confirmed_at=excluded.confirmed_at`).bind(body.businessDate || today(), expected, actual, actual - expected, JSON.stringify(body.denominations || {}), body.note || '', body.confirmedBy || 'admin').run();
    return json({ expected, actual, variance: actual - expected });
  }
  if (path === '/api/admin/products' && request.method === 'POST') {
    const body = await request.json();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO products(id,name,category,sale_price,active) VALUES(?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,sale_price=excluded.sale_price,updated_at=CURRENT_TIMESTAMP').bind(body.id, body.name, body.category, Number(body.salePrice)),
      env.DB.prepare('INSERT INTO product_cost_history(product_id,cost_price,effective_from,created_by) VALUES(?,?,?,?)').bind(body.id, Number(body.costPrice), body.effectiveFrom || new Date().toISOString(), body.createdBy || 'admin')
    ]);
    return json({ saved: true });
  }
  const statusMatch = path.match(/^\/api\/admin\/orders\/([^/]+)\/status$/);
  if (statusMatch && request.method === 'POST') {
    const body = await request.json();
    const allowed = new Set(['received', 'preparing', 'ready', 'completed', 'canceled']);
    if (!allowed.has(body.status)) return json({ error: 'INVALID_STATUS' }, 400);
    const completedAt = body.status === 'completed' ? new Date().toISOString() : null;
    const result = await env.DB.prepare('UPDATE orders SET status=?,completed_at=? WHERE order_number=?').bind(body.status, completedAt, statusMatch[1]).run();
    if (!result.meta.changes) return json({ error: 'ORDER_NOT_FOUND' }, 404);
    return json({ updated: true });
  }
  if (path === '/api/admin/reports.csv') {
    const from = new URL(request.url).searchParams.get('from') || today();
    const to = new URL(request.url).searchParams.get('to') || from;
    const rows = await env.DB.prepare(`SELECT o.business_date AS date,o.order_number AS orderNumber,o.pickup_time AS pickupTime,oi.product_name_snapshot AS product,oi.quantity,oi.sale_price*oi.quantity AS sales,oi.cost_price_snapshot*oi.quantity AS cost,(oi.sale_price-oi.cost_price_snapshot)*oi.quantity AS grossProfit FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.status='completed' AND o.business_date BETWEEN ? AND ? ORDER BY o.business_date,o.pickup_time`).bind(from, to).all();
    return new Response(toCsv(rows.results, ['date','orderNumber','pickupTime','product','quantity','sales','cost','grossProfit']), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="beppo-report-${from}-${to}.csv"` } });
  }
  return json({ error: 'NOT_FOUND' }, 404);
}

export default { async fetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/orders' && request.method === 'POST') return createOrder(request, env);
  if (url.pathname.startsWith('/api/admin/')) return admin(request, env, url.pathname);
  return env.ASSETS.fetch(request);
} };
