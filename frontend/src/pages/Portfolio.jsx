import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  IndianRupee,
  Layers,
  History,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import { getPortfolio, resetPortfolio } from '../services/api';
import OrderModal from '../components/portfolio/OrderModal';
import MetricCard from '../components/common/MetricCard';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Order modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSymbol, setModalSymbol] = useState('RELIANCE.NS');
  const [modalType, setModalType] = useState('BUY');
  const [modalOwnedQty, setModalOwnedQty] = useState(0);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await getPortfolio();
    if (err) {
      setError(err);
    } else {
      setPortfolio(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const handleOpenTrade = (symbol = 'RELIANCE.NS', type = 'BUY', owned = 0) => {
    setModalSymbol(symbol);
    setModalType(type);
    setModalOwnedQty(owned);
    setIsModalOpen(true);
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset your paper portfolio to the initial ₹10,00,000 cash balance? This will clear all active holdings and transaction history.')) {
      setIsLoading(true);
      await resetPortfolio();
      await fetchPortfolioData();
    }
  };

  const isNetProfit = portfolio ? portfolio.net_pnl >= 0 : false;
  const isUnrealizedProfit = portfolio ? portfolio.total_unrealized_pnl >= 0 : false;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Paper Trading Portfolio</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Simulated Exchange
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulate real-world Indian equity transactions with ₹10,00,000 virtual capital.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenTrade('RELIANCE.NS', 'BUY', 0)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Trade Order</span>
          </button>

          <button
            onClick={fetchPortfolioData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Portfolio"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800 text-slate-400 border border-slate-700 text-xs font-medium transition-colors"
            title="Reset to ₹10,00,000 starting cash"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchPortfolioData}
            className="px-3 py-1 bg-rose-900/50 hover:bg-rose-900 rounded-lg text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Portfolio Value"
          value={portfolio ? `₹${portfolio.current_portfolio_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹10,00,000.00'}
          change={portfolio ? `${isNetProfit ? '+' : ''}${portfolio.net_pnl_percent}%` : null}
          isPositive={isNetProfit}
          subtitle={`Initial: ₹${portfolio ? portfolio.initial_balance.toLocaleString('en-IN') : '10,00,000'}`}
          icon={Briefcase}
        />

        <MetricCard
          title="Unrealized P&L"
          value={portfolio ? `₹${portfolio.total_unrealized_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
          change={portfolio ? `${isUnrealizedProfit ? '+' : ''}${portfolio.total_unrealized_pnl_percent}%` : null}
          isPositive={isUnrealizedProfit}
          subtitle={`${portfolio?.holdings?.length || 0} active positions`}
          icon={TrendingUp}
        />

        <MetricCard
          title="Realized P&L"
          value={portfolio ? `₹${portfolio.total_realized_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
          isPositive={portfolio ? portfolio.total_realized_pnl >= 0 : true}
          subtitle="From closed/exited trades"
          icon={IndianRupee}
        />

        <MetricCard
          title="Available Cash"
          value={portfolio ? `₹${portfolio.cash_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹10,00,000.00'}
          subtitle="Ready for order execution"
          icon={ArrowUpRight}
        />
      </div>

      {/* Active Holdings Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Active Holdings</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {portfolio?.holdings?.length || 0}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {portfolio?.holdings && portfolio.holdings.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Shares</th>
                  <th className="py-3.5 px-4">Avg Buy Price</th>
                  <th className="py-3.5 px-4">Current Price</th>
                  <th className="py-3.5 px-4">Invested Value</th>
                  <th className="py-3.5 px-4">Current Value</th>
                  <th className="py-3.5 px-4">Unrealized P&L</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolio.holdings.map((h) => {
                  const isProfit = h.unrealized_pnl >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white font-mono">{h.symbol}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {h.company_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">{h.quantity}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        ₹{h.average_buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        ₹{h.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        ₹{h.invested_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        ₹{h.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div
                          className={`font-bold flex items-center gap-1 ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfit ? '+' : ''}₹
                          {h.unrealized_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          <span className="text-[10px]">
                            ({isProfit ? '+' : ''}
                            {h.unrealized_pnl_percent}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenTrade(h.symbol, 'BUY', h.quantity)}
                          className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold transition-colors"
                        >
                          Buy More
                        </button>
                        <button
                          onClick={() => handleOpenTrade(h.symbol, 'SELL', h.quantity)}
                          className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-[11px] font-semibold transition-colors"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-white">No active holdings in your portfolio.</p>
              <p className="text-xs text-slate-400 mt-1">
                Click &quot;New Trade Order&quot; or explore Indian stocks to execute your first simulated trade.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Recent Transactions</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {portfolio?.recent_transactions?.length || 0}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {portfolio?.recent_transactions && portfolio.recent_transactions.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Execution Price</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolio.recent_transactions.map((t) => {
                  const isBuy = t.transaction_type === 'BUY';
                  const dateStr = new Date(t.timestamp).toLocaleString('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  });
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{dateStr}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] uppercase font-mono ${
                            isBuy
                              ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-300'
                              : 'bg-rose-950/70 border border-rose-800/60 text-rose-300'
                          }`}
                        >
                          {isBuy ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white font-mono">{t.symbol}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {t.company_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">{t.quantity}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        ₹{t.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        ₹{t.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {isBuy ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span
                            className={`font-bold ${
                              t.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {t.realized_pnl >= 0 ? '+' : ''}₹
                            {t.realized_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-white">No transactions recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Your buy and sell executions will appear here in chronological order.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Trade Execution Modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSymbol={modalSymbol}
        initialType={modalType}
        availableCash={portfolio?.cash_balance || 0}
        ownedQuantity={modalOwnedQty}
        onOrderSuccess={fetchPortfolioData}
      />
    </div>
  );
}
