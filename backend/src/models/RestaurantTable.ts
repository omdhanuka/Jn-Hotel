import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurantTable extends Document {
  tableId: string;
  tableName: string;
  seatingCapacity: number;
  tableType: 'indoor' | 'outdoor' | 'rooftop' | 'private';
  isAvailable: boolean;
  status: 'available' | 'reserved' | 'cleaning' | 'maintenance';
  location?: string;
  amenities: string[];
  price?: number; // For special tables
  images: string[];
  
  // Admin Metadata
  createdBy?: string;
  updatedBy?: string;
}

const restaurantTableSchema = new Schema<IRestaurantTable>({
  tableId: { type: String, required: true, unique: true },
  tableName: { type: String, required: true },
  seatingCapacity: { type: Number, required: true, min: 1 },
  tableType: { 
    type: String, 
    enum: ['indoor', 'outdoor', 'rooftop', 'private'], 
    required: true 
  },
  isAvailable: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['available', 'reserved', 'cleaning', 'maintenance'], 
    default: 'available' 
  },
  location: { type: String },
  amenities: [{ type: String }],
  price: { type: Number, min: 0 },
  images: [{ type: String }],
  
  // Admin Metadata
  createdBy: { type: String },
  updatedBy: { type: String }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for high-performance table availability queries
restaurantTableSchema.index({ tableId: 1 }, { unique: true });
restaurantTableSchema.index({ isAvailable: 1 });
restaurantTableSchema.index({ status: 1 });
restaurantTableSchema.index({ tableType: 1 });
restaurantTableSchema.index({ seatingCapacity: 1 });
restaurantTableSchema.index({ tableType: 1, isAvailable: 1, status: 1 }); // Compound for filtering
restaurantTableSchema.index({ location: 1 });

export default mongoose.model<IRestaurantTable>('RestaurantTable', restaurantTableSchema);
