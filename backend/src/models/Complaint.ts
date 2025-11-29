import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  guest: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  category: 'room' | 'service' | 'food' | 'cleanliness' | 'staff' | 'billing' | 'amenities' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  images?: string[];
}

const complaintSchema = new Schema<IComplaint>({
  guest: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['room', 'service', 'food', 'cleanliness', 'staff', 'billing', 'amenities', 'other'],
    required: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: { type: String },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  images: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IComplaint>('Complaint', complaintSchema);
