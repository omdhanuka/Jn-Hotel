import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  staffId: mongoose.Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  shiftStart: string;
  shiftEnd: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  shiftStart: { type: String, required: true },
  shiftEnd: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'absent' },
  notes: { type: String }
}, { timestamps: true });

// Compound index for staff and date
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);
