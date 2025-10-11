import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurantBooking extends Document {
  user: mongoose.Types.ObjectId;
  bookingId: string;
  bookingType: 'table' | 'order';
  
  // Basic Information
  fullName: string;
  email: string;
  phone: string;
  
  // Table Booking Details
  tableId?: mongoose.Types.ObjectId;
  tableNumber?: string; // Added for dine-in orders
  date?: Date;
  timeSlot?: string;
  numberOfGuests?: number;
  restaurantSection?: string;
  
  // Food Order Details
  items: {
    menuItem: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    addOns?: { name: string; price: number }[];
    spiceLevel?: string;
  }[];
  
  totalAmount: number;
  deliveryType?: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
  landmark?: string;
  
  // Payment
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  
  // Status
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  
  // Optional
  specialRequests?: string;
  tableTheme?: string;
  foodPreference?: string;
  couponCode?: string;
  discount?: number;
  rating?: number;
  feedback?: string;
}

const restaurantBookingSchema = new Schema<IRestaurantBooking>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: String, required: true, unique: true },
  bookingType: { type: String, enum: ['table', 'order'], required: true },
  
  // Basic Information
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  
  // Table Booking Details
  tableId: { type: Schema.Types.ObjectId, ref: 'RestaurantTable' },
  tableNumber: { type: String }, // Added for dine-in orders
  date: { type: Date },
  timeSlot: { type: String },
  numberOfGuests: { type: Number, min: 1 },
  restaurantSection: { type: String },
  
  // Food Order Details
  items: [{
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    addOns: [{ name: String, price: Number }],
    spiceLevel: { type: String }
  }],
  
  totalAmount: { type: Number, required: true, min: 0 },
  deliveryType: { type: String, enum: ['dine-in', 'takeaway', 'delivery'] },
  deliveryAddress: { type: String },
  landmark: { type: String },
  
  // Payment
  paymentMethod: { type: String, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentId: { type: String },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  
  // Optional
  specialRequests: { type: String },
  tableTheme: { type: String },
  foodPreference: { type: String },
  couponCode: { type: String },
  discount: { type: Number, min: 0 },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.model<IRestaurantBooking>('RestaurantBooking', restaurantBookingSchema);
