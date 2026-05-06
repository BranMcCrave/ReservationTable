import { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';

const STATUSES = ['pending', 'seated', 'completed', 'cancelled', 'no-show'];

export default function ReservationRow({ reservation, onUpdate, onDelete }) {
  const [tableInput, setTableInput] = useState(
    reservation.tableNumber ? String(reservation.tableNumber) : ''
  );
  const [busy, setBusy] = useState(false);

  const handle = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const setStatus = (status) =>
    handle(() => onUpdate(reservation._id, { status }));

  const assignTable = () =>
    handle(() => onUpdate(reservation._id, { tableNumber: tableInput ? Number(tableInput) : null }));

  const remove = () => {
    if (!confirm(`Delete reservation for ${reservation.guestName}?`)) return;
    handle(() => onDelete(reservation._id));
  };

  return (
    <tr>
      <td>
        <strong>{reservation.guestName}</strong>
        <div className="muted" style={{ fontSize: 12 }}>
          {reservation.guestPhone || reservation.guestEmail || '—'}
        </div>
      </td>
      <td>{reservation.partySize}</td>
      <td>
        {reservation.reservationDate}<br/>
        <span className="muted">{reservation.reservationTime}</span>
      </td>
      <td><StatusBadge status={reservation.status} /></td>
      <td>
        <div className="inline-form">
          <input
            type="number"
            min="1"
            placeholder="—"
            value={tableInput}
            onChange={(e) => setTableInput(e.target.value)}
            style={{ width: 70 }}
          />
          <button className="btn btn-sm" onClick={assignTable} disabled={busy}>
            Assign
          </button>
        </div>
      </td>
      <td>
        <div className="row-actions">
          <select
            value={reservation.status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={busy}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {reservation.status !== 'seated' && (
            <button className="btn btn-sm btn-primary" onClick={() => setStatus('seated')} disabled={busy}>
              Seat
            </button>
          )}
          {reservation.status === 'seated' && (
            <button className="btn btn-sm" onClick={() => setStatus('completed')} disabled={busy}>
              Complete
            </button>
          )}
          <button className="btn btn-sm btn-danger" onClick={remove} disabled={busy}>
            Delete
          </button>
        </div>
        {reservation.notes && (
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            “{reservation.notes}”
          </div>
        )}
      </td>
    </tr>
  );
}
