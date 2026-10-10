import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['Warehouse Manager', 'Staff'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Staff',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    setServerError('');
    try {
      await registerUser({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: data.role,
      });
      showToast('Registration successful! Welcome to the warehouse system.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wms-login-wrapper">
      <div className="wms-login-card" style={{ maxWidth: '500px' }}>
        <div className="wms-login-card-top-bar"></div>

        <div className="p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="wms-live-beacon">
                <span className="wms-beacon-dot"></span> System Live
              </span>
              <span className="text-secondary small font-monospace" style={{ fontSize: '0.72rem' }}>
                ACCOUNT PROVISIONING
              </span>
            </div>

            <div className="wms-neon-badge mb-3">
              <i className="bi bi-person-plus-fill"></i>
            </div>
            <h3 className="fw-bold text-white mb-1">Create Account</h3>
            <p className="text-secondary small mb-0">Join the Warehouse Operations Team</p>
          </div>

          {serverError && (
            <div className="mb-4 d-flex align-items-start gap-2 wms-login-alert-error" role="alert">
              <i className="bi bi-exclamation-triangle-fill fs-5 mt-0.5 flex-shrink-0"></i>
              <div>{serverError}</div>
            </div>
          )}

          <div
            className="p-3 mb-4 rounded-3 small"
            style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              color: '#86efac',
            }}
          >
            <i className="bi bi-info-circle me-1"></i>
            <strong>Security Notice:</strong> Public onboarding provisions <strong>Staff</strong> or <strong>Warehouse Manager</strong> roles. Administrator access is restricted to system administrators.
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-light mb-1">Full Name</label>
              <div className="input-group wms-neon-input-group">
                <span className="input-group-text">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  disabled={submitting}
                  className={`form-control ${errors.name ? 'border-danger' : ''}`}
                  placeholder="e.g. Alex Rivera"
                  {...register('name')}
                />
              </div>
              {errors.name && <div className="text-danger small mt-1">{errors.name.message}</div>}
            </div>

            {/* Email Address */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-light mb-1">Email Address</label>
              <div className="input-group wms-neon-input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  disabled={submitting}
                  className={`form-control ${errors.email ? 'border-danger' : ''}`}
                  placeholder="operator@warehouse.local"
                  {...register('email')}
                />
              </div>
              {errors.email && <div className="text-danger small mt-1">{errors.email.message}</div>}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-light mb-1">Password</label>
              <div className="input-group wms-neon-input-group">
                <span className="input-group-text">
                  <i className="bi bi-shield-lock"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={submitting}
                  className={`form-control ${errors.password ? 'border-danger' : ''}`}
                  placeholder="At least 6 characters"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="btn btn-password-toggle px-3"
                  tabIndex={-1}
                  disabled={submitting}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.password && <div className="text-danger small mt-1">{errors.password.message}</div>}
            </div>

            {/* Assigned Role */}
            <div className="mb-4">
              <label className="form-label small fw-semibold text-light mb-1">Assigned Role</label>
              <div className="input-group wms-neon-input-group">
                <span className="input-group-text">
                  <i className="bi bi-person-badge"></i>
                </span>
                <select
                  disabled={submitting}
                  className={`form-select ${errors.role ? 'border-danger' : ''}`}
                  style={{
                    backgroundColor: '#0b111e',
                    borderColor: 'rgba(71, 85, 105, 0.45)',
                    color: '#f8fafc',
                  }}
                  {...register('role')}
                >
                  <option value="Staff">Staff (Inventory & Basic Operations)</option>
                  <option value="Warehouse Manager">Warehouse Manager (Catalog, Orders, Inventory)</option>
                </select>
              </div>
              {errors.role && <div className="text-danger small mt-1">{errors.role.message}</div>}
            </div>

            <button
              type="submit"
              className="btn wms-neon-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4 pt-2">
            <span className="text-secondary small">Already have credentials? </span>
            <Link
              to="/login"
              className="small fw-semibold text-decoration-none"
              style={{ color: '#4ade80' }}
            >
              Sign In to Terminal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
