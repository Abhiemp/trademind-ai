import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Play,
  TrendingUp,
  TrendingDown,
  Percent,
  Layers,
  Calendar,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { runBacktest } from '../services/api';
import MetricCard from '../components/common/MetricCard';

const QUICK_STOCKS = [
  { symbol: 'RELIANCE.NS', label: 'RELIANCE' },
  { symbol: 'TCS.NS', label: 'TCS' },
  { symbol: 'INFY.NS', label: 'INFY' },
  { symbol: 'HDFCBANK.NS', label: 'HDFCBANK' },
  { symbol: 'TATAMOTORS.NS', label: 'TATAMOTORS' },
];

const STRATEGIES = [
  {
    id: 'SMA_CROSSOVER',
    name: 'SMA Crossover',
    description: 'Enters when Fast SMA crosses above Slow SMA; exits when it crosses below.',
  },
  {
    id: 'EMA_CROSSOVER',
    name: 'EMA Crossover',
    description: 'Enters on Bullish EMA crossover; exits on Bearish EMA crossover.',
  },
  {
    id: 'RSI_MEAN_REVERSION',
    name: 'RSI Mean Reversion',
    description: 'Enters when RSI crosses above oversold; exits when RSI reaches overbought.',
  },
  {
    id: 'MACD_CROSSOVER',
    name: 'MACD Crossover',
    description: 'Enters on bullish MACD line crossover above signal line; exits on bearish cross.',
  },
];

