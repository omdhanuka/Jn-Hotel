import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import StaffProfile from '../models/StaffProfile';

dotenv.config();

const createMissingStaffProfiles = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('✅ Connected to MongoDB');

    // Find all staff users without profiles
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`📊 Found ${staffUsers.length} staff users`);

    let created = 0;
    let existing = 0;

    for (const user of staffUsers) {
      const existingProfile = await StaffProfile.findOne({ user: user._id });
      
      if (!existingProfile) {
        // Generate a unique staff ID
        const count = await StaffProfile.countDocuments();
        const staffId = `STAFF${String(count + 1).padStart(4, '0')}`;

        // Create staff profile with default values
        const profile = new StaffProfile({
          user: user._id,
          staffId,
          staffType: 'housekeeping', // Default type - should be updated later
          department: 'General',
          joiningDate: new Date(),
          isActive: true,
          performanceMetrics: {
            tasksCompleted: 0,
            tasksRejected: 0,
            averageCompletionTime: 0,
            rating: 5.0
          },
          leaveBalance: {
            sick: 10,
            casual: 12,
            annual: 15
          }
        });

        await profile.save();
        console.log(`✅ Created profile for ${user.firstName} ${user.lastName} (${user.email}) - Staff ID: ${staffId}`);
        created++;
      } else {
        console.log(`ℹ️  Profile already exists for ${user.firstName} ${user.lastName}`);
        existing++;
      }
    }

    console.log('\n📋 Summary:');
    console.log(`  - Created: ${created} profiles`);
    console.log(`  - Existing: ${existing} profiles`);
    console.log(`  - Total staff users: ${staffUsers.length}`);
    console.log('\n✅ Migration completed successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating staff profiles:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createMissingStaffProfiles();
