import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  // Basic Information
  itemId: string;
  name: string;
  category: string;
  description: string;
  dishType: 'veg' | 'non-veg' | 'vegan';
  
  // Pricing & Availability
  price: number;
  discount?: number;
  isAvailable: boolean;
  preparationTime?: string;
  
  // Media
  images: string[];
  video?: string;
  
  // Additional Options
  spiceLevels: string[];
  addOns: {
    name: string;
    price: number;
  }[];
  comboOffers?: string[];
  
  // Optional Fields
  isFeatured: boolean;
  isTodaySpecial: boolean; // NEW
  availabilityTime?: string;
  stockQuantity?: number;
  calories?: number;
  nutritionInfo?: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  
  // Admin Metadata
  createdBy?: string;
  updatedBy?: string;
}

const menuItemSchema = new Schema<IMenuItem>({
  // Basic Information
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  dishType: { 
    type: String, 
    enum: ['veg', 'non-veg', 'vegan'], 
    required: true 
  },
  
  // Pricing & Availability
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, min: 0, max: 100 },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: String },
  
  // Media
  images: [{ type: String }],
  video: { type: String },
  
  // Additional Options
  spiceLevels: [{ type: String }],
  addOns: [{
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }
  }],
  comboOffers: [{ type: String }],
  
  // Optional Fields
  isFeatured: { type: Boolean, default: false },
  isTodaySpecial: { type: Boolean, default: false }, // NEW
  availabilityTime: { type: String },
  stockQuantity: { type: Number, min: 0 },
  calories: { type: Number, min: 0 },
  nutritionInfo: {
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    fiber: { type: Number, min: 0 }
  },
  
  // Admin Metadata
  createdBy: { type: String },
  updatedBy: { type: String }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for high-performance queries (10,000+ users)
menuItemSchema.index({ itemId: 1 }, { unique: true });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ isFeatured: 1 });
menuItemSchema.index({ isTodaySpecial: 1 });
menuItemSchema.index({ dishType: 1 });
menuItemSchema.index({ category: 1, isAvailable: 1 }); // Compound for menu filtering
menuItemSchema.index({ price: 1 }); // For price range queries
menuItemSchema.index({ createdAt: -1 }); // For sorting by newest

export default mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
