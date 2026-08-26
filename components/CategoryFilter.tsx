"use client";

import React from "react";
import { Flame } from "lucide-react";

export interface CategoryDef {
  id: string;
  label: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "all", label: "Todas" },
  { id: "DDHH", label: "Derechos Humanos" },
  { id: "Medios", label: "Medios" },
  { id: "Servicios", label: "Servicios" },
  { id: "Estado", label: "Estado" },
  { id: "Politica", label: "Política" },
  { id: "Internacional", label: "Internacional" },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
  breakingCount?: number;
  breakingOnly?: boolean;
  onToggleBreakingOnly?: () => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
  breakingCount = 0,
  breakingOnly = false,
  onToggleBreakingOnly,
}) => {
  return (
    <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto py-1 scroll-smooth">
      {/* Breaking News Dedicated Quick Pill */}
      {breakingCount > 0 && onToggleBreakingOnly && (
        <button
          type="button"
          onClick={onToggleBreakingOnly}
          className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] ${
            breakingOnly
              ? "border border-rose-500/50 bg-rose-600 text-white shadow-sm"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-400"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${breakingOnly ? "bg-white" : "bg-rose-500"} animate-ping`} />
          <span>Última Hora</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
              breakingOnly ? "bg-white/20 text-white" : "bg-rose-500/20 text-rose-600 dark:text-rose-300"
            }`}
          >
            {breakingCount}
          </span>
        </button>
      )}

      {CATEGORIES.map((cat) => {
        const isSelected =
          !breakingOnly &&
          (selectedCategory === cat.id ||
            (selectedCategory === "Todas" && cat.id === "all"));

        let count = 0;
        if (cat.id === "all" || cat.id === "Todas") {
          count = totalCount;
        } else {
          count =
            categoryCounts[cat.id] ||
            categoryCounts[cat.id.toLowerCase()] ||
            categoryCounts[cat.label] ||
            0;
        }

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
              isSelected
                ? "bg-[#1D1D1F] text-white shadow-sm dark:bg-[#F5F5F7] dark:text-[#1D1D1F]"
                : "border border-[#E5E5EA] bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-semibold ${
                isSelected
                  ? "bg-white/20 text-white dark:bg-black/10 dark:text-[#1D1D1F]"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
