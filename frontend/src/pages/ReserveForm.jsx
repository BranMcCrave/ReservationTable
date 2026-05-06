import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const todayStr = () => new Date().toISOString().slice(0, 10);

const initial = {
  guestName: '',
  guestPhone: '',
  guestEmail: '',
  partySize: 2,
  reservationDate: todayStr(),
  reservationTime: '19:00',
  notes: '',
};

function validate(form) {
  const errors = {};
  if (!form.guestName.trim()) errors.guestName = 'Name is required.';
  if (!form.guestPhone.trim() && !form.guestEmail.trim()) {
    errors.guestPhone = 'Provide a phone or email.';
    errors.guestEmail = 'Provide a phone or email.';
  }
  if (form.guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail)) {
    errors.guestEmail = 'Email format looks invalid.';
  }
  const size = Number(form.partySize);
  if (!size || size < 1 || size > 20) errors.partySize = 'Party size must be 1-20.';
  if (!form.reservationDate) errors.reservationDate = 'Date is required.';
  if (!form.reservationTime) errors.reservationTime = 'Time is required.';
  return errors;
}

export default function ReserveForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      const created = await api.post('/reservations', {
        ...form,
        partySize: Number(form.partySize),
      });
      navigate(`/confirmation/${created._id}`);
    } catch (err) {
      const detail = (err.errors && err.errors.length) ? ` — ${err.errors.join(', ')}` : '';
      setServerError(err.message + detail);
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h1>Reserve a Table</h1>
      <p className="muted">Tell us a bit about your visit. We will confirm your booking on the next screen.</p>

      <form className="card" onSubmit={onSubmit} noValidate>
        {serverError && <div className="banner banner-error">{serverError}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="guestName">Name</label>
            <input
              id="guestName"
              name="guestName"
              type="text"
              value={form.guestName}
              onChange={onChange}
              autoComplete="name"
            />
            {errors.guestName && <div className="field-error">{errors.guestName}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="partySize">Party size</label>
            <input
              id="partySize"
              name="partySize"
              type="number"
              min="1"
              max="20"
              value={form.partySize}
              onChange={onChange}
            />
            {errors.partySize && <div className="field-error">{errors.partySize}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="guestPhone">Phone</label>
            <input
              id="guestPhone"
              name="guestPhone"
              type="tel"
              value={form.guestPhone}
              onChange={onChange}
              placeholder="555-555-5555"
            />
            {errors.guestPhone && <div className="field-error">{errors.guestPhone}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="guestEmail">Email</label>
            <input
              id="guestEmail"
              name="guestEmail"
              type="email"
              value={form.guestEmail}
              onChange={onChange}
              placeholder="you@example.com"
            />
            {errors.guestEmail && <div className="field-error">{errors.guestEmail}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reservationDate">Date</label>
            <input
              id="reservationDate"
              name="reservationDate"
              type="date"
              value={form.reservationDate}
              onChange={onChange}
              min={todayStr()}
            />
            {errors.reservationDate && <div className="field-error">{errors.reservationDate}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="reservationTime">Time</label>
            <input
              id="reservationTime"
              name="reservationTime"
              type="time"
              value={form.reservationTime}
              onChange={onChange}
            />
            {errors.reservationTime && <div className="field-error">{errors.reservationTime}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              value={form.notes}
              onChange={onChange}
              maxLength={500}
              placeholder="Allergies, seating preference, occasion..."
            />
          </div>
        </div>

        <div className="row-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Reservation'}
          </button>
        </div>
      </form>
    </section>
  );
}
