import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="home-hero">
      <h1>Welcome to Bistro Reservations</h1>
      <p className="muted">
        Book a table in seconds, or sign in as a host to manage tonight's seating.
      </p>
      <div className="home-actions">
        <Link to="/reserve" className="btn btn-primary">Make a Reservation</Link>
        <Link to="/host" className="btn">Host Dashboard</Link>
      </div>
    </section>
  );
}
