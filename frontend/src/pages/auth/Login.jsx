import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import PasswordInput from '../../components/auth/PasswordInput.jsx';
import Field from '../../components/ui/Field.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(params.get('redirect') || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const redirect = params.get('redirect');

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Guests and hotel staff sign in here with their registered email."
      footer={<>New guest? <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>Create an account</Link></>}
    >
      <form onSubmit={submit} className="stack" noValidate>
        <Field label="Email address">
          <input type="email" className="input" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoFocus />
        </Field>
        <div className="field">
          <div className="field-row">
            <label className="field-label" htmlFor="login-password">Password</label>
            <Link to="/forgot-password" className="field-link">Forgot password?</Link>
          </div>
          <PasswordInput id="login-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        {error && <p className="form-alert" role="alert"><Icon name="alert" size={16} /> {error}</p>}
        <button className="btn btn-primary btn-block btn-lg" disabled={loading || !form.email || !form.password}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
