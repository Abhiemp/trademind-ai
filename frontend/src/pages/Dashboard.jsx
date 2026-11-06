import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Briefcase,
  TrendingUp,
  Server,
  Bot,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Database,
  Cpu,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import { getPortfolio } from '../services/api';

export default function Dashboard() {
  const { backendHealth, isCheckingHealth, onRefreshHealth } = useOutletContext();
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      const { data } = await getPortfolio();
      if (data) setPortfolio(data);
    };
    fetchPortfolio();
  }, []);

  const isNetProfit = portfolio ? portfolio.net_pnl >= 0 : true;
  const isUnrealizedProfit = portfolio ? portfolio.total_unrealized_pnl >= 0 : true;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-slate-800 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            AI for Finance — CIA-2 Project
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            TradeMind AI Financial Intelligence
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-300">
            Real-time Indian market (NSE & BSE) data intelligence, quantitative technical indicators,
            paper-trading simulation, and Groq-powered AI conversational analysis.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/analyst"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Bot className="w-4 h-4" />
              Chat with AI Analyst
            </Link>
            <Link
              to="/market"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Explore Indian Stocks
            </Link>
          </div>
        </div>
      </div>

      {/* Backend Integration Diagnostics Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Full-Stack Bridge Status</h2>
          </div>
          <button
            onClick={onRefreshHealth}
            disabled={isCheckingHealth}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            <span>Check Connectivity</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <span className="text-xs text-slate-400">API Health</span>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  backendHealth?.status === 'ok' ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
                }`}
              />
              <span className="text-sm font-semibold text-white uppercase">
                {backendHealth?.status || 'Connecting...'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              SQLite Database
            </span>
            <p className="mt-1 text-sm font-semibold text-white">
              {backendHealth?.database ? backendHealth.database : 'Pending'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Groq LLM Engine
            </span>
            <p className="mt-1 text-sm font-semibold text-white">
              {backendHealth?.groq_configured ? (
                <span className="text-emerald-400">Configured</span>
              ) : (
                <span className="text-amber-400">Key Not Set (Mock/Ready)</span>
              )}
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <span className="text-xs text-slate-400">Target Exchange</span>
            <p className="mt-1 text-xs font-semibold text-white truncate" title={backendHealth?.target_market}>
              {backendHealth?.target_market ? 'NSE & BSE India' : 'Locating...'}
            </p>
          </div>
        </div>
      </div>

      {/* Simulated Portfolio Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Paper Portfolio Value"
          value={portfolio ? `₹${portfolio.current_portfolio_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹10,00,000.00'}
          change={portfolio ? `${isNetProfit ? '+' : ''}${portfolio.net_pnl_percent}%` : null}
          isPositive={isNetProfit}
          subtitle={`Starting Capital: ₹${portfolio ? portfolio.initial_balance.toLocaleString('en-IN') : '10,00,000'}`}
          icon={Briefcase}
        />
        <MetricCard
          title="Unrealized P&L"
          value={portfolio ? `₹${portfolio.total_unrealized_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
          change={portfolio ? `${isUnrealizedProfit ? '+' : ''}${portfolio.total_unrealized_pnl_percent}%` : null}
          isPositive={isUnrealizedProfit}
          subtitle={`${portfolio?.holdings?.length || 0} active holdings`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Available Cash"
          value={portfolio ? `₹${portfolio.cash_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹10,00,000.00'}
          subtitle="Ready for order execution"
          icon={ArrowUpRight}
        />
        <MetricCard
          title="AI Signals (Today)"
          value="4 Signals"
          subtitle="2 BUY · 1 HOLD · 1 SELL"
          icon={Bot}
        />
      </div>

      {/* Indian Benchmark Indices Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Indian Benchmark Indices</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300">NIFTY 50</span>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">
                +0.42%
              </span>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-white">24,180.80</div>
            <p className="mt-1 text-xs text-slate-400">National Stock Exchange of India</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300">S&P BSE SENSEX</span>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">
                +0.38%
              </span>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-white">79,486.32</div>
            <p className="mt-1 text-xs text-slate-400">Bombay Stock Exchange</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300">BANK NIFTY</span>
              <span className="text-xs text-rose-400 font-semibold bg-rose-950/50 px-2 py-0.5 rounded border border-rose-900/50">
                -0.15%
              </span>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-white">51,840.10</div>
            <p className="mt-1 text-xs text-slate-400">Indian Banking Sector Index</p>
          </div>
        </div>
      </div>
    </div>
  );
}

