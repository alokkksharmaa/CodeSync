import 'dotenv/config';
import mongoose from 'mongoose';
import ActivityLog from './models/ActivityLog.js';
import User from './models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codesync';

async function testActivityApi() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const workspaceId = '699d2dec5279e7843c12ed79'; // From the test output

    // Simulate what the API does
    const activities = await ActivityLog.find({ workspaceId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    console.log(`\nFound ${activities.length} activities for workspace ${workspaceId}\n`);

    // Enrich activities with username from populated userId
    const enrichedActivities = activities.map(act => ({
      ...act,
      metadata: {
        ...act.metadata,
        username: act.metadata?.username || act.userId?.username || 'Unknown User'
      }
    }));

    console.log('First 5 enriched activities:');
    enrichedActivities.slice(0, 5).forEach((act, i) => {
      console.log(`\n${i + 1}. ${act.actionType}`);
      console.log(`   Username: ${act.metadata.username}`);
      console.log(`   UserId populated:`, act.userId);
      console.log(`   Metadata:`, act.metadata);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testActivityApi();
