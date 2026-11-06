import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { checkHealth } from '../../services/api';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);

  const fetchHealth = async () => {
    setIsCheckingHealth(true);
    const { data } = await checkHealth();
    setBackendHealth(data);
    setIsCheckingHealth(false);
  };

  useEffect(() => {
    fetchHealth();
    // Poll every 30 seconds for live connectivity
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          backendHealth={backendHealth}
          isCheckingHealth={isCheckingHealth}
          onRefreshHealth={fetchHealth}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ backendHealth, isCheckingHealth, onRefreshHealth: fetchHealth }} />
        </main>
      </div>
    </div>
  );
}

