import mongoose, { Document, Schema } from 'mongoose';

export interface IQROrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  dishType: 'veg' | 'non-veg' | 'vegan';
  image?: string;
}

export interface IQROrder extends Document {
  tableNumber: number | string;  // number for QR system tables, string for legacy tableIds
  tableName: string;
  items: IQROrderItem[];
  totalAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  specialRequests?: string;
  completedAt?: Date;
}

const qrOrderItemSchema = new Schema<IQROrderItem>({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  dishType: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan'],
    default: 'veg',
  },
  image: { type: String },
});

const qrOrderSchema = new Schema<IQROrder>({
  tableNumber: { type: Schema.Types.Mixed, required: true }, // accepts both Number and String
  tableName: { type: String, required: true },
  items: { type: [qrOrderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  specialRequests: { type: String },
  completedAt: { type: Date },
}, {
  timestamps: true,
});

qrOrderSchema.index({ tableNumber: 1, status: 1 });
qrOrderSchema.index({ status: 1 });
qrOrderSchema.index({ createdAt: -1 });

export default mongoose.model<IQROrder>('QROrder', qrOrderSchema);
