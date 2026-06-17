import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { FinancialsPanel } from './components/FinancialsPanel';
import { ChartPanel } from './components/ChartPanel';
import { SocialPanel } from './components/SocialPanel';
import { MarketStatusIndicator } from './components/MarketStatusIndicator';
import { api, ApiError } from './api/client';
import { adaptChart, adaptDashboard } from './api/adapters';
import { cn } from './lib/utils';
import { formatCurrency, formatNumber, hasNumber } from './lib/format';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import type { StockData } from './types';
import type { ChartRange, WatchlistItem } from './api/backendTypes';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStock, setActiveStock] = useState('AAPL');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedChartRange, setSelectedChartRange] = useState<ChartRange>('1Y');
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<'financials' | 'chart' | 'social' | null>(null);
  const chartRequestId = useRef(0);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    let cancelled = false;

    setWatchlistLoading(true);
    setWatchlistError(null);

    api.watchlist()
      .then((items) => {
        if (!cancelled) setWatchlist(items);
      })
      .catch((error) => {
        if (cancelled) return;
        setWatchlistError(error instanceof ApiError ? error.message : 'Unable to load watchlist.');
        setWatchlist([]);
      })
      .finally(() => {
        if (!cancelled) setWatchlistLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setLoadError(null);
    setStockData(null);
    setChartLoading(false);
    setChartError(null);
    chartRequestId.current += 1;

    api.dashboard(activeStock)
      .then((response) => {
        if (!cancelled) {
          setStockData(adaptDashboard(response));
          setSelectedChartRange(response.chart.range);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof ApiError ? error.message : 'Unable to load stock data.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeStock]);

  const loadChartRange = (range: ChartRange) => {
    const requestId = chartRequestId.current + 1;
    chartRequestId.current = requestId;
    setSelectedChartRange(range);
    setChartLoading(true);
    setChartError(null);

    api.chart(activeStock, range)
      .then((response) => {
        if (requestId !== chartRequestId.current) return;
        const nextChart = adaptChart(response);
        setStockData((current) => current ? {
          ...current,
          chart: nextChart.chart,
          chartRange: nextChart.chartRange,
        } : current);
      })
      .catch((error) => {
        if (requestId !== chartRequestId.current) return;
        setChartError(error instanceof ApiError ? error.message : 'Unable to load chart data.');
      })
      .finally(() => {
        if (requestId === chartRequestId.current) setChartLoading(false);
      });
  };

  const info = stockData?.info;
  const overviewStatus = stockData?.sources?.overview;
  const hasChange = hasNumber(info?.change) && hasNumber(info?.changePercent);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAFAFA] dark:bg-[#0B0E14] text-slate-800 dark:text-slate-300 font-sans transition-colors">
      <TopNav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectStock={setActiveStock}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          watchlist={watchlist}
          isLoading={watchlistLoading}
          error={watchlistError}
          activeStock={activeStock}
          setActiveStock={setActiveStock}
        />

        <main className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
              Loading stock data...
            </div>
          ) : loadError ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
              {loadError}
            </div>
          ) : info && stockData ? (
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
                      {formatCurrency(info.price)}
                    </span>
                    {hasChange && (
                      <span className={cn(
                        "flex items-center text-sm font-medium px-2 py-1 rounded",
                        info.change >= 0 ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40" : "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40"
                      )}>
                        {info.change >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(info.change))} ({formatNumber(Math.abs(info.changePercent))}%)
                      </span>
                    )}
                    {info.marketStatus && <MarketStatusIndicator status={info.marketStatus} className="ml-2 hidden sm:flex" />}
                  </div>
                </div>
                {overviewStatus && !overviewStatus.ok && (
                  <div className="text-xs text-red-600 dark:text-red-400">
                    Stock details unavailable.
                  </div>
                )}
              </div>

              {/* 3-Column Dashboard Layout */}
              <PanelGroup direction="horizontal" className="flex-1 rounded-lg border border-slate-200 dark:border-[#30363D] overflow-hidden">
                {(!expandedPanel || expandedPanel === 'financials') && (
                  <Panel defaultSize={expandedPanel === 'financials' ? 100 : 33} minSize={20}>
                    <div className="h-full overflow-hidden bg-white dark:bg-[#161B22]">
                      <FinancialsPanel 
                        data={stockData} 
                        status={stockData.sources?.financials}
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
                        status={stockData.sources?.chart}
                        range={selectedChartRange}
                        isLoading={chartLoading}
                        error={chartError}
                        onRangeChange={loadChartRange}
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
                        status={stockData.sources?.social}
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
              No stock data available.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
