const Reservation = require('../models/Reservation');

function makeReservation(overrides = {}) {
  return new Reservation({
    guestName: 'Test Guest',
    guestPhone: '555-555-5555',
    partySize: 2,
    reservationDate: '2026-05-07',
    reservationTime: '19:00',
    ...overrides,
  });
}

describe('Reservation model — schema validation', () => {
  test('TC-01 (happy): valid reservation passes validateSync', () => {
    const r = makeReservation();
    const err = r.validateSync();
    expect(err).toBeUndefined();
  });

  test('TC-02 (happy): status defaults to "pending"', () => {
    const r = makeReservation();
    expect(r.status).toBe('pending');
  });

  test('TC-03 (negative): missing guestName fails with required-field error', () => {
    const r = makeReservation({ guestName: undefined });
    const err = r.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.guestName).toBeDefined();
    expect(err.errors.guestName.message).toMatch(/required/i);
  });

  test('TC-04 (negative): bad email format is rejected', () => {
    const r = makeReservation({ guestEmail: 'not-an-email' });
    const err = r.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.guestEmail).toBeDefined();
  });

  test('TC-05 (negative): invalid status enum value is rejected', () => {
    const r = makeReservation({ status: 'eating' });
    const err = r.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.status).toBeDefined();
  });

  test('TC-06 (negative): malformed date (YYYY/MM/DD) is rejected', () => {
    const r = makeReservation({ reservationDate: '2026/05/07' });
    const err = r.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.reservationDate).toBeDefined();
  });

  // ---------- Boundary tests for partySize (AC: 1 ≤ partySize ≤ 20) ----------

  test('TC-07 (boundary, just inside lower): partySize=1 is accepted', () => {
    const r = makeReservation({ partySize: 1 });
    const err = r.validateSync();
    expect(err).toBeUndefined();
  });

  test('TC-08 (boundary, just outside lower): partySize=0 is rejected', () => {
    const r = makeReservation({ partySize: 0 });
    const err = r.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.partySize).toBeDefined();
  });

  test('TC-09 (boundary, at upper): partySize=20 is accepted', () => {
    const r = makeReservation({ partySize: 20 });
    const err = r.validateSync();
    expect(err).toBeUndefined();
  });

  test('TC-10 (boundary, just outside upper): partySize=21 is rejected', () => {
    const r = makeReservation({ partySize: 21 });
    const err = r.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.partySize).toBeDefined();
  });

  // ---------- Architectural-deficiency tests ----------

  test('TC-11 (deficiency: denormalization drift): schema accepts a tableNumber that does NOT match any real table', () => {
    // The schema allows tableNumber to be set to any number, with no
    // referential-integrity check against the Tables collection. This means
    // the denormalized tableNumber on a reservation can drift away from the
    // tableId it is supposed to mirror — a known integrity gap.
    const r = makeReservation({ tableNumber: 9999 });
    const err = r.validateSync();
    expect(err).toBeUndefined();
    expect(r.tableNumber).toBe(9999);
  });

  test('TC-12 (deficiency: no time-window double-booking guard): two reservations can be created for the same date+time with no overlap rejection at the schema level', () => {
    // The schema has no compound uniqueness on (reservationDate, reservationTime, tableId),
    // so two pending reservations targeting the same slot both pass validation.
    // Any deduplication has to happen in business logic, which currently does not exist.
    const a = makeReservation({ reservationDate: '2026-05-07', reservationTime: '19:00' });
    const b = makeReservation({ reservationDate: '2026-05-07', reservationTime: '19:00' });
    expect(a.validateSync()).toBeUndefined();
    expect(b.validateSync()).toBeUndefined();
  });
});
