// scripts/hashPasswords.js
require('dotenv').config({path:'../.env'});
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
 
// Adjust path to your Login model
const Login = require('../src/models/loginModel'); // <-- update if needed
 
const MONGO_URI = process.env.MONGO_URI;
const SALT_ROUNDS = 10;
 
async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');
 
  const users = await Login.find({});
  console.log(`Found ${users.length} login documents.`);
 
  for (const u of users) {
    const stored = u.password || '';
    const looksHashed = typeof stored === 'string' && stored.startsWith('$2'); // bcrypt hashes start with $2a/$2b etc
 
    if (looksHashed) {
      console.log(`Skipping ${u._id} - already hashed.`);
      continue;
    }
 
    if (!stored) {
      console.warn(`Skipping ${u._id} - empty password.`);
      continue;
    }
 
    const hashed = await bcrypt.hash(stored, SALT_ROUNDS);
    u.password = hashed;
    await u.save();
    console.log(`Hashed password for ${u._id}`);
  }
 
  await mongoose.disconnect();
  console.log('Done. Disconnected.');
}
 
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});