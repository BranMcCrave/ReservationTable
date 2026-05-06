import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import ReservationFilters from '../components/ReservationFilters.jsx';
import ReservationList from '../components/ReservationList.jsx';
import TableGrid from '../components/TableGrid.jsx';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function HostDashboard() {
  const [tab, setTab] = useState('reservations');
  const [filters, setFilters] = useState({ date: todayStr(), status: '' });
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.date) params.set('date', filters.date);
      if (filters.status) params.set('status', filters.status);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const [resData, tableData] = await Promise.all([
        api.get(`/reservations${qs}`),
        api.get('/tables'),
      ]);
      setReservations(resData);
      setTables(tableData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.date, filters.status]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const flash = (msg) => {
    setInfo(msg);
    setTimeout(() => setInfo(''), 2500);
  };

  const updateReservation = async (id, body) => {
    try {
      await api.patch(`/reservations/${id}`, body);
      flash('Reservation updated.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteReservation = async (id) => {
    try {
      await api.del(`/reservations/${id}`);
      flash('Reservation deleted.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const freeTable = async (id) => {
    try {
      await api.patch(`/tables/${id}`, { status: 'available' });
      flash('Table is now available.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h1>Host Dashboard</h1>

      <div className="tabs">
        <button
          className={tab === 'reservations' ? 'active' : ''}
          onClick={() => setTab('reservations')}
        >
          Reservations ({reservations.length})
        </button>
        <button
          className={tab === 'tables' ? 'active' : ''}
          onClick={() => setTab('tables')}
        >
          Tables ({tables.length})
        </button>
      </div>

      {error && <div className="banner banner-error">{error}</div>}
      {info && <div className="banner banner-info">{info}</div>}

      {tab === 'reservations' && (
        <div className="card">
          <ReservationFilters
            value={filters}
            onChange={setFilters}
            onClear={() => setFilters({ date: '', status: '' })}
          />
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          {loading ? (
            <p>Loading reservations...</p>
          ) : (
            <ReservationList
              reservations={reservations}
              onUpdate={updateReservation}
              onDelete={deleteReservation}
            />
          )}
        </div>
      )}

      {tab === 'tables' && (
        <div className="card">
          {loading ? (
            <p>Loading tables...</p>
          ) : (
            <TableGrid tables={tables} onFree={freeTable} />
          )}
        </div>
      )}
    </section>
  );
}
