import React from 'react';
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function StatusBadge({ status, loading, onRetry }) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-full">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Connecting to Backend...</span>
      </div>
    );
  }

  if (status === 'ok') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>API Live (v1.0.0)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-full">
      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
      <span>Backend Disconnected</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-1 underline hover:text-white transition-colors"
          title="Retry connection"
        >
          Retry
        </button>
      )}
    </div>
  );
}

