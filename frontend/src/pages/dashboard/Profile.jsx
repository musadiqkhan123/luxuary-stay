import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Field from '../../components/ui/Field.jsx';
import ImageUploader from '../../components/ui/ImageUploader.jsx';
import { updateMe, forgotPassword, exportMyData, closeMyAccount } from '../../services/authService.js';
import Icon from '../../components/ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROOM_TYPES, ROLE_LABELS } from '../../utils/constants.js';
import { downloadFile, formatDate } from '../../utils/format.js';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isGuest = user.role === 'guest';

  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', address: user.address || '', city: user.city || '', country: user.country || '',
    preferences: { roomType: '', bedType: '', floor: '', dietary: '', notes: '', ...user.preferences },
    marketing: Boolean(user.consent?.marketing),
    avatar: user.avatar || null,
  });
  const [resetSent, setResetSent] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setPref = (k) => (e) => setForm({ ...form, preferences: { ...form.preferences, [k]: e.target.value } });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updateMe(form);
      setUser(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Password changes go through a secure email link, the same flow as "Forgot password"
  const sendResetLink = async () => {
    setSending(true);
    try {
      await forgotPassword(user.email);
      setResetSent(true);
      toast.success(`Reset link sent to ${user.email}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const download = async () => {
    try {
      const data = await exportMyData();
      downloadFile('luxurystay-my-data.json', JSON.stringify(data, null, 2));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const closeAccount = async () => {
    if (!window.confirm('Close your account? You will be logged out and will not be able to log in again.')) return;
    try {
      const res = await closeMyAccount();
      toast.success(res.message);
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="My profile" description={`${ROLE_LABELS[user.role]} account, ${user.email}`} />
      <div className="grid-2 grid-wide-left">
        <form className="panel stack" onSubmit={saveProfile}>
          <div className="panel-head"><h2>Personal details</h2></div>
          <ImageUploader label="Profile photo" folder="avatars" max={1} round value={form.avatar} onChange={(avatar) => setForm((f) => ({ ...f, avatar }))} hint="Square photos look best. Saved when you press Save profile." />
          <div className="form-grid">
            <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} required /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Address"><input className="input" value={form.address} onChange={set('address')} /></Field>
            <Field label="City"><input className="input" value={form.city} onChange={set('city')} /></Field>
            <Field label="Country"><input className="input" value={form.country} onChange={set('country')} /></Field>
          </div>
          {isGuest && (
            <>
              <h3 className="subhead">Stay preferences</h3>
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
                    <option value="">No preference</option><option value="low">Low</option><option value="high">High</option>
                  </select>
                </Field>
              </div>
              <div className="form-grid">
                <Field label="Dietary needs"><input className="input" value={form.preferences.dietary} onChange={setPref('dietary')} /></Field>
                <Field label="Anything else"><input className="input" value={form.preferences.notes} onChange={setPref('notes')} /></Field>
              </div>
              <label className="checkbox">
                <input type="checkbox" checked={form.marketing} onChange={(e) => setForm({ ...form, marketing: e.target.checked })} />
                <span>Send me occasional offers by email</span>
              </label>
            </>
          )}
          <div><button className="btn btn-primary">Save profile</button></div>
        </form>

        <div className="stack-lg">
          <section className="panel stack security-panel">
            <div className="panel-head"><h2>Password & security</h2></div>
            <div className="security-row">
              <span className="security-icon"><Icon name="lock" size={20} /></span>
              <div>
                <strong>Change your password</strong>
                <p className="muted">
                  For your security we send a one-time link to <strong>{user.email}</strong>. It is valid for 30 minutes,
                  and signing in with the new password logs out your other devices.
                </p>
              </div>
            </div>
            {resetSent ? (
              <p className="form-success"><Icon name="mail" size={16} /> Check your inbox (and spam folder) for the reset link.</p>
            ) : null}
            <div><button className="btn btn-outline" onClick={sendResetLink} disabled={sending}>{sending ? 'Sending…' : resetSent ? 'Send link again' : 'Email me a reset link'}</button></div>
          </section>

          <section className="panel stack">
            <div className="panel-head"><h2>Your data</h2></div>
            <p className="muted">
              {user.consent?.acceptedAt ? `You accepted the privacy notice on ${formatDate(user.consent.acceptedAt)}. ` : ''}
              Download a copy of everything the hotel stores about you.
            </p>
            <div className="row">
              <button className="btn btn-outline" onClick={download}>Download my data</button>
              {isGuest && <button className="btn btn-ghost btn-danger-text" onClick={closeAccount}>Close my account</button>}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
