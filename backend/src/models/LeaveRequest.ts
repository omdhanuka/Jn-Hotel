import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveRequest extends Document {
  staff: mongoose.Types.ObjectId;
  leaveType: 'sick' | 'casual' | 'vacation' | 'emergency' | 'unpaid';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  remarks?: string;
}

const leaveRequestSchema = new Schema<ILeaveRequest>({
  staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { 
    type: String, 
    enum: ['sick', 'casual', 'vacation', 'emergency', 'unpaid'],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvalDate: { type: Date },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
