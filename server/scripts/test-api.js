require('dotenv').config();
const http = require('http');
const { connectDB, disconnectDB } = require('../config/db');
const { createApp } = require('../app');
const User = require('../models/User');

// Helper to make HTTP requests with cookie jar
class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = [];
  }

  request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (this.cookies.length > 0) {
        options.headers['Cookie'] = this.cookies.join('; ');
      }

      const req = http.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          // Capture Set-Cookie headers
          const setCookie = res.headers['set-cookie'];
          if (setCookie) {
            setCookie.forEach((c) => {
              const cookiePart = c.split(';')[0];
              this.cookies = this.cookies.filter((existing) => !existing.startsWith(cookiePart.split('=')[0]));
              this.cookies.push(cookiePart);
            });
          }

          let json = null;
          try {
            json = JSON.parse(data);
          } catch {
            json = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  get(path) {
    return this.request('GET', path);
  }

  post(path, body) {
    return this.request('POST', path, body);
  }

  put(path, body) {
    return this.request('PUT', path, body);
  }

  patch(path, body) {
    return this.request('PATCH', path, body);
  }

  delete(path) {
    return this.request('DELETE', path);
  }
}

const runTests = async () => {
  let server;
  let client;

  console.log('====================================================');
  console.log('  STARTING WMS BACKEND AUTOMATED INTEGRATION TESTS  ');
  console.log('====================================================\n');

  try {
    await connectDB();
    const app = createApp();

    // Start server on an ephemeral free port
    server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    client = new HttpClient(baseUrl);

    let passCount = 0;
    let failCount = 0;

    const assert = (condition, description) => {
      if (condition) {
        console.log(`  [PASS] ${description}`);
        passCount++;
      } else {
        console.error(`  [FAIL] ${description}`);
        failCount++;
      }
    };

    // 1. Health Check
    console.log('[Test Suite 1: Server Health & Security Headers]');
    const health = await client.get('/api/health');
    assert(health.status === 200 && health.body.status === 'OK', 'GET /api/health returns 200 OK');

    // 2. Reject Public Registration with Admin role
    console.log('\n[Test Suite 2: Authentication & Session Management]');
    const regAdminAttempt = await client.post('/api/v1/auth/register', {
      name: 'Hacker Admin',
      email: 'hacker@test.com',
      password: 'password123',
      role: 'Admin', // Must be rejected
    });
    assert(regAdminAttempt.status === 400, 'Public registration blocks Admin role assignment (400)');

    // 3. Valid Registration as Staff
    const regStaff = await client.post('/api/v1/auth/register', {
      name: 'Integration Tester',
      email: 'tester@test.com',
      password: 'TesterPassword123',
      role: 'Staff',
    });
    assert(regStaff.status === 201 && regStaff.body.user.role === 'Staff', 'Valid registration creates user with session (201)');

    // 4. Session Verification via /me
    const meRes = await client.get('/api/v1/auth/me');
    assert(meRes.status === 200 && meRes.body.user.email === 'tester@test.com', 'GET /api/v1/auth/me returns current user from session (200)');

    // 5. Logout
    const logoutRes = await client.post('/api/v1/auth/logout');
    assert(logoutRes.status === 200, 'POST /api/v1/auth/logout invalidates session (200)');

    // 6. Access /me after logout (must fail 401)
    const meLoggedOut = await client.get('/api/v1/auth/me');
    assert(meLoggedOut.status === 401, 'Protected route rejects unauthenticated request (401)');

    // 7. Seeded Admin Login
    // Ensure seed admin exists
    let adminUser = await User.findOne({ email: 'admin@warehouse.local' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Administrator',
        email: 'admin@warehouse.local',
        password: 'Admin@12345',
        role: 'Admin',
      });
    }

    const adminLogin = await client.post('/api/v1/auth/login', {
      email: 'admin@warehouse.local',
      password: 'Admin@12345',
    });
    assert(adminLogin.status === 200 && adminLogin.body.user.role === 'Admin', 'Admin login succeeds with credentials (200)');

    // 8. Categories CRUD
    console.log('\n[Test Suite 3: Category Management CRUD]');
    const newCat = await client.post('/api/v1/categories', {
      name: `Test Cat ${Date.now()}`,
      description: 'Test category description',
    });
    assert(newCat.status === 201 && newCat.body.category.name.startsWith('Test Cat'), 'POST /api/v1/categories creates category (201)');
    const testCatId = newCat.body.category._id;

    const listCats = await client.get('/api/v1/categories');
    assert(listCats.status === 200 && Array.isArray(listCats.body.categories), 'GET /api/v1/categories returns list with productCount (200)');

    // 9. Suppliers CRUD
    console.log('\n[Test Suite 4: Supplier Management CRUD]');
    const newSup = await client.post('/api/v1/suppliers', {
      name: 'Supplier Contact',
      companyName: `Test Supplier Corp ${Date.now()}`,
      email: 'supplier@test.com',
      phone: '+1-555-1234567',
      address: '123 Supplier Industrial Way',
    });
    assert(newSup.status === 201 && newSup.body.supplier.name === 'Supplier Contact', 'POST /api/v1/suppliers creates supplier (201)');
    const testSupId = newSup.body.supplier._id;

    // 10. Customers CRUD
    console.log('\n[Test Suite 5: Customer Management CRUD]');
    const newCust = await client.post('/api/v1/customers', {
      name: 'Alice Customer',
      companyName: 'Retail Stores Ltd',
      email: 'alice@retail.com',
      phone: '+1-555-9876543',
      address: '77 Commerce Blvd',
    });
    assert(newCust.status === 201 && newCust.body.customer.name === 'Alice Customer', 'POST /api/v1/customers creates customer (201)');
    const testCustId = newCust.body.customer._id;

    // 11. Products CRUD
    console.log('\n[Test Suite 6: Product Management CRUD]');
    const uniqueSku = `TEST-SKU-${Date.now().toString().slice(-5)}`;
    const newProd = await client.post('/api/v1/products', {
      sku: uniqueSku,
      name: 'Industrial Torque Wrench',
      description: 'Precision digital torque wrench',
      category: testCatId,
      supplier: testSupId,
      purchasePrice: 40.0,
      sellingPrice: 75.0,
      quantity: 50,
      minStockLevel: 10,
      location: 'Rack 4B',
    });
    assert(newProd.status === 201 && newProd.body.product.sku === uniqueSku, 'POST /api/v1/products creates product (201)');
    const testProdId = newProd.body.product._id;

    // Reject duplicate SKU
    const dupSku = await client.post('/api/v1/products', {
      sku: uniqueSku,
      name: 'Duplicate Item',
      category: testCatId,
      supplier: testSupId,
      purchasePrice: 10,
      sellingPrice: 20,
    });
    assert(dupSku.status === 409, 'Duplicate SKU creation is rejected (409)');

    // 12. Stock Movements
    console.log('\n[Test Suite 7: Inventory & Stock Movements]');
    // IN Movement
    const movIn = await client.post('/api/v1/stock-movements', {
      product: testProdId,
      movementType: 'IN',
      quantity: 10,
      reason: 'Batch shipment received',
    });
    assert(movIn.status === 201 && movIn.body.product.quantity === 60, 'IN StockMovement increases product quantity (50 -> 60) (201)');

    // OUT Movement
    const movOut = await client.post('/api/v1/stock-movements', {
      product: testProdId,
      movementType: 'OUT',
      quantity: 5,
      reason: 'Sample transfer to showroom',
    });
    assert(movOut.status === 201 && movOut.body.product.quantity === 55, 'OUT StockMovement decreases product quantity (60 -> 55) (201)');

    // Reject OUT exceeding available stock
    const movOver = await client.post('/api/v1/stock-movements', {
      product: testProdId,
      movementType: 'OUT',
      quantity: 1000,
      reason: 'Excessive dispatch',
    });
    assert(movOver.status === 400, 'Negative stock dispatch is rejected (400)');

    // 13. Order Management & Stock Consistency
    console.log('\n[Test Suite 8: Order Management & Inventory Consistency]');
    const newOrder = await client.post('/api/v1/orders', {
      customer: testCustId,
      items: [
        {
          product: testProdId,
          quantity: 15,
          unitPrice: 75.0,
        },
      ],
      notes: 'Test urgent dispatch order',
    });
    assert(newOrder.status === 201 && newOrder.body.order.status === 'Pending', 'POST /api/v1/orders creates order (201)');
    const testOrderId = newOrder.body.order._id;

    // Verify stock was deducted upon order placement (55 - 15 = 40)
    const prodAfterOrder = await client.get(`/api/v1/products/${testProdId}`);
    assert(prodAfterOrder.body.product.quantity === 40, 'Order creation automatically deducts stock (55 -> 40)');

    // Update status to Processing (should NOT deduct stock twice!)
    const statusProc = await client.patch(`/api/v1/orders/${testOrderId}/status`, {
      status: 'Processing',
    });
    assert(statusProc.status === 200 && statusProc.body.order.status === 'Processing', 'PATCH order status to Processing succeeds (200)');
    const prodAfterProc = await client.get(`/api/v1/products/${testProdId}`);
    assert(prodAfterProc.body.product.quantity === 40, 'Status change to Processing does not deduct stock again (remains 40)');

    // Cancel order and verify stock restoration (40 + 15 = 55)
    const cancelOrder = await client.patch(`/api/v1/orders/${testOrderId}/status`, {
      status: 'Cancelled',
      reason: 'Client requested cancellation',
    });
    assert(cancelOrder.status === 200 && cancelOrder.body.order.status === 'Cancelled', 'PATCH order status to Cancelled succeeds (200)');
    const prodAfterCancel = await client.get(`/api/v1/products/${testProdId}`);
    assert(prodAfterCancel.body.product.quantity === 55, 'Order cancellation restores deducted stock back to inventory (40 -> 55)');

    // 14. Reports & Dashboard
    console.log('\n[Test Suite 9: Reports, Analytics & CSV Export]');
    const dash = await client.get('/api/v1/reports/dashboard');
    assert(dash.status === 200 && dash.body.stats.totalProducts > 0, 'GET /api/v1/reports/dashboard returns real metrics (200)');

    const csvInv = await client.get('/api/v1/reports/inventory/export');
    assert(csvInv.status === 200 && csvInv.headers['content-type'].includes('text/csv'), 'GET /api/v1/reports/inventory/export returns valid CSV (200)');

    const csvMov = await client.get('/api/v1/reports/stock-movements/export');
    assert(csvMov.status === 200 && csvMov.headers['content-type'].includes('text/csv'), 'GET /api/v1/reports/stock-movements/export returns valid CSV (200)');

    const csvOrd = await client.get('/api/v1/reports/orders/export');
    assert(csvOrd.status === 200 && csvOrd.headers['content-type'].includes('text/csv'), 'GET /api/v1/reports/orders/export returns valid CSV (200)');

    console.log('\n====================================================');
    console.log(`  INTEGRATION TESTS SUMMARY:`);
    console.log(`  Passed: ${passCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log('====================================================');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('[Test Execution Error]:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
    process.exit(0);
  }
};

runTests();
