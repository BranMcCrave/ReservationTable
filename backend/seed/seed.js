const dotenv = require('dotenv');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

dotenv.config();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function run() {
  try {
    await connectDB();

    await Reservation.deleteMany({});
    await Table.deleteMany({});
    console.log('Cleared existing reservations and tables.');

    const tables = await Table.insertMany([
      { tableNumber: 1, capacity: 2, status: 'available' },
      { tableNumber: 2, capacity: 2, status: 'available' },
      { tableNumber: 3, capacity: 4, status: 'available' },
      { tableNumber: 4, capacity: 4, status: 'available' },
      { tableNumber: 5, capacity: 6, status: 'available' },
      { tableNumber: 6, capacity: 8, status: 'available' },
    ]);
    console.log(`Seeded ${tables.length} tables.`);

    const today = todayStr();
    const tomorrow = tomorrowStr();

    const reservations = await Reservation.insertMany([
      {
        guestName: 'Alice Johnson',
        guestPhone: '555-201-3344',
        guestEmail: 'alice@example.com',
        partySize: 2,
        reservationDate: today,
        reservationTime: '18:00',
        status: 'pending',
        notes: 'Window seat preferred',
      },
      {
        guestName: 'Bob Smith',
        guestPhone: '555-742-9911',
        partySize: 4,
        reservationDate: today,
        reservationTime: '19:30',
        status: 'pending',
      },
      {
        guestName: 'Carla Diaz',
        guestEmail: 'carla.d@example.com',
        partySize: 6,
        reservationDate: today,
        reservationTime: '20:00',
        status: 'pending',
        notes: 'Birthday party — small cake at the end if possible',
      },
      {
        guestName: 'Devon Park',
        guestPhone: '555-113-2244',
        partySize: 2,
        reservationDate: tomorrow,
        reservationTime: '18:30',
        status: 'pending',
      },
      {
        guestName: 'Evelyn Wright',
        guestPhone: '555-808-7766',
        guestEmail: 'evelyn@example.com',
        partySize: 4,
        reservationDate: tomorrow,
        reservationTime: '19:00',
        status: 'pending',
      },
    ]);
    console.log(`Seeded ${reservations.length} reservations.`);

    console.log('\nSeed complete.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
