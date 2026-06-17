import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { FinancialsPanel } from './components/FinancialsPanel';
import { ChartPanel } from './components/ChartPanel';
import { SocialPanel } from './components/SocialPanel';
import { MarketStatusIndicator } from './components/MarketStatusIndicator';
import { api, ApiError } from './api/client';
import { adaptChart, adaptFinancialHistory, adaptOverview, adaptSocial } from './api/adapters';
import { cn } from './lib/utils';
import { formatCurrency, formatNumber, hasNumber } from './lib/format';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import type { ChartDataPoint, FinancialYear, StockData, StockInfo, Tweet } from './types';
import type { ChartRange, SocialSort, WatchlistItem } from './api/backendTypes';

function emptyStockInfo(ticker: string): StockInfo {
  return {
    ticker,
    name: ticker,
    price: null,
    change: null,
    changePercent: null,
    marketCap: '—',
    peRatio: null,
    dividendYield: '—',
    range52Week: '—',
    open: null,
    high: null,
    low: null,
    prevClose: null,
    volume: '—',
    avgVolume: '—',
    beta: null,
    eps: null,
    earningsDate: '—',
    targetEst: null,
    nextDividendDate: '—',
    exDividendDate: '—',
  };
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStock, setActiveStock] = useState('AAPL');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [info, setInfo] = useState<StockInfo>(() => emptyStockInfo('AAPL'));
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [selectedChartRange, setSelectedChartRange] = useState<ChartRange>('1Y');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [financials, setFinancials] = useState<FinancialYear[]>([]);
  const [financialsLoading, setFinancialsLoading] = useState(true);
  const [financialsError, setFinancialsError] = useState<string | null>(null);
  const [selectedSocialSort, setSelectedSocialSort] = useState<SocialSort>('latest');
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<'financials' | 'chart' | 'social' | null>(null);
  const overviewRequestId = useRef(0);
  const chartRequestId = useRef(0);
  const financialsRequestId = useRef(0);
  const socialRequestId = useRef(0);

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
    const requestId = overviewRequestId.current + 1;
    overviewRequestId.current = requestId;

    setInfo(emptyStockInfo(activeStock));
    setOverviewLoading(true);
    setOverviewError(null);

    api.stockOverview(activeStock)
      .then((response) => {
        if (requestId !== overviewRequestId.current) return;
        setInfo(adaptOverview(activeStock, response));
      })
      .catch((error) => {
        if (requestId !== overviewRequestId.current) return;
        setOverviewError(error instanceof ApiError ? error.message : 'Unable to load stock details.');
      })
      .finally(() => {
        if (requestId === overviewRequestId.current) setOverviewLoading(false);
      });
  }, [activeStock]);

  useEffect(() => {
    const requestId = chartRequestId.current + 1;
    chartRequestId.current = requestId;

    setChartData([]);
    setChartLoading(true);
    setChartError(null);

    api.chart(activeStock, selectedChartRange)
      .then((response) => {
        if (requestId !== chartRequestId.current) return;
        const nextChart = adaptChart(response);
        setChartData(nextChart.chart);
        setSelectedChartRange(nextChart.chartRange);
      })
      .catch((error) => {
        if (requestId !== chartRequestId.current) return;
        setChartError(error instanceof ApiError ? error.message : 'Unable to load chart data.');
      })
      .finally(() => {
        if (requestId === chartRequestId.current) setChartLoading(false);
      });
  }, [activeStock, selectedChartRange]);

  useEffect(() => {
    const requestId = financialsRequestId.current + 1;
    financialsRequestId.current = requestId;

    setFinancials([]);
    setFinancialsLoading(true);
    setFinancialsError(null);

    api.financialHistory(activeStock)
      .then((response) => {
        if (requestId !== financialsRequestId.current) return;
        setFinancials(adaptFinancialHistory(response).financials);
      })
      .catch((error) => {
        if (requestId !== financialsRequestId.current) return;
        setFinancialsError(error instanceof ApiError ? error.message : 'Unable to load financial data.');
      })
      .finally(() => {
        if (requestId === financialsRequestId.current) setFinancialsLoading(false);
      });
  }, [activeStock]);

  useEffect(() => {
    const requestId = socialRequestId.current + 1;
    socialRequestId.current = requestId;

    setTweets([]);
    setSocialLoading(true);
    setSocialError(null);

    api.socialPosts(activeStock, selectedSocialSort)
      .then((response) => {
        if (requestId !== socialRequestId.current) return;
        const nextSocial = adaptSocial(response);
        setTweets(nextSocial.tweets);
        setSelectedSocialSort(nextSocial.socialSort);
      })
      .catch((error) => {
        if (requestId !== socialRequestId.current) return;
        setSocialError(error instanceof ApiError ? error.message : 'Unable to load social posts.');
      })
      .finally(() => {
        if (requestId === socialRequestId.current) setSocialLoading(false);
      });
  }, [activeStock, selectedSocialSort]);

  const loadChartRange = (range: ChartRange) => {
    setSelectedChartRange(range);
  };

  const loadSocialSort = (sort: SocialSort) => {
    setSelectedSocialSort(sort);
  };

  const stockData = useMemo<StockData>(() => ({
    info,
    chart: chartData,
    financials,
    tweets,
    chartRange: selectedChartRange,
    sources: {},
  }), [chartData, financials, info, selectedChartRange, tweets]);

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
                      {overviewLoading ? (
                        <span className="inline-block h-8 w-32 animate-pulse rounded bg-slate-200 align-middle dark:bg-slate-800" />
                      ) : (
                        formatCurrency(info.price)
                      )}
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
                {overviewError && (
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
                        isLoading={financialsLoading}
                        error={financialsError}
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
                        sort={selectedSocialSort}
                        isLoading={socialLoading}
                        error={socialError}
                        onSortChange={loadSocialSort}
                        isExpanded={expandedPanel === 'social'} 
                        onExpand={() => setExpandedPanel(expandedPanel === 'social' ? null : 'social')} 
                      />
                    </div>
                  </Panel>
                )}
              </PanelGroup>
            </div>
        </main>
      </div>
    </div>
  );
}
