import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  taskId: string;
  staffId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  category: 'room-cleaning' | 'maintenance' | 'guest-support' | 'food-delivery' | 'laundry' | 'emergency' | 'inventory';
  roomNumber?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  deadline: Date;
  notes?: string;
  startTime?: Date;
  completionTime?: Date;
  completionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  taskId: { type: String, unique: true }, // Remove required, we'll generate it
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { 
    type: String, 
    enum: ['room-cleaning', 'maintenance', 'guest-support', 'food-delivery', 'laundry', 'emergency', 'inventory'],
    required: true 
  },
  roomNumber: { type: String },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['assigned', 'in-progress', 'completed', 'cancelled'], default: 'assigned' },
  deadline: { type: Date, required: true },
  notes: { type: String },
  startTime: { type: Date },
  completionTime: { type: Date },
  completionNotes: { type: String }
}, { timestamps: true });

// Generate unique task ID before saving
taskSchema.pre('save', async function(next) {
  if (!this.taskId) {
    try {
      // Use this.constructor to get the model in the pre-save hook
      const TaskModel = this.constructor as any;
      const count = await TaskModel.countDocuments();
      this.taskId = `TSK-${String(count + 1).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating task ID:', error);
      // Fallback to timestamp-based ID if count fails
      this.taskId = `TSK-${Date.now().toString().slice(-8)}`;
    }
  }
  next();
});

// Add index for better query performance
taskSchema.index({ staffId: 1, status: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ status: 1 });

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
