import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  BarChart2,
} from 'lucide-react';
import StockSearchBar from '../components/stocks/StockSearchBar';
import StockChart from '../components/stocks/StockChart';
import TechnicalSignalsCard from '../components/stocks/TechnicalSignalsCard';
import OrderModal from '../components/portfolio/OrderModal';
import { getStockQuote, getStockIndicators, getPortfolio } from '../services/api';

export default function MarketOverview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramSymbol = searchParams.get('symbol');

  const [selectedSymbol, setSelectedSymbol] = useState(paramSymbol || 'RELIANCE.NS');
  const [period, setPeriod] = useState('6mo');

  useEffect(() => {
    if (paramSymbol && paramSymbol !== selectedSymbol) {
      setSelectedSymbol(paramSymbol);
    }
  }, [paramSymbol]);

  const [quote, setQuote] = useState(null);
  const [indicatorsData, setIndicatorsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paper trade order modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderType, setOrderType] = useState('BUY');
  const [availableCash, setAvailableCash] = useState(1000000);
  const [ownedShares, setOwnedShares] = useState(0);

  const fetchPortfolioState = async () => {
    const { data } = await getPortfolio();
    if (data) {
      setAvailableCash(data.cash_balance);
      const matchingHolding = data.holdings?.find((h) => h.symbol === selectedSymbol);
      setOwnedShares(matchingHolding ? matchingHolding.quantity : 0);
    }
  };

  useEffect(() => {
    fetchPortfolioState();
  }, [selectedSymbol]);

  const fetchStockData = async (symbol, timePeriod) => {
    setIsLoading(true);
    setError(null);

    try {
      const [quoteRes, indRes] = await Promise.all([
        getStockQuote(symbol),
        getStockIndicators(symbol, timePeriod),
      ]);

      if (quoteRes.error && indRes.error) {
        throw new Error(quoteRes.error || indRes.error);
      }

      setQuote(quoteRes.data);
      setIndicatorsData(indRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch Indian stock market data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(selectedSymbol, period);
  }, [selectedSymbol, period]);

  const formatCrores = (val) => {
    if (!val) return 'N/A';
    // 1 Crore = 10,000,000
    const cr = val / 10000000;
    return `₹${cr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
  };

  const isPositive = quote ? quote.change >= 0 : false;

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Indian Stock Market Intelligence
        </h1>
        <p className="text-sm text-slate-400">
          Real-time quotes, technical momentum indicators (RSI, MACD, Moving Averages), and automated trading signals.
        </p>
      </div>

      {/* Stock Search Component */}
      <StockSearchBar
        selectedSymbol={selectedSymbol}
        onSelectStock={(sym) => setSelectedSymbol(sym)}
      />

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchStockData(selectedSymbol, period)}
            className="px-3 py-1 bg-rose-900/50 hover:bg-rose-900 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stock Quote Header Card */}
      {quote && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                  {quote.symbol}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  NSE
                </span>
                <span className="text-xs text-slate-400 truncate max-w-xs md:max-w-md">
                  {quote.company_name}
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                  ₹{quote.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`inline-flex items-center text-sm font-bold font-mono px-2.5 py-0.5 rounded ${
                    isPositive
                      ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-900/50'
                      : 'text-rose-400 bg-rose-950/60 border border-rose-900/50'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  )}
                  {isPositive ? '+' : ''}
                  {quote.change} ({isPositive ? '+' : ''}
                  {quote.percent_change}%)
                </span>
              </div>
            </div>

            <div className="self-start lg:self-center flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setOrderType('BUY');
                  setIsOrderModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/20"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Buy Shares</span>
              </button>

              <button
                onClick={() => {
                  setOrderType('SELL');
                  setIsOrderModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-md shadow-rose-600/20"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Sell ({ownedShares})</span>
              </button>

              <button
                onClick={() => fetchStockData(selectedSymbol, period)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Key Fundamentals & Range Stats */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Day High</span>
              <p className="mt-1 font-mono font-semibold text-white">₹{quote.high}</p>
            </div>
            <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Day Low</span>
              <p className="mt-1 font-mono font-semibold text-white">₹{quote.low}</p>
            </div>
            <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">52-Wk High</span>
              <p className="mt-1 font-mono font-semibold text-emerald-400">
                ₹{quote.fifty_two_week_high || 'N/A'}
              </p>
            </div>
            <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">52-Wk Low</span>
              <p className="mt-1 font-mono font-semibold text-rose-400">
                ₹{quote.fifty_two_week_low || 'N/A'}
              </p>
            </div>
            <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">P/E Ratio</span>
              <p className="mt-1 font-mono font-semibold text-white">
                {quote.pe_ratio ? `${quote.pe_ratio}x` : 'N/A'}
              </p>
            </div>
            <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Market Cap</span>
              <p className="mt-1 font-mono font-semibold text-indigo-300">
                {formatCrores(quote.market_cap)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Algorithmic Technical Assessment Card */}
      {indicatorsData?.summary && (
        <TechnicalSignalsCard summary={indicatorsData.summary} />
      )}

      {/* Interactive Stock & Indicators Chart */}
      <StockChart
        chartData={indicatorsData?.chart_data || []}
        selectedPeriod={period}
        onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
        isLoading={isLoading}
      />

      {/* Trade Execution Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        initialSymbol={selectedSymbol}
        initialType={orderType}
        availableCash={availableCash}
        ownedQuantity={ownedShares}
        onOrderSuccess={fetchPortfolioState}
      />
    </div>
  );
}
