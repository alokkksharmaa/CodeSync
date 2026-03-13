import 'dotenv/config';
import mongoose from 'mongoose';
import ActivityLog from './models/ActivityLog.js';
import User from './models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codesync';

async function testActivities() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Count total activities
    const totalCount = await ActivityLog.countDocuments();
    console.log(`\nTotal activities in database: ${totalCount}\n`);

    // Fetch all activities
    const activities = await ActivityLog.find()
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`\nFound ${activities.length} activities:\n`);
    
    activities.forEach((act, i) => {
      console.log(`${i + 1}. [${act.actionType}] by ${act.userId?.username || 'Unknown'}`);
      console.log(`   Workspace: ${act.workspaceId}`);
      console.log(`   Metadata:`, act.metadata);
      console.log(`   Created: ${act.createdAt}\n`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testActivities();
