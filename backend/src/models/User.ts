import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: 'guest' | 'admin' | 'staff' | 'reception';
  department?: string;
  position?: string;
  isActive: boolean;
  loyaltyPoints: number;
  isVerified: boolean;
  permissions?: {
    viewBookings?: boolean;
    manageBookings?: boolean;
    viewRooms?: boolean;
    manageRooms?: boolean;
    viewBanquets?: boolean;
    manageBanquets?: boolean;
    viewRestaurant?: boolean;
    manageRestaurant?: boolean;
    viewOrders?: boolean;
    manageOrders?: boolean;
    viewReviews?: boolean;
    manageReviews?: boolean;
    viewUsers?: boolean;
    manageUsers?: boolean;
    viewReports?: boolean;
    manageBills?: boolean;
  };
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['guest', 'admin', 'staff', 'reception'], 
    default: 'guest' 
  },
  department: { type: String },
  position: { type: String },
  isActive: { type: Boolean, default: true },
  loyaltyPoints: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  permissions: {
    viewBookings: { type: Boolean, default: false },
    manageBookings: { type: Boolean, default: false },
    viewRooms: { type: Boolean, default: false },
    manageRooms: { type: Boolean, default: false },
    viewBanquets: { type: Boolean, default: false },
    manageBanquets: { type: Boolean, default: false },
    viewRestaurant: { type: Boolean, default: false },
    manageRestaurant: { type: Boolean, default: false },
    viewOrders: { type: Boolean, default: false },
    manageOrders: { type: Boolean, default: false },
    viewReviews: { type: Boolean, default: false },
    manageReviews: { type: Boolean, default: false },
    viewUsers: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    manageBills: { type: Boolean, default: false }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
