import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authService.getCurrentUser();
      if (data && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    // Establish the session on the server (sets the cookie)...
    await authService.login(credentials);
    // ...then confirm it by reading the profile back over the same cookie.
    // Only treat the user as authenticated when the backend agrees, so a
    // session that the browser failed to persist can never show a false
    // "logged in" state while protected API calls return 401.
    const me = await authService.getCurrentUser();
    setUser(me.user);
    return me;
  };

  const register = async (userData) => {
    await authService.register(userData);
    const me = await authService.getCurrentUser();
    setUser(me.user);
    return me;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    const data = await authService.updateProfile(profileData);
    setUser(data.user);
    return data;
  };

  const changePassword = async (passwordData) => {
    return await authService.changePassword(passwordData);
  };

  const hasRole = useCallback(
    (...allowedRoles) => {
      if (!user) return false;
      return allowedRoles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        hasRole,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
