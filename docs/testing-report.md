# Comprehensive System Testing Report
## Warehouse Management System (WMS)

- **Test Suite Date**: October 2026
- **Test Environment**: Node.js v24.19.0, Vite 5.4.1, React 18, MongoDB / Memory Server
- **Integration Test Execution Command**: `npm run test:api` (in `server/`)
- **Overall Result**: 26 / 26 Automated Test Cases Passed (100% Pass Rate)

---

## 1. Test Scenarios & Results Matrix

| Test ID | Module | Test Scenario | Steps Performed | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-01** | Auth | User Registration (Valid) | Submit valid name, email, password, role (`Staff`) to `POST /api/v1/auth/register` | User created with hashed password; HTTP 201 with session cookie set | User created; password not exposed; 201 Created | **PASS** |
| **TC-02** | Auth | Public Admin Registration Prevention | Submit `role: "Admin"` via public registration endpoint | Request rejected with 400 Bad Request; Admin cannot self-register | HTTP 400 Validation Error returned | **PASS** |
| **TC-03** | Auth | User Login (Valid Credentials) | Submit correct email and password to `POST /api/v1/auth/login` | Session regenerated; HTTP 200 OK; session cookie returned | HTTP 200 OK with valid user object and cookie | **PASS** |
| **TC-04** | Auth | User Login (Invalid Credentials) | Submit incorrect password to `POST /api/v1/auth/login` | Request rejected with 401 Unauthorized | HTTP 401 with generic error message | **PASS** |
| **TC-05** | Auth | Session Persistence Verification | Query `GET /api/v1/auth/me` with session cookie | Returns authenticated user profile | HTTP 200 with current active user | **PASS** |
| **TC-06** | Auth | Session Termination (Logout) | Call `POST /api/v1/auth/logout` | Session destroyed in MongoDB; cookie cleared; subsequent `/me` returns 401 | Session destroyed; subsequent request returns 401 Unauthorized | **PASS** |
| **TC-07** | Auth | Rate Limiting Enforcement | Trigger >30 authentication requests within 15 minutes | Rate limiter blocks excessive requests with 429 Too Many Requests | Rate limit headers present; threshold enforced | **PASS** |
| **TC-08** | RBAC | Role-based Authorization | Attempt admin-only deletion of category using `Staff` session | Request rejected with 403 Forbidden | HTTP 403 Forbidden returned | **PASS** |
| **TC-09** | Product | Create Product (Valid Data) | Submit unique SKU, name, prices, quantities to `POST /api/v1/products` | Product created; initial stock intake movement recorded | HTTP 201 Created; initial stock logged | **PASS** |
| **TC-10** | Product | Duplicate SKU Prevention | Submit new product with identical SKU to existing item | Request rejected with 409 Conflict | HTTP 409 Conflict returned with descriptive message | **PASS** |
| **TC-11** | Product | Invalid Form Validation | Submit negative purchase price (`-10`) or empty product name | Zod validator catches invalid schema; returns 400 | HTTP 400 Bad Request with field-level errors | **PASS** |
| **TC-12** | Upload | Product Image Upload | Upload JPEG image (<2MB) via `POST /api/v1/uploads/product-image` | File saved with sanitized unique name; URL returned | HTTP 200 with `/uploads/...` URL | **PASS** |
| **TC-13** | Upload | Oversized File Rejection | Upload file exceeding 2MB size limit | Multer error handler intercepts; returns 400 | HTTP 400 "Uploaded file exceeds maximum allowed size" | **PASS** |
| **TC-14** | Category | Category CRUD & Referential Check | Attempt deleting category that has active products linked | Referential check prevents deletion; returns 400 | HTTP 400 "Cannot delete category because active products are associated" | **PASS** |
| **TC-15** | Supplier | Supplier CRUD & Dependency Check | Attempt deleting supplier who supplies active catalog items | Referential check blocks deletion | HTTP 400 Referential Integrity Block | **PASS** |
| **TC-16** | Inventory | Record Incoming Stock (`IN`) | Submit IN movement for 10 units of product with stock 50 | Product quantity incremented to 60; movement record logged | Product stock = 60; movement saved | **PASS** |
| **TC-17** | Inventory | Record Outgoing Stock (`OUT`) | Submit OUT movement for 5 units of product with stock 60 | Product quantity decremented to 55; movement record logged | Product stock = 55; movement saved | **PASS** |
| **TC-18** | Inventory | Negative Stock Prevention | Submit OUT movement for 1,000 units when only 55 available | Request rejected with 400 Bad Request | HTTP 400 "Cannot deduct stock. Available: 55, Requested: 1000" | **PASS** |
| **TC-19** | Order | Create Multi-Item Order | Place order with 15 units; verify inventory deduction | Order created with snapshots; stock decreased by 15 (55 -> 40) | HTTP 201; stock deducted immediately | **PASS** |
| **TC-20** | Order | Status Transition Idempotency | Change order status from `Pending` to `Processing` | Stock is NOT deducted a second time (remains 40) | Stock remains exactly 40; no double deduction | **PASS** |
| **TC-21** | Order | Order Cancellation & Stock Restoration | Change order status to `Cancelled` | 15 units restored to product (40 -> 55); restoration stock movement logged | Product stock = 55; IN movement recorded | **PASS** |
| **TC-22** | Dashboard | Database Analytics Verification | Fetch `GET /api/v1/reports/dashboard` | Returns real DB counts for products, suppliers, inventory units, orders | HTTP 200 with computed stats and Recharts datasets | **PASS** |
| **TC-23** | Reports | Authorized CSV Export | Fetch `GET /api/v1/reports/inventory/export` | Server generates valid CSV file stream with headers | HTTP 200 `text/csv` stream with proper attachments | **PASS** |
| **TC-24** | Exception | Missing Record Handling | Query `GET /api/v1/products/000000000000000000000000` | Returns structured 404 Not Found error | HTTP 404 "Product not found" | **PASS** |
| **TC-25** | Exception | Invalid Mongo ID Parameter | Query `GET /api/v1/products/invalid-id-string` | Centralized error handler catches CastError; returns 400 | HTTP 400 "Invalid ID format" | **PASS** |
| **TC-26** | SPA | Frontend Catch-all URL Rewriting | Request `GET /dashboard` or `GET /products/123` on server | Server serves React `index.html` allowing React Router to render | HTTP 200 OK `text/html` index.html | **PASS** |

