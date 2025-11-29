import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomInventory extends Document {
  room: mongoose.Types.ObjectId;
  roomNumber: string;
  items: {
    name: string;
    quantity: number;
    status: 'ok' | 'missing' | 'damaged' | 'needs-restock';
    lastChecked: Date;
    notes?: string;
  }[];
  lastUpdatedBy: mongoose.Types.ObjectId;
}

const roomInventorySchema = new Schema<IRoomInventory>({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true, unique: true },
  roomNumber: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['ok', 'missing', 'damaged', 'needs-restock'],
      default: 'ok'
    },
    lastChecked: { type: Date, default: Date.now },
    notes: { type: String }
  }],
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IRoomInventory>('RoomInventory', roomInventorySchema);
