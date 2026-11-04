import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field from '../../components/ui/Field.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getUsers, getUser, createUser, updateUser } from '../../services/userService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ROOM_TYPES } from '../../utils/constants.js';
import { formatDate } from '../../utils/format.js';

const EMPTY = { name: '', email: '', phone: '', address: '', city: '', country: '', preferences: { roomType: '', bedType: '', floor: '', dietary: '', notes: '' } };

export default function Guests() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null); // 'new' | id
  const { data, meta, loading, error, reload } = useFetch(() => getUsers({ role: 'guest', search: query, page }), [query, page]);

  return (
    <>
      <PageHeader
        title="Guests"
        description="Guest profiles, contact details and stay preferences."
        actions={<button className="btn btn-primary" onClick={() => setOpenId('new')}><Icon name="plus" size={18} /> Add guest</button>}
      />
      <form className="search-input toolbar-search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
        <Icon name="search" size={18} />
        <input className="input" placeholder="Search by name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search guests" />
      </form>

      <ErrorNote message={error} onRetry={reload} />
      {loading ? <Spinner /> : data?.length ? (
        <section className="panel">
          <div className="table-wrap">
            <table className="table table-clickable">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>From</th><th>Since</th><th>Status</th></tr></thead>
              <tbody>
                {data.map((g) => (
                  <tr key={g._id} onClick={() => setOpenId(g._id)}>
                    <td><strong>{g.name}</strong></td>
                    <td>{g.email}</td>
                    <td>{g.phone || '—'}</td>
                    <td>{[g.city, g.country].filter(Boolean).join(', ') || '—'}</td>
                    <td>{formatDate(g.createdAt)}</td>
                    <td><Badge status={g.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </section>
      ) : !error && <EmptyState icon="users" title="No guests found" text="Try another search or add a guest profile." />}

      <GuestModal id={openId} onClose={() => setOpenId(null)} onSaved={() => { setOpenId(null); reload(); }} />
    </>
  );
}

function GuestModal({ id, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const isNew = id === 'new';

  useEffect(() => {
    setError('');
    setBookings([]);
    if (!id) return;
    if (isNew) {
      setForm(EMPTY);
      return;
    }
    getUser(id)
      .then((res) => {
        setForm({ ...EMPTY, ...res.data.user, preferences: { ...EMPTY.preferences, ...res.data.user.preferences } });
        setBookings(res.data.bookings);
      })
      .catch((err) => setError(err.message));
  }, [id, isNew]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setPref = (key) => (e) => setForm({ ...form, preferences: { ...form.preferences, [key]: e.target.value } });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, country: form.country, preferences: form.preferences };
    try {
      const res = isNew ? await createUser(payload) : await updateUser(id, payload);
      if (res.tempPassword) toast.info(`${res.message} Email is not set up, so share this temporary password: ${res.tempPassword}`, { autoClose: false });
      else toast.success(res.message);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      size="lg"
      title={isNew ? 'Add guest profile' : form.name || 'Guest'}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Close</button><button type="submit" form="guest-form" className="btn btn-primary">{isNew ? 'Create profile' : 'Save changes'}</button></>}
    >
      <form id="guest-form" onSubmit={submit} className="stack">
        <div className="form-grid form-grid-3">
          <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} required /></Field>
          <Field label="Email"><input type="email" className="input" value={form.email} onChange={set('email')} required /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Address"><input className="input" value={form.address} onChange={set('address')} /></Field>
          <Field label="City"><input className="input" value={form.city} onChange={set('city')} /></Field>
          <Field label="Country"><input className="input" value={form.country} onChange={set('country')} /></Field>
        </div>
        <h3 className="subhead">Preferences</h3>
        <div className="form-grid form-grid-3">
          <Field label="Room type">
            <select className="input" value={form.preferences.roomType} onChange={setPref('roomType')}>
              <option value="">No preference</option>
              {Object.entries(ROOM_TYPES).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Bed">
            <select className="input" value={form.preferences.bedType} onChange={setPref('bedType')}>
              <option value="">No preference</option><option value="king">King</option><option value="queen">Queen</option><option value="twin">Twin</option>
            </select>
          </Field>
          <Field label="Floor">
            <select className="input" value={form.preferences.floor} onChange={setPref('floor')}>
              <option value="">No preference</option><option value="low">Low floor</option><option value="high">High floor</option>
            </select>
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Dietary needs"><input className="input" value={form.preferences.dietary} onChange={setPref('dietary')} /></Field>
          <Field label="Notes for staff"><input className="input" value={form.preferences.notes} onChange={setPref('notes')} /></Field>
        </div>
        {isNew && <p className="field-hint">The guest receives an email with a link to set their own password.</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
      </form>

      {!isNew && (
        <>
          <h3 className="subhead">Stay history</h3>
          {bookings.length ? (
            <ul className="line-list">
              {bookings.map((b) => (
                <li key={b._id}>
                  <Link to={`/dashboard/bookings/${b._id}`} className="mono-link">{b.code}</Link>
                  <span>Room {b.room?.roomNumber}, {formatDate(b.checkIn)}</span>
                  <Badge status={b.status} />
                </li>
              ))}
            </ul>
          ) : <p className="muted">No stays yet.</p>}
        </>
      )}
    </Modal>
  );
}
