import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  // Basic Information
  roomNumber: string;
  roomName?: string;
  type: 'single' | 'double' | 'deluxe' | 'suite' | 'family' | 'presidential';
  title: string;
  description: string;

  // Pricing & Capacity
  price: number;
  discount?: number;
  discountType?: 'percentage' | 'amount';
  maxGuests: number;
  bedCount: number;
  bedType: 'king' | 'queen' | 'twin' | 'single' | 'sofa';

  // Facilities
  amenities: string[];
  facilities: {
    ac: boolean;
    geyser: boolean;
    wifi: boolean;
    tv: boolean;
    roomService: boolean;
    powerBackup: boolean;
    laundryService: boolean;
    parking: boolean;
    attachedBathroom: boolean;
    balcony: boolean;
    miniFridge: boolean;
    breakfast: boolean;
    cctvSecurity: boolean;
    elevatorAccess: boolean;
  };

  // Room Details
  roomSize: string;
  viewType: 'sea' | 'garden' | 'city' | 'mountain' | 'pool' | 'courtyard';
  floor: number;

  // Status & Availability
  isAvailable: boolean;
  status: 'active' | 'maintenance' | 'cleaning' | 'hidden' | 'inactive';
  availableFrom?: Date;
  isBooked: boolean;

  // Media
  images: string[];
  videoTour?: string;

  // Admin Metadata
  createdBy?: string;
  updatedBy?: string;
}

const roomSchema = new Schema<IRoom>({
  // Basic Information
  roomNumber: { type: String, required: true, unique: true },
  roomName: { type: String },
  type: { 
    type: String, 
    enum: ['single', 'double', 'deluxe', 'suite', 'family', 'presidential'], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },

  // Pricing & Capacity
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'amount'], default: 'percentage' },
  maxGuests: { type: Number, required: true },
  bedCount: { type: Number, required: true },
  bedType: { 
    type: String, 
    enum: ['king', 'queen', 'twin', 'single', 'sofa'], 
    required: true 
  },

  // Facilities
  amenities: [{ type: String }],
  facilities: {
    ac: { type: Boolean, default: false },
    geyser: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    tv: { type: Boolean, default: false },
    roomService: { type: Boolean, default: false },
    powerBackup: { type: Boolean, default: false },
    laundryService: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    attachedBathroom: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    miniFridge: { type: Boolean, default: false },
    breakfast: { type: Boolean, default: false },
    cctvSecurity: { type: Boolean, default: false },
    elevatorAccess: { type: Boolean, default: false }
  },

  // Room Details
  roomSize: { type: String, required: true },
  viewType: { 
    type: String, 
    enum: ['sea', 'garden', 'city', 'mountain', 'pool', 'courtyard'], 
    required: true 
  },
  floor: { type: Number, required: true },

  // Status & Availability
  isAvailable: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['active', 'maintenance', 'cleaning', 'hidden', 'inactive'], 
    default: 'active' 
  },
  availableFrom: { type: Date },
  isBooked: { type: Boolean, default: false },

  // Media
  images: [{ type: String }],
  videoTour: { type: String },

  // Admin Metadata
  createdBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

export default mongoose.model<IRoom>('Room', roomSchema);
