/**
 * Safely provision or reset a single demo user.
 * Never deletes or modifies any other record.
 *
 *   node scripts/provision-demo-user.js                    # create any missing demo user
 *   node scripts/provision-demo-user.js --email=staff@warehouse.local
 *   node scripts/provision-demo-user.js --email=staff@warehouse.local --reset-password
 */
require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { DEMO_USERS } = require('../utils/ensureDemoUsers');
const { runtimeContext } = require('../utils/diagnostics');

const args = process.argv.slice(2);
const getFlag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const hasFlag = (name) => args.includes(`--${name}`);

const targetEmail = (getFlag('email') || '').trim().toLowerCase();
const resetPassword = hasFlag('reset-password');

const run = async () => {
  await connectDB();
  console.log(`[Provision] Database: ${runtimeContext().db}`);

  const wanted = targetEmail ? DEMO_USERS.filter((d) => d.email.toLowerCase() === targetEmail) : DEMO_USERS;

  if (targetEmail && wanted.length === 0) {
    console.error(
      `[Provision] "${targetEmail}" is not a known demo account. Known: ${DEMO_USERS.map((d) => d.email).join(', ')}`
    );
    console.error('[Provision] To set a password for any account, use --email=<known demo email>.');
    process.exitCode = 1;
    await disconnectDB();
    return;
  }

  for (const demo of wanted) {
    const email = demo.email.toLowerCase();
    const existing = await User.findOne({ email });

    if (!existing) {
      const created = await User.create({ ...demo, email });
      console.log(`[Provision] Created ${email} (role: ${created.role}).`);
      continue;
    }

    if (!resetPassword) {
      console.log(`[Provision] Exists, untouched: ${email} (role: ${existing.role}). Add --reset-password to change it.`);
      continue;
    }

    // Assigning the plain password marks the field dirty, so the model's
    // pre-save hook hashes it exactly once.
    existing.password = demo.password;
    existing.isActive = true;
    await existing.save();
    console.log(`[Provision] Reset to demo defaults: ${email} (role: ${existing.role}).`);
  }

  // Verify each account can authenticate, without printing the password.
  for (const demo of wanted) {
    const user = await User.findOne({ email: demo.email.toLowerCase() });
    if (!user) continue;
    const ok = await user.comparePassword(demo.password);
    console.log(`[Provision] Login check ${demo.email}: ${ok ? 'OK' : 'FAILED'}`);
  }

  await disconnectDB();
};

run().catch(async (err) => {
  console.error('[Provision] Error:', err.message);
  await disconnectDB();
  process.exit(1);
});
