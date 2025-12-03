import mongoose, { Document, Schema } from 'mongoose';

export interface ITodaySpecial extends Document {
  name: string;
  description: string;
  category: string;
  dishType: 'veg' | 'non-veg' | 'vegan';
  price: number;
  originalPrice?: number; // Optional: to show discount
  images: string[];
  preparationTime?: string;
  spiceLevels: string[];
  addOns: {
    name: string;
    price: number;
  }[];
  stockQuantity: number;
  isAvailable: boolean;
  validUntil: Date; // Auto-expire at end of day
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const todaySpecialSchema = new Schema<ITodaySpecial>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  dishType: { 
    type: String, 
    enum: ['veg', 'non-veg', 'vegan'], 
    required: true 
  },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 }, // Show discount
  images: [{ type: String }],
  preparationTime: { type: String },
  spiceLevels: [{ type: String }],
  addOns: [{
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }
  }],
  stockQuantity: { type: Number, required: true, min: 0 },
  isAvailable: { type: Boolean, default: true },
  validUntil: { type: Date, required: true },
  createdBy: { type: String, required: true }
}, { 
  timestamps: true 
});

// Index for auto-cleanup
todaySpecialSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ITodaySpecial>('TodaySpecial', todaySpecialSchema);
