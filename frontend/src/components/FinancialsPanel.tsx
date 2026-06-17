import React, { useEffect, useState } from "react";
import { StockData } from "../types";
import type { FilingDocumentResponse, SourceState } from "../api/backendTypes";
import { api, ApiError } from "../api/client";
import { Maximize2, Minimize2 } from "lucide-react";
import { formatMoneyAmount } from "../lib/format";

function extractYear(value?: string | null) {
  if (!value) return null;
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function MetadataRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold">{value || "—"}</div>
    </div>
  );
}

export function FinancialsPanel({
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
  const latestYear = extractYear(data.financials[0]?.yearEnded) || new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => latestYear - i);
  const filingTypes = ["10-K", "10-Q", "8-K"];

  const [selectedYear, setSelectedYear] = useState<number>(years[0]);
  const [selectedType, setSelectedType] = useState<string>(filingTypes[0]);
  const [filing, setFiling] = useState<FilingDocumentResponse | null>(null);
  const [filingLoading, setFilingLoading] = useState(false);
  const [filingError, setFilingError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedYear(latestYear);
  }, [data.info.ticker, latestYear]);

  useEffect(() => {
    let cancelled = false;

    setFilingLoading(true);
    setFilingError(null);
    setFiling(null);

    api.secDocumentByYear(data.info.ticker, selectedYear, selectedType)
      .then((response) => {
        if (!cancelled) setFiling(response);
      })
      .catch((error) => {
        if (cancelled) return;
        setFilingError(error instanceof ApiError ? error.message : "Unable to load filing.");
      })
      .finally(() => {
        if (!cancelled) setFilingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data.info.ticker, selectedYear, selectedType]);

  if (!data?.info) return null;

  const latestFinancials = data.financials[0];
  const metadata = filing?.metadata;
  const hasFinancials = !status?.empty && data.financials.length > 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#161B22] overflow-hidden transition-colors">
      <div className="h-14 px-4 bg-white dark:bg-[#161B22] border-b border-slate-200 dark:border-[#30363D] flex flex-row items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
            SEC FILING
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-xs bg-slate-100 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#30363D] rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-[#1f242e] transition-colors"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
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

      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0B0E14] relative scrollbar-none custom-scrollbar">
        {/* Document Container */}
        <div className="my-8 mx-auto w-[90%] max-w-[800px] bg-white dark:bg-[#161B22] text-black dark:text-slate-300 p-10 md:p-14 shadow-xl dark:shadow-[0_0_15px_rgba(0,0,0,0.5)] min-h-[1000px] font-serif text-[12px] leading-relaxed dark:border dark:border-[#30363D]">
          {filingLoading ? (
            <div className="text-slate-500">Loading filing...</div>
          ) : filingError ? (
            <div className="text-slate-500">{filingError}</div>
          ) : filing ? (
            <>
              <div className="text-center font-bold mb-6">
                UNITED STATES
                <br />
                SECURITIES AND EXCHANGE COMMISSION
                <br />
                Washington, D.C. 20549
              </div>

              <div className="text-center font-bold text-xl my-6">
                FORM {metadata?.form_type || selectedType}
              </div>

              <div className="text-center font-bold text-xl uppercase mb-8">
                {metadata?.company_name || data.info.name}
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-y border-black py-6 text-sm dark:border-[#30363D]">
                <MetadataRow label="Report period" value={metadata?.report_period} />
                <MetadataRow label="Accession number" value={metadata?.accession_number} />
                <MetadataRow label="CIK" value={metadata?.cik} />
                <MetadataRow label="State" value={metadata?.state_of_incorporation} />
                <MetadataRow label="Employer ID" value={metadata?.employer_identification_number} />
                <MetadataRow label="Ticker" value={filing.ticker} />
              </div>

              <div className="mt-12 space-y-8 text-justify">
                {filing.sections.length > 0 ? (
                  filing.sections.map((section) => (
                    <section key={`${section.name}-${section.title}`}>
                      <h2 className="mb-3 font-bold uppercase tracking-wide">
                        {section.title || section.name}
                      </h2>
                      <p className="whitespace-pre-wrap">{section.content}</p>
                    </section>
                  ))
                ) : (
                  <p className="whitespace-pre-wrap">{filing.document}</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-slate-500">No filing available.</div>
          )}

          <div className="mt-12 space-y-4 text-justify">
            <div>
              <p className="font-bold mb-2">Financial Summary</p>
              {status && !status.ok ? (
                <p className="text-slate-500">Financial data could not be loaded.</p>
              ) : !hasFinancials ? (
                <p className="text-slate-500">No financial data available.</p>
              ) : (
              <table className="w-full mt-6 border-collapse text-xs">
                <tbody>
                  <tr>
                    <td className="py-2">Net Sales</td>
                    <td className="text-right py-2">
                      {formatMoneyAmount(latestFinancials.netSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Cost of Sales</td>
                    <td className="text-right py-2 border-b border-black dark:border-[#30363D]">
                      {formatMoneyAmount(latestFinancials.costOfSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold">Gross Margin</td>
                    <td className="text-right py-2 font-bold">
                      {formatMoneyAmount(latestFinancials.grossProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
