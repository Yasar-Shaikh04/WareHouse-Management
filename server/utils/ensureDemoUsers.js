const User = require('../models/User');

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
  try {
    for (const demo of DEMO_USERS) {
      const existing = await User.findOne({ email: demo.email.toLowerCase() });
      if (!existing) {
        await User.create(demo);
        console.log(`[Demo Accounts] Auto-provisioned: ${demo.email} (${demo.role})`);
      }
    }
  } catch (err) {
    console.warn(`[Demo Accounts] Notice: ${err.message}`);
  }
};

module.exports = { ensureDemoUsers, DEMO_USERS };
