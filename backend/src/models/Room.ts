import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  type: 'standard' | 'deluxe' | 'suite' | 'presidential';
  capacity: number;
  price: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  description: string;
  floor: number;
}

const roomSchema = new Schema<IRoom>({
  roomNumber: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['standard', 'deluxe', 'suite', 'presidential'], 
    required: true 
  },
  capacity: { type: Number, required: true },
  price: { type: Number, required: true },
  amenities: [{ type: String }],
  images: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  description: { type: String },
  floor: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model<IRoom>('Room', roomSchema);
