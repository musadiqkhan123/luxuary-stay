import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import ImageUploader from '../ui/ImageUploader.jsx';
import { reportIssue } from '../../services/maintenanceService.js';
import { getRooms } from '../../services/roomService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PRIORITIES } from '../../utils/constants.js';
import { titleCase } from '../../utils/format.js';

export default function MaintenanceFormModal({ open, onClose, onCreated, presetRoomId = '' }) {
  const { user } = useAuth();
  const toast = useToast();
  const isGuest = user.role === 'guest';
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({ title: '', description: '', priority: 'medium', roomId: presetRoomId, location: '', blockRoom: false, photos: [] });
    if (!isGuest) getRooms().then((res) => setRooms(res.data)).catch(() => {});
  }, [open, isGuest, presetRoomId]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await reportIssue(form);
      toast.success(res.message);
      onCreated(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report a problem"
      subtitle={isGuest ? 'We will send someone to your room.' : 'Maintenance and managers are notified straight away.'}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" form="issue-form" className="btn btn-primary">Send report</button></>}
    >
      <form id="issue-form" onSubmit={submit} className="stack">
        <Field label="What is wrong?"><input className="input" value={form.title || ''} onChange={set('title')} placeholder="e.g. AC not cooling" required maxLength={120} /></Field>
        <Field label="More detail" hint="Optional"><textarea className="input" rows="3" value={form.description || ''} onChange={set('description')} maxLength={1000} /></Field>
        <div className="form-grid">
          {!isGuest && (
            <Field label="Room">
              <select className="input" value={form.roomId || ''} onChange={set('roomId')}>
                <option value="">Not a room (public area)</option>
                {rooms.map((r) => <option key={r._id} value={r._id}>Room {r.roomNumber}</option>)}
              </select>
            </Field>
          )}
          {!isGuest && !form.roomId && (
            <Field label="Location"><input className="input" value={form.location || ''} onChange={set('location')} placeholder="e.g. Lobby, Pool" required /></Field>
          )}
          <Field label="How urgent?">
            <select className="input" value={form.priority || 'medium'} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}
            </select>
          </Field>
        </div>
        <ImageUploader label="Photos of the problem (optional)" folder="maintenance" max={4} value={form.photos || []} onChange={(photos) => setForm((f) => ({ ...f, photos }))} />
        {!isGuest && form.roomId && (
          <label className="checkbox">
            <input type="checkbox" checked={Boolean(form.blockRoom)} onChange={set('blockRoom')} />
            <span>Take the room out of service until it is fixed (not possible while a guest is in it)</span>
          </label>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}
