# REST API Documentation
## Warehouse Management System (WMS) v1.0

- **Base URL**: `/api/v1`
- **Protocol**: HTTP/HTTPS
- **Session Transport**: HTTP-Only Secure Cookie (`connect.sid`)
- **Default Response**: `application/json`

---

## 1. Authentication & User Management

### 1.1 Register New User
- **Method**: `POST`
- **Path**: `/auth/register`
- **Access**: Public (Role limited to `Warehouse Manager` or `Staff`)
- **Request Body**:
```json
{
  "name": "Alex Rivera",
  "email": "alex@warehouse.local",
  "password": "Password123",
  "role": "Staff"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful. You are now logged in.",
  "user": {
    "_id": "6707a01b...",
    "name": "Alex Rivera",
    "email": "alex@warehouse.local",
    "role": "Staff",
    "isActive": true
  }
}
```

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@warehouse.local",
  "password": "Admin@12345"
}
```
- **Response (200 OK)**: Sets HTTP-Only cookie `connect.sid`.

### 1.3 User Logout
- **Method**: `POST`
- **Path**: `/auth/logout`
- **Access**: Authenticated
- **Response (200 OK)**: Clears session cookie and destroys session in MongoDB.

### 1.4 Get Current User Profile
- **Method**: `GET`
- **Path**: `/auth/me`
- **Access**: Authenticated

### 1.5 Update User Profile
- **Method**: `PUT`
- **Path**: `/auth/profile`
- **Access**: Authenticated
- **Request Body**: `{ "name": "New Name", "email": "new@warehouse.local" }`

### 1.6 Change Password
- **Method**: `PUT`
- **Path**: `/auth/change-password`
- **Access**: Authenticated
- **Request Body**: `{ "currentPassword": "OldPassword123", "newPassword": "NewPassword123" }`

---

## 2. Product Management

### 2.1 List Products (Search, Filter, Sort, Paginate)
- **Method**: `GET`
- **Path**: `/products`
- **Access**: Authenticated
- **Query Parameters**:
  - `search`: Filter by name or SKU substring.
  - `category`: Category ObjectId filter.
  - `supplier`: Supplier ObjectId filter.
  - `stockStatus`: `in-stock` | `low-stock` | `out-of-stock`.
  - `sortBy`: `createdAt` | `name` | `sku` | `sellingPrice` | `quantity`.
  - `sortOrder`: `asc` | `desc`.
  - `page`: Page index (default: 1).
  - `limit`: Items per page (default: 10).

### 2.2 Get Product by ID
- **Method**: `GET`
- **Path**: `/products/:id`
- **Access**: Authenticated
- **Response (200 OK)**: Returns full product details with populated category, supplier, and recent stock movements.

### 2.3 Create Product
- **Method**: `POST`
- **Path**: `/products`
- **Access**: Admin, Warehouse Manager
- **Request Body**:
```json
{
  "sku": "WMS-SCN-001",
  "name": "Wireless 2D Handheld Barcode Scanner",
  "description": "Rugged scanner",
  "category": "6707a01...",
  "supplier": "6707a02...",
  "purchasePrice": 65.0,
  "sellingPrice": 110.0,
  "quantity": 50,
  "minStockLevel": 10,
  "location": "Aisle 2 - Shelf B",
  "imageUrl": "/uploads/scanner-123.jpg"
}
```

### 2.4 Update Product
- **Method**: `PUT`
- **Path**: `/products/:id`
- **Access**: Admin, Warehouse Manager

### 2.5 Delete Product
- **Method**: `DELETE`
- **Path**: `/products/:id`
- **Access**: Admin (Blocks deletion if product exists in active orders)

---

## 3. Category Management

### 3.1 List Categories
- **Method**: `GET`
- **Path**: `/categories`
- **Query Parameters**: `search`
- **Response (200 OK)**: Returns categories list with linked `productCount`.

### 3.2 Create Category
- **Method**: `POST`
- **Path**: `/categories`
- **Access**: Admin, Warehouse Manager
- **Request Body**: `{ "name": "Safety & PPE", "description": "Protective gear" }`

### 3.3 Delete Category
- **Method**: `DELETE`
- **Path**: `/categories/:id`
- **Access**: Admin (Referential integrity: rejected if `productCount > 0`)

---

## 4. Supplier Management

### 4.1 List Suppliers
- **Method**: `GET`
- **Path**: `/suppliers`
- **Query Parameters**: `search`

### 4.2 Create Supplier
- **Method**: `POST`
- **Path**: `/suppliers`
- **Access**: Admin, Warehouse Manager

### 4.3 Delete Supplier
- **Method**: `DELETE`
- **Path**: `/suppliers/:id`
- **Access**: Admin (Referential integrity: rejected if products reference supplier)

---

## 5. Customer Management

### 5.1 List Customers
- **Method**: `GET`
- **Path**: `/customers`
- **Query Parameters**: `search`

### 5.2 Get Customer Order History
- **Method**: `GET`
- **Path**: `/customers/:id`
- **Response (200 OK)**: Returns customer details and array of historical orders.

---

## 6. Inventory & Stock Movements

### 6.1 Inventory Valuation Overview
- **Method**: `GET`
- **Path**: `/inventory`
- **Response (200 OK)**:
```json
{
  "success": true,
  "summary": {
    "totalProducts": 8,
    "totalStockUnits": 324,
    "totalPurchaseValuation": 14250.0,
    "totalSellingValuation": 25480.0,
    "lowStockCount": 2,
    "outOfStockCount": 1
  },
  "inventory": [...]
}
```

### 6.2 Get Stock Movements Log
- **Method**: `GET`
- **Path**: `/stock-movements`
- **Query Parameters**: `product`, `movementType`, `page`, `limit`

### 6.3 Record Stock Movement
- **Method**: `POST`
- **Path**: `/stock-movements`
- **Access**: Authenticated
- **Request Body**:
```json
{
  "product": "6707a01...",
  "movementType": "IN",
  "quantity": 10,
  "reason": "Received vendor pallet intake",
  "referenceNumber": "PO-9812"
}
```

---

## 7. Order Management

### 7.1 List Orders
- **Method**: `GET`
- **Path**: `/orders`
- **Query Parameters**: `status`, `search`, `page`, `limit`

### 7.2 Create Order (Deducts Inventory)
- **Method**: `POST`
- **Path**: `/orders`
- **Access**: Authenticated
- **Request Body**:
```json
{
  "customer": "6707a03...",
  "notes": "Express Dock 3",
  "items": [
    {
      "product": "6707a01...",
      "quantity": 5,
      "unitPrice": 110.0
    }
  ]
}
```

### 7.3 Update Order Status
- **Method**: `PATCH`
- **Path**: `/orders/:id/status`
- **Access**: Admin, Warehouse Manager
- **Request Body**: `{ "status": "Cancelled", "reason": "Customer cancellation" }`
- **Stock Rule**: Transitioning to `Cancelled` automatically restores deducted inventory and logs an incoming restoration stock movement.

---

## 8. Reports & CSV Export

- `GET /reports/dashboard`: Returns aggregate KPI stats, charts, and recent activity.
- `GET /reports/inventory`: Returns full inventory valuation dataset.
- `GET /reports/low-stock`: Returns items at or below minimum threshold.
- `GET /reports/inventory/export`: Downloads live Inventory CSV.
- `GET /reports/stock-movements/export`: Downloads Stock Movements CSV.
- `GET /reports/orders/export`: Downloads Customer Orders CSV.

---

## 9. File Uploads

### 9.1 Upload Product Image
- **Method**: `POST`
- **Path**: `/uploads/product-image`
- **Headers**: `Content-Type: multipart/form-data`
- **Body**: `image` (binary file, JPEG/PNG/WEBP/GIF, max 2MB)
- **Response (200 OK)**:
```json
{
  "success": true,
  "imageUrl": "/uploads/barcode_scanner-172856-491024.jpg",
  "fileName": "barcode_scanner-172856-491024.jpg"
}
```
