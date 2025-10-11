import mongoose, { Document, Schema } from 'mongoose';

export interface IBill extends Document {
  orderId: mongoose.Types.ObjectId;
  tableNumber: string;
  customerName: string;
  items: {
    menuItem: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    addOns?: { name: string; price: number }[];
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid';
  notes?: string;
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
}

const billSchema = new Schema<IBill>({
  orderId: { type: Schema.Types.ObjectId, ref: 'RestaurantBooking', required: true },
  tableNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  items: [{
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    addOns: [{ name: String, price: Number }]
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'paid' },
  notes: { type: String },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

export default mongoose.model<IBill>('Bill', billSchema);
