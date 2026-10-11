const Category = require('../models/Category');
const Supplier = require('../models/Supplier');

const DEMO_CATEGORIES = [
  {
    name: 'Industrial Machinery',
    description: 'Heavy duty workshop equipment, hydraulic jacks, conveyor parts',
  },
  {
    name: 'Electronics & Sensors',
    description: 'Barcode scanners, temperature sensors, IoT asset tags, scale meters',
  },
  {
    name: 'Safety & PPE',
    description: 'Helmets, high-visibility jackets, gloves, safety boots, eye protection',
  },
  {
    name: 'Packaging & Shipping',
    description: 'Stretch wrap, corrugated boxes, bubble cushion, strapping tape',
  },
  {
    name: 'Hardware & Fasteners',
    description: 'Bolts, hex nuts, brackets, anchor anchors, metallic pins',
  },
];

const DEMO_SUPPLIERS = [
  {
    name: 'Michael Vance',
    companyName: 'Apex Industrial Solutions',
    email: 'vance@apexindustrial.com',
    phone: '+1-555-019-2831',
    address: '742 Evergreen Industrial Park, Chicago, IL',
    gstin: '07AAAAA0000A1Z5',
  },
  {
    name: 'Elena Rostova',
    companyName: 'Precision Sensors Ltd',
    email: 'orders@precisionsensors.io',
    phone: '+1-555-014-9982',
    address: '120 Technology Way, San Jose, CA',
    gstin: '06BBBBB1111B2Z4',
  },
  {
    name: 'David Miller',
    companyName: 'SecurePack Logistics Co.',
    email: 'dmiller@securepack.com',
    phone: '+1-555-017-3341',
    address: '88 Logistics Blvd, Atlanta, GA',
    gstin: '29CCCCC2222C3Z3',
  },
  {
    name: 'Robert Chen',
    companyName: 'Titan Hardware & Fasteners',
    email: 'sales@titanhardware.com',
    phone: '+1-555-018-7712',
    address: '404 Foundry Row, Cleveland, OH',
    gstin: '27DDDDD3333D4Z2',
  },
];

/**
 * Ensures that at least the demo categories and suppliers exist in the database.
 * This is safe to run on every startup — it only creates records that don't already exist.
 * It will NOT overwrite existing data.
 */
const ensureDemoData = async () => {
  try {
    // ── Categories ──────────────────────────────────────────────────────────
    const existingCatCount = await Category.countDocuments({});
    if (existingCatCount === 0) {
      for (const cat of DEMO_CATEGORIES) {
        await Category.create(cat);
      }
      console.log(`[Demo Data] Auto-provisioned ${DEMO_CATEGORIES.length} default categories.`);
    } else {
      console.log(`[Demo Data] ${existingCatCount} categories already exist – skipped seeding.`);
    }

    // ── Suppliers ────────────────────────────────────────────────────────────
    const existingSupCount = await Supplier.countDocuments({});
    if (existingSupCount === 0) {
      for (const sup of DEMO_SUPPLIERS) {
        await Supplier.create(sup);
      }
      console.log(`[Demo Data] Auto-provisioned ${DEMO_SUPPLIERS.length} default suppliers.`);
    } else {
      console.log(`[Demo Data] ${existingSupCount} suppliers already exist – skipped seeding.`);
    }
  } catch (err) {
    console.warn(`[Demo Data] Notice during auto-provisioning: ${err.message}`);
  }
};

module.exports = { ensureDemoData };
