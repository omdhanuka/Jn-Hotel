import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  ingredients: string[];
  allergens: string[];
  preparationTime: number;
}

const menuItemSchema = new Schema<IMenuItem>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String },
  isAvailable: { type: Boolean, default: true },
  ingredients: [{ type: String }],
  allergens: [{ type: String }],
  preparationTime: { type: Number, default: 15 } // in minutes
}, { timestamps: true });

export default mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
