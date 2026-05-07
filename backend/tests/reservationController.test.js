// We test the controller's pure-logic gates (no DB needed) by stubbing out the
// model modules. Anything that would touch Mongo is replaced with a jest.fn().
jest.mock('../models/Reservation', () => ({ create: jest.fn() }));
jest.mock('../models/Table', () => ({ findById: jest.fn(), findOne: jest.fn() }));

const Reservation = require('../models/Reservation');
const controller = require('../controllers/reservationController');

function makeReqRes(body = {}) {
  const req = { body, params: {}, query: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('reservationController.create — request gate', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('TC-23 (negative: contact required): rejects when both phone and email are missing', async () => {
    const { req, res, next } = makeReqRes({
      guestName: 'No Contact',
      partySize: 2,
      reservationDate: '2026-05-07',
      reservationTime: '19:00',
    });

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const passedErr = next.mock.calls[0][0];
    expect(passedErr).toBeInstanceOf(Error);
    expect(passedErr.status).toBe(400);
    expect(passedErr.message).toMatch(/phone|email/i);
    expect(Reservation.create).not.toHaveBeenCalled();
  });

  test('TC-24 (happy path): with a phone number provided, the controller calls Reservation.create and returns 201', async () => {
    const { req, res, next } = makeReqRes({
      guestName: 'Has Phone',
      guestPhone: '555-555-5555',
      partySize: 2,
      reservationDate: '2026-05-07',
      reservationTime: '19:00',
    });
    Reservation.create.mockResolvedValue({ _id: 'abc123', guestName: 'Has Phone' });

    await controller.create(req, res, next);

    expect(Reservation.create).toHaveBeenCalledTimes(1);
    expect(Reservation.create.mock.calls[0][0]).toMatchObject({
      guestName: 'Has Phone',
      guestPhone: '555-555-5555',
      status: 'pending',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: 'abc123', guestName: 'Has Phone' });
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-25 (deficiency: no auth on create): an anonymous request with no auth context still creates a reservation', async () => {
    // The route has no auth/identity middleware. Anyone who can hit the
    // endpoint can post a reservation against any guest name. This test
    // documents the gap and pins behavior so a future auth fix is detected.
    const { req, res, next } = makeReqRes({
      guestName: 'Anon User',
      guestEmail: 'anon@example.com',
      partySize: 2,
      reservationDate: '2026-05-07',
      reservationTime: '19:00',
    });
    // No req.user, no Authorization header — controller does not check.
    Reservation.create.mockResolvedValue({ _id: 'anon1' });

    await controller.create(req, res, next);

    expect(Reservation.create).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });
});
