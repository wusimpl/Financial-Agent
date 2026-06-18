import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StockData, Tweet } from "../types";
import type { SocialLanguage, SocialMinFaves, SocialSort, SourceState } from "../api/backendTypes";
import { BadgeCheck, Eye, Heart, Maximize2, MessageCircle, Minimize2, Repeat2, X } from "lucide-react";
import { LoadingState } from "./LoadingState";

const minFavesOptions: SocialMinFaves[] = [1, 5, 10, 30, 50, 100, 500, 1000];
const PREVIEW_LIMIT = 200;
const FOLD_SUFFIX = "（已折叠...）";

function previewContent(content: string) {
  if (content.length <= PREVIEW_LIMIT) return content;
  return `${content.slice(0, PREVIEW_LIMIT - FOLD_SUFFIX.length).trimEnd()}${FOLD_SUFFIX}`;
}

function isAvatarUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function Avatar({ avatar, name }: { avatar: string; name: string }) {
  const [errored, setErrored] = useState(false);
  const fallback = (avatar && !isAvatarUrl(avatar)) ? avatar : (name || "?").slice(0, 1).toUpperCase();

  if (isAvatarUrl(avatar) && !errored) {
    return (
      <img
        src={avatar}
        alt={name}
        loading="lazy"
        className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-200 dark:bg-slate-700"
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-white shrink-0">
      {fallback}
    </div>
  );
}

function TweetMetrics({ tweet, size = 12 }: { tweet: Tweet; size?: number }) {
  return (
    <div className="flex items-center gap-5 text-slate-500 text-[10px] font-mono">
      <span className="flex items-center gap-1">
        <MessageCircle size={size} /> {tweet.replies}
      </span>
      <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
        <Repeat2 size={size} /> {tweet.retweets}
      </span>
      <span className="flex items-center gap-1">
        <Heart size={size} /> {tweet.likes}
      </span>
      <span className="flex items-center gap-1">
        <Eye size={size} /> {tweet.views}
      </span>
    </div>
  );
}

type TweetRowProps = {
  tweet: Tweet;
  onOpen: (tweet: Tweet) => void;
};

const TweetRow: React.FC<TweetRowProps> = ({ tweet, onOpen }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(tweet)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(tweet);
        }
      }}
      className="p-4 bg-white dark:bg-[#161B22] mb-px hover:bg-slate-50 dark:hover:bg-[#30363D]/20 transition-colors cursor-pointer"
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
            {previewContent(tweet.content)}
          </p>

          <div className="mt-4">
            <TweetMetrics tweet={tweet} />
          </div>
        </div>
      </div>
    </div>
  );
};

type TweetModalProps = {
  tweet: Tweet;
  onClose: () => void;
};

const TweetModal: React.FC<TweetModalProps> = ({ tweet, onClose }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-[#161B22] rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-[#30363D]">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar avatar={tweet.avatar} name={tweet.author} />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {tweet.author}
              </span>
              {tweet.verified && (
                <BadgeCheck size={14} className="shrink-0 text-sky-500" aria-label="Verified" />
              )}
              <span className="text-xs text-slate-500 truncate">{tweet.handle}</span>
              <span className="text-xs text-slate-500 shrink-0">· {tweet.timeAgo}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-[#30363D] hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words whitespace-pre-line">
            {tweet.content}
          </p>
        </div>
        <div className="px-4 pb-4">
          <TweetMetrics tweet={tweet} size={14} />
        </div>
      </div>
    </div>,
    document.body
  );
};

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
  const [activeTweet, setActiveTweet] = useState<Tweet | null>(null);
  const openTweet = useCallback((tweet: Tweet) => setActiveTweet(tweet), []);
  const closeTweet = useCallback(() => setActiveTweet(null), []);

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
            <TweetRow key={tweet.id} tweet={tweet} onOpen={openTweet} />
          ))}
        </div>
      </div>
      {activeTweet && <TweetModal tweet={activeTweet} onClose={closeTweet} />}
    </div>
  );
}
