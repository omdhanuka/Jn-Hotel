import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomNote extends Document {
  room: mongoose.Types.ObjectId;
  roomNumber: string;
  note: string;
  category: 'observation' | 'guest-request' | 'maintenance' | 'cleaning' | 'inventory' | 'other';
  priority: 'high' | 'medium' | 'low';
  isResolved: boolean;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
}

const roomNoteSchema = new Schema<IRoomNote>({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  roomNumber: { type: String, required: true },
  note: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['observation', 'guest-request', 'maintenance', 'cleaning', 'inventory', 'other'],
    default: 'observation'
  },
  priority: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'low' 
  },
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IRoomNote>('RoomNote', roomNoteSchema);
