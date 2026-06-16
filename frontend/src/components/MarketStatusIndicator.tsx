import React from 'react';
import { Sunrise, Sunset, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

export type MarketState = 'pre_market' | 'open' | 'post_market' | 'overnight' | 'closed';

export function MarketStatusIndicator({ status = 'open', className }: { status?: MarketState, className?: string }) {
  const config = {
    pre_market: {
      icon: <Sunrise size={18} className="text-orange-400" />,
      text: '盘前',
    },
    open: {
      icon: <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />,
      text: '开盘',
    },
    post_market: {
      icon: <Sunset size={18} className="text-violet-500" />,
      text: '盘后',
    },
    overnight: {
      icon: <Moon size={18} className="text-blue-500" />,
      text: '隔夜',
    },
    closed: {
      icon: <Moon size={18} className="text-slate-400" />,
      text: '休市',
    }
  };

  const current = config[status];

  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      <div className="h-[18px] flex items-center justify-center">{current.icon}</div>
      <span className="text-xs font-medium leading-none text-slate-800 dark:text-slate-200">{current.text}</span>
    </div>
  );
}
