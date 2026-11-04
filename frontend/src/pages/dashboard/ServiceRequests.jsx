import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Field from '../../components/ui/Field.jsx';
import Icon from '../../components/ui/Icon.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getServiceRequests, createServiceRequest, updateServiceRequest } from '../../services/serviceRequestService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { SERVICE_TYPES } from '../../utils/constants.js';
import { money, formatDateTime, timeAgo } from '../../utils/format.js';

const SERVICE_ICONS = { 'room-service': 'utensils', laundry: 'shirt', 'wake-up-call': 'sun', transport: 'car', spa: 'leaf', housekeeping: 'sparkle', other: 'concierge' };

export default function ServiceRequests() {
  const { user } = useAuth();
  const isGuest = user.role === 'guest';
  const [status, setStatus] = useState(isGuest ? '' : 'pending');
  const { data, loading, error, reload, setData } = useFetch(() => getServiceRequests({ status }), [status]);

  return (
    <>
      <PageHeader
        title={isGuest ? 'Requests' : 'Guest services'}
        description={isGuest ? 'Ask for anything during your stay. Charges are added to your bill.' : 'Room service, laundry, transport and other requests from in-house guests.'}
      />
      {isGuest && <GuestRequestForm onCreated={(r) => setData((list) => [r, ...(list || [])])} />}

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {[['', 'All'], ['pending', 'New'], ['in-progress', 'In progress'], ['completed', 'Done'], ['cancelled', 'Cancelled']].map(([v, l]) => (
            <button key={v} role="tab" aria-selected={status === v} className={`tab ${status === v ? 'is-on' : ''}`} onClick={() => setStatus(v)}>{l}</button>
          ))}
        </div>
      </div>

      <ErrorNote message={error} onRetry={reload} />
      {loading ? <Spinner /> : data?.length ? (
        <ul className="request-list">
          {data.map((r) => <RequestItem key={r._id} request={r} isGuest={isGuest} onChange={(updated) => setData((list) => list.map((x) => (x._id === updated._id ? updated : x)))} />)}
        </ul>
      ) : !error && <EmptyState icon="concierge" title="No requests here" text={isGuest ? 'Use the form above to ask for something.' : 'New guest requests will appear here.'} />}
    </>
  );
}

function RequestItem({ request: r, isGuest, onChange }) {
  const toast = useToast();
  const { settings } = useSettings();
  const [charge, setCharge] = useState(r.charge);

  const update = async (body) => {
    try {
      const res = await updateServiceRequest(r._id, body);
      onChange(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const open = ['pending', 'in-progress'].includes(r.status);

  return (
    <li className="request">
      <span className="service-icon"><Icon name={SERVICE_ICONS[r.type] || 'concierge'} size={20} /></span>
      <div className="request-body">
        <p className="request-title">
          <strong>{SERVICE_TYPES[r.type]}</strong>
          {!isGuest && <span> for room {r.room?.roomNumber}, {r.guest?.name}</span>}
        </p>
        {r.details && <p>{r.details}</p>}
        <p className="cell-sub">
          Requested {timeAgo(r.createdAt)}
          {r.scheduledFor ? `, for ${formatDateTime(r.scheduledFor)}` : ''}
          {r.handledBy ? `, handled by ${r.handledBy.name}` : ''}
        </p>
      </div>
      <div className="request-side">
        <Badge status={r.status} />
        {!isGuest && open && !r.billed ? (
          <label className="charge-input">
            <span className="sr-only">Charge</span>
            <input type="number" min="0" className="input input-sm" value={charge} onChange={(e) => setCharge(e.target.value)} onBlur={() => Number(charge) !== r.charge && update({ charge: Number(charge) })} />
          </label>
        ) : (
          <span className="num">{r.charge ? money(r.charge, settings.currency) : 'Free'}</span>
        )}
        {!isGuest && r.status === 'pending' && <button className="btn btn-sm btn-outline" onClick={() => update({ status: 'in-progress' })}>Start</button>}
        {!isGuest && open && <button className="btn btn-sm btn-primary" onClick={() => update({ status: 'completed' })}>Mark done</button>}
        {open && (isGuest ? r.status === 'pending' : true) && (
          <button className="btn btn-sm btn-ghost" onClick={() => update({ status: 'cancelled' })}>Cancel</button>
        )}
      </div>
    </li>
  );
}

function GuestRequestForm({ onCreated }) {
  const toast = useToast();
  const { settings } = useSettings();
  const [form, setForm] = useState({ type: 'room-service', details: '', scheduledFor: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const price = settings.servicePrices?.[form.type] ?? 0;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await createServiceRequest({ ...form, scheduledFor: form.scheduledFor || undefined });
      toast.success(res.message);
      onCreated(res.data);
      setForm({ type: form.type, details: '', scheduledFor: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel request-form" onSubmit={submit}>
      <div className="service-picker" role="radiogroup" aria-label="Service">
        {Object.entries(SERVICE_TYPES).map(([v, l]) => (
          <button type="button" key={v} role="radio" aria-checked={form.type === v} className={`service-pick ${form.type === v ? 'is-on' : ''}`} onClick={() => setForm({ ...form, type: v })}>
            <Icon name={SERVICE_ICONS[v]} size={22} />
            <span>{l}</span>
          </button>
        ))}
      </div>
      <div className="form-grid">
        <Field label="Details" hint={price ? `Usually ${money(price, settings.currency)}, added to your bill.` : 'No charge.'}>
          <input className="input" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="What do you need?" maxLength={500} />
        </Field>
        <Field label="When" hint="Leave empty for as soon as possible.">
          <input type="datetime-local" className="input" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} />
        </Field>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>Send request</button>
    </form>
  );
}
