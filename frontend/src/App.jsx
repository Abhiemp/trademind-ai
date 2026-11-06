import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MarketOverview from './pages/MarketOverview';
import Portfolio from './pages/Portfolio';
import AIAssistant from './pages/AIAssistant';
import Backtest from './pages/Backtest';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="market" element={<MarketOverview />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="analyst" element={<AIAssistant />} />
          <Route path="backtest" element={<Backtest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
