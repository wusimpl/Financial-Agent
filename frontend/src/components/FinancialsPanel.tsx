import React, { useState } from "react";
import { StockData } from "../types";
import type { SourceState } from "../api/backendTypes";
import { cn } from "../lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { formatMoneyAmount } from "../lib/format";

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
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const filingTypes = ["10-K", "10-Q", "8-K"];

  const [selectedYear, setSelectedYear] = useState<number>(years[0]);
  const [selectedType, setSelectedType] = useState<string>(filingTypes[0]);

  if (!data?.info) return null;

  if (status && !status.ok) {
    return (
      <div className="p-6 text-slate-500 text-sm">Financial data could not be loaded.</div>
    );
  }

  if (status?.empty || !data.financials.length) {
    return (
      <div className="p-6 text-slate-500 text-sm">No financial data available.</div>
    );
  }

  const latestFinancials = data.financials[0];

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
          <div className="text-center font-bold mb-6">
            UNITED STATES
            <br />
            SECURITIES AND EXCHANGE COMMISSION
            <br />
            Washington, D.C. 20549
          </div>

          <div className="text-center font-bold text-xl my-6">
            FORM {selectedType}
          </div>

          <div className="text-center mb-6">
            (Mark One)
            <br />
            <div className="mt-2">
              [X]{" "}
              {selectedType === "10-K"
                ? "ANNUAL"
                : selectedType === "10-Q"
                  ? "QUARTERLY"
                  : "CURRENT"}{" "}
              REPORT PURSUANT TO SECTION 13 OR 15(d) OF THE SECURITIES EXCHANGE
              ACT OF 1934
            </div>
            <div className="mt-2">
              For the {selectedType === "10-K" ? "fiscal year" : "period"} ended{" "}
              <span className="font-bold">September 30, {selectedYear}</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <div>OR</div>
          </div>

          <div className="text-center mb-6">
            <div className="mt-2">
              [ ] TRANSITION REPORT PURSUANT TO SECTION 13 OR 15(d) OF THE
              SECURITIES EXCHANGE ACT OF 1934
            </div>
            <div className="mt-2">
              For the transition period from ___________ to ___________
            </div>
          </div>

          <div className="text-center mb-6 pb-6 border-b-2 border-black dark:border-[#30363D]">
            Commission file number 001-39511
          </div>

          <div className="text-center font-bold text-xl uppercase mb-2">
            {data.info.name}
          </div>

          <div className="text-center mb-8">
            (Exact name of registrant as specified in its charter)
          </div>

          <table className="w-full mb-8 text-center text-sm">
            <tbody>
              <tr>
                <td className="w-1/2 border-b border-black dark:border-[#30363D] pb-2">
                  <div className="font-bold">California</div>
                  <div className="text-[10px] font-normal">
                    (State or other jurisdiction of incorporation or
                    organization)
                  </div>
                </td>
                <td className="w-1/2 border-b border-black dark:border-[#30363D] pb-2 px-2">
                  <div className="font-bold">94-240411</div>
                  <div className="text-[10px] font-normal">
                    (I.R.S. Employer Identification No.)
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-12 space-y-8 text-justify">
            <h2 className="font-bold text-center uppercase tracking-widest text-sm mb-4">
              Part I
            </h2>

            <div>
              <p className="font-bold mb-2">Item 1. Business</p>
              <p className="mb-4">
                <strong>Company Background</strong>
                <br />
                {data.info.name} ("the Company") is a leading multinational
                technology company that designs, develops, and sells consumer
                electronics, computer software, and online services. Our
                hardware products include smartphones, personal computers,
                tablets, wearables, and accessories.
              </p>
              <p className="mb-4">
                <strong>Macroeconomic Conditions</strong>
                <br />
                Macroeconomic conditions, including inflation, changes in
                interest rates, and currency fluctuations, have had and may
                continue to have an impact on our business. The Company
                continues to monitor these factors closely. Supply chain
                disruptions and global labor shortages also remain a key risk
                factor for our operations and product availability.
              </p>
              <p className="mb-4">
                <strong>Competition</strong>
                <br />
                The markets for the Company’s products and services are highly
                competitive. We compete with various companies across different
                segments. Our ability to secure market share depends on our
                capability to introduce innovative products, maintain a robust
                ecosystem, and manage pricing strategies effectively against
                aggressive competitors.
              </p>
            </div>

            <div>
              <p className="font-bold mb-2">Item 1A. Risk Factors</p>
              <p className="mb-4">
                Our business, financial condition, and operating results are
                subject to various risks. Global economic conditions could
                materially adversely affect our business. Furthermore, our
                reliance on single-source suppliers for certain components
                introduces significant supply chain risk. Regulatory scrutiny
                regarding antitrust and data privacy matters could also affect
                our future operations and financial condition.
              </p>
            </div>

            <div>
              <p className="font-bold mb-2">
                Item 7. Management's Discussion and Analysis of Financial
                Condition and Results of Operations
              </p>
              <p className="mb-4">
                The following discussion should be read in conjunction with the
                consolidated financial statements and accompanying notes
                included in this Annual Report on Form 10-K.
              </p>
              <p className="mb-4">
                Net sales increased primarily due to higher demand for our
                hardware devices and continued growth in our services segment.
                Operating expenses also rose due to increased research and
                development investments specifically targeting artificial
                intelligence (AI) and enterprise solutions.
              </p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
