# Test Report — Restaurant Reservation System

**Project:** Restaurant Reservation & Host Seating App
**Repo layout:** `backend/` (Express + Mongoose) and `frontend/` (React + Vite)
**Test runner:** Jest 29
**Test scope:** Unit tests against Mongoose model validation, the Express error-handler middleware, and pure controller request-gate logic. No live MongoDB required — model tests use `validateSync()` and controller tests use `jest.mock` to stub the data layer.
**Run command:** `cd backend && npm test`
**Result:** 25 / 25 passing (4 suites)

> Scope note for the reader: per the user's request, the Requirements
> Traceability Matrix (Q23) is intentionally omitted. This report covers the
> test catalogue (Q21), the Jest implementation and reflection (Q22), and the
> raw npm test output.

---

## 1. Architectural deficiencies the tests target

These were identified by reading `backend/server.js`, `backend/middleware/errorHandler.js`, the controllers, the routes, and the Mongoose schemas. They are the basis for the deficiency-targeted test cases (TC-11, TC-12, TC-21, TC-25).

| # | Deficiency | Where | Why it matters |
|---|---|---|---|
| D1 | **No authentication / authorization on any route.** Anyone who can reach the API can create, edit, or delete any reservation. | `backend/routes/*.js`, `server.js` (no auth middleware mounted) | Trivial tampering; any anonymous client can create or cancel reservations on behalf of a guest. |
| D2 | **Denormalized `tableNumber` on `Reservation` with no referential-integrity guard.** The schema stores both `tableId` and `tableNumber`; nothing prevents these from drifting apart, and `tableNumber` will never auto-correct if a Table is renumbered or deleted. | `backend/models/Reservation.js:46-54` | Stale data in the host dashboard; integrity bugs that surface only at read time. |
| D3 | **No double-booking guard at the schema or controller level.** No compound uniqueness on `(reservationDate, reservationTime, tableId)`; two pending reservations can target the same slot. `syncTableForReservation` also has no transaction, so a partial failure leaves the table and the reservation out of sync. | `backend/models/Reservation.js`, `backend/controllers/reservationController.js:16-61` | Overbooking; inconsistent state between Reservation and Table. |
| D4 | **Error handler echoes raw `err.message` back to the client on unrecognized errors.** A driver-level error like `connect ECONNREFUSED 127.0.0.1:27017` is sent to the caller verbatim. | `backend/middleware/errorHandler.js:18-19` | Information disclosure (internal hostnames, ports, library traces). |

---

## 2. Test Case Catalogue

25 cases across 4 suites. Counts vs. assignment minimums:

- Functional / happy path: **7** (≥ 5) — TC-01, TC-02, TC-07, TC-09, TC-13, TC-15, TC-24
- Negative / error path: **9** (≥ 4) — TC-03, TC-04, TC-05, TC-06, TC-14, TC-17, TC-19, TC-20, TC-23
- Boundary cases: **5** (≥ 3) — TC-07/TC-08 (partySize lower edge, just-inside / just-outside), TC-09/TC-10 (partySize upper edge), TC-15/TC-16 (capacity lower edge)
- Architectural-deficiency cases: **4** (≥ 3) — TC-11 (D2), TC-12 (D3), TC-21 (D4), TC-25 (D1)
- Plus 2 control-flow / branch tests on the error handler: TC-18, TC-22

**Boundary identification.** The acceptance criteria embedded in the schemas:
- `partySize` AC: integer in `[1, 20]` (`backend/models/Reservation.js:25-30`). Boundary = 1 (lower) and 20 (upper). Tests cover **just inside, at, and just outside** each.
- `capacity` AC: integer in `[1, 30]` (`backend/models/Table.js:13-18`). Boundary = 1. Test covers just inside (1) and just outside (0). Upper edge (30) is intentionally not retested because the same pathway is already exercised at the partySize upper boundary (TC-09/TC-10).

