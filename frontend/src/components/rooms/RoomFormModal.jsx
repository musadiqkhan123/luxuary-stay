import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import ImageUploader from '../ui/ImageUploader.jsx';
import { createRoom, updateRoom } from '../../services/roomService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ROOM_TYPES, AMENITY_OPTIONS } from '../../utils/constants.js';

const EMPTY = {
  roomNumber: '', type: 'classic', floor: 1, pricePerNight: '', maxGuests: 2, bedType: 'king',
  size: 30, view: 'City', amenities: [], images: [], description: '', isActive: true,
};

export default function RoomFormModal({ open, room, onClose, onSaved }) {
  const toast = useToast();
  const { settings } = useSettings();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(room ? { ...EMPTY, ...room, images: (room.images || []).map((img) => (typeof img === 'string' ? { url: img, publicId: '' } : img)) } : { ...EMPTY, pricePerNight: settings.roomRates?.classic || '' });
  }, [open, room, settings.roomRates]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Suggest the standard rate when a new room's type changes
      if (key === 'type' && !room && settings.roomRates?.[value]) next.pricePerNight = settings.roomRates[value];
      return next;
    });
  };

  const toggleAmenity = (a) =>
    setForm((f) => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      floor: Number(form.floor),
      pricePerNight: Number(form.pricePerNight),
      maxGuests: Number(form.maxGuests),
      size: Number(form.size),
    };
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.__v;
    try {
      const res = room ? await updateRoom(room._id, payload) : await createRoom(payload);
      toast.success(res.message);
      onSaved(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={room ? `Edit room ${room.roomNumber}` : 'Add a room'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="room-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : room ? 'Save changes' : 'Add room'}</button>
        </>
      }
    >
      <form id="room-form" onSubmit={submit} className="stack">
        <div className="form-grid form-grid-3">
          <Field label="Room number"><input className="input" value={form.roomNumber} onChange={set('roomNumber')} required /></Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={set('type')}>
              {Object.entries(ROOM_TYPES).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Floor"><input type="number" min="0" className="input" value={form.floor} onChange={set('floor')} required /></Field>
          <Field label={`Price per night (${settings.currency})`}><input type="number" min="0" className="input" value={form.pricePerNight} onChange={set('pricePerNight')} required /></Field>
          <Field label="Max guests"><input type="number" min="1" max="10" className="input" value={form.maxGuests} onChange={set('maxGuests')} /></Field>
          <Field label="Bed">
            <select className="input" value={form.bedType} onChange={set('bedType')}>
              <option value="king">King</option><option value="queen">Queen</option><option value="twin">Twin</option>
            </select>
          </Field>
          <Field label="Size (m²)"><input type="number" min="0" className="input" value={form.size} onChange={set('size')} /></Field>
          <Field label="View"><input className="input" value={form.view} onChange={set('view')} /></Field>
          <Field label="Listed on website">
            <label className="checkbox inline"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /><span>Active</span></label>
          </Field>
        </div>
        <Field label="Description"><textarea className="input" rows="3" value={form.description} onChange={set('description')} maxLength={1000} /></Field>
        <fieldset className="field">
          <legend className="field-label">Amenities</legend>
          <div className="chips">
            {AMENITY_OPTIONS.map((a) => (
              <button type="button" key={a} className={`chip ${form.amenities.includes(a) ? 'is-on' : ''}`} aria-pressed={form.amenities.includes(a)} onClick={() => toggleAmenity(a)}>{a}</button>
            ))}
          </div>
        </fieldset>
        <ImageUploader
          label="Room photos"
          folder="rooms"
          max={8}
          value={form.images}
          onChange={(images) => setForm((f) => ({ ...f, images }))}
          hint="Drag photos here or click to choose. The first photo is the cover. Stored on Cloudinary, up to 8."
        />
        {error && <p className="field-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}
