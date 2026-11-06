import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, TrendingUp, X } from 'lucide-react';
import { searchStocks } from '../../services/api';

const QUICK_STOCKS = [
  { symbol: 'RELIANCE.NS', label: 'RELIANCE' },
  { symbol: 'TCS.NS', label: 'TCS' },
  { symbol: 'HDFCBANK.NS', label: 'HDFCBANK' },
  { symbol: 'INFY.NS', label: 'INFY' },
  { symbol: 'ICICIBANK.NS', label: 'ICICIBANK' },
  { symbol: 'TATAMOTORS.NS', label: 'TATAMOTORS' },
  { symbol: 'ITC.NS', label: 'ITC' },
  { symbol: 'SBIN.NS', label: 'SBIN' },
];

export default function StockSearchBar({ selectedSymbol, onSelectStock }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const { data } = await searchStocks(query);
      setResults(data || []);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Search Bar Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder="Search Indian stocks by symbol or company (e.g., RELIANCE, TCS, INFY)..."
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-11 pr-10 py-3 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-3.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && (
          <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Searching Indian securities...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2 divide-y divide-slate-800/60">
                {results.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      onSelectStock(stock.symbol);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/70 transition-colors ${
                      selectedSymbol === stock.symbol ? 'bg-indigo-600/15' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm font-mono">
                          {stock.symbol}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {stock.exchange}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{stock.name}</p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{stock.sector}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-400">
                No matching Indian stocks found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Picks Ticker Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-400 shrink-0 font-medium flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Top Indian Equities:
        </span>
        {QUICK_STOCKS.map((item) => (
          <button
            key={item.symbol}
            onClick={() => onSelectStock(item.symbol)}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-all shrink-0 ${
              selectedSymbol === item.symbol
                ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

