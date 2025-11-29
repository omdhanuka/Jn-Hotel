import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffAttendance extends Document {
  staff: mongoose.Types.ObjectId;
  date: string;
  status: 'present' | 'absent' | 'half-day' | 'late' | 'on-leave';
  checkInTime?: Date;
  checkOutTime?: Date;
  workingHours?: number;
  notes?: string;
  markedBy: mongoose.Types.ObjectId;
}

const staffAttendanceSchema = new Schema<IStaffAttendance>({
  staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'half-day', 'late', 'on-leave'],
    required: true
  },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  workingHours: { type: Number },
  notes: { type: String },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Compound index to ensure one record per staff per date
staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

export default mongoose.model<IStaffAttendance>('StaffAttendance', staffAttendanceSchema);
