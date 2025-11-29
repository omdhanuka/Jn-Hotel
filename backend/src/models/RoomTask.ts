import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomTask extends Document {
  room: mongoose.Types.ObjectId;
  roomNumber: string;
  taskType: 'cleaning' | 'maintenance' | 'inspection';
  issueType?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: mongoose.Types.ObjectId;
  description: string;
  notes?: string;
  checklist?: {
    item: string;
    completed: boolean;
  }[];
  estimatedTime?: number; // in minutes
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const roomTaskSchema = new Schema<IRoomTask>({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  roomNumber: { type: String, required: true },
  taskType: { 
    type: String, 
    enum: ['cleaning', 'maintenance', 'inspection'], 
    required: true 
  },
  issueType: { 
    type: String,
    enum: ['AC', 'Light/Fan', 'Bathroom', 'TV/WiFi', 'Power', 'Plumbing', 'Furniture', 'Other']
  },
  priority: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  notes: { type: String },
  checklist: [{
    item: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  estimatedTime: { type: Number },
  completedAt: { type: Date },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IRoomTask>('RoomTask', roomTaskSchema);
