"use client";

import React from "react";

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
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
}) => {
  return (
    <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto py-1.5 scroll-smooth">
      {CATEGORIES.map((cat) => {
        const isSelected =
          selectedCategory === cat.id ||
          (selectedCategory === "Todas" && cat.id === "all");

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
            className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all active:scale-[0.97] ${
              isSelected
                ? "bg-[#1D1D1F] text-white shadow-sm dark:bg-[#F5F5F7] dark:text-[#1D1D1F]"
                : "border border-[#E5E5EA] bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold ${
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
