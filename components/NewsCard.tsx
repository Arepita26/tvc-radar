"use client";

import React, { useState } from "react";
import { ExternalLink, Copy, Check, Share2, MapPin } from "lucide-react";
import { NewsItem, VENEZUELA_REGIONS } from "@/lib/scanner";

interface NewsCardProps {
  item: NewsItem;
  index: number;
}

const CATEGORY_STYLES: Record<string, string> = {
  Medios: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  DDHH: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  Estado: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Politica: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  Servicios: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  Internacional: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

export const NewsCard: React.FC<NewsCardProps> = ({ item, index }) => {
  const [copied, setCopied] = useState(false);

  const categoryStyle =
    CATEGORY_STYLES[item.category] ||
    "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20";

  const regionDef = VENEZUELA_REGIONS.find((r) => r.id === item.region);

  const singleText = `${item.title}\nFuente: ${item.source}\nEnlace: ${item.url}`;

  const handleCopySingle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(singleText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareSingleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(singleText)}`,
      "_blank"
    );
  };

  const indexFormatted = String(index + 1).padStart(2, "0");

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:hover:border-zinc-700">
      <div>
        {/* Breaking Badge if applicable */}
        {item.isBreaking && (
          <div className="mb-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-rose-600 dark:border-rose-500/40 dark:text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>ÚLTIMA HORA</span>
            </span>
          </div>
        )}

        {/* Card Header: Metadata Row without truncation/overflow collision */}
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-2 border-b border-zinc-100 pb-2.5 dark:border-zinc-800/60">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
            <span className="font-mono font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
              #{indexFormatted}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 border ${categoryStyle}`}
            >
              {item.category === "DDHH" ? "Derechos Humanos" : item.category}
            </span>
            {regionDef && (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200/80 bg-zinc-100/80 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                <MapPin className="h-2.5 w-2.5 text-zinc-400" />
                <span>{regionDef.label}</span>
              </span>
            )}
            <span className="font-medium truncate text-zinc-600 dark:text-zinc-300">
              {item.source}
            </span>
          </div>
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap shrink-0 font-mono">
            {item.relativeTime}
          </span>
        </div>

        {/* Headline */}
        <div className="mt-2.5">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link block"
          >
            <h3 className="text-[15px] sm:text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100 break-words hyphens-none transition-colors group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400">
              {item.title}
            </h3>
          </a>

          {/* Snippet / Excerpt if available */}
          {item.snippet && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {item.snippet}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer: Direct Link & Action Buttons (Min touch target 44px) */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>Abrir fuente</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShareSingleWhatsApp}
            aria-label="Compartir en WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-700"
            title="Enviar noticia individual a WhatsApp"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            onClick={handleCopySingle}
            aria-label="Copiar texto"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-700"
            title="Copiar texto de la noticia"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
