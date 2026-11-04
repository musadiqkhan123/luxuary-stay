import HousekeepingTask from '../models/HousekeepingTask.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import notify from '../utils/notify.js';
import { TASK_TYPES, TASK_STATUSES, PRIORITIES } from '../constants/index.js';
import { requireFields, assertOneOf, assertObjectId, pick } from '../utils/validate.js';

const POPULATE = [
  { path: 'room', select: 'roomNumber floor type status' },
  { path: 'assignedTo', select: 'name' },
  { path: 'createdBy', select: 'name' },
];

// GET /api/housekeeping?status=&mine=true
export const getTasks = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === 'housekeeping' || req.query.mine === 'true') {
    filter.$or = [{ assignedTo: req.user._id }, { assignedTo: null }];
  }
  const items = await HousekeepingTask.find(filter).populate(POPULATE).sort({ status: 1, dueDate: 1 }).limit(300);
  res.json({ success: true, data: items });
};

// GET /api/housekeeping/staff  — list of housekeepers for the assign dropdown
export const getHousekeepers = async (req, res) => {
  const staff = await User.find({ role: 'housekeeping', isActive: true }).select('name');
  res.json({ success: true, data: staff });
};

// POST /api/housekeeping
export const createTask = async (req, res) => {
  requireFields(req.body, ['roomId']);
  assertObjectId(req.body.roomId, 'room ID');
  assertOneOf(req.body.type, TASK_TYPES, 'Task type');
  assertOneOf(req.body.priority, PRIORITIES, 'Priority');

  const room = await Room.findById(req.body.roomId);
  if (!room) throw new ApiError(404, 'Room not found.');

  const task = await HousekeepingTask.create({
    room: room._id,
    type: req.body.type,
    priority: req.body.priority,
    assignedTo: req.body.assignedTo || undefined,
    dueDate: req.body.dueDate || undefined,
    notes: req.body.notes,
    createdBy: req.user._id,
  });
  await task.populate(POPULATE);

  notify({
    users: task.assignedTo ? [task.assignedTo._id] : [],
    roles: task.assignedTo ? [] : ['housekeeping'],
    title: `New ${task.type} task`,
    message: `Room ${room.roomNumber} · ${task.priority} priority`,
    link: '/dashboard/housekeeping',
  });

  res.status(201).json({ success: true, message: 'Task scheduled.', data: task });
};

// PATCH /api/housekeeping/:id
export const updateTask = async (req, res) => {
  const task = await HousekeepingTask.findById(req.params.id).populate('room');
  if (!task) throw new ApiError(404, 'Task not found.');

  const isHousekeeper = req.user.role === 'housekeeping';
  if (isHousekeeper && task.assignedTo && String(task.assignedTo) !== String(req.user._id)) {
    throw new ApiError(403, 'This task is assigned to someone else.');
  }

  const allowed = isHousekeeper ? ['status', 'notes'] : ['status', 'notes', 'priority', 'type', 'assignedTo', 'dueDate'];
  const updates = pick(req.body, allowed);
  assertOneOf(updates.status, TASK_STATUSES, 'Status');
  assertOneOf(updates.priority, PRIORITIES, 'Priority');
  assertOneOf(updates.type, TASK_TYPES, 'Task type');
  if (updates.assignedTo === '') updates.assignedTo = null;

  const previous = task.status;
  Object.assign(task, updates);

  if (updates.status === 'in-progress' && previous !== 'in-progress') {
    task.startedAt = new Date();
    if (!task.assignedTo) task.assignedTo = req.user._id; // claim the task
  }
  if (updates.status === 'completed' && previous !== 'completed') {
    task.completedAt = new Date();
    if (!task.assignedTo) task.assignedTo = req.user._id;
    // A cleaned room becomes sellable again
    if (task.room && task.room.status === 'cleaning') {
      await Room.findByIdAndUpdate(task.room._id, { status: 'available' });
    }
  }

  await task.save();
  await task.populate(POPULATE);
  res.json({ success: true, message: 'Task updated.', data: task });
};
