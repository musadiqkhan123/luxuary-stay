import { cloneElement, isValidElement, useId } from 'react';

// <Field label="Email"><input className="input" /></Field>
export default function Field({ label, hint, error, children, className = '' }) {
  const id = useId();
  const control = isValidElement(children) ? cloneElement(children, { id: children.props.id || id }) : children;
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field-label" htmlFor={children?.props?.id || id}>
          {label}
        </label>
      )}
      {control}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
