import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ title, value, change, isPositive, subtitle, icon: Icon }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {Icon && (
          <div className="p-2 bg-slate-800/80 rounded-lg text-slate-300">
            <Icon className="w-5 h-5 text-indigo-400" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
              isPositive
                ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-900/50'
                : 'text-rose-400 bg-rose-950/50 border border-rose-900/50'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