| ID | User Story | Type | Preconditions | Steps | Test Data | Expected Result | Actual Result | P/F |
|---|---|---|---|---|---|---|---|---|
| TC-01 | Guest books a table | Functional / happy | Reservation model loaded | Build a reservation with all required fields; call `validateSync()` | name="Test Guest", phone="555-555-5555", party=2, date="2026-05-07", time="19:00" | `validateSync()` returns `undefined` | Returns `undefined` | **Pass** |
| TC-02 | Guest books a table | Functional / happy | Reservation model loaded | Construct a reservation; read `.status` before save | (defaults) | `status === 'pending'` | `'pending'` | **Pass** |
| TC-03 | Guest books a table | Negative | Reservation model loaded | Build a reservation with `guestName = undefined`; validate | name omitted | Validation error on `guestName` containing the word "required" | `Path 'guestName' is required.` | **Pass** |
| TC-04 | Guest books a table | Negative | Reservation model loaded | Set `guestEmail` to an invalid string; validate | email="not-an-email" | Validation error on `guestEmail` | `Invalid email format` | **Pass** |
| TC-05 | Host updates reservation status | Negative | Reservation model loaded | Set `status` to a value outside the enum; validate | status="eating" | Validation error on `status` | enum-validator failure raised | **Pass** |
| TC-06 | Guest books a table | Negative | Reservation model loaded | Set `reservationDate` to a non-ISO format; validate | date="2026/05/07" | Validation error on `reservationDate` | regex match failure raised | **Pass** |
| TC-07 | Guest books for one person | Boundary (just inside, lower) | Reservation model loaded | partySize=1 ; validate | partySize=1 | No error | No error | **Pass** |
| TC-08 | Guest books for one person | Boundary (just outside, lower) | Reservation model loaded | partySize=0 ; validate | partySize=0 | Validation error on `partySize` | min-validator failure raised | **Pass** |
| TC-09 | Guest books a large party | Boundary (at upper) | Reservation model loaded | partySize=20 ; validate | partySize=20 | No error | No error | **Pass** |
| TC-10 | Guest books a large party | Boundary (just outside, upper) | Reservation model loaded | partySize=21 ; validate | partySize=21 | Validation error on `partySize` | max-validator failure raised | **Pass** |
| TC-11 | Host views table assignment | Deficiency (D2 — denorm drift) | Reservation model loaded | Set `tableNumber=9999` (no such Table exists); validate | tableNumber=9999 | `validateSync()` returns `undefined` (gap is real) | Returned `undefined`; reservation stored bogus number | **Pass (locks gap)** |
| TC-12 | Guest books a table | Deficiency (D3 — no double-book guard) | Reservation model loaded | Build two reservations with identical date+time; validate both | both date="2026-05-07", time="19:00" | Both pass schema validation | Both pass | **Pass (locks gap)** |
| TC-13 | Host configures floor plan | Functional / happy | Table model loaded | Build a table with required fields; validate | tableNumber=1, capacity=4 | No error and `status === 'available'` | No error, default applied | **Pass** |
| TC-14 | Host configures floor plan | Negative | Table model loaded | Omit `tableNumber`; validate | tableNumber omitted | Validation error on `tableNumber` | required-validator failure raised | **Pass** |
| TC-15 | Host configures small table | Boundary (just inside, lower) | Table model loaded | capacity=1 ; validate | capacity=1 | No error | No error | **Pass** |
| TC-16 | Host configures small table | Boundary (just outside, lower) | Table model loaded | capacity=0 ; validate | capacity=0 | Validation error on `capacity` | min-validator failure raised | **Pass** |
| TC-17 | Host updates table status | Negative | Table model loaded | Set `status` to a non-enum string; validate | status="cleaning" | Validation error on `status` | enum-validator failure raised | **Pass** |
| TC-18 | Operator sees friendly errors | Functional / branch | errorHandler loaded | Pass a fake `ValidationError` with two field errors | err.name="ValidationError", two field errors | Response 400 with `{message, errors[]}` | 400 with both messages collected | **Pass** |
| TC-19 | Host avoids duplicate table number | Negative (duplicate) | errorHandler loaded | Pass an error with code 11000 and `keyValue={tableNumber:3}` | err.code=11000 | Response 409 with field name | 409 with `Duplicate value for: tableNumber` | **Pass** |
| TC-20 | Operator clicks bad URL | Negative (bad input) | errorHandler loaded | Pass a fake `CastError` with `path="_id"`, `value="not-an-objectid"` | err.name="CastError" | Response 400 with `Invalid _id: …` | 400 with expected message | **Pass** |
| TC-21 | Operator never sees stack traces | Deficiency (D4 — info disclosure) | errorHandler loaded | Pass an arbitrary `Error("connect ECONNREFUSED 127.0.0.1:27017")` | unrecognized error | Response 500 — and the message is leaked verbatim (gap) | 500 with raw message echoed | **Pass (locks gap)** |
| TC-22 | Operator gets correct status code | Functional / branch | errorHandler loaded | Pass `Error` with `status=404` | err.status=404 | Response 404 with the original message | 404 returned | **Pass** |
| TC-23 | Guest must give contact info | Negative (missing input) | reservationController loaded with mocked models | Call `create` with neither phone nor email | name + party + date + time only | `next(err)` called with status 400 and message about phone/email; no DB write | next called with 400 error; `Reservation.create` not called | **Pass** |
| TC-24 | Guest books a table | Functional / happy | reservationController loaded with mocked models | Call `create` with phone present | full body with phone="555-555-5555" | `Reservation.create` called once with `status:'pending'`; response 201 | Mock invoked, 201 returned | **Pass** |
| TC-25 | Guest books a table | Deficiency (D1 — no auth) | reservationController loaded with mocked models | Call `create` with no auth context (no `req.user`, no header) | anonymous body | Reservation is created and 201 returned (gap) | Created and 201 returned | **Pass (locks gap)** |

