import mongoose, { Document, Schema } from 'mongoose';

export interface IBanquet extends Document {
  name: string;
  capacity: number;
  area: string;
  price: number;
  features: string[];
  images: string[];
  isAvailable: boolean;
  description: string;
  location: string;
}

const banquetSchema = new Schema<IBanquet>({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  area: { type: String, required: true },
  price: { type: Number, required: true },
  features: [{ type: String }],
  images: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  description: { type: String },
  location: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IBanquet>('Banquet', banquetSchema);
