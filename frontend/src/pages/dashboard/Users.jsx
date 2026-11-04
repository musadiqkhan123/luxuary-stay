import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field from '../../components/ui/Field.jsx';
import ImageUploader from '../../components/ui/ImageUploader.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getUsers, createUser, updateUser, setUserStatus, getPermissions, sendPasswordReset } from '../../services/userService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROLE_LABELS } from '../../utils/constants.js';
import { formatDateTime } from '../../utils/format.js';

const STAFF_ROLE_OPTIONS = ['admin', 'manager', 'receptionist', 'housekeeping'];

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('staff');
  const [editing, setEditing] = useState(null); // 'new' | user
  const { data, loading, error, reload, setData } = useFetch(() => getUsers({ role: 'staff', limit: 100 }), []);
  const { data: permissions } = useFetch(() => getPermissions(), []);

  const replace = (u) => setData((list) => list.map((x) => (x._id === u._id ? u : x)));

  const changeRole = async (u, role) => {
    try {
      const res = await updateUser(u._id, { role });
      replace(res.data);
      toast.success(`${u.name} is now ${ROLE_LABELS[role]}.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (u) => {
    try {
      const res = await setUserStatus(u._id, !u.isActive);
      replace(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Staff & roles"
        description="Create staff accounts, change roles and switch access on or off."
        actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" size={18} /> Add staff member</button>}
      />
      <div className="tabs tabs-spaced" role="tablist">
        <button role="tab" aria-selected={tab === 'staff'} className={`tab ${tab === 'staff' ? 'is-on' : ''}`} onClick={() => setTab('staff')}>Staff accounts</button>
        <button role="tab" aria-selected={tab === 'permissions'} className={`tab ${tab === 'permissions' ? 'is-on' : ''}`} onClick={() => setTab('permissions')}>What each role can do</button>
      </div>

      {tab === 'staff' && (
        <>
          <ErrorNote message={error} onRetry={reload} />
          {loading ? <Spinner /> : (
            <section className="panel">
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Name</th><th>Role</th><th>Job title</th><th>Last login</th><th>Access</th><th /></tr></thead>
                  <tbody>
                    {data.map((u) => {
                      const self = u._id === me._id;
                      return (
                        <tr key={u._id}>
                          <td><span className="person"><Avatar user={u} size={34} /><span><strong>{u.name}</strong><span className="cell-sub">{u.email}</span></span></span></td>
                          <td>
                            <select className="input input-sm" value={u.role} disabled={self} onChange={(e) => changeRole(u, e.target.value)} aria-label={`Role for ${u.name}`}>
                              {STAFF_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                          </td>
                          <td>{u.jobTitle || '—'}</td>
                          <td>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</td>
                          <td><Badge status={u.isActive ? 'active' : 'inactive'} /></td>
                          <td className="num">
                            <button className="btn btn-sm btn-ghost" onClick={() => setEditing(u)}>Edit</button>
                            {!self && <button className="btn btn-sm btn-outline" onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {tab === 'permissions' && permissions && (
        <section className="panel">
          <div className="table-wrap">
            <table className="table perm-table">
              <thead><tr><th>Area</th>{Object.keys(ROLE_LABELS).map((r) => <th key={r}>{ROLE_LABELS[r]}</th>)}</tr></thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.module}>
                    <td><strong>{p.module}</strong></td>
                    {Object.keys(ROLE_LABELS).map((r) => (
                      <td key={r} className={p[r] === 'none' ? 'perm-none' : p[r] === 'full' ? 'perm-full' : 'perm-some'}>{p[r] === 'none' ? '—' : p[r]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <StaffModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
    </>
  );
}

function StaffModal({ user, onClose, onSaved }) {
  const toast = useToast();
  const isNew = user === 'new';
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const key = isNew ? 'new' : user?._id;
  if (user && form?._key !== key) {
    setError('');
    setForm(isNew
      ? { _key: 'new', name: '', email: '', phone: '', role: 'receptionist', jobTitle: '', avatar: null }
      : { _key: key, name: user.name, email: user.email, phone: user.phone, role: user.role, jobTitle: user.jobTitle, avatar: user.avatar || null });
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const resetLink = async () => {
    try {
      const res = await sendPasswordReset(user._id);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const { _key, ...body } = form;
    try {
      const res = isNew ? await createUser(body) : await updateUser(user._id, body);
      if (res.tempPassword) toast.info(`${res.message} Email is not set up, so share this temporary password: ${res.tempPassword}`, { autoClose: false });
      else toast.success(res.message);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal open={Boolean(user)} onClose={onClose} title={isNew ? 'Add staff member' : `Edit ${user?.name}`}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" form="staff-form" className="btn btn-primary">{isNew ? 'Create account' : 'Save changes'}</button></>}>
      {form && (
        <form id="staff-form" onSubmit={submit} className="stack">
          <ImageUploader label="Profile photo" folder="avatars" max={1} round value={form.avatar} onChange={(avatar) => setForm((f) => ({ ...f, avatar }))} />
          <div className="form-grid">
            <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} required /></Field>
            <Field label="Email"><input type="email" className="input" value={form.email} onChange={set('email')} required /></Field>
            <Field label="Phone"><input className="input" value={form.phone || ''} onChange={set('phone')} /></Field>
            <Field label="Job title"><input className="input" value={form.jobTitle || ''} onChange={set('jobTitle')} /></Field>
            <Field label="Role">
              <select className="input" value={form.role} onChange={set('role')}>
                {STAFF_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </Field>
          </div>
          {isNew ? (
            <p className="note">The new team member gets an email with a secure link to set their own password (valid 48 hours).</p>
          ) : (
            <div className="security-row">
              <span className="security-icon"><Icon name="lock" size={18} /></span>
              <div>
                <strong>Password</strong>
                <p className="muted">Passwords are never shown. Send a reset link to {user?.email} if they cannot sign in.</p>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={resetLink}>Send reset email</button>
            </div>
          )}
          {error && <p className="field-error" role="alert">{error}</p>}
        </form>
      )}
    </Modal>
  );
}
