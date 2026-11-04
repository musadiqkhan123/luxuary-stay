import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getInvoices } from '../../services/invoiceService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { money, formatDate } from '../../utils/format.js';

const TABS = [
  { value: '', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partially-paid', label: 'Part paid' },
  { value: 'paid', label: 'Paid' },
];

export default function Invoices() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => getInvoices({ status, page }), [status, page]);
  const isGuest = user.role === 'guest';

  return (
    <>
      <PageHeader title={isGuest ? 'My invoices' : 'Invoices'} description="Invoices are created automatically at check-out." />
      <div className="toolbar">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.value} role="tab" aria-selected={status === t.value} className={`tab ${status === t.value ? 'is-on' : ''}`} onClick={() => { setStatus(t.value); setPage(1); }}>{t.label}</button>
          ))}
        </div>
      </div>
      <ErrorNote message={error} onRetry={reload} />
      {loading ? <Spinner /> : data?.length ? (
        <section className="panel">
          <div className="table-wrap">
            <table className="table table-clickable">
              <thead>
                <tr><th>Invoice</th>{!isGuest && <th>Guest</th>}<th>Stay</th><th>Issued</th><th className="num">Total</th><th className="num">Balance</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.map((inv) => (
                  <tr key={inv._id} onClick={() => navigate(`/dashboard/invoices/${inv._id}`)}>
                    <td><Link to={`/dashboard/invoices/${inv._id}`} className="mono-link" onClick={(e) => e.stopPropagation()}>{inv.number}</Link></td>
                    {!isGuest && <td>{inv.guest?.name}</td>}
                    <td>Room {inv.booking?.room?.roomNumber}<span className="cell-sub">{inv.booking?.code}</span></td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td className="num">{money(inv.total, settings.currency)}</td>
                    <td className="num">{money(inv.balance, settings.currency)}</td>
                    <td><Badge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </section>
      ) : !error && <EmptyState icon="receipt" title="No invoices here" text="Invoices appear after check-out." />}
    </>
  );
}
