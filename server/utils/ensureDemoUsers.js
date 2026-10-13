const User = require('../models/User');
const { runtimeContext } = require('./diagnostics');

const DEMO_USERS = [
  {
    name: 'System Administrator',
    email: 'admin@warehouse.local',
    password: 'Admin@12345',
    role: 'Admin',
  },
  {
    name: 'Sarah Jenkins',
    email: 'manager@warehouse.local',
    password: 'Manager@12345',
    role: 'Warehouse Manager',
  },
  {
    name: 'Alex Rivera',
    email: 'staff@warehouse.local',
    password: 'Staff@12345',
    role: 'Staff',
  },
];

const ensureDemoUsers = async () => {
  console.log(`[Demo Accounts] Target database: ${runtimeContext().db} (env: ${runtimeContext().env})`);
  for (const demo of DEMO_USERS) {
    const email = demo.email.toLowerCase();
    try {
      const existing = await User.findOne({ email });
      if (existing) {
        console.log(`[Demo Accounts] Present, kept as-is: ${email} (${existing.role})`);
        continue;
      }
      await User.create({ ...demo, email });
      console.log(`[Demo Accounts] Auto-provisioned: ${email} (${demo.role})`);
    } catch (err) {
      // Keep seeding the remaining accounts instead of aborting the whole loop.
      console.error(`[Demo Accounts] Failed to provision ${email}: ${err.message}`);
    }
  }
};

module.exports = { ensureDemoUsers, DEMO_USERS };
