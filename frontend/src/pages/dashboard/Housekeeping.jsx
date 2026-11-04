import { useEffect, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field from '../../components/ui/Field.jsx';
import MaintenanceFormModal from '../../components/dashboard/MaintenanceFormModal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getTasks, getHousekeepers, createTask, updateTask } from '../../services/housekeepingService.js';
import { getRooms } from '../../services/roomService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FRONT_OFFICE, PRIORITIES, TASK_TYPES } from '../../utils/constants.js';
import { titleCase, toInputDate, formatShortDate, timeAgo } from '../../utils/format.js';

const COLUMNS = [
  { status: 'pending', title: 'To do' },
  { status: 'in-progress', title: 'In progress' },
  { status: 'completed', title: 'Done' },
];
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function Housekeeping() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useFetch(() => getTasks(), []);
  const [scheduling, setScheduling] = useState(false);
  const [reportRoom, setReportRoom] = useState(null);
  const [staff, setStaff] = useState([]);
  const canSchedule = FRONT_OFFICE.includes(user.role);

  useEffect(() => {
    if (canSchedule) getHousekeepers().then((res) => setStaff(res.data)).catch(() => {});
  }, [canSchedule]);

  const update = async (task, body) => {
    try {
      const res = await updateTask(task._id, body);
      setData((list) => list.map((t) => (t._id === task._id ? res.data : t)));
      toast.success(body.status === 'completed' && task.room?.status === 'cleaning' ? `Room ${task.room.roomNumber} is ready to sell again.` : res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const todayStr = toInputDate();
  const tasks = (data || []).filter((t) => t.status !== 'completed' || (t.completedAt && toInputDate(t.completedAt) === todayStr));

  return (
    <>
      <PageHeader
        title="Housekeeping"
        description={user.role === 'housekeeping' ? 'Your tasks and unassigned tasks. Start one to claim it.' : 'Cleaning and inspection tasks across the hotel.'}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => setReportRoom('')}><Icon name="wrench" size={16} /> Report a problem</button>
            {canSchedule && <button className="btn btn-primary" onClick={() => setScheduling(true)}><Icon name="plus" size={18} /> Schedule task</button>}
          </>
        }
      />
      <ErrorNote message={error} onRetry={reload} />
      {loading ? <Spinner /> : (
        <div className="kanban">
          {COLUMNS.map((col) => {
            const list = tasks
              .filter((t) => t.status === col.status)
              .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
            return (
              <section key={col.status} className="kanban-col">
                <h2>{col.title} <span className="count">{list.length}</span></h2>
                {list.map((t) => (
                  <article key={t._id} className={`task-card priority-${t.priority}`}>
                    <header>
                      <span className="room-chip">{t.room?.roomNumber}</span>
                      <strong>{TASK_TYPES[t.type]}</strong>
                      <Badge status={t.priority} />
                    </header>
                    {t.notes && <p>{t.notes}</p>}
                    <p className="cell-sub">
                      {t.assignedTo ? `Assigned to ${t.assignedTo.name}` : 'Unassigned'}
                      {t.status === 'completed' ? `, done ${timeAgo(t.completedAt)}` : `, due ${formatShortDate(t.dueDate)}`}
                    </p>
                    {canSchedule && t.status !== 'completed' && (
                      <label className="assign">
                        <span className="sr-only">Assign</span>
                        <select className="input input-sm" value={t.assignedTo?._id || ''} onChange={(e) => update(t, { assignedTo: e.target.value })}>
                          <option value="">Unassigned</option>
                          {staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                      </label>
                    )}
                    <div className="row">
                      {t.status === 'pending' && <button className="btn btn-sm btn-outline" onClick={() => update(t, { status: 'in-progress' })}>Start</button>}
                      {t.status !== 'completed' && <button className="btn btn-sm btn-primary" onClick={() => update(t, { status: 'completed' })}><Icon name="check" size={14} /> Done</button>}
                      {t.status !== 'completed' && <button className="btn btn-sm btn-ghost" onClick={() => setReportRoom(t.room?._id)}>Report issue</button>}
                    </div>
                  </article>
                ))}
                {!list.length && <p className="muted kanban-empty">Nothing here.</p>}
              </section>
            );
          })}
        </div>
      )}

      {canSchedule && <ScheduleModal open={scheduling} staff={staff} onClose={() => setScheduling(false)} onCreated={(t) => { setScheduling(false); setData((list) => [t, ...(list || [])]); }} />}
      <MaintenanceFormModal open={reportRoom !== null} presetRoomId={reportRoom || ''} onClose={() => setReportRoom(null)} onCreated={() => setReportRoom(null)} />
    </>
  );
}

function ScheduleModal({ open, staff, onClose, onCreated }) {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({ roomId: '', type: 'cleaning', priority: 'medium', assignedTo: '', dueDate: toInputDate(), notes: '' });
    getRooms().then((res) => setRooms(res.data)).catch(() => {});
  }, [open]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await createTask(form);
      toast.success(res.message);
      onCreated(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule a housekeeping task"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" form="task-form" className="btn btn-primary">Schedule</button></>}>
      <form id="task-form" onSubmit={submit} className="stack">
        <div className="form-grid">
          <Field label="Room">
            <select className="input" value={form.roomId || ''} onChange={set('roomId')} required>
              <option value="">Choose a room</option>
              {rooms.map((r) => <option key={r._id} value={r._id}>Room {r.roomNumber} ({titleCase(r.status)})</option>)}
            </select>
          </Field>
          <Field label="Task">
            <select className="input" value={form.type} onChange={set('type')}>
              {Object.entries(TASK_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="input" value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}
            </select>
          </Field>
          <Field label="Assign to">
            <select className="input" value={form.assignedTo} onChange={set('assignedTo')}>
              <option value="">Anyone on shift</option>
              {staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Due"><input type="date" className="input" value={form.dueDate || ''} onChange={set('dueDate')} /></Field>
        </div>
        <Field label="Notes"><input className="input" value={form.notes || ''} onChange={set('notes')} maxLength={500} /></Field>
      </form>
    </Modal>
  );
}
