import { useMemo, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import RoomFormModal from '../../components/rooms/RoomFormModal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getRooms, updateRoomStatus, deleteRoom } from '../../services/roomService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ROOM_STATUS, ROOM_TYPES, MANAGEMENT } from '../../utils/constants.js';
import { money } from '../../utils/format.js';

const STATUS_OPTIONS = {
  housekeeping: ['available', 'cleaning', 'maintenance'],
  default: Object.keys(ROOM_STATUS),
};

export default function RoomBoard() {
  const { user } = useAuth();
  const toast = useToast();
  const { settings } = useSettings();
  const { data: rooms, loading, error, reload, setData } = useFetch(() => getRooms(), []);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | room
  const [busy, setBusy] = useState(false);

  const canManage = MANAGEMENT.includes(user.role);
  const statusOptions = STATUS_OPTIONS[user.role] || STATUS_OPTIONS.default;

  const counts = useMemo(() => {
    const c = Object.fromEntries(Object.keys(ROOM_STATUS).map((s) => [s, 0]));
    (rooms || []).filter((r) => r.isActive).forEach((r) => { c[r.status] += 1; });
    return c;
  }, [rooms]);

  const floors = useMemo(() => {
    const map = new Map();
    (rooms || [])
      .filter((r) => !filter || r.status === filter)
      .forEach((r) => map.set(r.floor, [...(map.get(r.floor) || []), r]));
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [rooms, filter]);

  const replaceRoom = (room) => setData((list) => list.map((r) => (r._id === room._id ? room : r)));

  const changeStatus = async (status) => {
    setBusy(true);
    try {
      const res = await updateRoomStatus(selected._id, status);
      replaceRoom(res.data);
      setSelected(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove room ${selected.roomNumber}? Rooms with booking history are retired instead of deleted.`)) return;
    try {
      const res = await deleteRoom(selected._id);
      toast.success(res.message);
      setSelected(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Room board"
        description="Live status of every room. Select a room to update it."
        actions={canManage && <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" size={18} /> Add room</button>}
      />

      <div className="chips status-filter" role="group" aria-label="Filter by status">
        <button className={`chip ${!filter ? 'is-on' : ''}`} onClick={() => setFilter('')}>All rooms <strong>{rooms?.filter((r) => r.isActive).length || 0}</strong></button>
        {Object.entries(ROOM_STATUS).map(([s, label]) => (
          <button key={s} className={`chip chip-status ${filter === s ? 'is-on' : ''}`} onClick={() => setFilter(filter === s ? '' : s)}>
            <span className={`dot seg-${s}`} /> {label} <strong>{counts[s]}</strong>
          </button>
        ))}
      </div>

      <ErrorNote message={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : (
        <div className="floors">
          {floors.map(([floor, list]) => (
            <section key={floor} className="floor">
              <h2 className="floor-label">Floor {floor}</h2>
              <div className="room-tiles">
                {list.map((r) => (
                  <button key={r._id} className={`room-tile tile-${r.status} ${r.isActive ? '' : 'is-retired'}`} onClick={() => setSelected(r)}>
                    <span className="tile-number">{r.roomNumber}</span>
                    <span className="tile-type">{ROOM_TYPES[r.type]?.short}</span>
                    <span className="tile-status">{r.isActive ? ROOM_STATUS[r.status] : 'Retired'}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!floors.length && <p className="muted">No rooms with this status.</p>}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Room ${selected.roomNumber}` : ''}
        subtitle={selected ? `${ROOM_TYPES[selected.type]?.label}, floor ${selected.floor}` : ''}
        footer={
          canManage && selected && (
            <>
              <button className="btn btn-ghost btn-danger-text" onClick={remove}><Icon name="trash" size={16} /> Remove</button>
              <button className="btn btn-outline" onClick={() => { setEditing(selected); setSelected(null); }}><Icon name="edit" size={16} /> Edit details</button>
            </>
          )
        }
      >
        {selected && (
          <div className="stack">
            <dl className="kv">
              <div><dt>Status</dt><dd><Badge status={selected.status} /></dd></div>
              <div><dt>Rate</dt><dd>{money(selected.pricePerNight, settings.currency)} per night</dd></div>
              <div><dt>Sleeps</dt><dd>{selected.maxGuests} guests, {selected.bedType} bed</dd></div>
              <div><dt>Size & view</dt><dd>{selected.size} m², {selected.view}</dd></div>
            </dl>
            <div>
              <p className="field-label">Set status</p>
              <div className="chips">
                {statusOptions.map((s) => (
                  <button key={s} className={`chip chip-status ${selected.status === s ? 'is-on' : ''}`} disabled={busy || selected.status === s} onClick={() => changeStatus(s)}>
                    <span className={`dot seg-${s}`} /> {ROOM_STATUS[s]}
                  </button>
                ))}
              </div>
              <p className="field-hint">Check-in and check-out update the status automatically.</p>
            </div>
          </div>
        )}
      </Modal>

      <RoomFormModal
        open={Boolean(editing)}
        room={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); reload(); }}
      />
    </>
  );
}
