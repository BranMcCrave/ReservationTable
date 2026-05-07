const errorHandler = require('../middleware/errorHandler');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware', () => {
  // Silence the console.error inside the handler so test output stays clean.
  let errSpy;
  beforeEach(() => { errSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { errSpy.mockRestore(); });

  test('TC-18 (happy/branch): ValidationError -> 400 with collected error messages', () => {
    const err = {
      name: 'ValidationError',
      message: 'Validation failed',
      errors: {
        guestName: { message: 'Guest name is required' },
        partySize: { message: 'Party size must be at least 1' },
      },
    };
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: ['Guest name is required', 'Party size must be at least 1'],
    });
  });

  test('TC-19 (negative path: duplicate key): code 11000 -> 409 with field name', () => {
    const err = { code: 11000, keyValue: { tableNumber: 3 }, message: 'dup' };
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Duplicate value for: tableNumber' });
  });

  test('TC-20 (negative path: bad ObjectId): CastError -> 400 with path/value detail', () => {
    const err = { name: 'CastError', path: '_id', value: 'not-an-objectid', message: 'cast' };
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid _id: not-an-objectid' });
  });

  test('TC-21 (deficiency: leaks raw err.message): unknown error -> 500 with message echoed back to client', () => {
    // The handler echoes err.message back in the response for any unrecognized
    // error. That means a stack-trace-style internal message (e.g. a DB driver
    // exception) is sent to the caller — an information-disclosure deficiency
    // we want a regression test to lock in until it is fixed.
    const err = new Error('connect ECONNREFUSED 127.0.0.1:27017');
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'connect ECONNREFUSED 127.0.0.1:27017' });
  });

  test('TC-22 (happy/branch): err.status is honored when provided', () => {
    const err = Object.assign(new Error('Reservation not found'), { status: 404 });
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Reservation not found' });
  });
});
