PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS business_days (
  business_date TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'preparing',
  planned_quantity INTEGER NOT NULL DEFAULT 15,
  mobile_quantity INTEGER NOT NULL DEFAULT 0,
  counter_quantity INTEGER NOT NULL DEFAULT 0,
  reservation_quantity INTEGER NOT NULL DEFAULT 0,
  opening_cash_expected INTEGER NOT NULL DEFAULT 0,
  opening_cash_actual INTEGER,
  opening_cash_variance INTEGER,
  opening_cash_confirmed_at TEXT,
  opening_cash_confirmed_by TEXT,
  closing_cash_actual INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sale_price INTEGER NOT NULL CHECK (sale_price >= 0),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_cost_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id),
  cost_price INTEGER NOT NULL CHECK (cost_price >= 0),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pickup_slots (
  business_date TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (business_date, pickup_time)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  client_request_id TEXT NOT NULL UNIQUE,
  business_date TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  total_amount INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'direct',
  notes TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  sale_price INTEGER NOT NULL,
  cost_price_snapshot INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cash_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_date TEXT NOT NULL UNIQUE,
  expected_amount INTEGER NOT NULL,
  actual_amount INTEGER NOT NULL,
  variance INTEGER NOT NULL,
  denomination_json TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  confirmed_by TEXT NOT NULL,
  confirmed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cost_history_effective ON product_cost_history(product_id, effective_from);
