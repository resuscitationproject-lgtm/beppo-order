import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateCompletedOrders, calculateGrossProfit, openingCashSummary, toCsv } from '../src/domain.js';

test('商品ごとの原価スナップショットから粗利を計算する', () => {
  const items = [
    { salePrice: 1200, costPrice: 430, quantity: 1 },
    { salePrice: 300, costPrice: 90, quantity: 2 }
  ];
  assert.equal(calculateGrossProfit(items), 1190);
});

test('開店前レジ金の金種合計と差額を計算する', () => {
  assert.deepEqual(openingCashSummary(10000, { 10000: 0, 1000: 8, 100: 15, 10: 0, 1: 0 }), { expected: 10000, actual: 9500, variance: -500 });
});

test('受取完了日ごとに日計を集計する', () => {
  const result = aggregateCompletedOrders([
    { completedAt: '2026-10-06T11:00:00+09:00', quantity: 1, sales: 1200, cost: 430 },
    { completedAt: '2026-10-06T12:00:00+09:00', quantity: 2, sales: 2400, cost: 860 },
    { completedAt: '2026-10-07T12:00:00+09:00', quantity: 1, sales: 800, cost: 260 }
  ]);
  assert.deepEqual(result['2026-10-06'], { date: '2026-10-06', orders: 2, quantity: 3, sales: 3600, cost: 1290, grossProfit: 2310 });
});

test('CSVはUTF-8 BOMとセルエスケープを含む', () => {
  const csv = toCsv([{ name: 'Beppo,本店', sales: 1200 }], ['name', 'sales']);
  assert.equal(csv, '\uFEFFname,sales\r\n"Beppo,本店",1200\r\n');
});
