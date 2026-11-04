import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field from '../../components/ui/Field.jsx';
import MaintenanceFormModal from '../../components/dashboard/MaintenanceFormModal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getMaintenance, updateMaintenance } from '../../services/maintenanceService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FRONT_OFFICE, PRIORITIES, ROLE_LABELS } from '../../utils/constants.js';
import { titleCase, timeAgo, formatDateTime } from '../../utils/format.js';

export default function Maintenance() {
  const { user } = useAuth();
  const [status, setStatus] = useState(user.role === 'guest' ? '' : 'open');
  const [reporting, setReporting] = useState(false);
  const [editing, setEditing] = useState(null);
  const { data, loading, error, reload, setData } = useFetch(() => getMaintenance({ status }), [status]);
  const canUpdate = FRONT_OFFICE.includes(user.role);

  return (
    <>
      <PageHeader
        title={user.role === 'guest' ? 'Report a problem' : 'Maintenance'}
        description={user.role === 'guest' ? 'Something not working in your room? Tell us and track the fix.' : 'Repairs and issues reported by staff and guests.'}
        actions={<button className="btn btn-primary" onClick={() => setReporting(true)}><Icon name="plus" size={18} /> Report a problem</button>}
      />
      <div className="toolbar">
        <div className="tabs" role="tablist">
          {[['', 'All'], ['open', 'Open'], ['in-progress', 'In progress'], ['resolved', 'Resolved']].map(([v, l]) => (
            <button key={v} role="tab" aria-selected={status === v} className={`tab ${status === v ? 'is-on' : ''}`} onClick={() => setStatus(v)}>{l}</button>
          ))}
        </div>
      </div>
      <ErrorNote message={error} onRetry={reload} />
      {loading ? <Spinner /> : data?.length ? (
        <section className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Issue</th><th>Where</th><th>Priority</th><th>Reported</th><th>Status</th>{canUpdate && <th />}</tr></thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <strong>{m.title}</strong>
                      {m.description && <span className="cell-sub">{m.description}</span>}
                      {m.resolutionNote && <span className="cell-sub">Fix: {m.resolutionNote}</span>}
                      {m.photos?.length > 0 && (
                        <span className="photo-strip">
                          {m.photos.map((p, i) => (
                            <a key={p.url} href={p.url} target="_blank" rel="noreferrer" aria-label={`Photo ${i + 1} of the problem`}>
                              <img src={p.url} alt="" loading="lazy" />
                            </a>
                          ))}
                        </span>
                      )}
                    </td>
                    <td>{m.room ? `Room ${m.room.roomNumber}` : m.location}{m.roomBlocked && m.status !== 'resolved' && <span className="cell-sub">Out of service</span>}</td>
                    <td><Badge status={m.priority} /></td>
                    <td>{timeAgo(m.createdAt)}<span className="cell-sub">{m.reportedBy?.name}{m.reportedBy ? `, ${ROLE_LABELS[m.reportedBy.role]}` : ''}</span></td>
                    <td><Badge status={m.status} />{m.resolvedAt && <span className="cell-sub">{formatDateTime(m.resolvedAt)}</span>}</td>
                    {canUpdate && <td className="num"><button className="btn btn-sm btn-outline" onClick={() => setEditing(m)}>Update</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : !error && <EmptyState icon="wrench" title="Nothing reported" text="All clear for now." />}

      <MaintenanceFormModal open={reporting} onClose={() => setReporting(false)} onCreated={() => { setReporting(false); reload(); }} />
      <UpdateModal item={editing} onClose={() => setEditing(null)} onSaved={(updated) => { setEditing(null); setData((list) => list.map((x) => (x._id === updated._id ? updated : x))); }} />
    </>
  );
}

function UpdateModal({ item, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null);

  if (item && (!form || form._id !== item._id)) {
    setForm({ _id: item._id, status: item.status, priority: item.priority, resolutionNote: item.resolutionNote || '' });
  }

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { _id, ...body } = form;
      const res = await updateMaintenance(_id, body);
      toast.success(res.message);
      onSaved(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={item?.title}
      subtitle={item?.room ? `Room ${item.room.roomNumber}` : item?.location}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" form="mnt-form" className="btn btn-primary">Save</button></>}
    >
      {form && (
        <form id="mnt-form" onSubmit={submit} className="stack">
          <div className="form-grid">
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="open">Open</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option>
              </select>
            </Field>
            <Field label="Priority">
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="What was done?" hint="Shown to the person who reported it.">
            <textarea className="input" rows="3" value={form.resolutionNote} onChange={(e) => setForm({ ...form, resolutionNote: e.target.value })} />
          </Field>
          {form.status === 'resolved' && item?.room?.status === 'maintenance' && (
            <p className="note">Room {item.room.roomNumber} will go to housekeeping for an inspection before it can be sold again.</p>
          )}
        </form>
      )}
    </Modal>
  );
}
