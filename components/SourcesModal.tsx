"use client";

import React, { useState } from "react";
import { X, Rss, Search, Database } from "lucide-react";
import sourcesData from "@/config/sources.json";

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "rss" | "x">("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const rssFeeds = sourcesData.rss_feeds || [];
  const xAccounts = sourcesData.x_accounts || [];

  const allSources = [
    ...rssFeeds.map((f) => ({
      name: f.name,
      url: f.url,
      category: f.category,
      type: "Feed RSS Directo",
      isX: false,
    })),
    ...xAccounts.map((x) => ({
      name: x.name,
      url: `https://x.com/${x.handle}`,
      category: x.category,
      type: "Cuenta de X (Twitter)",
      isX: true,
    })),
  ];

  const filteredSources = allSources.filter((s) => {
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "rss"
        ? !s.isX
        : s.isX;

    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-[#E5E5EA] bg-white shadow-2xl dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Catálogo de Fuentes Monitoreadas
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50/60 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/80 dark:bg-black/30">
          {/* Tabs */}
          <div className="flex items-center rounded-2xl bg-zinc-200/70 p-1 dark:bg-zinc-800/70">
            <button
              onClick={() => setActiveTab("all")}
              className={`min-h-[36px] rounded-xl px-3.5 py-1 text-xs font-semibold transition ${
                activeTab === "all"
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Todas ({allSources.length})
            </button>
            <button
              onClick={() => setActiveTab("rss")}
              className={`min-h-[36px] rounded-xl px-3.5 py-1 text-xs font-semibold transition ${
                activeTab === "rss"
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Feeds RSS ({rssFeeds.length})
            </button>
            <button
              onClick={() => setActiveTab("x")}
              className={`min-h-[36px] rounded-xl px-3.5 py-1 text-xs font-semibold transition ${
                activeTab === "x"
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Cuentas X ({xAccounts.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar fuente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-[36px] w-full rounded-xl border border-[#E5E5EA] bg-white py-1.5 pl-8 pr-3 text-xs text-[#1D1D1F] placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none dark:border-[#2C2C2E] dark:bg-black/50 dark:text-[#F5F5F7] dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Source List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {filteredSources.map((source, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-[#E5E5EA] bg-zinc-50/60 p-3.5 dark:border-[#2C2C2E] dark:bg-black/40"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {source.name}
                    </span>
                    <span className="shrink-0 rounded-full border border-zinc-200/80 bg-zinc-200/60 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {source.category}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    {source.url}
                  </p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  {source.isX ? (
                    <span className="font-mono font-bold text-blue-500">X</span>
                  ) : (
                    <Rss className="h-3 w-3 text-amber-500" />
                  )}
                  <span>{source.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Exclusively the Close button aligned right */}
        <div className="flex items-center justify-end border-t border-zinc-100 px-6 py-4 dark:border-zinc-800/80">
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-2xl bg-[#1D1D1F] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-[#F5F5F7] dark:text-[#1D1D1F] dark:hover:bg-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
