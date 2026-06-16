import React, { useState } from 'react';
import { StockData } from '../types';
import { cn } from '../lib/utils';
import { ChevronLeft, Menu } from 'lucide-react';

interface SidebarProps {
  watchlist: string[];
  activeStock: string;
  setActiveStock: (ticker: string) => void;
  stocksMap: Record<string, StockData>;
}

function CompanyLogo({ ticker, name }: { ticker: string; name: string }) {
  const [error, setError] = useState(false);
  const domainMap: Record<string, string> = {
    AAPL: 'apple.com',
    TSLA: 'tesla.com',
    MSFT: 'microsoft.com'
  };
  const domain = domainMap[ticker] || `${ticker.toLowerCase()}.com`;
  
  if (error) {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400 shrink-0">
        {ticker.slice(0, 1)}
      </div>
    );
  }

  return (
    <img 
      src={`https://logo.clearbit.com/${domain}`} 
      alt={`${name} logo`} 
      onError={() => setError(true)}
      className="w-8 h-8 rounded-full shrink-0 object-cover bg-white border border-slate-100 dark:border-slate-800"
    />
  );
}

export function Sidebar({ watchlist, activeStock, setActiveStock, stocksMap }: SidebarProps) {
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
        {watchlist.map((ticker) => {
          const stock = stocksMap[ticker]?.info;
          if (!stock) return null;
          
          const isActive = activeStock === ticker;
          
          return (
            <button
              key={ticker}
              onClick={() => setActiveStock(ticker)}
              className={cn(
                "w-full flex items-center py-3 border-l-2 transition-colors cursor-pointer text-left whitespace-nowrap gap-3",
                isOpen ? "px-4" : "px-0 justify-center",
                isActive ? "bg-white dark:bg-[#161B22] border-blue-500 shadow-sm dark:shadow-none" : "border-transparent hover:bg-slate-100 dark:hover:bg-[#161B22]"
              )}
              title={!isOpen ? stock.name : undefined}
            >
              <CompanyLogo ticker={ticker} name={stock.name} />
              
              {isOpen && (
                <div className="flex flex-col items-start overflow-hidden flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white uppercase">{stock.ticker}</div>
                  <div className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 truncate w-full">{stock.name}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
