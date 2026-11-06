import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';

export default function TechnicalSignalsCard({ summary }) {
  if (!summary) return null;

  const { overall_signal, score, rsi, rsi_signal, macd, macd_signal, moving_averages_signal, signals_breakdown } = summary;

  const getSignalBadge = (sig) => {
    if (sig === 'BUY') {
      return {
        bg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
        dot: 'bg-emerald-400',
        icon: TrendingUp,
        label: 'STRONG BUY SIGNAL',
      };
    }
    if (sig === 'SELL') {
      return {
        bg: 'bg-rose-950/70 border-rose-500/50 text-rose-300',
        dot: 'bg-rose-400',
        icon: TrendingDown,
        label: 'SELL / CAUTION SIGNAL',
      };
    }
    return {
      bg: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
      dot: 'bg-amber-400',
      icon: Minus,
      label: 'HOLD / NEUTRAL SIGNAL',
    };
  };

  const badgeConfig = getSignalBadge(overall_signal);
  const BadgeIcon = badgeConfig.icon;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Top Header & Signal Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Algorithmic Technical Assessment
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Computed deterministically from RSI (14), MACD, SMA 50/200, and EMA 9/21.
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-bold text-sm ${badgeConfig.bg}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${badgeConfig.dot}`} />
          <BadgeIcon className="w-4 h-4" />
          <span>{badgeConfig.label}</span>
        </div>
      </div>

      {/* Grid of Key Indicator Values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* RSI Box */}
        <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>RSI (14-period)</span>
            <span className="font-mono font-semibold text-white">{rsi}</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                rsi > 70 ? 'bg-rose-500' : rsi < 30 ? 'bg-emerald-400' : 'bg-indigo-400'
              }`}
              style={{ width: `${Math.min(Math.max(rsi, 0), 100)}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-slate-300 mt-2 truncate">
            {rsi_signal}
          </p>
        </div>

        {/* MACD Box */}
        <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>MACD (12, 26, 9)</span>
            <span className="font-mono font-semibold text-white">{macd}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                macd_signal.includes('BULLISH') ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span className="text-xs font-semibold text-white">{macd_signal}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Convergence/Divergence</p>
        </div>

        {/* Moving Averages Box */}
        <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Moving Averages</span>
            <span className="font-mono font-semibold text-white">Score: {score > 0 ? `+${score}` : score}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                moving_averages_signal === 'BULLISH'
                  ? 'bg-emerald-400'
                  : moving_averages_signal === 'BEARISH'
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-semibold text-white">{moving_averages_signal}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">SMA 50/200 & EMA 9/21</p>
        </div>
      </div>

      {/* Signal Reasoning Breakdown */}
      {signals_breakdown && signals_breakdown.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Deterministic Signal Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {signals_breakdown.map((item, idx) => {
              const isBull = item.signal.includes('BULLISH');
              const isBear = item.signal.includes('BEARISH');
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs"
                >
                  {isBull ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : isBear ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{item.indicator}</span>
                      <span className="font-mono text-[11px] text-slate-400">{item.value}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

