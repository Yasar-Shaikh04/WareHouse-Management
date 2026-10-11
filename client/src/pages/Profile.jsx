import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();

  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data) => {
    setProfileSubmitting(true);
    setProfileError('');
    try {
      await updateProfile(data);
      showToast('Profile information updated successfully!', 'success');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordSubmitting(true);
    setPasswordError('');
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showToast('Password changed successfully!', 'success');
      resetPasswordForm();
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-0" style={{ maxWidth: '850px' }}>
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">User Account Profile</h2>
        <p className="text-muted small">Manage your personal credentials, contact email, and security settings</p>
      </div>

      <div className="row g-4">
        {/* Account Summary Banner */}
        <div className="col-12">
          <div className="card wms-card border-0 shadow-sm">
            <div className="card-body p-4 d-flex flex-column flex-sm-row align-items-sm-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-2"
                style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.16)', color: '#0d966c' }}
              >
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h4 className="fw-bold mb-0 text-dark">{user?.name}</h4>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.16)', color: '#0d966c' }}>{user?.role}</span>
                </div>
                <div className="text-muted small mb-1">
                  <i className="bi bi-envelope me-1"></i> {user?.email}
                </div>
                <div className="text-muted small">
                  Account Status:{' '}
                  <span className="badge bg-success bg-opacity-10 text-success border border-success">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Update Profile Form */}
        <div className="col-12 col-md-6">
          <div className="card wms-card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold mb-0">Profile Information</h6>
            </div>
            <div className="card-body p-4">
              {profileError && (
                <div className="alert alert-danger py-2 small d-flex align-items-center mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{profileError}</div>
                </div>
              )}
              <form onSubmit={handleSubmitProfile(onProfileSubmit)}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Full Name</label>
                  <input
                    type="text"
                    className={`form-control ${profileErrors.name ? 'is-invalid' : ''}`}
                    {...registerProfile('name')}
                  />
                  {profileErrors.name && (
                    <div className="text-danger small mt-1">{profileErrors.name.message}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary">Email Address</label>
                  <input
                    type="email"
                    className={`form-control ${profileErrors.email ? 'is-invalid' : ''}`}
                    {...registerProfile('email')}
                  />
                  {profileErrors.email && (
                    <div className="text-danger small mt-1">{profileErrors.email.message}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center"
                  disabled={profileSubmitting}
                >
                  {profileSubmitting && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                  Update Profile Details
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="col-12 col-md-6">
          <div className="card wms-card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold mb-0">Change Password</h6>
            </div>
            <div className="card-body p-4">
              {passwordError && (
                <div className="alert alert-danger py-2 small d-flex align-items-center mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{passwordError}</div>
                </div>
              )}
              <form onSubmit={handleSubmitPassword(onPasswordSubmit)}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Current Password</label>
                  <input
                    type="password"
                    className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                    placeholder="Enter current password"
                    {...registerPassword('currentPassword')}
                  />
                  {passwordErrors.currentPassword && (
                    <div className="text-danger small mt-1">{passwordErrors.currentPassword.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">New Password</label>
                  <input
                    type="password"
                    className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                    placeholder="At least 6 characters"
                    {...registerPassword('newPassword')}
                  />
                  {passwordErrors.newPassword && (
                    <div className="text-danger small mt-1">{passwordErrors.newPassword.message}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary">Confirm New Password</label>
                  <input
                    type="password"
                    className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Repeat new password"
                    {...registerPassword('confirmPassword')}
                  />
                  {passwordErrors.confirmPassword && (
                    <div className="text-danger small mt-1">{passwordErrors.confirmPassword.message}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center"
                  disabled={passwordSubmitting}
                >
                  {passwordSubmitting && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
