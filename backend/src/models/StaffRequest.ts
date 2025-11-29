import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffRequest extends Document {
  staffId: mongoose.Types.ObjectId;
  requestType: 'leave' | 'inventory' | 'issue-report' | 'guest-complaint' | 'room-damage' | 'maintenance';
  subject: string;
  description: string;
  roomNumber?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const staffRequestSchema = new Schema<IStaffRequest>({
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestType: { 
    type: String, 
    enum: ['leave', 'inventory', 'issue-report', 'guest-complaint', 'room-damage', 'maintenance'],
    required: true 
  },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  roomNumber: { type: String },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'resolved'], default: 'pending' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String },
  reviewedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IStaffRequest>('StaffRequest', staffRequestSchema);
