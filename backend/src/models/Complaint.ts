import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  complaintId: string;
  user: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  category: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  roomNumber?: string;
  images?: string[];
  assignedTo?: mongoose.Types.ObjectId;
  timeline: Array<{
    timestamp: Date;
    action: string;
    performedBy: mongoose.Types.ObjectId;
    remarks?: string;
  }>;
  resolution?: {
    description: string;
    resolvedBy: mongoose.Types.ObjectId;
    resolvedAt: Date;
  };
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>({
  complaintId: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  category: {
    type: String,
    enum: [
      'room-cleanliness',
      'room-amenities', 
      'room-maintenance',
      'noise-disturbance',
      'staff-behavior',
      'food-beverage',
      'facilities',
      'billing-issue',
      'safety-security',
      'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  roomNumber: { type: String },
  images: [{ type: String }],
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  timeline: [{
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: String
  }],
  resolution: {
    description: String,
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date
  },
  internalNotes: String
}, { timestamps: true });

export default mongoose.model<IComplaint>('Complaint', complaintSchema);
