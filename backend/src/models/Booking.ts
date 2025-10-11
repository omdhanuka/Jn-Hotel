import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  type: 'room' | 'banquet' | 'table';
  resourceId: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'cancelled' | 'failed';
  paymentId?: string;
  specialRequests?: string;
  services: string[];
  eventDetails?: {
    eventType?: string;
    fullName?: string;
    phone?: string;
    address?: string;
    cateringPreference?: string;
    decorationTheme?: string;
    seatingArrangement?: string;
    parkingRequired?: boolean;
    numberOfVehicles?: number;
    musicDjRequired?: boolean;
    bookingType?: string;
    advanceAmount?: number;
    paymentMethod?: string;
  };
}

const bookingSchema = new Schema<IBooking>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['room', 'banquet', 'table'], 
    required: true 
  },
  resourceId: { type: Schema.Types.ObjectId, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded', 'cancelled', 'failed'], 
    default: 'pending' 
  },
  paymentId: { type: String },
  specialRequests: { type: String },
  services: [{ type: String }],
  eventDetails: {
    eventType: { type: String },
    fullName: { type: String },
    phone: { type: String },
    address: { type: String },
    cateringPreference: { type: String },
    decorationTheme: { type: String },
    seatingArrangement: { type: String },
    parkingRequired: { type: Boolean },
    numberOfVehicles: { type: Number },
    musicDjRequired: { type: Boolean },
    bookingType: { type: String },
    advanceAmount: { type: Number },
    paymentMethod: { type: String }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
bookingSchema.index({ type: 1, resourceId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IBooking>('Booking', bookingSchema);
