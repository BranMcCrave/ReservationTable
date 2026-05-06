const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

async function syncTableForReservation(reservation, prevTableId, prevStatus) {
  const newTableId = reservation.tableId ? String(reservation.tableId) : null;
  const oldTableId = prevTableId ? String(prevTableId) : null;
  const status = reservation.status;

  // If the table assignment changed, free the old table.
  if (oldTableId && oldTableId !== newTableId) {
    const oldTable = await Table.findById(oldTableId);
    if (oldTable && String(oldTable.currentReservationId) === String(reservation._id)) {
      oldTable.status = 'available';
      oldTable.currentReservationId = null;
      await oldTable.save();
    }
  }

  // Update the new (or same) table based on reservation status.
  if (newTableId) {
    const table = await Table.findById(newTableId);
    if (!table) return;

    if (status === 'seated') {
      table.status = 'occupied';
      table.currentReservationId = reservation._id;
    } else if (status === 'pending') {
      table.status = 'reserved';
      table.currentReservationId = reservation._id;
    } else if (status === 'completed' || status === 'cancelled' || status === 'no-show') {
      if (String(table.currentReservationId) === String(reservation._id)) {
        table.status = 'available';
        table.currentReservationId = null;
      }
    }
    await table.save();
  }

  // Reservation has no table but moved to a terminal status — nothing to sync.
  // Make the denormalized tableNumber match the linked table.
  if (newTableId) {
    const table = await Table.findById(newTableId);
    reservation.tableNumber = table ? table.tableNumber : null;
    await reservation.save();
  } else if (reservation.tableNumber) {
    reservation.tableNumber = null;
    await reservation.save();
  }
}

exports.list = async (req, res, next) => {
  try {
    const { date, status } = req.query;
    const filter = {};
    if (date) filter.reservationDate = date;
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .sort({ reservationDate: 1, reservationTime: 1, createdAt: 1 })
      .lean();
    res.json(reservations);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id).lean();
    if (!reservation) return next(notFound('Reservation not found'));
    res.json(reservation);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { guestName, guestPhone, guestEmail, partySize, reservationDate, reservationTime, notes } = req.body;

    if (!guestPhone && !guestEmail) {
      return next(badRequest('Please provide at least a phone number or an email.'));
    }

    const reservation = await Reservation.create({
      guestName,
      guestPhone,
      guestEmail,
      partySize,
      reservationDate,
      reservationTime,
      notes,
      status: 'pending',
    });

    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return next(notFound('Reservation not found'));

    const prevTableId = reservation.tableId;
    const prevStatus = reservation.status;

    const editable = [
      'guestName',
      'guestPhone',
      'guestEmail',
      'partySize',
      'reservationDate',
      'reservationTime',
      'status',
      'notes',
    ];
    for (const key of editable) {
      if (req.body[key] !== undefined) reservation[key] = req.body[key];
    }

    if (req.body.tableId !== undefined) {
      reservation.tableId = req.body.tableId || null;
    } else if (req.body.tableNumber !== undefined) {
      // Allow assigning by tableNumber for convenience.
      if (req.body.tableNumber === null || req.body.tableNumber === '') {
        reservation.tableId = null;
        reservation.tableNumber = null;
      } else {
        const table = await Table.findOne({ tableNumber: Number(req.body.tableNumber) });
        if (!table) return next(badRequest(`No table found with number ${req.body.tableNumber}`));
        reservation.tableId = table._id;
        reservation.tableNumber = table.tableNumber;
      }
    }

    await reservation.save();
    await syncTableForReservation(reservation, prevTableId, prevStatus);

    const fresh = await Reservation.findById(reservation._id).lean();
    res.json(fresh);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return next(notFound('Reservation not found'));

    // Free any table linked to this reservation.
    if (reservation.tableId) {
      const table = await Table.findById(reservation.tableId);
      if (table && String(table.currentReservationId) === String(reservation._id)) {
        table.status = 'available';
        table.currentReservationId = null;
        await table.save();
      }
    }

    await reservation.deleteOne();
    res.json({ message: 'Reservation deleted' });
  } catch (err) {
    next(err);
  }
};
