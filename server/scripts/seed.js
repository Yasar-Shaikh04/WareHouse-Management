require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');
const Order = require('../models/Order');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      StockMovement.deleteMany({}),
      Order.deleteMany({}),
    ]);

    console.log('[Seed] Creating Users...');
    // Note: User model pre-save hook will hash passwords automatically
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@warehouse.local',
      password: 'Admin@12345',
      role: 'Admin',
    });

    const manager = await User.create({
      name: 'Sarah Jenkins',
      email: 'manager@warehouse.local',
      password: 'Manager@12345',
      role: 'Warehouse Manager',
    });

    const staff = await User.create({
      name: 'Alex Rivera',
      email: 'staff@warehouse.local',
      password: 'Staff@12345',
      role: 'Staff',
    });

    console.log('[Seed] Creating Categories...');
    const catMachinery = await Category.create({
      name: 'Industrial Machinery',
      description: 'Heavy duty workshop equipment, hydraulic jacks, conveyor parts',
    });
    const catElectronics = await Category.create({
      name: 'Electronics & Sensors',
      description: 'Barcode scanners, temperature sensors, IoT asset tags, scale meters',
    });
    const catSafety = await Category.create({
      name: 'Safety & PPE',
      description: 'Helmets, high-visibility jackets, gloves, safety boots, eye protection',
    });
    const catPackaging = await Category.create({
      name: 'Packaging & Shipping',
      description: 'Stretch wrap, corrugated boxes, bubble cushion, strapping tape',
    });
    const catFasteners = await Category.create({
      name: 'Hardware & Fasteners',
      description: 'Bolts, hex nuts, brackets, anchor anchors, metallic pins',
    });

    console.log('[Seed] Creating Suppliers...');
    const supApex = await Supplier.create({
      name: 'Michael Vance',
      companyName: 'Apex Industrial Solutions',
      email: 'vance@apexindustrial.com',
      phone: '+1-555-019-2831',
      address: '742 Evergreen Industrial Park, Chicago, IL',
      gstin: '07AAAAA0000A1Z5',
    });

    const supSensors = await Supplier.create({
      name: 'Elena Rostova',
      companyName: 'Precision Sensors Ltd',
      email: 'orders@precisionsensors.io',
      phone: '+1-555-014-9982',
      address: '120 Technology Way, San Jose, CA',
      gstin: '06BBBBB1111B2Z4',
    });

    const supPackaging = await Supplier.create({
      name: 'David Miller',
      companyName: 'SecurePack Logistics Co.',
      email: 'dmiller@securepack.com',
      phone: '+1-555-017-3341',
      address: '88 Logistics Blvd, Atlanta, GA',
      gstin: '29CCCCC2222C3Z3',
    });

    const supTitan = await Supplier.create({
      name: 'Robert Chen',
      companyName: 'Titan Hardware & Fasteners',
      email: 'sales@titanhardware.com',
      phone: '+1-555-018-7712',
      address: '404 Foundry Row, Cleveland, OH',
      gstin: '27DDDDD3333D4Z2',
    });

    console.log('[Seed] Creating Products...');
    const productsData = [
      {
        sku: 'WMS-SCN-001',
        name: 'Wireless 2D Handheld Barcode Scanner',
        description: 'Rugged Bluetooth barcode scanner with 50m transmission range',
        category: catElectronics._id,
        supplier: supSensors._id,
        purchasePrice: 65.0,
        sellingPrice: 110.0,
        quantity: 45,
        minStockLevel: 10,
        location: 'Aisle 2 - Shelf B',
      },
      {
        sku: 'WMS-IOT-002',
        name: 'Wireless IoT Temperature/Humidity Sensor',
        description: 'Cold storage warehouse environment tracking sensor probe',
        category: catElectronics._id,
        supplier: supSensors._id,
        purchasePrice: 28.5,
        sellingPrice: 52.0,
        quantity: 4, // LOW STOCK
        minStockLevel: 10,
        location: 'Aisle 2 - Shelf D',
      },
      {
        sku: 'WMS-HLM-101',
        name: 'ANSI Heavy Duty Safety Hard Hat',
        description: 'Vented hard hat with 6-point ratchet suspension (Yellow)',
        category: catSafety._id,
        supplier: supApex._id,
        purchasePrice: 14.0,
        sellingPrice: 25.0,
        quantity: 80,
        minStockLevel: 15,
        location: 'Aisle 1 - Bin 04',
      },
      {
        sku: 'WMS-GLV-102',
        name: 'Cut Resistant Work Gloves (Level 5)',
        description: 'Nitrile coated safety gloves for warehouse material handling',
        category: catSafety._id,
        supplier: supApex._id,
        purchasePrice: 4.5,
        sellingPrice: 9.0,
        quantity: 2, // CRITICAL LOW STOCK
        minStockLevel: 25,
        location: 'Aisle 1 - Bin 08',
      },
      {
        sku: 'WMS-BOX-201',
        name: 'Heavy Duty Corrugated Boxes (24x18x18)',
        description: 'Bundle of 25 double-wall shipping boxes for freight packing',
        category: catPackaging._id,
        supplier: supPackaging._id,
        purchasePrice: 32.0,
        sellingPrice: 55.0,
        quantity: 120,
        minStockLevel: 30,
        location: 'Zone C - Bulk Rack 1',
      },
      {
        sku: 'WMS-WRP-202',
        name: 'Industrial Stretch Film Wrap (80 Gauge)',
        description: 'Roll of 18 inch x 1500 ft clear cast pallet stretch film',
        category: catPackaging._id,
        supplier: supPackaging._id,
        purchasePrice: 18.0,
        sellingPrice: 34.0,
        quantity: 0, // OUT OF STOCK
        minStockLevel: 15,
        location: 'Zone C - Bulk Rack 2',
      },
      {
        sku: 'WMS-HYD-301',
        name: '3-Ton Hydraulic Hand Pallet Jack',
        description: 'Heavy gauge steel pallet truck with polyurethane wheels',
        category: catMachinery._id,
        supplier: supApex._id,
        purchasePrice: 280.0,
        sellingPrice: 450.0,
        quantity: 8,
        minStockLevel: 3,
        location: 'Equipment Staging Area',
      },
      {
        sku: 'WMS-BLT-401',
        name: 'Grade 8 Hex Cap Screws (1/2"-13 x 2")',
        description: 'High tensile alloy steel zinc-yellow plated hex bolts (Box of 100)',
        category: catFasteners._id,
        supplier: supTitan._id,
        purchasePrice: 22.0,
        sellingPrice: 39.0,
        quantity: 65,
        minStockLevel: 15,
        location: 'Hardware Vault - Bin 14',
      },
    ];

    const createdProducts = [];
    for (const prodData of productsData) {
      const prod = await Product.create(prodData);
      createdProducts.push(prod);

      // Record initial intake movement
      if (prod.quantity > 0) {
        await StockMovement.create({
          product: prod._id,
          movementType: 'IN',
          quantity: prod.quantity,
          previousStock: 0,
          newStock: prod.quantity,
          reason: 'Initial warehouse inventory load',
          referenceNumber: `INIT-${prod.sku}`,
          performedBy: manager._id,
        });
      }
    }

    console.log('[Seed] Creating Customers...');
    const cust1 = await Customer.create({
      name: 'Marcus Brody',
      companyName: 'Metro Distribution Hub',
      email: 'mbrody@metrohub.com',
      phone: '+1-555-012-3489',
      address: '500 Logistics Parkway, Dallas, TX',
    });

    const cust2 = await Customer.create({
      name: 'Samantha Reed',
      companyName: 'Sterling Manufacturing Inc.',
      email: 'sreed@sterlingmfg.com',
      phone: '+1-555-013-8822',
      address: '14 Steel Mill Way, Pittsburgh, PA',
    });

    const cust3 = await Customer.create({
      name: 'Lucas Campbell',
      companyName: 'Quantum Logistics Corp',
      email: 'lcampbell@quantumlogistics.net',
      phone: '+1-555-016-7734',
      address: '220 Airport Road, Seattle, WA',
    });

    console.log('[Seed] Creating Sample Orders...');
    // Order 1: Completed
    const pScanner = createdProducts.find((p) => p.sku === 'WMS-SCN-001');
    const pHat = createdProducts.find((p) => p.sku === 'WMS-HLM-101');
    const pBoxes = createdProducts.find((p) => p.sku === 'WMS-BOX-201');

    const order1 = await Order.create({
      orderNumber: 'ORD-20261001-0001',
      customer: cust1._id,
      orderDate: new Date('2026-10-01T10:30:00Z'),
      items: [
        {
          product: pScanner._id,
          productName: pScanner.name,
          sku: pScanner.sku,
          quantity: 5,
          unitPrice: pScanner.sellingPrice,
          subtotal: 5 * pScanner.sellingPrice,
        },
        {
          product: pHat._id,
          productName: pHat.name,
          sku: pHat.sku,
          quantity: 10,
          unitPrice: pHat.sellingPrice,
          subtotal: 10 * pHat.sellingPrice,
        },
      ],
      totalAmount: 5 * pScanner.sellingPrice + 10 * pHat.sellingPrice,
      status: 'Completed',
      notes: 'Shipped via Express Freight Dock 3',
      createdBy: manager._id,
    });

    // Record stock movement for order 1
    await StockMovement.create({
      product: pScanner._id,
      movementType: 'OUT',
      quantity: 5,
      previousStock: 50,
      newStock: 45,
      reason: `Dispatched order: ${order1.orderNumber}`,
      referenceNumber: order1.orderNumber,
      performedBy: staff._id,
    });

    // Order 2: Processing
    const order2 = await Order.create({
      orderNumber: 'ORD-20261005-0002',
      customer: cust2._id,
      orderDate: new Date('2026-10-05T14:15:00Z'),
      items: [
        {
          product: pBoxes._id,
          productName: pBoxes.name,
          sku: pBoxes.sku,
          quantity: 20,
          unitPrice: pBoxes.sellingPrice,
          subtotal: 20 * pBoxes.sellingPrice,
        },
      ],
      totalAmount: 20 * pBoxes.sellingPrice,
      status: 'Processing',
      notes: 'Palletizing in progress for truck pickup',
      createdBy: staff._id,
    });

    // Order 3: Pending
    const order3 = await Order.create({
      orderNumber: 'ORD-20261010-0003',
      customer: cust3._id,
      orderDate: new Date(),
      items: [
        {
          product: pScanner._id,
          productName: pScanner.name,
          sku: pScanner.sku,
          quantity: 2,
          unitPrice: pScanner.sellingPrice,
          subtotal: 2 * pScanner.sellingPrice,
        },
      ],
      totalAmount: 2 * pScanner.sellingPrice,
      status: 'Pending',
      notes: 'Awaiting customer PO confirmation',
      createdBy: manager._id,
    });

    console.log('[Seed] Database seeding completed successfully!');
    console.log('======================================================');
    console.log('  CREDENTIALS CREATED FOR DEMONSTRATION:');
    console.log('  1. Administrator:');
    console.log('     Email:    admin@warehouse.local');
    console.log('     Password: Admin@12345');
    console.log('     Role:     Admin (Complete access to all modules)');
    console.log('');
    console.log('  2. Warehouse Manager:');
    console.log('     Email:    manager@warehouse.local');
    console.log('     Password: Manager@12345');
    console.log('     Role:     Warehouse Manager');
    console.log('');
    console.log('  3. Staff:');
    console.log('     Email:    staff@warehouse.local');
    console.log('     Password: Staff@12345');
    console.log('     Role:     Staff');
    console.log('======================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedData();