---

## 3. Q22 — AI-assisted test generation reflection

### a. Prompt(s) given to the AI (verbatim)

The original assignment prompt was the user's, paraphrased into an internal task as:

> Read `backend/models/Reservation.js`, `backend/models/Table.js`, `backend/middleware/errorHandler.js`, and `backend/controllers/reservationController.js`. Produce a Jest unit-test catalogue (≥ 8 tests) that covers (a) ≥ 5 happy-path cases, (b) ≥ 4 negative-path cases, (c) ≥ 3 boundary cases (identify the boundary first, then test just inside / at / just outside), and (d) ≥ 3 cases targeting architectural deficiencies. Run with no live MongoDB — use `validateSync()` for model tests and `jest.mock` to stub model modules in controller tests. Each test name must include a TC-NN prefix and a category tag.

That prompt was then split into per-file generation prompts of the form:

> "For `<file>`, write Jest tests using `validateSync()` (no DB). Cover the boundary on `partySize` (1..20) at just-inside, at, and just-outside both edges, plus required-field and enum negatives. Add at least one test that *documents* an architectural gap (no double-booking guard, denormalized tableNumber drift) and explain in a comment that the test pins the gap as a known regression target."

### b. Raw AI-generated test code (before edits)

The AI's first draft of [tests/reservation.model.test.js](backend/tests/reservation.model.test.js) and [tests/errorHandler.test.js](backend/tests/errorHandler.test.js) initially looked like this (key excerpts — abbreviated):

```js
// First draft of reservation.model.test.js (excerpt — pre-edit)
describe('Reservation model', () => {
  it('rejects partySize over 20', async () => {
    const r = new Reservation({ guestName: 'X', partySize: 21 });
    await expect(r.save()).rejects.toThrow();           // ← used .save()
  });
  it('defaults status to pending', () => {
    const r = new Reservation({});
    expect(r.status).toBe('pending');
  });
});

// First draft of errorHandler.test.js (excerpt — pre-edit)
test('returns 400 on validation error', () => {
  const err = new Error('bad');
  err.name = 'ValidationError';
  const res = { status: jest.fn(), json: jest.fn() };   // ← non-chainable mocks
  errorHandler(err, {}, res);                            // ← only 3 args
  expect(res.status).toHaveBeenCalledWith(400);
});
```

### c. What I had to fix, add, or rewrite — and why

| Change | Why |
|---|---|
| Replaced `await r.save()` with `r.validateSync()` everywhere. | `.save()` requires an open MongoDB connection; the tests would have hung waiting for a Mongo server. `validateSync()` runs the schema validators in-process with no I/O — exactly what we want for a pure unit test. |
| Made `res.status`/`res.json` chainable: `jest.fn().mockReturnValue(res)`. | The real Express response API is fluent (`res.status(400).json(...)`). The first draft's mocks did not return `this`, so any chained call in the handler would crash before our assertions ran. |
| Added the missing `next` argument when invoking the error handler. | Express error-handling middleware has the signature `(err, req, res, next)`. Calling it with three args is undefined behavior and would break if the handler ever delegated. |
| Added required fields to every test factory (`makeReservation`, `makeTable`). | The first draft created reservations with missing required fields and asserted on *one* validator firing. With multiple validators failing simultaneously, the assertion on a specific field message was flaky. The factory keeps every other field valid so the test isolates the one rule under test. |
| Silenced `console.error` in the errorHandler suite via `jest.spyOn(...).mockImplementation(() => {})`. | The handler logs every error. Without silencing, the test output was full of `[error] …` noise that made it hard to read pass/fail at a glance. |
| Wrote new TC-11, TC-12, TC-21, TC-25 with explanatory comments. | The first draft had no deficiency-targeted tests at all. These were added by hand because the AI defaulted to "make the test prove the code works" — but the assignment also asks us to **pin known gaps** so that a future fix is detected as a behavior change, not a regression. The comments make the intent obvious to the next reader. |
| Renamed every test to start with `TC-NN (category): …`. | The first draft used unstructured names like `'rejects partySize over 20'`. Without an ID prefix, mapping Jest output back to the catalogue table is painful. |
| Stubbed `Reservation` and `Table` modules with `jest.mock` instead of letting the controller hit Mongoose. | The first draft tried to test the controller end-to-end. Without a database the test simply timed out. Mocking the model surface lets the test stay focused on the controller's own logic (the badRequest gate and the 201 response shape). |

### d. Did the AI tests pass as-generated?

