// On phones, data tables turn into stacked cards. This copies each column heading
// into a data-label attribute on its cells so CSS can show "Label: value" rows.
const SKIP = ['table-compact', 'invoice-table', 'perm-table'];

const labelTable = (table) => {
  if (SKIP.some((c) => table.classList.contains(c))) return;
  const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim());
  if (!headers.length) return;
  table.classList.add('table-stack');
  table.querySelectorAll('tbody tr').forEach((row) => {
    Array.from(row.children).forEach((cell, i) => {
      if (cell.getAttribute('data-label') !== headers[i]) cell.setAttribute('data-label', headers[i] || '');
    });
  });
};

export const startResponsiveTables = () => {
  let scheduled = false;
  const run = () => {
    scheduled = false;
    document.querySelectorAll('table.table').forEach(labelTable);
  };
  new MutationObserver(() => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(run);
    }
  }).observe(document.body, { childList: true, subtree: true });
  run();
};
