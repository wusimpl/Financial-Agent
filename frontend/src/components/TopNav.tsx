import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Sun, Moon, Settings } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { StockSearchItem } from '../api/backendTypes';

interface TopNavProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectStock: (ticker: string) => void;
}

function matchLabel(matchReason?: string | null) {
  if (matchReason === 'ticker_or_company') return 'Ticker or company';
  return 'Stock match';
}

export function TopNav({ searchQuery, setSearchQuery, onSelectStock }: TopNavProps) {
  const [isDark, setIsDark] = useState(true);
  const [results, setResults] = useState<StockSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    // Sync initial state if needed, but we default to true anyway
    const hasDarkClass = document.documentElement.classList.contains('dark');
    if (hasDarkClass !== isDark) {
      setIsDark(hasDarkClass);
    }
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    let cancelled = false;

    if (!query) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timer = window.setTimeout(() => {
      api.searchStocks(query)
        .then((items) => {
          if (!cancelled) setResults(items);
        })
        .catch((error) => {
          if (cancelled) return;
          setResults([]);
          setSearchError(error instanceof ApiError ? error.message : 'Unable to search stocks.');
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const selectStock = (ticker: string) => {
    onSelectStock(ticker);
    setSearchQuery('');
    setResults([]);
    setSearchError(null);
  };

  const showSearchPanel = searchQuery.trim().length > 0;

  return (
    <header className="h-14 bg-white dark:bg-[#0B0E14] border-b border-slate-200 dark:border-[#1E232D] flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">
          <TrendingUp size={18} />
        </div>
        <span className="font-bold tracking-tight text-slate-900 dark:text-white">STX.ANALYTICS</span>
      </div>

      <div className="flex-1 max-w-xl px-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search ticker (e.g. AAPL, TSLA, MSFT)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-[#161B22] border border-slate-200 dark:border-[#30363D] rounded-full py-1.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-500 text-slate-900 dark:text-slate-300"
          />
          {showSearchPanel && (
            <div className="absolute left-0 right-0 top-10 z-30 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-[#30363D] dark:bg-[#161B22]">
              {isSearching ? (
                <div className="px-4 py-3 text-xs text-slate-500">Searching...</div>
              ) : searchError ? (
                <div className="px-4 py-3 text-xs text-red-600 dark:text-red-400">{searchError}</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-500">No matching stocks.</div>
              ) : (
                <div className="max-h-80 overflow-y-auto py-1">
                  {results.map((item) => (
                    <button
                      key={item.identity.ticker}
                      type="button"
                      onClick={() => selectStock(item.identity.ticker)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-[#30363D]/50"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.identity.ticker}
                        </div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {item.identity.company_name}
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                        {matchLabel(item.match_reason)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500">
        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-[#161B22] rounded-full transition-colors" title="Toggle Theme">
          {isDark ? <Sun size={18} className="text-slate-400" /> : <Moon size={18} className="text-slate-600" />}
        </button>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-[#161B22] rounded-full transition-colors" title="Settings">
          <Settings size={18} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </header>
  );
}
