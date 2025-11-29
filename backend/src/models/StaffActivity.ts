import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffActivity extends Document {
  staff: mongoose.Types.ObjectId;
  staffName: string;
  action: string;
  room?: mongoose.Types.ObjectId;
  roomNumber?: string;
  details: string;
  category: 'cleaning' | 'maintenance' | 'status-update' | 'note' | 'inventory' | 'inspection';
}

const staffActivitySchema = new Schema<IStaffActivity>({
  staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  staffName: { type: String, required: true },
  action: { type: String, required: true },
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String },
  details: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['cleaning', 'maintenance', 'status-update', 'note', 'inventory', 'inspection'],
    required: true
  }
}, { timestamps: true });

export default mongoose.model<IStaffActivity>('StaffActivity', staffActivitySchema);
