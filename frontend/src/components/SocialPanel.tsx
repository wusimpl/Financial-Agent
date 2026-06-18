import React from "react";
import { StockData } from "../types";
import type { SocialLanguage, SocialMinFaves, SocialSort, SourceState } from "../api/backendTypes";
import { BadgeCheck, Eye, Heart, Maximize2, MessageCircle, Minimize2, Repeat2 } from "lucide-react";
import { LoadingState } from "./LoadingState";

const minFavesOptions: SocialMinFaves[] = [1, 5, 10, 30, 50, 100, 500, 1000];

function isAvatarUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function Avatar({ avatar, name }: { avatar: string; name: string }) {
  if (isAvatarUrl(avatar)) {
    return (
      <img
        src={avatar}
        alt={name}
        loading="lazy"
        className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-200 dark:bg-slate-700"
        referrerPolicy="no-referrer"
        onError={(event) => {
          const target = event.currentTarget;
          target.style.display = "none";
        }}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-white shrink-0">
      {avatar}
    </div>
  );
}

export function SocialPanel({
  data,
  status,
  sort,
  language,
  minFaves,
  isLoading,
  error,
  onSortChange,
  onLanguageChange,
  onMinFavesChange,
  onExpand,
  isExpanded,
}: {
  data: StockData;
  status?: SourceState;
  sort?: SocialSort;
  language?: SocialLanguage;
  minFaves?: SocialMinFaves;
  isLoading?: boolean;
  error?: string | null;
  onSortChange?: (sort: SocialSort) => void;
  onLanguageChange?: (language: SocialLanguage) => void;
  onMinFavesChange?: (minFaves: SocialMinFaves) => void;
  onExpand?: () => void;
  isExpanded?: boolean;
}) {
  const toolbar = (
    <div className="px-4 py-2 bg-white dark:bg-[#161B22] border-b border-slate-200 dark:border-[#30363D] shrink-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter whitespace-nowrap">
          Social Points
        </h3>
        {onExpand && (
          <button
            onClick={onExpand}
            className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-[#30363D] hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <select
          value={language || "zh"}
          onChange={(event) => onLanguageChange?.(event.target.value as SocialLanguage)}
          aria-label="Language"
          title="Language"
          className="w-full min-w-0 text-[10px] bg-transparent border border-slate-300 dark:border-[#30363D] rounded px-1.5 py-0.5 outline-none text-slate-500 dark:text-slate-400"
        >
          <option value="zh">Chinese</option>
          <option value="en">English</option>
        </select>
        <select
          value={sort || "hot"}
          onChange={(event) => onSortChange?.(event.target.value as SocialSort)}
          aria-label="Sort"
          title="Sort"
          className="w-full min-w-0 text-[10px] bg-transparent border border-slate-300 dark:border-[#30363D] rounded px-1.5 py-0.5 outline-none text-slate-500 dark:text-slate-400"
        >
          <option value="hot">Trending</option>
          <option value="latest">Latest</option>
        </select>
        <select
          value={minFaves || 30}
          onChange={(event) => onMinFavesChange?.(Number(event.target.value) as SocialMinFaves)}
          aria-label="Minimum likes"
          title="Minimum likes"
          className="w-full min-w-0 text-[10px] bg-transparent border border-slate-300 dark:border-[#30363D] rounded px-1.5 py-0.5 outline-none text-slate-500 dark:text-slate-400"
        >
          {minFavesOptions.map((value) => (
            <option key={value} value={value}>{value}+ likes</option>
          ))}
        </select>
      </div>
    </div>
  );

  const panelState = (content: React.ReactNode) => (
    <div className="flex flex-col h-full bg-white dark:bg-[#161B22] overflow-hidden transition-colors">
      {toolbar}
      <div className="flex-1 bg-slate-50 dark:bg-[#30363D]/20">{content}</div>
    </div>
  );

  if (isLoading)
    return panelState(<LoadingState label="Loading social posts..." />);

  if (error)
    return panelState(<div className="p-6 text-slate-500 text-sm">{error}</div>);

  if (status && !status.ok)
    return panelState(<div className="p-6 text-slate-500 text-sm">Social data could not be loaded.</div>);

  if (!data?.tweets?.length)
    return panelState(<div className="p-6 text-slate-500 text-sm">No social data available.</div>);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#161B22] overflow-hidden transition-colors">
      {toolbar}

      <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-[#30363D]/20 space-y-px">
        <div className="divide-y divide-slate-100 dark:divide-[#30363D]/50">
          {data.tweets.map((tweet) => (
            <div
              key={tweet.id}
              className="p-4 bg-white dark:bg-[#161B22] mb-px hover:bg-slate-50 dark:hover:bg-[#30363D]/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                <Avatar avatar={tweet.avatar} name={tweet.author} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {tweet.author}
                      </span>
                      {tweet.verified && (
                        <BadgeCheck
                          size={13}
                          className="shrink-0 text-sky-500"
                          aria-label="Verified"
                        />
                      )}
                      <span className="text-[10px] text-slate-500 ml-1 truncate">
                        {tweet.handle}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        · {tweet.timeAgo}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words whitespace-pre-line">
                    {tweet.content}
                  </p>

                  <div className="mt-4 flex items-center gap-5 text-slate-500 text-[10px] font-mono hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer">
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} /> {tweet.replies}
                    </span>
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                      <Repeat2 size={12} /> {tweet.retweets}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {tweet.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {tweet.views}
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
