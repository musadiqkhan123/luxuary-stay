import { useState } from 'react';
import Icon from '../ui/Icon.jsx';

export default function PasswordInput({ id, value, onChange, autoComplete = 'current-password', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input">
      <input id={id} type={show ? 'text' : 'password'} className="input" value={value} onChange={onChange} autoComplete={autoComplete} {...rest} />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}

// Live checklist shown under "new password" fields
export function PasswordRules({ value = '' }) {
  const rules = [
    ['At least 8 characters', value.length >= 8],
    ['Contains a letter', /[A-Za-z]/.test(value)],
    ['Contains a number', /\d/.test(value)],
  ];
  return (
    <ul className="pw-rules">
      {rules.map(([label, ok]) => (
        <li key={label} className={ok ? 'is-ok' : ''}><Icon name={ok ? 'check' : 'x'} size={13} strokeWidth={2.5} /> {label}</li>
      ))}
    </ul>
  );
}
