"use client";

import React, { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Radio,
  Clock,
  Database,
  Lock,
} from "lucide-react";

interface HeaderProps {
  onOpenSourcesModal: () => void;
  onOpenAdminModal: () => void;
  sourcesCount: number;
  isXSessionActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSourcesModal,
  onOpenAdminModal,
  sourcesCount,
  isXSessionActive,
}) => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [caracasTime, setCaracasTime] = useState<string>("");

  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    setIsDark(isCurrentlyDark);

    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("es-VE", {
        timeZone: "America/Caracas",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      setCaracasTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tvc_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tvc_theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E5EA] bg-[#F5F5F7]/85 backdrop-blur-xl transition-colors dark:border-[#2C2C2E] dark:bg-[#000000]/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1D1D1F] text-white shadow-sm dark:bg-[#F5F5F7] dark:text-[#1D1D1F]">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                TVC RADAR
              </span>
              <span className="rounded-full bg-zinc-200/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                SALA DE REDACCION
              </span>
            </div>
            <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
              La TV Calle | Monitor de Última Hora
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin PIN & X Session Status Button */}
          <button
            onClick={onOpenAdminModal}
            type="button"
            className="flex min-h-[38px] items-center gap-2 rounded-2xl border border-[#E5E5EA] bg-white px-3 py-1.5 text-xs font-medium text-[#1D1D1F] shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-[#F5F5F7] dark:hover:bg-zinc-800"
            title="Panel de Administración del Sistema (Protegido por PIN)"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isXSessionActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
              }`}
            />
            <Lock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Administración</span>
            <span className="sm:hidden">Admin</span>
          </button>

          {/* Caracas Time */}
          {caracasTime && (
            <div className="hidden items-center gap-1.5 rounded-2xl border border-[#E5E5EA] bg-white px-3 py-1.5 text-xs text-zinc-600 lg:flex dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="font-mono text-[11px]">CCS {caracasTime}</span>
            </div>
          )}

          {/* Sources Catalog Button */}
          <button
            onClick={onOpenSourcesModal}
            className="flex min-h-[38px] items-center gap-1.5 rounded-2xl border border-[#E5E5EA] bg-white px-3 py-1.5 text-xs font-medium text-[#1D1D1F] shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-[#F5F5F7] dark:hover:bg-zinc-800"
            title="Ver catálogo de fuentes monitoreadas"
          >
            <Database className="h-3.5 w-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Fuentes</span>
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {sourcesCount}
            </span>
          </button>

          {/* Dark / Light Mode Switch */}
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema de color"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#E5E5EA] bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
