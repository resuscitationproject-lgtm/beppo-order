INSERT OR IGNORE INTO products(id,name,category,sale_price,active) VALUES
  ('curry','Sri Lankan Rice & Curry','main',1200,1),
  ('half','ハーフサイズ','main',800,1),
  ('omelette','オムレツ','topping',250,1),
  ('tea','セイロンティー','drink',400,1);

INSERT OR IGNORE INTO product_cost_history(product_id,cost_price,effective_from,created_by) VALUES
  ('curry',430,'2026-01-01T00:00:00+09:00','seed'),
  ('half',300,'2026-01-01T00:00:00+09:00','seed'),
  ('omelette',90,'2026-01-01T00:00:00+09:00','seed'),
  ('tea',120,'2026-01-01T00:00:00+09:00','seed');

INSERT OR IGNORE INTO business_days(business_date,status,planned_quantity)
  VALUES('2026-10-10','open',15);
