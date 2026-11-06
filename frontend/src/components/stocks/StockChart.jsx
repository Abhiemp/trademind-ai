import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Sliders, Eye } from 'lucide-react';

const TIMEFRAMES = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
];

export default function StockChart({
  chartData,
  selectedPeriod,
  onPeriodChange,
  isLoading,
}) {
  // Indicator Visibility Toggles
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showSMA200, setShowSMA200] = useState(false);
  const [showEMA9, setShowEMA9] = useState(false);
  const [showEMA21, setShowEMA21] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
        No historical chart data available.
      </div>
    );
  }

  const formatPrice = (val) => (val != null ? `₹${val.toFixed(2)}` : '');
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Chart Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => onPeriodChange(tf.value)}
              disabled={isLoading}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedPeriod === tf.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1 mr-1">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Indicators:
          </span>

          <button
            onClick={() => setShowSMA20(!showSMA20)}
            className={`px-2 py-1 rounded border font-mono transition-colors ${
              showSMA20
                ? 'bg-amber-950/60 text-amber-300 border-amber-600/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            SMA 20
          </button>

          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`px-2 py-1 rounded border font-mono transition-colors ${
              showSMA50
                ? 'bg-purple-950/60 text-purple-300 border-purple-600/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            SMA 50
          </button>

          <button
            onClick={() => setShowSMA200(!showSMA200)}
            className={`px-2 py-1 rounded border font-mono transition-colors ${
              showSMA200
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-600/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            SMA 200
          </button>

          <button
            onClick={() => setShowEMA9(!showEMA9)}
            className={`px-2 py-1 rounded border font-mono transition-colors ${
              showEMA9
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            EMA 9
          </button>

          <button
            onClick={() => setShowEMA21(!showEMA21)}
            className={`px-2 py-1 rounded border font-mono transition-colors ${
              showEMA21
                ? 'bg-pink-950/60 text-pink-300 border-pink-600/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            EMA 21
          </button>

          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2 py-1 rounded border font-mono transition-colors ${
              showRSI
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-600/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            RSI Panel
          </button>

          <button
            onClick={() => setShowMACD(!showMACD)}
            className={`px-2 py-1 rounded border font-mono transition-colors ${
              showMACD
                ? 'bg-blue-950/60 text-blue-300 border-blue-600/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            MACD Panel
          </button>
        </div>
      </div>

      {/* Main Stock Price Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={formatDate}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#64748b"
              fontSize={11}
              orientation="right"
              tickLine={false}
              tickFormatter={(v) => `₹${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              }}
              formatter={(value, name) => {
                if (value == null) return null;
                const formatted = `₹${Number(value).toFixed(2)}`;
                if (name === 'close') return [formatted, 'Price'];
                if (name === 'sma_20') return [formatted, 'SMA 20'];
                if (name === 'sma_50') return [formatted, 'SMA 50'];
                if (name === 'sma_200') return [formatted, 'SMA 200'];
                if (name === 'ema_9') return [formatted, 'EMA 9'];
                if (name === 'ema_21') return [formatted, 'EMA 21'];
                return [formatted, name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />

            {/* Price Area */}
            <Area
              type="monotone"
              dataKey="close"
              stroke="#818cf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#priceGradient)"
            />

            {/* Moving Average Overlays */}
            {showSMA20 && (
              <Line
                type="monotone"
                dataKey="sma_20"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showSMA50 && (
              <Line
                type="monotone"
                dataKey="sma_50"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showSMA200 && (
              <Line
                type="monotone"
                dataKey="sma_200"
                stroke="#06b6d4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showEMA9 && (
              <Line
                type="monotone"
                dataKey="ema_9"
                stroke="#10b981"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showEMA21 && (
              <Line
                type="monotone"
                dataKey="ema_21"
                stroke="#ec4899"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-Panel: Volume */}
      <div className="h-20 w-full pt-1 border-t border-slate-800/80">
        <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pb-1">
          Trading Volume
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis orientation="right" hide domain={['auto', 'auto']} />
            <Bar dataKey="volume" fill="#334155" opacity={0.7} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-Panel: RSI (14) */}
      {showRSI && (
        <div className="h-32 w-full pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 px-2 pb-1">
            <span>RSI (14-period)</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-rose-400">Overbought: 70</span>
              <span className="text-emerald-400">Oversold: 30</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                domain={[0, 100]}
                ticks={[30, 50, 70]}
                orientation="right"
                stroke="#64748b"
                fontSize={10}
              />
              <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="#475569" strokeDasharray="2 2" />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                formatter={(val) => [Number(val).toFixed(2), 'RSI']}
              />
              <Line
                type="monotone"
                dataKey="rsi_14"
                stroke="#c084fc"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sub-Panel: MACD */}
      {showMACD && (
        <div className="h-36 w-full pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 px-2 pb-1">
            <span>MACD (12, 26, 9)</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-blue-400">MACD Line</span>
              <span className="text-amber-400">Signal Line</span>
              <span className="text-slate-400">Histogram</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis orientation="right" stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
              <ReferenceLine y={0} stroke="#475569" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                formatter={(val, name) => [Number(val).toFixed(2), name]}
              />
              <Bar dataKey="macd_hist" fill="#38bdf8" opacity={0.6} />
              <Line
                type="monotone"
                dataKey="macd"
                stroke="#60a5fa"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="macd_signal"
                stroke="#fbbf24"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

