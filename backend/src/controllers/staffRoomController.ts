import { Request, Response } from 'express';
import Room from '../models/Room';
import RoomTask from '../models/RoomTask';
import RoomNote from '../models/RoomNote';
import RoomInventory from '../models/RoomInventory';
import StaffActivity from '../models/StaffActivity';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

// Log staff activity
const logActivity = async (
  staffId: string,
  staffName: string,
  action: string,
  details: string,
  category: string,
  roomId?: string,
  roomNumber?: string
) => {
  try {
    await StaffActivity.create({
      staff: staffId,
      staffName,
      action,
      details,
      category,
      room: roomId,
      roomNumber
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Get room dashboard stats
export const getRoomStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalRooms = await Room.countDocuments({ status: { $ne: 'inactive' } });
    const availableRooms = await Room.countDocuments({ isAvailable: true, status: 'active' });
    const cleaningRooms = await Room.countDocuments({ status: 'cleaning' });
    const maintenanceRooms = await Room.countDocuments({ status: 'maintenance' });
    const occupiedRooms = await Room.countDocuments({ isBooked: true, status: 'active' });
    
    const pendingTasks = await RoomTask.countDocuments({ 
      status: { $in: ['pending', 'in-progress'] } 
    });
    
    const myPendingTasks = await RoomTask.countDocuments({ 
      assignedTo: req.user!._id,
      status: { $in: ['pending', 'in-progress'] } 
    });

    res.json({
      totalRooms,
      availableRooms,
      cleaningRooms,
      maintenanceRooms,
      occupiedRooms,
      pendingTasks,
      myPendingTasks,
      readyForCheckIn: availableRooms
    });
  } catch (error) {
    console.error('Get room stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all rooms with their current status
export const getAllRoomsStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, floor } = req.query;
    
    const filter: any = { status: { $ne: 'inactive' } };
    if (status && status !== 'all') filter.status = status;
    if (floor) filter.floor = parseInt(floor as string);

    const rooms = await Room.find(filter)
      .sort({ roomNumber: 1 })
      .lean();

    // Get pending tasks for each room
    const roomsWithTasks = await Promise.all(
      rooms.map(async (room) => {
        const pendingTasks = await RoomTask.countDocuments({
          room: room._id,
          status: { $in: ['pending', 'in-progress'] }
        });
        
        const unresolvedNotes = await RoomNote.countDocuments({
          room: room._id,
          isResolved: false
        });

        return {
          ...room,
          pendingTasks,
          unresolvedNotes
        };
      })
    );

    res.json({ rooms: roomsWithTasks });
  } catch (error) {
    console.error('Get rooms status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update room status
export const updateRoomStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    
    const validStatuses = ['active', 'cleaning', 'maintenance', 'out-of-service', 'needs-inspection'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid room status' });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Log activity
    await logActivity(
      req.user!._id.toString(),
      `${req.user!.firstName} ${req.user!.lastName}`,
      'Status Updated',
      `Changed room status to ${status}${notes ? `: ${notes}` : ''}`,
      'status-update',
      room._id.toString(),
      room.roomNumber
    );

    // Create note if provided
    if (notes) {
      await RoomNote.create({
        room: room._id,
        roomNumber: room.roomNumber,
        note: notes,
        category: 'observation',
        createdBy: req.user!._id
      });
    }

    res.json({ message: 'Room status updated successfully', room });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get cleaning tasks
export const getCleaningTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'all', assignedToMe } = req.query;
    
    const filter: any = { taskType: 'cleaning' };
    if (status !== 'all') filter.status = status;
    if (assignedToMe === 'true') filter.assignedTo = req.user!._id;

    const tasks = await RoomTask.find(filter)
      .populate('room', 'roomNumber floor')
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ priority: -1, createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get cleaning tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create cleaning task
export const createCleaningTask = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, roomNumber, priority, description, estimatedTime, checklist } = req.body;

    const defaultChecklist = checklist || [
      { item: 'Bed made', completed: false },
      { item: 'Bathroom cleaned', completed: false },
      { item: 'Floor cleaned', completed: false },
      { item: 'Towels replaced', completed: false },
      { item: 'Toiletries refilled', completed: false },
      { item: 'Dustbins empty', completed: false },
      { item: 'TV remote functioning', completed: false },
      { item: 'AC functioning', completed: false },
      { item: 'WiFi working', completed: false },
      { item: 'No smell/odor', completed: false }
    ];

    const task = await RoomTask.create({
      room: roomId,
      roomNumber,
      taskType: 'cleaning',
      priority: priority || 'medium',
      status: 'pending',
      description,
      estimatedTime,
      checklist: defaultChecklist,
      createdBy: req.user!._id
    });

    // Update room status
    await Room.findByIdAndUpdate(roomId, { status: 'cleaning' });

    // Log activity
    await logActivity(
      req.user!._id.toString(),
      `${req.user!.firstName} ${req.user!.lastName}`,
      'Cleaning Task Created',
      description,
      'cleaning',
      roomId,
      roomNumber
    );

    const populatedTask = await RoomTask.findById(task._id)
      .populate('room', 'roomNumber floor')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({ message: 'Cleaning task created', task: populatedTask });
  } catch (error) {
    console.error('Create cleaning task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update cleaning task
export const updateCleaningTask = async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes, checklist } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (checklist) updateData.checklist = checklist;
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.completedBy = req.user!._id;
    }

    const task = await RoomTask.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('room', 'roomNumber floor');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If task completed, update room status to needs-inspection
    if (status === 'completed') {
      await Room.findByIdAndUpdate(task.room, { status: 'needs-inspection' });
      
      await logActivity(
        req.user!._id.toString(),
        `${req.user!.firstName} ${req.user!.lastName}`,
        'Cleaning Completed',
        `Room ${task.roomNumber} cleaned and ready for inspection`,
        'cleaning',
        task.room.toString(),
        task.roomNumber
      );
    }

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('Update cleaning task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get maintenance tasks
export const getMaintenanceTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'all', issueType } = req.query;
    
    const filter: any = { taskType: 'maintenance' };
    if (status !== 'all') filter.status = status;
    if (issueType && issueType !== 'all') filter.issueType = issueType;

    const tasks = await RoomTask.find(filter)
      .populate('room', 'roomNumber floor')
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ priority: -1, createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get maintenance tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create maintenance task
export const createMaintenanceTask = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, roomNumber, issueType, priority, description, estimatedTime } = req.body;

    const task = await RoomTask.create({
      room: roomId,
      roomNumber,
      taskType: 'maintenance',
      issueType,
      priority: priority || 'high',
      status: 'pending',
      description,
      estimatedTime,
      createdBy: req.user!._id
    });

    // Update room status
    await Room.findByIdAndUpdate(roomId, { status: 'maintenance', isAvailable: false });

    // Log activity
    await logActivity(
      req.user!._id.toString(),
      `${req.user!.firstName} ${req.user!.lastName}`,
      'Maintenance Task Created',
      `${issueType}: ${description}`,
      'maintenance',
      roomId,
      roomNumber
    );

    const populatedTask = await RoomTask.findById(task._id)
      .populate('room', 'roomNumber floor')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({ message: 'Maintenance task created', task: populatedTask });
  } catch (error) {
    console.error('Create maintenance task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update maintenance task
export const updateMaintenanceTask = async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;

    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.completedBy = req.user!._id;
    }

    const task = await RoomTask.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('room', 'roomNumber floor');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If task completed, update room status back to active
    if (status === 'completed') {
      await Room.findByIdAndUpdate(task.room, { 
        status: 'needs-inspection',
        isAvailable: true 
      });
      
      await logActivity(
        req.user!._id.toString(),
        `${req.user!.firstName} ${req.user!.lastName}`,
        'Maintenance Completed',
        `${task.issueType} issue resolved in room ${task.roomNumber}`,
        'maintenance',
        task.room.toString(),
        task.roomNumber
      );
    }

    res.json({ message: 'Maintenance task updated', task });
  } catch (error) {
    console.error('Update maintenance task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get room notes
export const getRoomNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, resolved } = req.query;
    
    const filter: any = {};
    if (roomId) filter.room = roomId;
    if (resolved !== undefined) filter.isResolved = resolved === 'true';

    const notes = await RoomNote.find(filter)
      .populate('room', 'roomNumber floor')
      .populate('createdBy', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ notes });
  } catch (error) {
    console.error('Get room notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create room note
export const createRoomNote = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, roomNumber, note, category, priority } = req.body;

    const roomNote = await RoomNote.create({
      room: roomId,
      roomNumber,
      note,
      category: category || 'observation',
      priority: priority || 'low',
      createdBy: req.user!._id
    });

    // Log activity
    await logActivity(
      req.user!._id.toString(),
      `${req.user!.firstName} ${req.user!.lastName}`,
      'Note Added',
      note,
      'note',
      roomId,
      roomNumber
    );

    const populatedNote = await RoomNote.findById(roomNote._id)
      .populate('room', 'roomNumber floor')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({ message: 'Note created', note: populatedNote });
  } catch (error) {
    console.error('Create room note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resolve room note
export const resolveRoomNote = async (req: AuthRequest, res: Response) => {
  try {
    const note = await RoomNote.findByIdAndUpdate(
      req.params.id,
      {
        isResolved: true,
        resolvedBy: req.user!._id,
        resolvedAt: new Date()
      },
      { new: true }
    ).populate('room', 'roomNumber floor');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: 'Note resolved', note });
  } catch (error) {
    console.error('Resolve note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get room inventory
export const getRoomInventory = async (req: AuthRequest, res: Response) => {
  try {
    const inventory = await RoomInventory.findOne({ room: req.params.roomId })
      .populate('room', 'roomNumber floor')
      .populate('lastUpdatedBy', 'firstName lastName');

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    res.json({ inventory });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update room inventory
export const updateRoomInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, roomNumber, items } = req.body;

    let inventory = await RoomInventory.findOne({ room: roomId });

    if (!inventory) {
      // Create new inventory
      inventory = await RoomInventory.create({
        room: roomId,
        roomNumber,
        items,
        lastUpdatedBy: req.user!._id
      });
    } else {
      // Update existing inventory
      inventory.items = items;
      inventory.lastUpdatedBy = req.user!._id;
      await inventory.save();
    }

    // Log activity
    const issuesFound = items.filter((item: any) => item.status !== 'ok');
    if (issuesFound.length > 0) {
      await logActivity(
        req.user!._id.toString(),
        `${req.user!.firstName} ${req.user!.lastName}`,
        'Inventory Updated',
        `${issuesFound.length} items need attention in room ${roomNumber}`,
        'inventory',
        roomId,
        roomNumber
      );
    }

    res.json({ message: 'Inventory updated', inventory });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Complete room inspection
export const completeInspection = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, checklist, notes, approved } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Create inspection task record
    await RoomTask.create({
      room: roomId,
      roomNumber: room.roomNumber,
      taskType: 'inspection',
      status: 'completed',
      description: `Room inspection ${approved ? 'passed' : 'failed'}`,
      notes,
      checklist,
      completedAt: new Date(),
      completedBy: req.user!._id,
      createdBy: req.user!._id
    });

    // Update room status
    if (approved) {
      await Room.findByIdAndUpdate(roomId, { 
        status: 'active',
        isAvailable: true 
      });
      
      await logActivity(
        req.user!._id.toString(),
        `${req.user!.firstName} ${req.user!.lastName}`,
        'Inspection Passed',
        `Room ${room.roomNumber} is ready for guests`,
        'inspection',
        roomId,
        room.roomNumber
      );
    } else {
      await Room.findByIdAndUpdate(roomId, { status: 'cleaning' });
      
      await logActivity(
        req.user!._id.toString(),
        `${req.user!.firstName} ${req.user!.lastName}`,
        'Inspection Failed',
        `Room ${room.roomNumber} needs additional cleaning`,
        'inspection',
        roomId,
        room.roomNumber
      );
    }

    res.json({ message: 'Inspection completed', approved });
  } catch (error) {
    console.error('Complete inspection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get staff activity log
export const getStaffActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, roomId, category, limit = 50 } = req.query;
    
    const filter: any = {};
    if (staffId) filter.staff = staffId;
    if (roomId) filter.room = roomId;
    if (category && category !== 'all') filter.category = category;

    const activities = await StaffActivity.find(filter)
      .populate('staff', 'firstName lastName department')
      .populate('room', 'roomNumber floor')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.json({ activities });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
