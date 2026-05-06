const Table = require('../models/Table');
const Reservation = require('../models/Reservation');

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

exports.list = async (_req, res, next) => {
  try {
    const tables = await Table.find()
      .sort({ tableNumber: 1 })
      .populate('currentReservationId', 'guestName partySize reservationTime status')
      .lean();
    res.json(tables);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { tableNumber, capacity, status } = req.body;
    const table = await Table.create({ tableNumber, capacity, status });
    res.status(201).json(table);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return next(notFound('Table not found'));

    const editable = ['tableNumber', 'capacity', 'status'];
    for (const key of editable) {
      if (req.body[key] !== undefined) table[key] = req.body[key];
    }

    // Allow explicit clearing of currentReservationId (free a table).
    if (req.body.currentReservationId !== undefined) {
      table.currentReservationId = req.body.currentReservationId || null;
    }

    // If the table is being marked available, also clear the linked reservation
    // and unset its tableId so the two stay in sync.
    if (req.body.status === 'available') {
      const linkedId = table.currentReservationId;
      table.currentReservationId = null;
      if (linkedId) {
        const reservation = await Reservation.findById(linkedId);
        if (reservation) {
          reservation.tableId = null;
          reservation.tableNumber = null;
          // If still seated, move it to completed since the host freed the table.
          if (reservation.status === 'seated') {
            reservation.status = 'completed';
          }
          await reservation.save();
        }
      }
    }

    await table.save();
    res.json(table);
  } catch (err) {
    next(err);
  }
};
