import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { supplierService } from '../services/supplierService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const productSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(50),
  name: z.string().min(2, 'Product name must be at least 2 characters').max(150),
  description: z.string().max(1000).optional().default(''),
  category: z.string().min(1, 'Please select a Category'),
  supplier: z.string().min(1, 'Please select a Supplier'),
  purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative').default(0),
  minStockLevel: z.coerce.number().int().min(0, 'Min stock level cannot be negative').default(5),
  location: z.string().max(50).optional().default('Bay A-01'),
});

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [depsError, setDepsError] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category: '',
      supplier: '',
      purchasePrice: 0,
      sellingPrice: 0,
      quantity: 0,
      minStockLevel: 5,
      location: 'Bay A-01',
    },
  });

  const loadReferenceData = async () => {
    try {
      const [catsRes, supsRes] = await Promise.all([
        categoryService.getAll(),
        supplierService.getAll(),
      ]);
      setCategories(catsRes.categories || []);
      setSuppliers(supsRes.suppliers || []);
      setDepsError(false);
    } catch (err) {
      setDepsError(true);
      showToast(err.message || 'Failed to load categories and suppliers.', 'danger');
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      if (!isEdit) {
        setInitialLoading(false);
        return;
      }
      try {
        const prodRes = await productService.getById(id);
        const p = prodRes.product;
        reset({
          sku: p.sku,
          name: p.name,
          description: p.description || '',
          category: p.category?._id || p.category || '',
          supplier: p.supplier?._id || p.supplier || '',
          purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice,
          quantity: p.quantity,
          minStockLevel: p.minStockLevel,
          location: p.location || 'Bay A-01',
        });
        if (p.imageUrl) {
          setImagePreview(p.imageUrl);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load product details.', 'danger');
      } finally {
        setInitialLoading(false);
      }
    };

    loadProduct();
  }, [id, isEdit, reset, showToast]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image file size must be less than 2MB', 'warning');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setServerError('');

    try {
      let finalImageUrl = imagePreview;

      if (imageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await productService.uploadImage(formData);
        finalImageUrl = uploadRes.imageUrl;
      }

      const payload = {
        ...data,
        imageUrl: finalImageUrl,
      };

      if (isEdit) {
        await productService.update(id, payload);
        showToast('Product updated successfully!', 'success');
      } else {
        await productService.create(payload);
        showToast('Product created successfully!', 'success');
      }
      navigate('/products');
    } catch (err) {
      setServerError(err.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner text="Loading product details..." />;
  }

  return (
    <div className="container-fluid px-0" style={{ maxWidth: '900px' }}>
      <div className="mb-4">
        <Link to="/products" className="text-decoration-none small text-muted mb-2 d-inline-block">
          <i className="bi bi-arrow-left me-1"></i> Back to Products
        </Link>
        <h2 className="fw-bold text-dark mb-1">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
        <p className="text-muted small">
          {isEdit ? 'Update product specifications, prices, and locations' : 'Enter product information, pricing, and initial warehouse stock'}
        </p>
      </div>

      {serverError && (
        <div className="alert alert-danger py-2 small d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{serverError}</div>
        </div>
      )}

      {depsError && (
        <div className="alert alert-warning py-2 small d-flex justify-content-between align-items-center mb-4">
          <span>
            <i className="bi bi-exclamation-triangle me-1"></i>
            Categories and suppliers failed to load. The required dropdowns below may be empty.
          </span>
          <button type="button" className="btn btn-sm btn-outline-warning" onClick={loadReferenceData}>
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card wms-card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h6 className="fw-bold mb-0">Product Information</h6>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Product SKU *</label>
                <input
                  type="text"
                  className={`form-control ${errors.sku ? 'is-invalid' : ''}`}
                  placeholder="e.g. WMS-SCN-001"
                  {...register('sku')}
                />
                {errors.sku && <div className="text-danger small mt-1">{errors.sku.message}</div>}
              </div>

              <div className="col-12 col-md-8">
                <label className="form-label small fw-semibold text-secondary">Product Name *</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Wireless 2D Handheld Barcode Scanner"
                  {...register('name')}
                />
                {errors.name && <div className="text-danger small mt-1">{errors.name.message}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Category *</label>
                <select className={`form-select ${errors.category ? 'is-invalid' : ''}`} {...register('category')}>
                  <option value="">Select a Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category && <div className="text-danger small mt-1">{errors.category.message}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Supplier *</label>
                <select className={`form-select ${errors.supplier ? 'is-invalid' : ''}`} {...register('supplier')}>
                  <option value="">Select a Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.companyName}
                    </option>
                  ))}
                </select>
                {errors.supplier && <div className="text-danger small mt-1">{errors.supplier.message}</div>}
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Product specifications, dimensions, features..."
                  {...register('description')}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="card wms-card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h6 className="fw-bold mb-0">Pricing & Inventory Levels</h6>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Purchase Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.purchasePrice ? 'is-invalid' : ''}`}
                  {...register('purchasePrice')}
                />
                {errors.purchasePrice && <div className="text-danger small mt-1">{errors.purchasePrice.message}</div>}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Selling Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.sellingPrice ? 'is-invalid' : ''}`}
                  {...register('sellingPrice')}
                />
                {errors.sellingPrice && <div className="text-danger small mt-1">{errors.sellingPrice.message}</div>}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">
                  {isEdit ? 'Current Quantity' : 'Initial Quantity *'}
                </label>
                <input
                  type="number"
                  className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                  disabled={isEdit}
                  {...register('quantity')}
                />
                {isEdit && (
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                    Adjust via Stock Movements
                  </span>
                )}
                {errors.quantity && <div className="text-danger small mt-1">{errors.quantity.message}</div>}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Min Stock Level *</label>
                <input
                  type="number"
                  className={`form-control ${errors.minStockLevel ? 'is-invalid' : ''}`}
                  {...register('minStockLevel')}
                />
                {errors.minStockLevel && <div className="text-danger small mt-1">{errors.minStockLevel.message}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Warehouse Location / Bin</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Aisle 3 - Bin 12"
                  {...register('location')}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Product Image (JPEG, PNG, WEBP)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="form-control form-control-sm"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="rounded border object-fit-cover"
                      style={{ width: '48px', height: '48px' }}
                    />
                    <span className="small text-muted">Image selected (Max 2MB)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mb-5">
          <Link to="/products" className="btn btn-light border px-4">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary px-4 shadow-sm d-flex align-items-center gap-2"
            disabled={submitting || uploadingImage}
          >
            {(submitting || uploadingImage) && <span className="spinner-border spinner-border-sm" role="status"></span>}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
