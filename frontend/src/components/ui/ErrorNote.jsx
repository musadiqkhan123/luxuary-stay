import Icon from './Icon.jsx';

export default function ErrorNote({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-note" role="alert">
      <Icon name="alert" size={18} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
