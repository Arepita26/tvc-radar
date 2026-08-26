"use client";

import React from "react";

export const TIMEFRAMES = [
  { value: 1, label: "1h" },
  { value: 2, label: "2h" },
  { value: 3, label: "3h" },
  { value: 6, label: "6h" },
  { value: 12, label: "12h" },
  { value: 24, label: "24h" },
] as const;

interface TimeframeSelectorProps {
  selectedHours: number;
  onSelectTimeframe: (hours: number) => void;
  disabled?: boolean;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selectedHours,
  onSelectTimeframe,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-semibold text-zinc-500 sm:inline dark:text-zinc-400">
        Ventana:
      </span>
      <div className="no-scrollbar inline-flex items-center rounded-2xl bg-zinc-200/80 p-1 dark:bg-zinc-800/80">
        {TIMEFRAMES.map((tf) => {
          const isActive = selectedHours === tf.value;
          return (
            <button
              key={tf.value}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTimeframe(tf.value)}
              className={`relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.96] ${
                isActive
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              {tf.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
