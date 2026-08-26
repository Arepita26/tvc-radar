"use client";

import React from "react";
import { MapPin } from "lucide-react";
import { VENEZUELA_REGIONS } from "@/lib/scanner";

interface RegionFilterProps {
  selectedRegion: string;
  onSelectRegion: (regionId: string) => void;
  regionCounts: Record<string, number>;
}

export const RegionFilter: React.FC<RegionFilterProps> = ({
  selectedRegion,
  onSelectRegion,
  regionCounts,
}) => {
  return (
    <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto py-1 scroll-smooth">
      <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
        <MapPin className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Región:</span>
      </div>

      <button
        type="button"
        onClick={() => onSelectRegion("all")}
        className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium transition active:scale-[0.97] ${
          selectedRegion === "all"
            ? "bg-[#1D1D1F] text-white shadow-sm dark:bg-[#F5F5F7] dark:text-[#1D1D1F]"
            : "border border-[#E5E5EA] bg-white text-zinc-600 hover:bg-zinc-50 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-zinc-400 dark:hover:bg-zinc-800"
        }`}
      >
        <span>Todas las regiones</span>
      </button>

      {VENEZUELA_REGIONS.map((reg) => {
        const isSelected = selectedRegion === reg.id;
        const count = regionCounts[reg.id] || 0;

        return (
          <button
            key={reg.id}
            type="button"
            onClick={() => onSelectRegion(reg.id)}
            className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium transition active:scale-[0.97] ${
              isSelected
                ? "bg-[#1D1D1F] text-white shadow-sm dark:bg-[#F5F5F7] dark:text-[#1D1D1F]"
                : "border border-[#E5E5EA] bg-white text-zinc-600 hover:bg-zinc-50 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <span>{reg.label}</span>
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-semibold ${
                  isSelected
                    ? "bg-white/20 text-white dark:bg-black/10 dark:text-[#1D1D1F]"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
