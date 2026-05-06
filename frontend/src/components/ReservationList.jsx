import ReservationRow from './ReservationRow.jsx';

export default function ReservationList({ reservations, onUpdate, onDelete }) {
  if (!reservations.length) {
    return <p className="muted">No reservations match the current filters.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Guest</th>
          <th>Party</th>
          <th>When</th>
          <th>Status</th>
          <th>Table</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map((r) => (
          <ReservationRow
            key={r._id}
            reservation={r}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  );
}
