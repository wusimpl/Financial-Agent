import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { FinancialsPanel } from './components/FinancialsPanel';
import { ChartPanel } from './components/ChartPanel';
import { SocialPanel } from './components/SocialPanel';
import { MarketStatusIndicator } from './components/MarketStatusIndicator';
import { mockStocks } from './mockData';
import { cn } from './lib/utils';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStock, setActiveStock] = useState('AAPL');
  const [watchlist, setWatchlist] = useState(['AAPL', 'TSLA', 'MSFT']);
  const [expandedPanel, setExpandedPanel] = useState<'financials' | 'chart' | 'social' | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const stockData = mockStocks[activeStock];
  const info = stockData?.info;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAFAFA] dark:bg-[#0B0E14] text-slate-800 dark:text-slate-300 font-sans transition-colors">
      <TopNav searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          watchlist={watchlist}
          activeStock={activeStock}
          setActiveStock={setActiveStock}
          stocksMap={mockStocks}
        />

        <main className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col">
          {info ? (
            <div className="flex-1 flex flex-col min-w-[1024px] p-6 lg:p-8 h-full overflow-hidden">
              {/* Active Stock Header */}
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{info.ticker}</h1>
                    <span className="text-slate-500 text-lg">{info.name}</span>
                  </div>
                  <div className="hidden sm:block h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-3xl font-medium tracking-tight tabular-nums text-slate-900 dark:text-white">
                      ${info.price.toFixed(2)}
                    </span>
                    <span className={cn(
                      "flex items-center text-sm font-medium px-2 py-1 rounded",
                      info.change >= 0 ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40" : "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40"
                    )}>
                      {info.change >= 0 ? '▲' : '▼'} {Math.abs(info.change).toFixed(2)} ({Math.abs(info.changePercent).toFixed(2)}%)
                    </span>
                    <MarketStatusIndicator status="open" className="ml-2 hidden sm:flex" />
                  </div>
                </div>
              </div>

              {/* 3-Column Dashboard Layout */}
              <PanelGroup direction="horizontal" className="flex-1 rounded-lg border border-slate-200 dark:border-[#30363D] overflow-hidden">
                {(!expandedPanel || expandedPanel === 'financials') && (
                  <Panel defaultSize={expandedPanel === 'financials' ? 100 : 33} minSize={20}>
                    <div className="h-full overflow-hidden bg-white dark:bg-[#161B22]">
                      <FinancialsPanel 
                        data={stockData} 
                        isExpanded={expandedPanel === 'financials'} 
                        onExpand={() => setExpandedPanel(expandedPanel === 'financials' ? null : 'financials')} 
                      />
                    </div>
                  </Panel>
                )}
                
                {(!expandedPanel) && (
                  <PanelResizeHandle className="group relative w-1 cursor-col-resize flex flex-col justify-center items-center shrink-0 z-10 transition-colors bg-white dark:bg-[#161B22]">
                    <div className="w-[1px] h-full bg-slate-200 dark:bg-[#30363D] group-hover:bg-blue-500 transition-colors" />
                  </PanelResizeHandle>
                )}
                
                {(!expandedPanel || expandedPanel === 'chart') && (
                  <Panel defaultSize={expandedPanel === 'chart' ? 100 : 34} minSize={20}>
                    <div className="h-full overflow-hidden bg-white dark:bg-[#161B22]">
                      <ChartPanel 
                        data={stockData} 
                        isExpanded={expandedPanel === 'chart'} 
                        onExpand={() => setExpandedPanel(expandedPanel === 'chart' ? null : 'chart')} 
                      />
                    </div>
                  </Panel>
                )}

                {(!expandedPanel) && (
                  <PanelResizeHandle className="group relative w-1 cursor-col-resize flex flex-col justify-center items-center shrink-0 z-10 transition-colors bg-white dark:bg-[#161B22]">
                    <div className="w-[1px] h-full bg-slate-200 dark:bg-[#30363D] group-hover:bg-blue-500 transition-colors" />
                  </PanelResizeHandle>
                )}
                
                {(!expandedPanel || expandedPanel === 'social') && (
                  <Panel defaultSize={expandedPanel === 'social' ? 100 : 33} minSize={20}>
                    <div className="h-full overflow-hidden bg-white dark:bg-[#161B22]">
                      <SocialPanel 
                        data={stockData} 
                        isExpanded={expandedPanel === 'social'} 
                        onExpand={() => setExpandedPanel(expandedPanel === 'social' ? null : 'social')} 
                      />
                    </div>
                  </Panel>
                )}
              </PanelGroup>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a stock from the watchlist or search for one.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
