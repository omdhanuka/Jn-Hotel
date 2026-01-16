import mongoose, { Document, Schema } from 'mongoose';

export interface IBanquet extends Document {
  // Basic Information
  banquetId: string;
  name: string;
  type: 'wedding' | 'conference' | 'party' | 'meeting' | 'reception' | 'corporate';
  description: string;

  // Capacity & Pricing
  capacity: number;
  pricePerDay: number;
  pricePerHour: number;
  minimumHours: number;

  // Features & Amenities
  amenities: string[];
  facilities: {
    ac: boolean;
    projector: boolean;
    soundSystem: boolean;
    wifi: boolean;
    parking: boolean;
    catering: boolean;
    decoration: boolean;
    dj: boolean;
    photography: boolean;
    powerBackup: boolean;
  };

  // Seating Arrangements Available
  seatingArrangements: string[];

  // Physical Details
  area: string; // e.g., "2000 sq ft"
  floor: number;
  location: string;

  // Availability
  isAvailable: boolean;
  status: 'active' | 'maintenance' | 'hidden' | 'inactive';

  // Media
  images: string[];
  videoTour?: string;

  // Admin Metadata
  createdBy?: string;
  updatedBy?: string;
}

const banquetSchema = new Schema<IBanquet>({
  // Basic Information
  banquetId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['wedding', 'conference', 'party', 'meeting', 'reception', 'corporate'], 
    required: true 
  },
  description: { type: String, required: true },

  // Capacity & Pricing
  capacity: { type: Number, required: true, min: 1 },
  pricePerDay: { type: Number, required: true, min: 0 },
  pricePerHour: { type: Number, required: true, min: 0 },
  minimumHours: { type: Number, default: 4, min: 1 },

  // Features & Amenities
  amenities: [{ type: String }],
  facilities: {
    type: {
      ac: { type: Boolean, default: false },
      projector: { type: Boolean, default: false },
      soundSystem: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      catering: { type: Boolean, default: false },
      decoration: { type: Boolean, default: false },
      dj: { type: Boolean, default: false },
      photography: { type: Boolean, default: false },
      powerBackup: { type: Boolean, default: false }
    },
    default: {}
  },

  // Seating Arrangements Available
  seatingArrangements: [{ type: String }],

  // Physical Details
  area: { type: String, required: true },
  floor: { type: Number, required: true, min: 1 },
  location: { type: String, required: true },

  // Availability
  isAvailable: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['active', 'maintenance', 'hidden', 'inactive'], 
    default: 'active' 
  },

  // Media
  images: [{ type: String }],
  videoTour: { type: String },

  // Admin Metadata
  createdBy: { type: String },
  updatedBy: { type: String }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for high-performance banquet queries (10,000+ users)
banquetSchema.index({ banquetId: 1 }, { unique: true });
banquetSchema.index({ type: 1 });
banquetSchema.index({ isAvailable: 1 });
banquetSchema.index({ status: 1 });
banquetSchema.index({ capacity: 1 }); // For capacity range queries
banquetSchema.index({ pricePerDay: 1 }); // For price sorting
banquetSchema.index({ pricePerHour: 1 });
banquetSchema.index({ type: 1, isAvailable: 1, status: 1 }); // Compound for filtering
banquetSchema.index({ floor: 1 });
banquetSchema.index({ location: 1 });
banquetSchema.index({ createdAt: -1 }); // For newest listings

export default mongoose.model<IBanquet>('Banquet', banquetSchema);
