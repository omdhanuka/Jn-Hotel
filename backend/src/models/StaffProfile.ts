import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffProfile extends Document {
  user: mongoose.Types.ObjectId;
  staffId: string;
  staffType: 'housekeeping' | 'maintenance' | 'frontdesk' | 'restaurant' | 'banquet';
  department: string;
  joiningDate: Date;
  assignedManager?: mongoose.Types.ObjectId;
  isActive: boolean;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  address?: string;
  performanceMetrics: {
    tasksCompleted: number;
    tasksRejected: number;
    averageCompletionTime: number;
    rating: number;
  };
  leaveBalance: {
    sick: number;
    casual: number;
    annual: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const staffProfileSchema = new Schema<IStaffProfile>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  staffId: { type: String, required: true, unique: true },
  staffType: {
    type: String,
    enum: ['housekeeping', 'maintenance', 'frontdesk', 'restaurant', 'banquet'],
    required: true
  },
  department: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  assignedManager: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String }
  },
  address: { type: String },
  performanceMetrics: {
    tasksCompleted: { type: Number, default: 0 },
    tasksRejected: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0, min: 0, max: 5 }
  },
  leaveBalance: {
    sick: { type: Number, default: 10 },
    casual: { type: Number, default: 12 },
    annual: { type: Number, default: 15 }
  }
}, { timestamps: true });

staffProfileSchema.index({ user: 1 });
staffProfileSchema.index({ staffType: 1, isActive: 1 });

export default mongoose.model<IStaffProfile>('StaffProfile', staffProfileSchema);
