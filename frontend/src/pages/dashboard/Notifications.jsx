import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Icon from '../../components/ui/Icon.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getNotifications, markRead, markAllRead } from '../../services/notificationService.js';
import { timeAgo } from '../../utils/format.js';

const ICONS = { info: 'info', success: 'check', warning: 'alert', alert: 'bell' };

export default function Notifications() {
  const navigate = useNavigate();
  const { data, meta, loading, error, reload, setData } = useFetch(() => getNotifications(), []);

  const changed = () => window.dispatchEvent(new Event('notifications:changed'));

  const open = async (n) => {
    if (!n.isRead) {
      await markRead(n._id).catch(() => {});
      setData((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      changed();
    }
    if (n.link) navigate(n.link);
  };

  const readAll = async () => {
    await markAllRead();
    setData((list) => list.map((x) => ({ ...x, isRead: true })));
    changed();
  };

  const unread = data?.filter((n) => !n.isRead).length ?? meta?.unread ?? 0;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : 'You are all caught up.'}
        actions={unread > 0 && <button className="btn btn-outline" onClick={readAll}>Mark all as read</button>}
      />
      <ErrorNote message={error} onRetry={reload} />
      {loading ? <Spinner /> : data?.length ? (
        <ul className="notif-list panel">
          {data.map((n) => (
            <li key={n._id}>
              <button className={`notif ${n.isRead ? '' : 'is-unread'} notif-${n.type}`} onClick={() => open(n)}>
                <span className="notif-icon"><Icon name={ICONS[n.type]} size={18} /></span>
                <span className="notif-body">
                  <strong>{n.title}</strong>
                  {n.message && <span>{n.message}</span>}
                </span>
                <span className="notif-time">{timeAgo(n.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : !error && <EmptyState icon="bell" title="No notifications" text="Alerts about bookings, tasks and requests will show up here." />}
    </>
  );
}
