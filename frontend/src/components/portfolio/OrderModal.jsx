import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { getStockQuote, placeOrder } from '../../services/api';

export default function OrderModal({
  isOpen,
  onClose,
  initialSymbol = 'RELIANCE.NS',
  initialType = 'BUY',
  availableCash = 0,
  ownedQuantity = 0,
  onOrderSuccess,
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [transactionType, setTransactionType] = useState(initialType);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const [quote, setQuote] = useState(null);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSymbol(initialSymbol);
      setTransactionType(initialType);
      setQuantity(1);
      setError(null);
      setSuccessMsg(null);
      fetchQuote(initialSymbol);
    }
  }, [isOpen, initialSymbol, initialType]);

  const fetchQuote = async (sym) => {
    if (!sym) return;
    setIsFetchingQuote(true);
    setError(null);
    const { data, error: err } = await getStockQuote(sym);
    if (err) {
      setError(err);
      setQuote(null);
    } else {
      setQuote(data);
    }
    setIsFetchingQuote(false);
  };

  if (!isOpen) return null;

  const currentPrice = quote ? quote.current_price : 0;
  const estimatedTotal = Math.round(currentPrice * (quantity || 0) * 100) / 100;

  const isBuy = transactionType === 'BUY';
  const hasInsufficientCash = isBuy && estimatedTotal > availableCash;
  const hasInsufficientShares = !isBuy && quantity > ownedQuantity;

  const handleExecute = async (e) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Please enter a valid quantity of at least 1 share.');
      return;
    }
    if (hasInsufficientCash) {
      setError(`Insufficient cash balance: Required ₹${estimatedTotal.toLocaleString('en-IN')}, available ₹${availableCash.toLocaleString('en-IN')}.`);
      return;
    }
    if (hasInsufficientShares) {
      setError(`Cannot sell ${quantity} shares: You only hold ${ownedQuantity} shares.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { data, error: err } = await placeOrder({
      symbol,
      transaction_type: transactionType,
      quantity,
      notes: notes.trim() || undefined,
    });

    if (err) {
      setError(err);
    } else {
      setSuccessMsg(data.message);
      if (onOrderSuccess) onOrderSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Simulated Order Ticket</h3>
              <p className="text-[11px] text-slate-400">Zero-risk Indian paper trading (NSE/BSE)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Form */}
        <form onSubmit={handleExecute} className="p-6 space-y-4">
          {/* BUY / SELL Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTransactionType('BUY');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isBuy
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              BUY (Long)
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('SELL');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !isBuy
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              SELL (Exit)
            </button>
          </div>

          {/* Symbol Display / Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Indian Security Symbol
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onBlur={() => fetchQuote(symbol)}
                placeholder="e.g. RELIANCE.NS, TCS.NS"
                className="flex-1 bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => fetchQuote(symbol)}
                className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
              >
                Fetch
              </button>
            </div>
          </div>

          {/* Live Quote Price Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400">Live Execution Price</span>
              <p className="text-lg font-bold font-mono text-white mt-0.5">
                {isFetchingQuote ? (
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Fetching quote...
                  </span>
                ) : quote ? (
                  `₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                ) : (
                  'Price Unavailable'
                )}
              </p>
            </div>
            {quote && (
              <div className="text-right">
                <span className="text-[11px] text-slate-400">Day Change</span>
                <p
                  className={`text-xs font-mono font-semibold ${
                    quote.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {quote.change >= 0 ? '+' : ''}
                  {quote.change} ({quote.percent_change}%)
                </p>
              </div>
            )}
          </div>

          {/* Quantity Stepper */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label className="font-medium text-slate-400">Quantity (Shares)</label>
              <span className="text-slate-400 font-mono text-[11px]">
                {isBuy ? `Available Cash: ₹${availableCash.toLocaleString('en-IN')}` : `Shares Owned: ${ownedQuantity}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500"
              />
              {[1, 5, 10, 50].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setQuantity(step)}
                  className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium"
                >
                  +{step}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Total Calculation */}
          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-baseline">
            <span className="text-xs text-slate-400">Total Order Amount:</span>
            <span className="text-xl font-extrabold font-mono text-white">
              ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !quote || hasInsufficientCash || hasInsufficientShares}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
              isBuy
                ? 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 shadow-rose-600/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing on Simulated Exchange...</span>
              </>
            ) : (
              <span>
                Confirm {transactionType} {quantity} Shares of {symbol.replace('.NS', '')}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

