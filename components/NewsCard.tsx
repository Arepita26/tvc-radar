"use client";

import React from "react";
import { ExternalLink, Share2, Copy, Check } from "lucide-react";
import { NewsItem, VENEZUELA_REGIONS } from "@/lib/scanner";

interface NewsCardProps {
  item: NewsItem;
  index: number;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, index }) => {
  const [copied, setCopied] = React.useState(false);
  const indexFormatted = String(index + 1).padStart(2, "0");

  const getCategoryBadgeClass = (category: string) => {
    switch (category?.toLowerCase()) {
      case "ddhh":
      case "derechos humanos":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "servicios":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "estado":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "politica":
      case "política":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "medios":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "internacional":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20";
    }
  };

  const regionDef = VENEZUELA_REGIONS.find((r) => r.id === item.region);
  const regionText = regionDef ? regionDef.label : item.region;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `${item.title}\nFuente: ${item.source}`,
          url: item.url,
        });
      } catch {
        // Cancelado por el usuario
      }
    } else {
      await navigator.clipboard.writeText(
        `${item.title}\nFuente: ${item.source}\n${item.url}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDDHH =
    item.category?.toLowerCase() === "ddhh" ||
    item.category?.toLowerCase() === "derechos humanos";

  return (
    <article className="group bg-white dark:bg-[#1C1C1E] border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Insignia de Última Hora si aplica */}
        {item.isBreaking && (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-rose-600 dark:border-rose-500/40 dark:text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>ÚLTIMA HORA</span>
            </span>
          </div>
        )}

        {/* FILA 1: Índices, Badges y Tiempo Relativo */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="font-mono text-xs font-semibold text-zinc-400 dark:text-zinc-500 shrink-0">
              #{indexFormatted}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${getCategoryBadgeClass(
                item.category
              )} shrink-0`}
            >
              {isDDHH ? (
                <>
                  <span className="sm:hidden">DDHH</span>
                  <span className="hidden sm:inline">Derechos Humanos</span>
                </>
              ) : (
                item.category
              )}
            </span>
            {regionText && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                {regionText}
              </span>
            )}
          </div>

          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap shrink-0 font-mono pt-0.5">
            {item.relativeTime}
          </span>
        </div>

        {/* FILA 2: Nombre de la Fuente / Medio */}
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 truncate">
          {item.source}
        </div>

        {/* FILA 3: Titular Completo (Sin cortes de palabras por la mitad) */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link block"
        >
          <h3 className="text-[15px] sm:text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100 break-words hyphens-none tracking-normal transition-colors group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400">
            {item.title}
          </h3>
        </a>

        {/* Snippet si existe */}
        {item.snippet && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {item.snippet}
          </p>
        )}
      </div>

      {/* FILA 4: Acciones Táctiles (Altura mínima accesible de 44px) */}
      <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline min-h-[40px]"
        >
          <span>Abrir fuente original</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={handleShare}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Compartir noticia"
          aria-label="Compartir noticia"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </article>
  );
};
