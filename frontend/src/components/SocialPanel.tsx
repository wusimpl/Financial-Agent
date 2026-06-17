import React from "react";
import { StockData } from "../types";
import type { SourceState } from "../api/backendTypes";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "../lib/utils";

export function SocialPanel({
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
      <div className="p-6 text-slate-500 text-sm">
        Social data could not be loaded.
      </div>
    );

  if (!data?.tweets?.length)
    return (
      <div className="p-6 text-slate-500 text-sm">
        No social data available.
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#161B22] overflow-hidden transition-colors">
      <div className="h-14 px-4 bg-white dark:bg-[#161B22] border-b border-slate-200 dark:border-[#30363D] flex justify-between items-center shrink-0">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
          Social Points
        </h3>
        <div className="flex items-center gap-2">
          <select className="text-[10px] bg-transparent border border-slate-300 dark:border-[#30363D] rounded px-1.5 py-0.5 outline-none text-slate-500 dark:text-slate-400">
            <option>Trending</option>
            <option>Latest</option>
          </select>
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

      <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-[#30363D]/20 space-y-px">
        <div className="divide-y divide-slate-100 dark:divide-[#30363D]/50">
          {data.tweets.map((tweet) => (
            <div
              key={tweet.id}
              className="p-4 bg-white dark:bg-[#161B22] mb-px hover:bg-slate-50 dark:hover:bg-[#30363D]/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-white shrink-0">
                  {tweet.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {tweet.author}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1 truncate">
                        {tweet.handle}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        · {tweet.timeAgo}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                    {tweet.content}
                  </p>

                  <div className="mt-4 flex items-center gap-6 text-slate-500 text-[10px] font-mono hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer">
                    <span className="flex items-center gap-1">
                      💬 {tweet.replies}
                    </span>
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                      ▲ {tweet.retweets}
                    </span>
                    <span className="flex items-center gap-1">
                      ❤️ {tweet.likes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
