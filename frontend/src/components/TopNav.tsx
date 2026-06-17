import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Sun, Moon, Settings } from 'lucide-react';

interface TopNavProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function TopNav({ searchQuery, setSearchQuery }: TopNavProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Sync initial state if needed, but we default to true anyway
    const hasDarkClass = document.documentElement.classList.contains('dark');
    if (hasDarkClass !== isDark) {
      setIsDark(hasDarkClass);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

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
