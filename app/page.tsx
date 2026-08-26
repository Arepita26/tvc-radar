"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  RefreshCw,
  Search,
  Share2,
  Copy,
  Check,
  Radio,
  FileText,
  AlertCircle,
  Flame,
} from "lucide-react";
import { Header } from "@/components/Header";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { CategoryFilter } from "@/components/CategoryFilter";
import { RegionFilter } from "@/components/RegionFilter";
import { NewsCard } from "@/components/NewsCard";
import { ExportModal } from "@/components/ExportModal";
import { SourcesModal } from "@/components/SourcesModal";
import { AdminModal } from "@/components/AdminModal";
import { NewsItem, ScanResult } from "@/lib/scanner";
import { formatInstitutionalReport, generateWhatsAppLink } from "@/lib/whatsapp";
import sourcesData from "@/config/sources.json";

export default function HomePage() {
  const [hours, setHours] = useState<number>(24);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [breakingOnly, setBreakingOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [isXSessionActive, setIsXSessionActive] = useState<boolean>(true);
  const [stats, setStats] = useState<{ total: number; success: number }>({
    total:
      (sourcesData.rss_feeds?.length || 0) +
      (sourcesData.x_accounts?.length || 0),
    success: 0,
  });

  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const totalSourcesCount =
    (sourcesData.rss_feeds?.length || 0) +
    (sourcesData.x_accounts?.length || 0);

  const checkSessionStatus = useCallback(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("tvc_x_auth_token");
      const ct0 = localStorage.getItem("tvc_x_ct0");
      if (auth && ct0 && auth.trim() !== "" && ct0.trim() !== "") {
        setIsXSessionActive(true);
      }
    }
  }, []);

  const fetchScan = useCallback(
    async (timeframeHours: number) => {
      setIsLoading(true);
      setError(null);

      const headers: Record<string, string> = {};
      if (typeof window !== "undefined") {
        const auth = localStorage.getItem("tvc_x_auth_token");
        const ct0 = localStorage.getItem("tvc_x_ct0");
        if (auth && auth.trim() !== "" && auth !== "null" && auth !== "undefined") {
          headers["x-auth-token"] = auth.trim();
        }
        if (ct0 && ct0.trim() !== "" && ct0 !== "null" && ct0 !== "undefined") {
          headers["x-ct0"] = ct0.trim();
        }
      }

      try {
        const response = await fetch(`/api/scan?hours=${timeframeHours}`, {
          headers,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Respuesta no satisfactoria del servidor");
        }

        const data = await response.json();
        if (data.success && data.data) {
          const scanData: ScanResult = data.data;
          setItems(scanData.items);
          setStats({
            total: scanData.totalScannedSources,
            success: scanData.successfulSources,
          });
          if (scanData.xSessionActive !== undefined) {
            setIsXSessionActive(scanData.xSessionActive);
          }
          setLastScanTime(new Date());
        } else {
          throw new Error(data.error || "Fallo en la extracción");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "No fue posible conectar con el motor de escaneo";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    checkSessionStatus();
    fetchScan(hours);
  }, [fetchScan, checkSessionStatus, hours]);

  const handleTimeframeChange = (newHours: number) => {
    setHours(newHours);
    fetchScan(newHours);
  };

  // Pure single-state derivation of displayed items with breaking news prioritized at the top
  const displayedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      // 0. Breaking news only toggle
      if (breakingOnly && !item.isBreaking) {
        return false;
      }

      // 1. Filter by category
      let matchesCategory = false;
      if (selectedCategory === "all" || selectedCategory === "Todas") {
        matchesCategory = true;
      } else if (selectedCategory === "DDHH") {
        matchesCategory = item.category === "DDHH";
      } else {
        matchesCategory =
          item.category?.toLowerCase() === selectedCategory.toLowerCase();
      }

      // 2. Filter by geographic region
      let matchesRegion = false;
      if (selectedRegion === "all") {
        matchesRegion = true;
      } else {
        matchesRegion = item.region === selectedRegion;
      }

      // 3. Filter by search query
      const normalizedQuery = searchQuery.toLowerCase().trim();
      const matchesSearch =
        normalizedQuery === "" ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.source.toLowerCase().includes(normalizedQuery) ||
        (item.snippet && item.snippet.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesRegion && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (a.isBreaking && !b.isBreaking) return -1;
      if (!a.isBreaking && b.isBreaking) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [items, breakingOnly, selectedCategory, selectedRegion, searchQuery]);

  const breakingCount = useMemo(() => {
    return items.filter((i) => i.isBreaking).length;
  }, [items]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const cat = item.category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return counts;
  }, [items]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (item.region) {
        counts[item.region] = (counts[item.region] || 0) + 1;
      }
    }
    return counts;
  }, [items]);

  const showToast = (message: string) => {
    setCopiedToast(message);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  const handleCopyFullReport = async () => {
    try {
      const text = formatInstitutionalReport(displayedItems, hours, selectedCategory);
      await navigator.clipboard.writeText(text);
      showToast("Reporte copiado al portapapeles");
    } catch {
      showToast("Error al copiar reporte");
    }
  };

  const handleShareWhatsApp = () => {
    const text = formatInstitutionalReport(displayedItems, hours, selectedCategory);
    const url = generateWhatsAppLink(text);
    window.open(url, "_blank");
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F5F5F7] text-[#1D1D1F] transition-colors dark:bg-[#000000] dark:text-[#F5F5F7]">
      {/* Institutional Header */}
      <Header
        onOpenSourcesModal={() => setIsSourcesOpen(true)}
        onOpenAdminModal={() => setIsAdminOpen(true)}
        sourcesCount={totalSourcesCount}
        isXSessionActive={isXSessionActive}
      />

      {/* Main Container */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Top Control Card - Super Optimized for Mobile */}
        <section className="mb-4 rounded-3xl border border-[#E5E5EA] bg-white p-4 shadow-sm transition-colors sm:mb-6 sm:p-6 dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#1D1D1F] sm:text-2xl dark:text-[#F5F5F7]">
                Monitor de Última Hora
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm dark:text-zinc-400">
                Monitoreo continuo de medios, vocerías del Estado, servicios y
                Derechos Humanos en Venezuela.
              </p>
            </div>

            {/* Timeframe & Main Scan Button */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
              <TimeframeSelector
                selectedHours={hours}
                onSelectTimeframe={handleTimeframeChange}
                disabled={isLoading}
              />

              {/* Main Scan Button */}
              <button
                type="button"
                onClick={() => fetchScan(hours)}
                disabled={isLoading}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>{isLoading ? "Escaneando..." : "Escanear Última Hora"}</span>
              </button>
            </div>
          </div>

          {/* Secondary Controls: Search & 3-Column Mobile Action Grid */}
          <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/80">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrar por titular, cuenta, región o medio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[44px] w-full rounded-2xl border border-[#E5E5EA] bg-zinc-50 py-2.5 pl-10 pr-16 text-xs text-[#1D1D1F] placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-[#2C2C2E] dark:bg-black/50 dark:text-[#F5F5F7] dark:placeholder:text-zinc-500 dark:focus:bg-[#1C1C1E]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Action Buttons: 3 Columns on Mobile, Flex on Desktop */}
            <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center">
              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl border border-[#E5E5EA] bg-white px-3 py-2 text-xs font-medium text-[#1D1D1F] shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-[#F5F5F7] dark:hover:bg-zinc-800"
                title="Generar y configurar reportes institucionales"
              >
                <FileText className="h-4 w-4 text-zinc-500" />
                <span className="truncate">Reporte</span>
              </button>

              <button
                type="button"
                onClick={handleCopyFullReport}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl border border-[#E5E5EA] bg-white px-3 py-2 text-xs font-medium text-[#1D1D1F] shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-[#F5F5F7] dark:hover:bg-zinc-800"
                title="Copiar reporte institucional al portapapeles"
              >
                <Copy className="h-4 w-4 text-zinc-500" />
                <span className="truncate">Copiar</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-500 active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500"
                title="Compartir reporte institucional por WhatsApp"
              >
                <Share2 className="h-4 w-4" />
                <span className="truncate">WhatsApp</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 1: Category Filters Bar */}
        <section className="mb-2 w-full">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setBreakingOnly(false);
            }}
            categoryCounts={categoryCounts}
            totalCount={items.length}
            breakingCount={breakingCount}
            breakingOnly={breakingOnly}
            onToggleBreakingOnly={() => setBreakingOnly(!breakingOnly)}
          />
        </section>

        {/* Section 2: Region Filters Bar */}
        <section className="mb-3 w-full">
          <RegionFilter
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            regionCounts={regionCounts}
          />
        </section>

        {/* Section 3: Clean Results & Time Subheader (No overlap) */}
        <div className="mb-4 flex items-center justify-between border-b border-zinc-200/60 pb-2 text-xs text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {displayedItems.length} resultado(s)
            </span>
            {breakingOnly && (
              <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                Filtro Última Hora
              </span>
            )}
          </div>

          {lastScanTime && (
            <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
              Actualizado:{" "}
              {lastScanTime.toLocaleTimeString("es-VE", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-700 dark:border-rose-500/30 dark:text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Aviso de escaneo</p>
              <p className="mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => fetchScan(hours)}
              className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-sm dark:border-[#2C2C2E] dark:bg-[#1C1C1E]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3">
                    <div className="h-4 w-24 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-14 rounded-md skeleton-shimmer" />
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-full rounded-md skeleton-shimmer" />
                    <div className="h-4 w-5/6 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-4/6 rounded-md skeleton-shimmer" />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
                  <div className="h-3 w-20 rounded-md skeleton-shimmer" />
                  <div className="h-6 w-14 rounded-md skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* News Items Grid with dynamic key for instant repainting */}
        {!isLoading && displayedItems.length > 0 && (
          <div
            key={`${hours}-${selectedCategory}-${selectedRegion}-${breakingOnly}-${displayedItems.length}`}
            className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          >
            {displayedItems.map((item, index) => (
              <NewsCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayedItems.length === 0 && (
          <div className="my-auto flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800/80 dark:text-zinc-500">
              <Radio className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Sin registros relevantes en la ventana de {hours}h
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
              {searchQuery || selectedCategory !== "all" || selectedRegion !== "all" || breakingOnly
                ? "No se hallaron noticias verificadas con los filtros actuales. Prueba cambiando de categoría, región, desactivando filtros o limpiando la búsqueda."
                : `No se han detectado nuevas publicaciones en las fuentes monitoreadas durante las últimas ${hours} horas.`}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {hours < 24 && (
                <button
                  onClick={() => handleTimeframeChange(hours < 6 ? 6 : 24)}
                  className="min-h-[44px] rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                >
                  Ampliar a {hours < 6 ? "6h" : "24h"}
                </button>
              )}
              {(searchQuery || selectedCategory !== "all" || selectedRegion !== "all" || breakingOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedRegion("all");
                    setBreakingOnly(false);
                  }}
                  className="min-h-[44px] rounded-2xl border border-[#E5E5EA] bg-white px-5 py-2.5 text-xs font-medium text-[#1D1D1F] transition hover:bg-zinc-50 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="mt-auto border-t border-[#E5E5EA] bg-white py-4 text-xs text-zinc-500 transition-colors dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-zinc-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              TVC Radar
            </span>
            <span>-</span>
            <span>Sistema de Monitoreo para La TV Calle</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Fuentes: {stats.total}</span>
            <span>Respuestas activas: {stats.success}</span>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3 text-xs font-medium text-[#1D1D1F] shadow-xl dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-[#F5F5F7]">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        items={displayedItems}
        hours={hours}
        activeCategory={selectedCategory}
      />

      <SourcesModal
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onSessionUpdated={() => {
          checkSessionStatus();
          fetchScan(hours);
        }}
        isXSessionActive={isXSessionActive}
      />
    </div>
  );
}
