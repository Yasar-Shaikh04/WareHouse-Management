import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Client-side validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g. name@warehouse.local)'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    name: 'Administrator',
    email: 'admin@warehouse.local',
    password: 'Admin@12345',
    icon: 'bi-shield-shaded',
    badge: 'Full Access',
  },
  {
    role: 'Manager',
    name: 'Warehouse Manager',
    email: 'manager@warehouse.local',
    password: 'Manager@12345',
    icon: 'bi-kanban-fill',
    badge: 'Operations',
  },
  {
    role: 'Staff',
    name: 'Warehouse Staff',
    email: 'staff@warehouse.local',
    password: 'Staff@12345',
    icon: 'bi-box-seam-fill',
    badge: 'Inventory/Orders',
  },
];

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null); // { type, message, icon }
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Clear previous server error immediately whenever user edits email or password
  useEffect(() => {
    if (serverError) {
      setServerError(null);
    }
  }, [emailValue, passwordValue]);

  const onSubmit = async (data) => {
    if (submitting) return; // Prevent multiple requests from rapid clicks
    setSubmitting(true);
    setServerError(null);

    try {
      // Ensure field names expected by backend: { email, password }
      await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      showToast('Authentication verified! Welcome to WMS.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      // Distinctly categorize network errors, rate limits, and authentication failures
      if (err.isNetworkError || !err.status || err.status === 0) {
        setServerError({
          type: 'network',
          icon: 'bi-wifi-off',
          title: 'Connection Offline',
          message:
            'Unable to reach the warehouse server. Please verify that the backend is running on port 5000.',
        });
      } else if (err.status === 429) {
        setServerError({
          type: 'rate_limit',
          icon: 'bi-hourglass-bottom',
          title: 'Too Many Attempts',
          message:
            err.message || 'Login attempt limit exceeded. Please wait 15 minutes before retrying.',
        });
      } else if (err.status === 401) {
        setServerError({
          type: 'credentials',
          icon: 'bi-shield-x',
          title: 'Authentication Failed',
          message:
            'Invalid email or password. Please verify your login credentials and try again.',
        });
      } else if (err.status === 403) {
        setServerError({
          type: 'account',
          icon: 'bi-person-x-fill',
          title: 'Account Inactive',
          message:
            err.message || 'This account has been deactivated. Please contact an administrator.',
        });
      } else {
        setServerError({
          type: 'server',
          icon: 'bi-exclamation-octagon',
          title: 'Server Error',
          message:
            err.message || 'An unexpected error occurred while processing authentication.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demo) => {
    if (submitting) return;
    clearErrors();
    setServerError(null);
    setValue('email', demo.email, { shouldValidate: true });
    setValue('password', demo.password, { shouldValidate: true });
    await onSubmit({ email: demo.email, password: demo.password });
  };

  return (
    <div className="wms-login-wrapper">
      <div className="wms-login-card">
        {/* Neon top accent bar */}
        <div className="wms-login-card-top-bar"></div>

        <div className="p-4 p-md-5">
          {/* Header & Neon Brand Badge */}
          <div className="text-center mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="wms-live-beacon">
                <span className="wms-beacon-dot"></span> System Live
              </span>
              <span className="text-secondary small font-monospace" style={{ fontSize: '0.72rem' }}>
                TERMINAL v1.0
              </span>
            </div>

            <div className="wms-neon-badge mb-3">
              <i className="bi bi-boxes"></i>
            </div>
            <h3 className="fw-bold text-white mb-1 tracking-wide" style={{ letterSpacing: '0.02em' }}>
              Warehouse Portal
            </h3>
            <p className="text-secondary small mb-0">
              Inventory Logistics & Management Gateway
            </p>
          </div>

          {/* Server Error Alert — Displayed only after an actual backend response */}
          {serverError && (
            <div
              className={`mb-4 d-flex align-items-start gap-3 ${
                serverError.type === 'network' ? 'wms-login-alert-network' : 'wms-login-alert-error'
              }`}
              role="alert"
            >
              <i className={`bi ${serverError.icon} fs-5 mt-0.5 flex-shrink-0`}></i>
              <div>
                <strong className="d-block mb-1">{serverError.title}</strong>
                <span>{serverError.message}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email Field */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-light mb-1 d-flex justify-content-between">
                <span>Email Address</span>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Authorized ID</span>
              </label>
              <div className="input-group wms-neon-input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  disabled={submitting}
                  className={`form-control ${errors.email ? 'border-danger' : ''}`}
                  placeholder="operator@warehouse.local"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <div className="text-danger small mt-1.5 d-flex align-items-center gap-1">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="form-label small fw-semibold text-light mb-1 d-flex justify-content-between">
                <span>Security Password</span>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Encrypted</span>
              </label>
              <div className="input-group wms-neon-input-group">
                <span className="input-group-text">
                  <i className="bi bi-shield-lock"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={submitting}
                  className={`form-control ${errors.password ? 'border-danger' : ''}`}
                  placeholder="••••••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="btn btn-password-toggle px-3"
                  tabIndex={-1}
                  disabled={submitting}
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.password && (
                <div className="text-danger small mt-1.5 d-flex align-items-center gap-1">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errors.password.message}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn wms-neon-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo One-Click Sign In (for Evaluators / Viva) */}
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(71, 85, 105, 0.35)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                QUICK DEMO PRESETS:
              </span>
              <span className="text-success small font-monospace" style={{ fontSize: '0.7rem' }}>
                AUTO-FILL & AUTH
              </span>
            </div>

            <div className="row g-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <div key={demo.role} className="col-4">
                  <button
                    type="button"
                    className="w-100 wms-demo-pill-btn"
                    disabled={submitting}
                    onClick={() => handleQuickLogin(demo)}
                    title={`Sign in as ${demo.name} (${demo.email})`}
                  >
                    <i className={`bi ${demo.icon} text-success fs-6`}></i>
                    <span>{demo.role}</span>
                    <span className="wms-demo-pill-badge">{demo.badge}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center mt-4 pt-2">
            <span className="text-secondary small">Need employee access? </span>
            <Link
              to="/register"
              className="small fw-semibold text-decoration-none"
              style={{ color: '#4ade80' }}
            >
              Register Account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