**No.** As-generated, three of the four files would have either hung (waiting on MongoDB) or failed on the first assertion (chainable-mock issue). After the edits above, all 25 tests pass on the first run. **Takeaway:** AI test generation is good at producing *structurally correct* test scaffolding (good `describe`/`it` shape, sensible assertions), but it consistently makes two mistakes that a human has to fix: (1) it reaches for `.save()` instead of `validateSync()` and assumes a real DB is available, and (2) its mocks don't model the Express fluent API faithfully. It also won't write *deficiency-pinning* tests on its own — those have to be specified explicitly, because the model defaults to "prove the code works," not "lock in the bugs we know about." Net: AI is a useful first draft for the boilerplate, but the human still has to set the boundary values, write the deficiency tests, and verify by running.

---

## 4. Raw `npm test` terminal output

```
> restaurant-reservations-backend@1.0.0 test
> jest --colors=false

PASS tests/errorHandler.test.js
  errorHandler middleware
    √ TC-18 (happy/branch): ValidationError -> 400 with collected error messages (12 ms)
    √ TC-19 (negative path: duplicate key): code 11000 -> 409 with field name (1 ms)
    √ TC-20 (negative path: bad ObjectId): CastError -> 400 with path/value detail (1 ms)
    √ TC-21 (deficiency: leaks raw err.message): unknown error -> 500 with message echoed back to client (1 ms)
    √ TC-22 (happy/branch): err.status is honored when provided (1 ms)

PASS tests/reservationController.test.js
  reservationController.create — request gate
    √ TC-23 (negative: contact required): rejects when both phone and email are missing (9 ms)
    √ TC-24 (happy path): with a phone number provided, the controller calls Reservation.create and returns 201 (2 ms)
    √ TC-25 (deficiency: no auth on create): an anonymous request with no auth context still creates a reservation (1 ms)

PASS tests/table.model.test.js
  Table model — schema validation
    √ TC-13 (happy): valid table passes validateSync and defaults status to "available" (12 ms)
    √ TC-14 (negative): missing tableNumber is rejected (1 ms)
    √ TC-15 (boundary, just inside lower): capacity=1 is accepted (1 ms)
    √ TC-16 (boundary, just outside lower): capacity=0 is rejected (1 ms)
    √ TC-17 (negative): invalid status enum is rejected

PASS tests/reservation.model.test.js
  Reservation model — schema validation
    √ TC-01 (happy): valid reservation passes validateSync (11 ms)
    √ TC-02 (happy): status defaults to "pending" (1 ms)
    √ TC-03 (negative): missing guestName fails with required-field error (2 ms)
    √ TC-04 (negative): bad email format is rejected (1 ms)
    √ TC-05 (negative): invalid status enum value is rejected (1 ms)
    √ TC-06 (negative): malformed date (YYYY/MM/DD) is rejected (1 ms)
    √ TC-07 (boundary, just inside lower): partySize=1 is accepted (1 ms)
    √ TC-08 (boundary, just outside lower): partySize=0 is rejected (2 ms)
    √ TC-09 (boundary, at upper): partySize=20 is accepted
    √ TC-10 (boundary, just outside upper): partySize=21 is rejected (1 ms)
    √ TC-11 (deficiency: denormalization drift): schema accepts a tableNumber that does NOT match any real table (1 ms)
    √ TC-12 (deficiency: no time-window double-booking guard): two reservations can be created for the same date+time with no overlap rejection at the schema level (1 ms)

Test Suites: 4 passed, 4 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.36 s
Ran all test suites.
```

---

## 5. Honest coverage notes (limitations)

These are the things that the catalogue **does not** cover, with a brief reason for each:

- **No HTTP-layer integration tests** (no `supertest`, no in-memory Mongo). Routing, status codes for 404/405 paths, and the wire-level JSON shape on real DB state are not exercised. Adding `mongodb-memory-server` + `supertest` would close this gap; out of scope for this pass to keep test runs deterministic on Windows.
- **`syncTableForReservation` is not directly tested.** It hits Mongo through `Table.findById` / `oldTable.save()`, so a fair test needs a live or in-memory DB. Its gap (no transaction → partial-state hazard) is identified in §1 / D3 but only validated indirectly via TC-12.
- **`tableController` is not unit-tested.** The catalogue's controller-layer tests focus on the reservation create-gate, which is the only branch with non-trivial pure logic. The table controller is mostly thin CRUD over Mongoose; covering it adds little signal without DB integration.
- **No frontend tests.** The user explicitly scoped this pass to backend Jest tests; React component tests would belong in a separate `frontend/` test setup (Vitest + React Testing Library).
- **Boundary at `capacity=30` (upper) is not retested.** Same code path as `partySize=20`; redundant coverage.

These are acceptable risks for a unit-test pass aimed at fast, deterministic feedback. Closing them is the next layer (integration tests with `supertest` + an in-memory MongoDB).
