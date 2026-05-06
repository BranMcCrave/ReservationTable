const STATUSES = ['pending', 'seated', 'completed', 'cancelled', 'no-show'];

export default function ReservationFilters({ value, onChange, onClear }) {
  const update = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="form-row" style={{ marginBottom: 0 }}>
      <div className="form-group">
        <label htmlFor="filter-date">Date</label>
        <input
          id="filter-date"
          type="date"
          value={value.date}
          onChange={(e) => update({ date: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          value={value.status}
          onChange={(e) => update({ status: e.target.value })}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="form-group" style={{ alignSelf: 'flex-end', flex: '0 0 auto' }}>
        <button type="button" className="btn btn-sm" onClick={onClear}>Clear filters</button>
      </div>
    </div>
  );
}
