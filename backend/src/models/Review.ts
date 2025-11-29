import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  experienceType: 'room' | 'banquet' | 'restaurant' | 'overall';
  isApproved: boolean;
  isSpam?: boolean;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  moderatorNotes?: string;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 1000 },
  experienceType: { 
    type: String, 
    enum: ['room', 'banquet', 'restaurant', 'overall'],
    default: 'overall'
  },
  isApproved: { type: Boolean, default: false },
  isSpam: { type: Boolean, default: false },
  moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  moderatorNotes: { type: String },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

// Index for efficient queries
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });
reviewSchema.index({ rating: -1, createdAt: -1 });
reviewSchema.index({ isApproved: 1, isPublished: 1 });

export default mongoose.model<IReview>('Review', reviewSchema);
