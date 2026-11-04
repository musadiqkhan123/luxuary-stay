import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import Field from '../../components/ui/Field.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { forgotPassword } from '../../services/authService.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setSent(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? 'Check your email' : 'Forgot your password?'}
      subtitle={sent ? '' : 'Enter the email you sign in with and we will send you a secure link to choose a new password.'}
      footer={<><Link to="/login" className="text-link"><Icon name="back" size={15} /> Back to sign in</Link></>}
    >
      {sent ? (
        <div className="auth-success">
          <span className="auth-success-icon"><Icon name="mail" size={26} /></span>
          <p>{sent}</p>
          <p className="muted">The link is valid for 30 minutes and can be used once. Did not get it?</p>
          <button className="btn btn-outline" onClick={() => setSent('')}>Send again</button>
        </div>
      ) : (
        <form onSubmit={submit} className="stack">
          <Field label="Email address">
            <input type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          {error && <p className="form-alert" role="alert"><Icon name="alert" size={16} /> {error}</p>}
          <button className="btn btn-primary btn-block btn-lg" disabled={loading || !email}>{loading ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
    </AuthLayout>
  );
}
