import React from "react";
import { StockData } from "../types";
import type { SourceState } from "../api/backendTypes";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { Maximize2, Minimize2 } from "lucide-react";
import { formatNumber, hasNumber } from "../lib/format";

export function ChartPanel({
  data,
  status,
  onExpand,
  isExpanded,
}: {
  data: StockData;
  status?: SourceState;
  onExpand?: () => void;
  isExpanded?: boolean;
}) {
  if (status && !status.ok)
    return (
      <div className="p-6 text-slate-500 text-sm">Chart data could not be loaded.</div>
    );

  if (!data?.chart?.length)
    return (
      <div className="p-6 text-slate-500 text-sm">No chart data available.</div>
    );

  const info = data.info;

  // Custom candlestick shape
  const Candlestick = (props: any) => {
    const { x, y, width, height, open, close, high, low } = props;
    if (
      x === undefined ||
      y === undefined ||
      width === undefined ||
      height === undefined
    )
      return null;

    const isPositive = close >= open;
    const color = isPositive ? "#10B981" : "#EF4444"; // green vs red

    // Coordinates mapping
    const ratio = high !== low ? height / (high - low) : 0;

    const yOpen = y + (high - open) * ratio;
    const yClose = y + (high - close) * ratio;

    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1); // Minimum 1px height
    const centerX = x + width / 2;

    return (
      <g>
        {/* Wick (high to low) */}
        <line
          x1={centerX}
          y1={y}
          x2={centerX}
          y2={y + height}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body (open to close) */}
        <rect
          x={x}
          y={bodyTop}
          width={width}
          height={bodyHeight}
          fill={color}
          stroke={color}
        />
      </g>
    );
  };

  const minLow = Math.min(...data.chart.map((d) => d.low));
  const maxHigh = Math.max(...data.chart.map((d) => d.high));
  const domainPadding = (maxHigh - minLow) * 0.1;

  // Re-map data for ComposedChart to use the Candlestick shape properly.
  const chartData = data.chart.map((d) => ({
    ...d,
    candleVal: [d.low, d.high],
  }));

  const lastPoint = chartData[chartData.length - 1];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#161B22] overflow-hidden transition-colors">
      {/* Chart Toolbar */}
      <div className="h-14 px-4 border-b border-slate-200 dark:border-[#30363D] flex items-center justify-between bg-slate-50 dark:bg-[#11141A] shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
            PRICE CHART
          </h3>
          <div className="flex gap-1 text-[10px] font-mono px-2">
            <select
              value={data.chartRange || "1Y"}
              onChange={() => undefined}
              className="bg-transparent border border-slate-300 dark:border-[#30363D] rounded px-1.5 py-0.5 outline-none text-slate-800 dark:text-slate-200 font-bold"
            >
              {["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"].map(
                (tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pr-2 text-slate-500 dark:text-slate-400">
          <select className="bg-transparent text-[11px] outline-none hover:text-slate-800 dark:hover:text-slate-200">
            <option>Basic</option>
            <option>Advanced</option>
          </select>
          <div className="w-px h-4 bg-slate-200 dark:bg-[#30363D] mx-2"></div>
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex items-center gap-6 text-[10px] font-mono border-b border-slate-200 dark:border-[#30363D]/50 bg-slate-50 dark:bg-[#0B0E14]">
        <div className="flex gap-2 text-blue-500 dark:text-blue-400">
          <span>MA(20)</span> <span>{formatNumber(lastPoint?.ma20)}</span>
        </div>
        <div className="flex gap-2 text-orange-500 dark:text-orange-400">
          <span>MA(50)</span> <span>{formatNumber(lastPoint?.ma50)}</span>
        </div>
        <div className="flex gap-2 text-purple-500 dark:text-purple-400">
          <span>MA(200)</span> <span>{formatNumber(lastPoint?.ma200)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none custom-scrollbar pb-4">
        {/* Main Price Chart */}
        <div className="h-[350px] w-full pt-4">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              syncId="stockChart"
            >
              <CartesianGrid
                strokeDasharray="2 2"
                vertical={false}
                stroke="#94a3b8"
                strokeOpacity={0.2}
                strokeWidth={0.5}
              />
              <XAxis dataKey="date" hide />
              <YAxis
                domain={[minLow - domainPadding, maxHigh + domainPadding]}
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                  fontFamily: "monospace",
                }}
                tickLine={false}
                axisLine={false}
                dx={-10}
                orientation="right"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--tw-colors-white, #fff)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#334155",
                }}
                itemStyle={{ color: "#0f172a" }}
                labelStyle={{ color: "#64748b", marginBottom: "4px" }}
              />
              <Bar
                dataKey="candleVal"
                shape={(props: any) => (
                  <Candlestick
                    {...props}
                    open={props.payload.open}
                    close={props.payload.close}
                    high={props.payload.high}
                    low={props.payload.low}
                  />
                )}
                isAnimationActive={false}
              />
              <Line
                type="basis"
                dataKey="ma20"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="basis"
                dataKey="ma50"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="basis"
                dataKey="ma200"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceLine
                y={hasNumber(info?.price) ? info.price : undefined}
                stroke="#10B981"
                strokeDasharray="3 3"
                strokeWidth={0.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Sub-Chart */}
        <div className="h-[80px] w-full border-b border-slate-200 dark:border-[#30363D]/50 mb-2">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              syncId="stockChart"
            >
              <XAxis dataKey="date" hide />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                  fontFamily: "monospace",
                }}
                tickLine={false}
                axisLine={false}
                dx={-10}
                orientation="right"
                tickFormatter={(v) => `${Math.floor(v / 10)}M`}
              />
              <Tooltip
                cursor={{ fill: "#94a3b8", opacity: 0.1 }}
                content={() => null}
              />
              <Bar dataKey="volume" isAnimationActive={false}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.close >= entry.open ? "#059669" : "#b91c1c"}
                    opacity={0.6}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* RSI Sub-Chart */}
        <div className="h-[100px] w-full border-b border-slate-200 dark:border-[#30363D]/50 mb-2 relative">
          <div className="absolute top-1 left-4 text-[10px] font-mono text-purple-500 dark:text-purple-400">
            RSI(14) {formatNumber(lastPoint?.rsi14)}
          </div>
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 0, left: -20, bottom: 0 }}
              syncId="stockChart"
            >
              <XAxis dataKey="date" hide />
              <YAxis
                domain={[0, 100]}
                ticks={[30, 70]}
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                  fontFamily: "monospace",
                }}
                tickLine={false}
                axisLine={false}
                dx={-10}
                orientation="right"
              />
              <Tooltip
                cursor={{ fill: "#94a3b8", opacity: 0.1 }}
                content={() => null}
              />
              <ReferenceLine
                y={70}
                stroke="#64748b"
                strokeDasharray="3 3"
                strokeWidth={0.5}
              />
              <ReferenceLine
                y={30}
                stroke="#64748b"
                strokeDasharray="3 3"
                strokeWidth={0.5}
              />
              <Line
                type="monotone"
                dataKey="rsi14"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* MACD Sub-Chart */}
        <div className="h-[120px] w-full relative mb-4">
          <div className="absolute top-1 left-4 text-[10px] font-mono flex gap-2">
            <span className="text-blue-600 dark:text-blue-500">
              MACD(12,26,9)
            </span>
            <span className="text-blue-500 dark:text-blue-400">
              {formatNumber(lastPoint?.macd)}
            </span>
            <span className="text-orange-500 dark:text-orange-400">
              {formatNumber(lastPoint?.macdSignal)}
            </span>
            <span
              className={
                hasNumber(lastPoint?.macdHist) && lastPoint.macdHist > 0
                  ? "text-green-600 dark:text-green-500"
                  : "text-red-600 dark:text-red-500"
              }
            >
              {formatNumber(lastPoint?.macdHist)}
            </span>
          </div>
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 0, left: -20, bottom: 20 }}
              syncId="stockChart"
            >
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#64748b", pt: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                  fontFamily: "monospace",
                }}
                tickLine={false}
                axisLine={false}
                dx={-10}
                orientation="right"
              />
              <Tooltip
                cursor={{ fill: "#94a3b8", opacity: 0.1 }}
                content={() => null}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={0.5} />
              <Bar dataKey="macdHist" isAnimationActive={false}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={hasNumber(entry.macdHist) && entry.macdHist > 0 ? "#10B981" : "#EF4444"}
                    opacity={0.8}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="macd"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="macdSignal"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Data Grid */}
        <div className="grid grid-cols-4 gap-x-8 gap-y-3 px-6 py-4 border-t border-slate-200 dark:border-[#30363D] text-[11px] font-mono">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Open</span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatNumber(info?.open)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">High</span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatNumber(info?.high)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Low</span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatNumber(info?.low)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Prev Close</span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatNumber(info?.prevClose)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Volume</span>
              <span className="text-slate-800 dark:text-slate-200">
                {info?.volume || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Avg Vol</span>
              <span className="text-slate-800 dark:text-slate-200">
                {info?.avgVolume || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Beta</span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatNumber(info?.beta)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">P/E Ratio</span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatNumber(info?.peRatio)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Market Cap</span>
              <span className="text-slate-800 dark:text-slate-200">
                {info?.marketCap || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">EPS (TTM)</span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatNumber(info?.eps)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Earnings</span>
              <span className="text-slate-800 dark:text-slate-200">
                {info?.earningsDate || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Est</span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatNumber(info?.targetEst)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Next Div</span>
              <span className="text-slate-800 dark:text-slate-200">{info?.nextDividendDate || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ex-Div</span>
              <span className="text-slate-800 dark:text-slate-200">{info?.exDividendDate || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Div Yield</span>
              <span className="text-slate-800 dark:text-slate-200">
                {info?.dividendYield || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">52W Range</span>
              <span className="text-slate-800 dark:text-slate-200">
                {info?.range52Week || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
