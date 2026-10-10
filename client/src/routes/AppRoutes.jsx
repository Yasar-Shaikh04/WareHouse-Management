import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../layouts/AppLayout';

// Auth Pages
import Login from '../pages/Login';
import Register from '../pages/Register';

// Dashboard & Management Pages
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import ProductForm from '../pages/ProductForm';
import ProductDetails from '../pages/ProductDetails';
import Categories from '../pages/Categories';
import Suppliers from '../pages/Suppliers';
import Customers from '../pages/Customers';
import Inventory from '../pages/Inventory';
import StockMovements from '../pages/StockMovements';
import Orders from '../pages/Orders';
import OrderCreate from '../pages/OrderCreate';
import OrderDetails from '../pages/OrderDetails';
import Reports from '../pages/Reports';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Products */}
        <Route path="products" element={<Products />} />
        <Route
          path="products/new"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Warehouse Manager']}>
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route
          path="products/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Warehouse Manager']}>
              <ProductForm />
            </ProtectedRoute>
          }
        />

        {/* Categories, Suppliers, Customers */}
        <Route path="categories" element={<Categories />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="customers" element={<Customers />} />

        {/* Inventory & Stock Movements */}
        <Route path="inventory" element={<Inventory />} />
        <Route path="stock-movements" element={<StockMovements />} />

        {/* Orders */}
        <Route path="orders" element={<Orders />} />
        <Route path="orders/new" element={<OrderCreate />} />
        <Route path="orders/:id" element={<OrderDetails />} />

        {/* Reports & Profile */}
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
