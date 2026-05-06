const mongoose = require('mongoose');

const RESERVATION_STATUSES = ['pending', 'seated', 'completed', 'cancelled', 'no-show'];

const reservationSchema = new mongoose.Schema(
  {
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
      maxlength: 120,
    },
    guestPhone: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    partySize: {
      type: Number,
      required: [true, 'Party size is required'],
      min: [1, 'Party size must be at least 1'],
      max: [20, 'Party size cannot exceed 20'],
    },
    reservationDate: {
      type: String,
      required: [true, 'Reservation date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Reservation date must be in YYYY-MM-DD format'],
    },
    reservationTime: {
      type: String,
      required: [true, 'Reservation time is required'],
      match: [/^\d{2}:\d{2}$/, 'Reservation time must be in HH:mm format'],
    },
    status: {
      type: String,
      enum: RESERVATION_STATUSES,
      default: 'pending',
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
    },
    tableNumber: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

reservationSchema.statics.STATUSES = RESERVATION_STATUSES;

module.exports = mongoose.model('Reservation', reservationSchema);
