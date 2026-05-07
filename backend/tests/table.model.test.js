const Table = require('../models/Table');

function makeTable(overrides = {}) {
  return new Table({ tableNumber: 1, capacity: 4, ...overrides });
}

describe('Table model — schema validation', () => {
  test('TC-13 (happy): valid table passes validateSync and defaults status to "available"', () => {
    const t = makeTable();
    const err = t.validateSync();
    expect(err).toBeUndefined();
    expect(t.status).toBe('available');
  });

  test('TC-14 (negative): missing tableNumber is rejected', () => {
    const t = makeTable({ tableNumber: undefined });
    const err = t.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.tableNumber).toBeDefined();
  });

  // ---------- Boundary tests for capacity (AC: 1 ≤ capacity ≤ 30) ----------

  test('TC-15 (boundary, just inside lower): capacity=1 is accepted', () => {
    const t = makeTable({ capacity: 1 });
    const err = t.validateSync();
    expect(err).toBeUndefined();
  });

  test('TC-16 (boundary, just outside lower): capacity=0 is rejected', () => {
    const t = makeTable({ capacity: 0 });
    const err = t.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.capacity).toBeDefined();
  });

  test('TC-17 (negative): invalid status enum is rejected', () => {
    const t = makeTable({ status: 'cleaning' });
    const err = t.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.status).toBeDefined();
  });
});
