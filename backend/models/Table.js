const mongoose = require('mongoose');

const TABLE_STATUSES = ['available', 'occupied', 'reserved'];

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: [true, 'Table number is required'],
      unique: true,
      min: 1,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: 30,
    },
    status: {
      type: String,
      enum: TABLE_STATUSES,
      default: 'available',
    },
    currentReservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
    },
  },
  { timestamps: true }
);

tableSchema.statics.STATUSES = TABLE_STATUSES;

module.exports = mongoose.model('Table', tableSchema);
