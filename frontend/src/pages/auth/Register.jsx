import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import PasswordInput, { PasswordRules } from '../../components/auth/PasswordInput.jsx';
import Field from '../../components/ui/Field.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', privacyAccepted: false, marketing: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const strong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!strong) {
      setError('Please choose a stronger password.');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim() });
      toast.success('Your account is ready. A welcome email is on its way.');
      navigate(params.get('redirect') || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your guest account"
      subtitle="Book rooms, request services during your stay and keep your invoices in one place."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={submit} className="stack">
        <div className="form-grid">
          <Field label="Full name"><input className="input" autoComplete="name" value={form.name} onChange={set('name')} required maxLength={80} /></Field>
          <Field label="Phone" hint="Optional"><input type="tel" className="input" autoComplete="tel" value={form.phone} onChange={set('phone')} /></Field>
        </div>
        <Field label="Email address"><input type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} required /></Field>
        <Field label="Password">
          <PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" required />
        </Field>
        <PasswordRules value={form.password} />
        <label className="checkbox">
          <input type="checkbox" checked={form.privacyAccepted} onChange={set('privacyAccepted')} required />
          <span>I agree that the hotel stores my details to manage my bookings, as described in the <Link to="/about">privacy notice</Link>.</span>
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={form.marketing} onChange={set('marketing')} />
          <span>Email me occasional offers (optional)</span>
        </label>
        {error && <p className="form-alert" role="alert"><Icon name="alert" size={16} /> {error}</p>}
        <button className="btn btn-primary btn-block btn-lg" disabled={loading || !form.privacyAccepted}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
