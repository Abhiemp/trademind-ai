import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function Header({ onMenuClick, backendHealth, isCheckingHealth, onRefreshHealth }) {
  const [headerSearch, setHeaderSearch] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && headerSearch.trim()) {
      navigate(`/market?symbol=${encodeURIComponent(headerSearch.trim().toUpperCase())}`);
      setHeaderSearch('');
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md flex items-center justify-between px-4 lg:px-8">
      {/* Left: Mobile hamburger + Indian Market Indices ticker preview */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live Market Ribbon */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-md">
            <span className="font-semibold text-slate-300">NIFTY 50</span>
            <span className="text-white font-mono font-medium">24,180.80</span>
            <span className="text-emerald-400 font-semibold font-mono text-[11px]">+0.42%</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-md">
            <span className="font-semibold text-slate-300">SENSEX</span>
            <span className="text-white font-mono font-medium">79,486.32</span>
            <span className="text-emerald-400 font-semibold font-mono text-[11px]">+0.38%</span>
          </div>
        </div>
      </div>

      {/* Right: Search + Backend Health Status + Profile badge */}
      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            onKeyDown={handleSearchSubmit}
            placeholder="Search NSE/BSE (e.g. RELIANCE)..."
            className="w-full bg-slate-950/60 border border-slate-800 text-xs rounded-lg pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Backend health status badge */}
        <StatusBadge
          status={backendHealth?.status}
          loading={isCheckingHealth}
          onRetry={onRefreshHealth}
        />

        {/* Account balance preview */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            AI
          </div>
        </div>
      </div>
    </header>
  );
}
