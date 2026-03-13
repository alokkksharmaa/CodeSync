import mongoose from 'mongoose';
import 'dotenv/config';
import File from './models/File.js';

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codesync');
  await File.collection.dropIndexes();
  await File.syncIndexes();
  const indexes2 = await File.collection.indexes();
  console.log('NEW INDEXES:', JSON.stringify(indexes2, null, 2));
  process.exit(0);
}
check();
