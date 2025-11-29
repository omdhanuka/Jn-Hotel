import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: 'guest' | 'admin' | 'staff' | 'reception' | 'manager';
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
    manageManagers?: boolean;
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
    enum: ['guest', 'admin', 'staff', 'reception', 'manager'], 
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
    manageBills: { type: Boolean, default: false },
    manageManagers: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    console.log(`🔐 Password hashed for user: ${this.email}`);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Hash password before updating
userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() as any;
  
  if (update.password) {
    try {
      update.password = await bcrypt.hash(update.password, 12);
      console.log('🔐 Password hashed during update');
    } catch (error: any) {
      return next(error);
    }
  }
  
  next();
});

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
