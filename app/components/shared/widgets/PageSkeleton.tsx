import React from 'react';
import { cn } from '~/lib/utils';

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('h-3 bg-slate-200 animate-pulse rounded-md', className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn('bg-slate-100 border border-slate-200/60 animate-pulse rounded-xl', className)} />
  );
}

export function PageSkeleton(): React.ReactElement {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full font-sans select-none animate-fadeIn">
      {/* 1. Header Section Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-8 h-8 rounded-xl bg-slate-200" />
            <SkeletonLine className="w-56 h-6 bg-slate-200" />
            <SkeletonBlock className="w-24 h-5 rounded-full bg-slate-100" />
          </div>
          <SkeletonLine className="w-80 h-3 bg-slate-100" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="w-32 h-9 rounded-xl bg-slate-100" />
          <SkeletonBlock className="w-28 h-9 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* 2. Stats Grid 3 Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <SkeletonLine className="w-28 h-3.5 bg-slate-200" />
              <SkeletonBlock className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <SkeletonLine className="w-36 h-7 bg-slate-300" />
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <SkeletonLine className="w-24 h-3 bg-slate-100" />
              <SkeletonLine className="w-16 h-3 bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. DataTable / Main Card Skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        {/* Toolbar & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="w-24 h-8 rounded-xl bg-slate-200" />
            <SkeletonBlock className="w-24 h-8 rounded-xl bg-slate-100" />
            <SkeletonBlock className="w-24 h-8 rounded-xl bg-slate-100 hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="w-48 h-8 rounded-xl bg-slate-100" />
            <SkeletonBlock className="w-20 h-8 rounded-xl bg-slate-200" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-2 pt-1">
          {/* Header Row */}
          <div className="h-10 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center px-4 gap-4">
            <SkeletonLine className="w-8 h-3 bg-slate-200" />
            <SkeletonLine className="w-40 h-3 bg-slate-200" />
            <SkeletonLine className="w-28 h-3 bg-slate-200 ml-auto" />
            <SkeletonLine className="w-24 h-3 bg-slate-200" />
            <SkeletonLine className="w-16 h-3 bg-slate-200" />
          </div>

          {/* 5 Content Rows */}
          {[1, 2, 3, 4, 5].map((rowIdx) => (
            <div
              key={rowIdx}
              className="h-14 border border-slate-100 rounded-xl flex items-center px-4 gap-4 hover:bg-slate-50/50"
            >
              <SkeletonLine className="w-6 h-3 bg-slate-200" />
              <div className="flex items-center gap-2.5">
                <SkeletonBlock className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                <div className="space-y-1">
                  <SkeletonLine className="w-36 h-3.5 bg-slate-200" />
                  <SkeletonLine className="w-24 h-2.5 bg-slate-100" />
                </div>
              </div>
              <SkeletonLine className="w-24 h-4 rounded-full bg-slate-100 ml-auto" />
              <SkeletonLine className="w-20 h-3 bg-slate-100" />
              <SkeletonBlock className="w-16 h-7 rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PageSkeleton;
