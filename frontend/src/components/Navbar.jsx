import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="brand">Bistro Reservations</NavLink>
      <div className="nav-links">
        <NavLink to="/reserve" className={({ isActive }) => (isActive ? 'active' : '')}>
          Reserve
        </NavLink>
        <NavLink to="/host" className={({ isActive }) => (isActive ? 'active' : '')}>
          Host
        </NavLink>
      </div>
    </nav>
  );
}
