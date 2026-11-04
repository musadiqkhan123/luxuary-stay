export default function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn btn-sm btn-ghost" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Previous
      </button>
      <span className="muted">
        Page {meta.page} of {meta.pages} ({meta.total} total)
      </span>
      <button className="btn btn-sm btn-ghost" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>
        Next
      </button>
    </nav>
  );
}
