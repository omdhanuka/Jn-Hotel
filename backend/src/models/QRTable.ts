import mongoose, { Document, Schema } from 'mongoose';

export interface IQRTable extends Document {
  tableNumber: number;
  tableName: string;
  capacity: number;
  qrCodeUrl: string;
  status: 'empty' | 'occupied';
  currentOrderId?: mongoose.Types.ObjectId;
}

const qrTableSchema = new Schema<IQRTable>({
  tableNumber: { type: Number, required: true, unique: true, min: 1 },
  tableName: { type: String, required: true },
  capacity: { type: Number, required: true, default: 4 },
  qrCodeUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ['empty', 'occupied'],
    default: 'empty',
  },
  currentOrderId: { type: Schema.Types.ObjectId, ref: 'QROrder' },
}, {
  timestamps: true,
});

qrTableSchema.index({ tableNumber: 1 }, { unique: true });
qrTableSchema.index({ status: 1 });

export default mongoose.model<IQRTable>('QRTable', qrTableSchema);