const PERIODS = [
  { value: '6mo', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
  { value: '5y', label: '5 Years' },
];

export default function Backtest() {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [strategyType, setStrategyType] = useState('SMA_CROSSOVER');
  const [period, setPeriod] = useState('1y');
  const [initialCapital, setInitialCapital] = useState(100000);

  // Strategy Parameters
  const [fastPeriod, setFastPeriod] = useState(20);
  const [slowPeriod, setSlowPeriod] = useState(50);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [rsiOverbought, setRsiOverbought] = useState(70);

  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunBacktest = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload = {
      symbol,
      strategy_type: strategyType,
      period,
      initial_capital: Number(initialCapital),
      fast_period: Number(fastPeriod),
      slow_period: Number(slowPeriod),
      rsi_period: Number(rsiPeriod),
      rsi_oversold: Number(rsiOversold),
      rsi_overbought: Number(rsiOverbought),
    };

    const { data, error: err } = await runBacktest(payload);
    if (err) {
      setError(err);
      setResult(null);
    } else {
      setResult(data);
    }
    setIsLoading(false);
  };

  // Run initial backtest on mount
  useEffect(() => {
    handleRunBacktest();
  }, []);

  const isProfitable = result ? result.strategy_return_pct >= 0 : false;
  const isOutperforming = result ? result.outperformance_pct >= 0 : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Strategy Backtesting</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Quantitative Backtester
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Simulate algorithmic trading strategies against authentic historical Indian stock data (NSE/BSE).
        </p>
      </div>

      {/* Strategy Configuration Form Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
        <form onSubmit={handleRunBacktest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stock Symbol Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Indian Security (NSE)
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. RELIANCE.NS"
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
              />
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none">
                {QUICK_STOCKS.map((s) => (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => setSymbol(s.symbol)}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors shrink-0 ${
                      symbol === s.symbol
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy Model Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Algorithmic Strategy
              </label>
              <select
                value={strategyType}
                onChange={(e) => setStrategyType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
              >
                {STRATEGIES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {STRATEGIES.find((st) => st.id === strategyType)?.description}
              </p>
            </div>

            {/* Historical Period Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Backtest Horizon
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Daily timeframe candles</p>
            </div>

            {/* Initial Capital Input */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Starting Capital (₹)
              </label>
              <input
                type="number"
                min="10000"
                step="5000"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Simulated test capital</p>
            </div>
          </div>

          {/* Dynamic Strategy Parameters */}
          {(strategyType === 'SMA_CROSSOVER' || strategyType === 'EMA_CROSSOVER') && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
              <span className="text-slate-400 font-semibold">Moving Average Windows:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Fast Window:</span>
                <input
                  type="number"
                  min="3"
                  max="50"
                  value={fastPeriod}
                  onChange={(e) => setFastPeriod(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-lg px-2 py-1 text-center"
                />
                <span className="text-slate-500">days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Slow Window:</span>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={slowPeriod}
                  onChange={(e) => setSlowPeriod(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-lg px-2 py-1 text-center"
                />
                <span className="text-slate-500">days</span>
              </div>
            </div>
          )}

          {strategyType === 'RSI_MEAN_REVERSION' && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
              <span className="text-slate-400 font-semibold">RSI Parameters:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Period:</span>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={rsiPeriod}
                  onChange={(e) => setRsiPeriod(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-lg px-2 py-1 text-center"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Oversold (Buy):</span>
                <input
                  type="number"
                  min="10"
                  max="45"
                  value={rsiOversold}
                  onChange={(e) => setRsiOversold(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-lg px-2 py-1 text-center"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Overbought (Sell):</span>
                <input
                  type="number"
                  min="55"
                  max="90"
                  value={rsiOverbought}
                  onChange={(e) => setRsiOverbought(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-lg px-2 py-1 text-center"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Strategy Simulation...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Backtest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleRunBacktest}
            className="px-3 py-1 bg-rose-900/50 hover:bg-rose-900 rounded-lg text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Backtest Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Strategy Return"
              value={`${isProfitable ? '+' : ''}${result.strategy_return_pct}%`}
              change={`Final: ₹${result.final_equity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              isPositive={isProfitable}
              subtitle={`Capital: ₹${result.initial_capital.toLocaleString('en-IN')}`}
              icon={TrendingUp}
            />

            <MetricCard
              title="Benchmark Buy & Hold"
              value={`${result.benchmark_return_pct >= 0 ? '+' : ''}${result.benchmark_return_pct}%`}
              change={
                isOutperforming
                  ? `+${result.outperformance_pct}% vs Benchmark`
                  : `${result.outperformance_pct}% vs Benchmark`
              }
              isPositive={isOutperforming}
              subtitle="Passive Buy & Hold return"
              icon={Percent}
            />

            <MetricCard
              title="Win Rate"
              value={`${result.win_rate}%`}
              isPositive={result.win_rate >= 50}
              subtitle={`${result.winning_trades} Win · ${result.losing_trades} Loss (${result.total_trades} Trades)`}
              icon={CheckCircle2}
            />

            <MetricCard
              title="Max Drawdown"
              value={`${result.max_drawdown}%`}
              isPositive={result.max_drawdown < 15}
              subtitle={`Profit Factor: ${result.profit_factor}x`}
              icon={TrendingDown}
            />
          </div>

          {/* Equity Curve Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Strategy Equity Curve vs Buy & Hold Benchmark
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison of {result.strategy_name} against passive holding in INR.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Strategy Equity
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Buy & Hold Benchmark
                </span>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={result.equity_curve} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="strategyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(d) => d.slice(5)}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    orientation="right"
                    tickLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val, name) => {
                      const formatted = `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                      if (name === 'strategy_equity') return [formatted, 'Strategy Equity'];
                      if (name === 'benchmark_equity') return [formatted, 'Benchmark Buy & Hold'];
                      return [formatted, name];
                    }}
                    labelFormatter={(lbl) => `Date: ${lbl}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="strategy_equity"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fill="url(#strategyGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark_equity"
                    stroke="#fbbf24"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completed Trades Audit Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Simulated Trade Execution Log
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {result.trades.length} Trades
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {result.trades && result.trades.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Entry Date</th>
                      <th className="py-3 px-4">Entry Price</th>
                      <th className="py-3 px-4">Exit Date</th>
                      <th className="py-3 px-4">Exit Price</th>
                      <th className="py-3 px-4">Shares</th>
                      <th className="py-3 px-4">P&L (₹)</th>
                      <th className="py-3 px-4">Return (%)</th>
                      <th className="py-3 px-4">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {result.trades.map((t, idx) => {
                      const isWin = t.pnl > 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-300">{t.entry_date}</td>
                          <td className="py-2.5 px-4 font-mono text-white">
                            ₹{t.entry_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-300">{t.exit_date}</td>
                          <td className="py-2.5 px-4 font-mono text-white">
                            ₹{t.exit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-white">{t.shares}</td>
                          <td className="py-2.5 px-4 font-mono font-bold">
                            <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                              {isWin ? '+' : ''}₹
                              {t.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                isWin
                                  ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-300'
                                  : 'bg-rose-950/70 border border-rose-800/60 text-rose-300'
                              }`}
                            >
                              {isWin ? '+' : ''}
                              {t.return_pct}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px] truncate max-w-xs">
                            {t.exit_reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-white">No trade triggers occurred.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting the timeframe or indicator parameters to see simulated trade executions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
