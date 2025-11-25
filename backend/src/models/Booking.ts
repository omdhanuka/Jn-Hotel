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
  isCheckedIn?: boolean;  // NEW: Add check-in flag
  isCheckedOut?: boolean; // NEW: Add check-out flag
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
  bill?: {
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
    subtotal: number;
    discount: number; // percentage 0-100
    taxRate: number; // percentage 0-100
    taxAmount: number;
    serviceChargeRate: number; // percentage 0-100
    serviceChargeAmount: number;
    extraCharges?: number; // NEW: optional additional charges
    grandTotal: number;
    currency: string;
    notes?: string;
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
  isCheckedIn: { type: Boolean, default: false },   // NEW
  isCheckedOut: { type: Boolean, default: false },  // NEW
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
  },
  bill: {
    items: [{
      description: { type: String, required: true },
      quantity: { type: Number, default: 1 },
      unitPrice: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    }],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    serviceChargeRate: { type: Number, default: 0 },
    serviceChargeAmount: { type: Number, default: 0 },
    extraCharges: { type: Number, default: 0 }, // NEW
    grandTotal: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    notes: { type: String }
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
