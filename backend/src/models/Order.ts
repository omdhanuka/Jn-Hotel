import mongoose, { Document, Schema } from 'mongoose';

interface OrderItem {
  menuItem: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'dine-in' | 'room-service' | 'takeaway';
  tableId?: mongoose.Types.ObjectId;
  roomNumber?: string;
  specialRequests?: string;
  estimatedTime: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

const orderSchema = new Schema<IOrder>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [{
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    specialInstructions: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  orderType: { 
    type: String, 
    enum: ['dine-in', 'room-service', 'takeaway'], 
    required: true 
  },
  tableId: { type: Schema.Types.ObjectId, ref: 'Table' },
  roomNumber: { type: String },
  specialRequests: { type: String },
  estimatedTime: { type: Number, default: 30 }, // in minutes
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'], 
    default: 'pending' 
  }
}, { timestamps: true });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
