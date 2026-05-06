import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Confirmation() {
  const { id } = useParams();
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get(`/reservations/${id}`)
      .then((data) => { if (active) setReservation(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <p>Loading reservation...</p>;
  if (error) return <div className="banner banner-error">{error}</div>;
  if (!reservation) return <p>Reservation not found.</p>;

  return (
    <section>
      <div className="banner banner-success">
        Reservation confirmed! We have saved your booking.
      </div>

      <div className="card">
        <h2>Booking details</h2>
        <p className="muted">Confirmation #{reservation._id.slice(-6).toUpperCase()}</p>

        <table className="data-table">
          <tbody>
            <tr><th>Guest</th><td>{reservation.guestName}</td></tr>
            <tr><th>Party size</th><td>{reservation.partySize}</td></tr>
            <tr><th>Date</th><td>{reservation.reservationDate}</td></tr>
            <tr><th>Time</th><td>{reservation.reservationTime}</td></tr>
            {reservation.guestPhone && <tr><th>Phone</th><td>{reservation.guestPhone}</td></tr>}
            {reservation.guestEmail && <tr><th>Email</th><td>{reservation.guestEmail}</td></tr>}
            {reservation.notes && <tr><th>Notes</th><td>{reservation.notes}</td></tr>}
            <tr><th>Status</th><td><StatusBadge status={reservation.status} /></td></tr>
          </tbody>
        </table>

        <div className="row-actions" style={{ marginTop: 16 }}>
          <Link to="/reserve" className="btn btn-primary">Book another</Link>
          <Link to="/" className="btn">Back home</Link>
        </div>
      </div>
    </section>
  );
}
