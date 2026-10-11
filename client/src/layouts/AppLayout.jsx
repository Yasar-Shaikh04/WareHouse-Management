import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex wms-app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="wms-main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="p-3 p-md-4 flex-grow-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;
