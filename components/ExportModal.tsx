"use client";

import React, { useState, useMemo } from "react";
import { X, Copy, Check, ExternalLink, FileText, Send, Radio } from "lucide-react";
import { NewsItem } from "@/lib/scanner";
import {
  formatInstitutionalReport,
  formatFlashHeadlines,
  formatBroadcastScript,
  generateWhatsAppLink,
} from "@/lib/whatsapp";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: NewsItem[];
  hours: number;
  activeCategory: string;
}

type TemplateType = "full" | "flash" | "broadcast";

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  items,
  hours,
  activeCategory,
}) => {
  const [template, setTemplate] = useState<TemplateType>("full");
  const [copied, setCopied] = useState(false);

  const reportText = useMemo(() => {
    if (template === "flash") {
      return formatFlashHeadlines(items, hours);
    }
    if (template === "broadcast") {
      return formatBroadcastScript(items, hours);
    }
    return formatInstitutionalReport(items, hours, activeCategory);
  }, [template, items, hours, activeCategory]);

  const whatsappUrl = useMemo(() => {
    return generateWhatsAppLink(reportText);
  }, [reportText]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-[#E5E5EA] bg-white shadow-2xl transition-colors dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Generador de Reportes Institucionales
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Formatos de texto plano optimizados para WhatsApp, resúmenes y locución
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Template Selector Bar */}
        <div className="border-b border-zinc-100 bg-zinc-50/60 px-6 py-3 dark:border-zinc-800/80 dark:bg-black/30">
          <div className="flex items-center rounded-2xl bg-zinc-200/70 p-1 dark:bg-zinc-800/70">
            <button
              onClick={() => setTemplate("full")}
              className={`min-h-[36px] flex-1 rounded-xl px-3 text-xs font-semibold transition ${
                template === "full"
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Reporte Completo
            </button>
            <button
              onClick={() => setTemplate("flash")}
              className={`min-h-[36px] flex-1 rounded-xl px-3 text-xs font-semibold transition ${
                template === "flash"
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Titulares Flash (Top 5)
            </button>
            <button
              onClick={() => setTemplate("broadcast")}
              className={`min-h-[36px] flex-1 rounded-xl px-3 text-xs font-semibold transition ${
                template === "broadcast"
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Escaleta Radial
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-2xl border border-[#E5E5EA] bg-zinc-50 p-4 dark:border-[#2C2C2E] dark:bg-black/50">
            <pre className="font-mono text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap dark:text-zinc-200">
              {reportText}
            </pre>
          </div>
        </div>

        {/* Footer Actions (Min touch target 44px) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800/80 dark:bg-black/20">
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {items.length} registro(s) disponibles
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex min-h-[44px] items-center gap-1.5 rounded-2xl border border-[#E5E5EA] bg-white px-5 py-2.5 text-xs font-medium text-[#1D1D1F] shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-[#F5F5F7] dark:hover:bg-zinc-800"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Copiado al Portapapeles
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-zinc-500" />
                  <span>Copiar Formato</span>
                </>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-500 active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <Send className="h-4 w-4" />
              <span>Enviar a WhatsApp</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
