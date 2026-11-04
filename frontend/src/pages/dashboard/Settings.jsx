import { useEffect, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Field from '../../components/ui/Field.jsx';
import ImageUploader from '../../components/ui/ImageUploader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { updateSettings, applyRoomRates } from '../../services/settingService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROOM_TYPES, SERVICE_TYPES } from '../../utils/constants.js';

export default function Settings() {
  const { settings, setSettings } = useSettings();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?._id) setForm(structuredClone(settings));
  }, [settings]);

  if (!form) return <Spinner />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setNested = (group, key, isNumber = false) => (e) =>
    setForm({ ...form, [group]: { ...form[group], [key]: isNumber ? Number(e.target.value) : e.target.value } });

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const { hotelName, email, phone, address, currency, checkInTime, checkOutTime, roomRates, servicePrices, policies } = form;
      const res = await updateSettings({ heroImage: form.heroImage || null, hotelName, email, phone, address, currency, taxRate: Number(form.taxRate), checkInTime, checkOutTime, roomRates, servicePrices, policies });
      setSettings(res.data);
      toast.success(res.message);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAndApplyRates = async () => {
    if (!window.confirm('Save and apply these standard rates to every room? Existing bookings keep their original rate.')) return;
    if (!(await save())) return;
    try {
      const res = await applyRoomRates();
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Hotel details, rates, taxes and policies used across the system." />
      <form onSubmit={save} className="settings-form">
        <section className="panel">
          <div className="panel-head"><h2>Hotel details</h2></div>
          <div className="form-grid">
            <Field label="Hotel name"><input className="input" value={form.hotelName} onChange={set('hotelName')} /></Field>
            <Field label="Email"><input type="email" className="input" value={form.email} onChange={set('email')} /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Address"><input className="input" value={form.address} onChange={set('address')} /></Field>
          </div>
          <div className="settings-hero">
            <ImageUploader label="Homepage photo" folder="hotel" max={1} value={form.heroImage} onChange={(heroImage) => setForm((f) => ({ ...f, heroImage }))} hint="The large photo on the website's first screen. Landscape or portrait, at least 1400 px wide." />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Billing & times</h2></div>
          <div className="form-grid form-grid-4">
            <Field label="Currency code" hint="ISO code, e.g. PKR, USD"><input className="input" value={form.currency} onChange={set('currency')} maxLength={3} /></Field>
            <Field label="Tax rate (%)"><input type="number" min="0" max="50" step="0.5" className="input" value={form.taxRate} onChange={set('taxRate')} /></Field>
            <Field label="Check-in from"><input type="time" className="input" value={form.checkInTime} onChange={set('checkInTime')} /></Field>
            <Field label="Check-out by"><input type="time" className="input" value={form.checkOutTime} onChange={set('checkOutTime')} /></Field>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Standard room rates</h2>
            <button type="button" className="btn btn-sm btn-outline" onClick={saveAndApplyRates}>Save and apply to all rooms</button>
          </div>
          <div className="form-grid form-grid-4">
            {Object.entries(ROOM_TYPES).map(([type, t]) => (
              <Field key={type} label={`${t.label} (${form.currency})`}>
                <input type="number" min="0" className="input" value={form.roomRates?.[type] ?? 0} onChange={setNested('roomRates', type, true)} />
              </Field>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Service prices</h2></div>
          <p className="muted">Default charge added when a guest requests a service. Staff can adjust each request.</p>
          <div className="form-grid form-grid-4">
            {Object.entries(SERVICE_TYPES).map(([type, label]) => (
              <Field key={type} label={label}>
                <input type="number" min="0" className="input" value={form.servicePrices?.[type] ?? 0} onChange={setNested('servicePrices', type, true)} />
              </Field>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Policies</h2></div>
          <div className="stack">
            <Field label="Cancellation"><textarea className="input" rows="2" value={form.policies?.cancellation || ''} onChange={setNested('policies', 'cancellation')} /></Field>
            <Field label="Children"><textarea className="input" rows="2" value={form.policies?.children || ''} onChange={setNested('policies', 'children')} /></Field>
            <Field label="Pets"><textarea className="input" rows="2" value={form.policies?.pets || ''} onChange={setNested('policies', 'pets')} /></Field>
          </div>
        </section>

        <div className="sticky-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        </div>
      </form>
    </>
  );
}