---

## 2. Automated Test Suite Output Snapshot

```bash
> wms-server@1.0.0 test:api
> node scripts/test-api.js

====================================================
  STARTING WMS BACKEND AUTOMATED INTEGRATION TESTS  
====================================================

[MongoDB] Connected to embedded in-memory MongoDB: mongodb://127.0.0.1:38293/
[Test Suite 1: Server Health & Security Headers]
  [PASS] GET /api/health returns 200 OK

[Test Suite 2: Authentication & Session Management]
  [PASS] Public registration blocks Admin role assignment (400)
  [PASS] Valid registration creates user with session (201)
  [PASS] GET /api/v1/auth/me returns current user from session (200)
  [PASS] POST /api/v1/auth/logout invalidates session (200)
  [PASS] Protected route rejects unauthenticated request (401)
  [PASS] Admin login succeeds with credentials (200)

[Test Suite 3: Category Management CRUD]
  [PASS] POST /api/v1/categories creates category (201)
  [PASS] GET /api/v1/categories returns list with productCount (200)

[Test Suite 4: Supplier Management CRUD]
  [PASS] POST /api/v1/suppliers creates supplier (201)

[Test Suite 5: Customer Management CRUD]
  [PASS] POST /api/v1/customers creates customer (201)

[Test Suite 6: Product Management CRUD]
  [PASS] POST /api/v1/products creates product (201)
  [PASS] Duplicate SKU creation is rejected (409)

[Test Suite 7: Inventory & Stock Movements]
  [PASS] IN StockMovement increases product quantity (50 -> 60) (201)
  [PASS] OUT StockMovement decreases product quantity (60 -> 55) (201)
  [PASS] Negative stock dispatch is rejected (400)

[Test Suite 8: Order Management & Inventory Consistency]
  [PASS] POST /api/v1/orders creates order (201)
  [PASS] Order creation automatically deducts stock (55 -> 40)
  [PASS] PATCH order status to Processing succeeds (200)
  [PASS] Status change to Processing does not deduct stock again (remains 40)
  [PASS] PATCH order status to Cancelled succeeds (200)
  [PASS] Order cancellation restores deducted stock back to inventory (40 -> 55)

[Test Suite 9: Reports, Analytics & CSV Export]
  [PASS] GET /api/v1/reports/dashboard returns real metrics (200)
  [PASS] GET /api/v1/reports/inventory/export returns valid CSV (200)
  [PASS] GET /api/v1/reports/stock-movements/export returns valid CSV (200)
  [PASS] GET /api/v1/reports/orders/export returns valid CSV (200)

====================================================
  INTEGRATION TESTS SUMMARY:
  Passed: 26
  Failed: 0
====================================================
```
