const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const mongoIdSchema = z
  .string()
  .regex(objectIdRegex, 'Must be a valid 24-character hexadecimal MongoDB ID');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Valid email address is required').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  // Public registration restricts role to Staff or Warehouse Manager only (Admin cannot be self-registered)
  role: z.enum(['Warehouse Manager', 'Staff']).default('Staff'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Valid email address is required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Valid email address is required').toLowerCase(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().default(''),
});

const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier contact name must be at least 2 characters').max(100),
  companyName: z.string().min(2, 'Company name is required').max(150),
  email: z.string().email('Valid email address is required').toLowerCase(),
  phone: z.string().min(7, 'Valid phone number is required').max(20),
  address: z.string().min(5, 'Address is required').max(250),
  gstin: z.string().max(25).optional().default(''),
});

const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters').max(100),
  email: z.string().email('Valid email address is required').toLowerCase(),
  phone: z.string().min(7, 'Valid phone number is required').max(20),
  address: z.string().min(5, 'Address is required').max(250),
  companyName: z.string().max(150).optional().default(''),
});

const productSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(50).toUpperCase(),
  name: z.string().min(2, 'Product name must be at least 2 characters').max(150),
  description: z.string().max(1000).optional().default(''),
  category: mongoIdSchema,
  supplier: mongoIdSchema,
  purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative').default(0),
  minStockLevel: z.coerce.number().int().min(0, 'Min stock level cannot be negative').default(5),
  location: z.string().max(50).optional().default('Bay A-01'),
  imageUrl: z.string().nullable().optional(),
});

const stockMovementSchema = z.object({
  product: mongoIdSchema,
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(2, 'Reason is required').max(250),
  referenceNumber: z.string().max(100).optional().default(''),
  adjustmentDirection: z.enum(['ADD', 'SUBTRACT']).optional().default('ADD'),
  isAbsolute: z.boolean().optional().default(false),
});

const orderItemSchema = z.object({
  product: mongoIdSchema,
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative').optional(),
});

const orderSchema = z.object({
  customer: mongoIdSchema,
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  notes: z.string().max(500).optional().default(''),
});

const orderStatusSchema = z.object({
  status: z.enum(['Pending', 'Processing', 'Completed', 'Cancelled']),
  reason: z.string().optional(),
});

module.exports = {
  mongoIdSchema,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  categorySchema,
  supplierSchema,
  customerSchema,
  productSchema,
  stockMovementSchema,
  orderSchema,
  orderStatusSchema,
};
