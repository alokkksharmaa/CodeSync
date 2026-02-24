import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import ActivityLog from './models/ActivityLog.js';
import User from './models/User.js';
import { getActivities } from './controllers/activityController.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codesync';

async function testFullFlow() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    const workspaceId = '699d2dec5279e7843c12ed79';

    // Test 1: Raw query
    console.log('=== TEST 1: Raw Query ===');
    const rawActivities = await ActivityLog.find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(5);
    console.log(`Found ${rawActivities.length} raw activities`);
    console.log('First activity:', JSON.stringify(rawActivities[0], null, 2));

    // Test 2: With population
    console.log('\n=== TEST 2: With Population ===');
    const populatedActivities = await ActivityLog.find({ workspaceId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    console.log(`Found ${populatedActivities.length} populated activities`);
    console.log('First activity:', JSON.stringify(populatedActivities[0], null, 2));

    // Test 3: Enriched (like API does)
    console.log('\n=== TEST 3: Enriched (API Format) ===');
    const enrichedActivities = populatedActivities.map(act => ({
      ...act,
      metadata: {
        ...act.metadata,
        username: act.metadata?.username || act.userId?.username || 'Unknown User'
      }
    }));
    console.log('First enriched activity:', JSON.stringify(enrichedActivities[0], null, 2));

    // Test 4: Simulate API call
    console.log('\n=== TEST 4: Simulating API Response ===');
    const mockReq = { params: { workspaceId } };
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`Response Status: ${code}`);
          console.log(`Response Data Length: ${data.length}`);
          console.log('First 3 activities:');
          data.slice(0, 3).forEach((act, i) => {
            console.log(`\n${i + 1}. ${act.actionType}`);
            console.log(`   _id: ${act._id}`);
            console.log(`   username: ${act.metadata?.username}`);
            console.log(`   createdAt: ${act.createdAt}`);
          });
          return { status: code, data };
        }
      })
    };

    await getActivities(mockReq, mockRes);

    await mongoose.disconnect();
    console.log('\n\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFullFlow();
