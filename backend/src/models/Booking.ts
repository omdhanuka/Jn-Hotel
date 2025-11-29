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
  paymentMethod?: string;
  paymentId?: string; // Add payment ID field
  transactionId?: string;
  specialRequests?: string;
  isCheckedIn?: boolean;
  isCheckedOut?: boolean;
  discountApplied?: number;
  discountReason?: string;
  eventDetails?: {
    eventType?: string;
    fullName?: string;
    phone?: string;
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
    discount: number;
    taxRate: number;
    taxAmount: number;
    serviceChargeRate: number;
    serviceChargeAmount: number;
    extraCharges?: number;
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
  guests: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
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
  paymentMethod: { type: String },
  paymentId: { type: String },
  transactionId: { type: String },
  specialRequests: { type: String },
  isCheckedIn: { type: Boolean, default: false },
  isCheckedOut: { type: Boolean, default: false },
  discountApplied: { type: Number },
  discountReason: { type: String },
  eventDetails: {
    eventType: { type: String },
    fullName: { type: String },
    phone: { type: String },
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
      description: { type: String },
      quantity: { type: Number },
      unitPrice: { type: Number },
      amount: { type: Number }
    }],
    subtotal: { type: Number },
    discount: { type: Number },
    taxRate: { type: Number },
    taxAmount: { type: Number },
    serviceChargeRate: { type: Number },
    serviceChargeAmount: { type: Number },
    extraCharges: { type: Number },
    grandTotal: { type: Number },
    currency: { type: String },
    notes: { type: String }
  }
}, { timestamps: true });

// Create indexes for better query performance
bookingSchema.index({ user: 1 });
bookingSchema.index({ type: 1, resourceId: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });

export default mongoose.model<IBooking>('Booking', bookingSchema);
