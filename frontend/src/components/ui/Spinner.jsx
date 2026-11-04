export default function Spinner({ label = 'Loading…', block = true }) {
  return (
    <div className={block ? 'spinner-block' : 'spinner-inline'} role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
