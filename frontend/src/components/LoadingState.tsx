import React from "react";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 text-center text-sm text-slate-500">
      <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin dark:border-slate-700 dark:border-t-blue-400" />
      <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="loading-progress h-full w-1/2 rounded-full bg-blue-500 dark:bg-blue-400" />
      </div>
      <div className="mt-3">{label}</div>
    </div>
  );
}
