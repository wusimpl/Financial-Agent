import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Building2, ChevronLeft, Menu, Trash2 } from 'lucide-react';
import type { WatchlistItem } from '../api/backendTypes';

interface SidebarProps {
  watchlist: WatchlistItem[];
  isLoading?: boolean;
  error?: string | null;
  activeStock: string;
  setActiveStock: (ticker: string) => void;
  removeStock: (ticker: string) => void;
}

const logoDevToken = String(import.meta.env.VITE_LOGO_DEV_TOKEN || '').trim();

function getLogoUrl(ticker: string) {
  const params = new URLSearchParams({
    token: logoDevToken,
    size: '64',
    format: 'png',
    theme: 'dark',
    fallback: '404',
    retina: 'true',
  });

  return `https://img.logo.dev/ticker/${encodeURIComponent(ticker.toLowerCase())}?${params}`;
}

function CompanyLogo({ ticker, name }: { ticker: string; name: string }) {
  const [error, setError] = useState(false);
  const logoUrl = logoDevToken && !error ? getLogoUrl(ticker) : null;
  
  if (!logoUrl) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 border border-slate-200 dark:border-slate-700">
        <Building2 size={15} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${name} 标志`}
      onError={() => setError(true)}
      className="w-8 h-8 rounded-full shrink-0 object-contain bg-white border border-slate-100 dark:border-slate-800 p-1"
    />
  );
}

export function Sidebar({ watchlist, isLoading, error, activeStock, setActiveStock, removeStock }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className={cn(
      "bg-[#FAFAFA] dark:bg-[#0B0E14] border-r border-slate-200 dark:border-[#1E232D] h-full flex flex-col shrink-0 transition-all duration-300",
      isOpen ? "w-52" : "w-16"
    )}>
      <div className={cn("p-4 flex items-center", isOpen ? "justify-between" : "justify-center")}>
        {isOpen && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap overflow-hidden">Watchlist</span>}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-200 dark:hover:bg-[#1E232D]"
        >
          {isOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
        </button>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading && (
          <div className={cn("px-4 py-3 text-xs text-slate-500", !isOpen && "sr-only")}>
            Loading watchlist...
          </div>
        )}
        {!isLoading && error && (
          <div className={cn("px-4 py-3 text-xs text-red-600 dark:text-red-400", !isOpen && "sr-only")}>
            {error}
          </div>
        )}
        {!isLoading && !error && watchlist.length === 0 && (
          <div className={cn("px-4 py-3 text-xs text-slate-500", !isOpen && "sr-only")}>
            No stocks in watchlist.
          </div>
        )}
        {!isLoading && !error && watchlist.map((item) => {
          const ticker = item.identity.ticker;
          const name = item.identity.company_name;
          
          const isActive = activeStock === ticker;
          
          return (
            <div
              key={ticker}
              className={cn(
                "w-full flex items-center border-l-2 transition-colors whitespace-nowrap",
                isOpen ? "pl-4 pr-2" : "px-0 justify-center",
                isActive ? "bg-white dark:bg-[#161B22] border-blue-500 shadow-sm dark:shadow-none" : "border-transparent hover:bg-slate-100 dark:hover:bg-[#161B22]"
              )}
            >
              <button
                type="button"
                onClick={() => setActiveStock(ticker)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 py-3 text-left",
                  !isOpen && "justify-center",
                )}
                title={!isOpen ? name : undefined}
              >
                <CompanyLogo ticker={ticker} name={name} />

                {isOpen && (
                  <div className="flex flex-col items-start overflow-hidden flex-1">
                    <div className="text-sm font-bold text-slate-900 dark:text-white uppercase">{ticker}</div>
                    <div className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 truncate w-full">{name}</div>
                  </div>
                )}
              </button>
              {isOpen && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`从列表中删除 ${ticker}？`)) {
                      removeStock(ticker);
                    }
                  }}
                  className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  aria-label={`删除 ${ticker}`}
                  title={`删除 ${ticker}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
