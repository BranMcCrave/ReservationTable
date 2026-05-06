import StatusBadge from './StatusBadge.jsx';

export default function TableGrid({ tables, onFree }) {
  if (!tables.length) {
    return <p className="muted">No tables yet. Run the seed script to add some.</p>;
  }

  return (
    <div className="table-grid">
      {tables.map((t) => {
        const reservation = t.currentReservationId;
        return (
          <div key={t._id} className="table-card">
            <h3>
              <span>Table {t.tableNumber}</span>
              <StatusBadge status={t.status} />
            </h3>
            <p className="muted" style={{ margin: '4px 0 12px' }}>
              Seats up to {t.capacity}
            </p>
            {reservation ? (
              <div>
                <div><strong>{reservation.guestName}</strong></div>
                <div className="muted" style={{ fontSize: 13 }}>
                  Party of {reservation.partySize} · {reservation.reservationTime}
                </div>
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>Open</div>
            )}
            {t.status !== 'available' && (
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-sm" onClick={() => onFree(t._id)}>
                  Free this table
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
