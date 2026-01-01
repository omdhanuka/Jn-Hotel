import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffLeave extends Document {
  staff: mongoose.Types.ObjectId;
  leaveType: 'sick' | 'casual' | 'emergency' | 'annual' | 'unpaid';
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  documents?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const staffLeaveSchema = new Schema<IStaffLeave>({
  staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'emergency', 'annual', 'unpaid'],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  appliedAt: { type: Date, default: Date.now },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },
  documents: [{ type: String }]
}, { timestamps: true });

staffLeaveSchema.index({ staff: 1, status: 1 });
staffLeaveSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model<IStaffLeave>('StaffLeave', staffLeaveSchema);
