import React, { useEffect, useRef, useState } from "react";
import { StockData } from "../types";
import type { FilingSummary, SourceState } from "../api/backendTypes";
import { api, ApiError } from "../api/client";
import { Maximize2, Minimize2 } from "lucide-react";
import { LoadingState } from "./LoadingState";

function extractYear(value?: string | null) {
  if (!value) return null;
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function filingYear(filing: FilingSummary) {
  return extractYear(filing.report_date || filing.filing_date);
}

function filingYears(filings: FilingSummary[]) {
  return Array.from(
    new Set(
      filings
        .map(filingYear)
        .filter((year): year is number => year !== null),
    ),
  ).sort((a, b) => b - a);
}

function collectPageTargets(document: Document) {
  if (!document.body) return [];

  const pageBreaks = Array.from(document.querySelectorAll("hr")).filter((element) => {
    const style = element.getAttribute("style") || "";
    return /page-break-after\s*:\s*always/i.test(style) || /break-after\s*:\s*page/i.test(style);
  });
  if (pageBreaks.length === 0) return [];

  const targets = [document.body];
  pageBreaks.forEach((pageBreak) => {
    const nextElement = pageBreak.nextElementSibling;
    if (nextElement) targets.push(nextElement as HTMLElement);
  });

  return targets;
}

export function FinancialsPanel({
  data,
  onExpand,
  isExpanded,
}: {
  data: StockData;
  status?: SourceState;
  isLoading?: boolean;
  error?: string | null;
  onExpand?: () => void;
  isExpanded?: boolean;
}) {
  const filingTypes = ["10-K", "10-Q", "8-K"];

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>(filingTypes[0]);
  const [filings, setFilings] = useState<FilingSummary[]>([]);
  const [filingsLoading, setFilingsLoading] = useState(false);
  const [filingsError, setFilingsError] = useState<string | null>(null);
  const [filingPages, setFilingPages] = useState<number[]>([]);
  const [selectedPage, setSelectedPage] = useState(1);
  const filingFrameRef = useRef<HTMLIFrameElement>(null);
  const pageTargetsRef = useRef<HTMLElement[]>([]);

  const resetFilingPages = () => {
    pageTargetsRef.current = [];
    setFilingPages([]);
    setSelectedPage(1);
  };

  useEffect(() => {
    let cancelled = false;

    setFilings([]);
    setSelectedYear(null);
    resetFilingPages();
    setFilingsLoading(true);
    setFilingsError(null);

    api.secFilings(data.info.ticker, { filingType: selectedType, limit: 50 })
      .then((response) => {
        if (cancelled) return;
        setFilings(response);
        setSelectedYear(filingYears(response)[0] ?? null);
      })
      .catch((error) => {
        if (cancelled) return;
        setFilingsError(error instanceof ApiError ? error.message : "Unable to load filings.");
      })
      .finally(() => {
        if (!cancelled) setFilingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data.info.ticker, selectedType]);

  if (!data?.info) return null;

  const years = filingYears(filings);
  const filingFrameUrl = selectedYear
    ? api.secDocumentHtmlByYearUrl(data.info.ticker, selectedYear, selectedType)
    : null;

  const handleFilingFrameLoad = () => {
    try {
      const frameDocument = filingFrameRef.current?.contentDocument;
      const targets = frameDocument ? collectPageTargets(frameDocument) : [];

      pageTargetsRef.current = targets;
      setFilingPages(targets.map((_, index) => index + 1));
      setSelectedPage(1);
    } catch {
      pageTargetsRef.current = [];
      setFilingPages([]);
      setSelectedPage(1);
    }
  };

  const jumpToFilingPage = (page: number) => {
    const frameWindow = filingFrameRef.current?.contentWindow;
    const target = pageTargetsRef.current[page - 1];
    if (!frameWindow || !target) return;

    setSelectedPage(page);
    if (page === 1) {
      frameWindow.scrollTo({ top: 0 });
      return;
    }
    target.scrollIntoView({ block: "start" });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#161B22] overflow-hidden transition-colors">
      <div className="h-14 px-4 bg-white dark:bg-[#161B22] border-b border-slate-200 dark:border-[#30363D] flex flex-row items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
            SEC FILING
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear ?? ""}
              onChange={(e) => {
                const year = Number(e.target.value);
                if (!Number.isNaN(year)) {
                  resetFilingPages();
                  setSelectedYear(year);
                }
              }}
              disabled={filingsLoading || years.length === 0}
              className="text-xs bg-slate-100 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#30363D] rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-[#1f242e] transition-colors"
            >
              {years.length > 0 ? (
                years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              ) : (
                <option value="">—</option>
              )}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs bg-slate-100 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#30363D] rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-[#1f242e] transition-colors"
            >
              {filingTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {filingPages.length > 1 && (
              <select
                aria-label="Page"
                value={selectedPage}
                onChange={(e) => jumpToFilingPage(Number(e.target.value))}
                className="w-24 text-xs bg-slate-100 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#30363D] rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-[#1f242e] transition-colors"
              >
                {filingPages.map((page) => (
                  <option key={page} value={page}>
                    Page {page}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-[#30363D] hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-[#0B0E14] p-4">
        <div className="h-full overflow-hidden bg-white dark:bg-[#0B0E14] shadow-xl dark:shadow-[0_0_15px_rgba(0,0,0,0.5)] dark:border dark:border-[#30363D]">
          {filingsLoading ? (
            <LoadingState label="Loading filing..." />
          ) : filingsError ? (
            <div className="flex h-full items-center justify-center px-6 text-sm text-slate-500">
              {filingsError}
            </div>
          ) : filingFrameUrl ? (
            <iframe
              ref={filingFrameRef}
              key={filingFrameUrl}
              title={`${data.info.ticker} SEC filing`}
              src={filingFrameUrl}
              onLoad={handleFilingFrameLoad}
              className="h-full w-full border-0 bg-[#0B0E14]"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-sm text-slate-500">
              No filing available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
