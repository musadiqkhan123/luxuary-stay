import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import PasswordInput, { PasswordRules } from '../../components/auth/PasswordInput.jsx';
import Field from '../../components/ui/Field.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { resetPassword } from '../../services/authService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!strong) return setError('Please choose a stronger password.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      toast.success(res.message);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something you have not used here before. You will be signed out on other devices."
      footer={<Link to="/forgot-password">Need a new link?</Link>}
    >
      <form onSubmit={submit} className="stack">
        <Field label="New password"><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required autoFocus /></Field>
        <PasswordRules value={password} />
        <Field label="Repeat new password"><PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></Field>
        {error && <p className="form-alert" role="alert"><Icon name="alert" size={16} /> {error}</p>}
        <button className="btn btn-primary btn-block btn-lg" disabled={loading}>{loading ? 'Saving…' : 'Save new password'}</button>
      </form>
    </AuthLayout>
  );
}
