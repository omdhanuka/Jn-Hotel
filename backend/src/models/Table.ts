import mongoose, { Document, Schema } from 'mongoose';

export interface ITable extends Document {
  tableNumber: string;
  capacity: number;
  location: 'indoor' | 'outdoor';
  isAvailable: boolean;
  reservations: mongoose.Types.ObjectId[];
}

const tableSchema = new Schema<ITable>({
  tableNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  location: { 
    type: String, 
    enum: ['indoor', 'outdoor'], 
    required: true 
  },
  isAvailable: { type: Boolean, default: true },
  reservations: [{ type: Schema.Types.ObjectId, ref: 'Booking' }]
}, { timestamps: true });

export default mongoose.model<ITable>('Table', tableSchema);
