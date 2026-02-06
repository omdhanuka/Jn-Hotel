import mongoose, { Document, Schema } from 'mongoose';

export interface IOffer extends Document {
  title: string;
  description: string;
  discount: number;
  image: string;
  features: string[];
  validUntil: Date;
  category: 'romantic' | 'luxury' | 'family' | 'business';
  price: number;
  originalPrice: number;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Offer description is required'],
      trim: true
    },
    discount: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: 0,
      max: 100
    },
    image: {
      type: String,
      required: [true, 'Offer image is required']
    },
    features: {
      type: [String],
      default: []
    },
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required']
    },
    category: {
      type: String,
      enum: ['romantic', 'luxury', 'family', 'business'],
      required: [true, 'Category is required']
    },
    price: {
      type: Number,
      required: [true, 'Offer price is required'],
      min: 0
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: 0
    },
    code: {
      type: String,
      required: [true, 'Promo code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
offerSchema.index({ category: 1, isActive: 1 });
offerSchema.index({ code: 1 });
offerSchema.index({ validUntil: 1 });

export default mongoose.model<IOffer>('Offer', offerSchema);
