import mongoose, { Document, Schema } from 'mongoose';

export interface IBill extends Document {
  billNumber: string;
  billType: 'restaurant' | 'banquet' | 'room';
  orderId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  deliveryType?: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
  items?: {
    menuItem: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    addOns?: { name: string; price: number }[];
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  taxPercent?: number;              // Add this
  serviceCharge?: number;
  serviceChargePercent?: number;    // Add this
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'partial';
  notes?: string;
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  printCount: number;
}

const billSchema = new Schema<IBill>({
  billNumber: { type: String, required: false },
  billType: { type: String, enum: ['restaurant', 'banquet', 'room'], required: true },
  orderId: { type: Schema.Types.ObjectId, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  tableNumber: { type: String },
  deliveryType: { type: String, enum: ['dine-in', 'takeaway', 'delivery'] },
  deliveryAddress: { type: String },
  items: [{
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    addOns: [{ name: String, price: Number }]
  }],
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, required: true, min: 0 },
  taxPercent: { type: Number, default: 5, min: 0 },              // Add this
  serviceCharge: { type: Number, default: 0, min: 0 },
  serviceChargePercent: { type: Number, default: 10, min: 0 },   // Add this
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
  notes: { type: String },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now },
  printCount: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

billSchema.pre('save', async function(next) {
  if (this.isNew && !this.billNumber) {
    try {
      const count = await mongoose.model('Bill').countDocuments();
      const prefix = this.billType === 'restaurant' ? 'RB' : this.billType === 'banquet' ? 'BB' : 'HB';
      this.billNumber = `${prefix}${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error instanceof Error ? error : new Error(String(error)));
    }
  }
  next();
});

export default mongoose.model<IBill>('Bill', billSchema);
