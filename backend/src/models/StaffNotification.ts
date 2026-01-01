import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffNotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'task_assigned' | 'task_approved' | 'task_rejected' | 'leave_approved' | 'leave_rejected' | 'urgent' | 'shift_update';
  title: string;
  message: string;
  relatedTask?: mongoose.Types.ObjectId;
  relatedLeave?: mongoose.Types.ObjectId;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

const staffNotificationSchema = new Schema<IStaffNotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['task_assigned', 'task_approved', 'task_rejected', 'leave_approved', 'leave_rejected', 'urgent', 'shift_update'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedTask: { type: Schema.Types.ObjectId, ref: 'StaffTask' },
  relatedLeave: { type: Schema.Types.ObjectId, ref: 'StaffLeave' },
  isRead: { type: Boolean, default: false },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, { timestamps: true });

staffNotificationSchema.index({ recipient: 1, isRead: 1 });
staffNotificationSchema.index({ createdAt: -1 });

export default mongoose.model<IStaffNotification>('StaffNotification', staffNotificationSchema);
