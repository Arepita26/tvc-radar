"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogOut,
  ExternalLink,
} from "lucide-react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: () => void;
  isXSessionActive: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSessionUpdated,
  isXSessionActive,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Unlocked state values
  const [authToken, setAuthToken] = useState<string>("");
  const [ct0, setCt0] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined") {
        setAuthToken(localStorage.getItem("tvc_x_auth_token") || "");
        setCt0(localStorage.getItem("tvc_x_ct0") || "");
      }
      setPin("");
      setPinError(null);
      setSavedSuccess(false);
    } else {
      // Reset lock on close for security
      setIsAuthenticated(false);
      setPin("");
      setPinError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setPinError("Ingresa el PIN de administración");
      return;
    }

    setIsVerifying(true);
    setPinError(null);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
      } else {
        setPinError(data.error || "PIN incorrecto");
      }
    } catch {
      setPinError("Error de conexión al validar el PIN");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      if (authToken.trim()) {
        localStorage.setItem("tvc_x_auth_token", authToken.trim());
      } else {
        localStorage.removeItem("tvc_x_auth_token");
      }

      if (ct0.trim()) {
        localStorage.setItem("tvc_x_ct0", ct0.trim());
      } else {
        localStorage.removeItem("tvc_x_ct0");
      }

      setSavedSuccess(true);
      onSessionUpdated();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    }
  };

  const handleClearSession = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tvc_x_auth_token");
      localStorage.removeItem("tvc_x_ct0");
      setAuthToken("");
      setCt0("");
      onSessionUpdated();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-[#E5E5EA] bg-white shadow-2xl transition-colors dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Unlock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Lock className="h-5 w-5 text-[#1D1D1F] dark:text-[#F5F5F7]" />
            )}
            <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {isAuthenticated
                ? "Configuración Administrativa"
                : "Acceso Administrativo"}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* VIEW 1: LOCKED (PIN ENTRY) */}
          {!isAuthenticated && (
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Protección de Seguridad
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Introduce el PIN administrativo para acceder a las credenciales y ajustes del sistema.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  PIN de Seguridad
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(null);
                  }}
                  autoFocus
                  placeholder="••••"
                  className="mt-1.5 min-h-[44px] w-full rounded-2xl border border-[#E5E5EA] bg-zinc-50 px-4 text-center font-mono text-base tracking-widest text-[#1D1D1F] placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-[#2C2C2E] dark:bg-black/50 dark:text-[#F5F5F7]"
                />
              </div>

              {pinError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] rounded-2xl border border-[#E5E5EA] bg-white px-5 py-2.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="min-h-[44px] rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {isVerifying ? "Verificando..." : "Desbloquear"}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: UNLOCKED (CREDENTIALS CONFIGURATION) */}
          {isAuthenticated && (
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-black/30">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isXSessionActive ? "bg-emerald-500" : "bg-zinc-400"
                    }`}
                  />
                  <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Estado de Sesión X:{" "}
                    <strong>
                      {isXSessionActive ? "Conectada" : "Inactiva / Fallback"}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthenticated(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Bloquear
                </button>
              </div>

              {/* auth_token */}
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Cookie auth_token
                </label>
                <input
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Ej: 96cdce9d2fb6cf28..."
                  className="mt-1 min-h-[44px] w-full rounded-2xl border border-[#E5E5EA] bg-zinc-50 px-4 font-mono text-xs text-[#1D1D1F] placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-[#2C2C2E] dark:bg-black/50 dark:text-[#F5F5F7]"
                />
              </div>

              {/* ct0 */}
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Cookie ct0 (Token CSRF)
                </label>
                <input
                  type="password"
                  value={ct0}
                  onChange={(e) => setCt0(e.target.value)}
                  placeholder="Ej: 76a18faed0a89cdf64cc..."
                  className="mt-1 min-h-[44px] w-full rounded-2xl border border-[#E5E5EA] bg-zinc-50 px-4 font-mono text-xs text-[#1D1D1F] placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-[#2C2C2E] dark:bg-black/50 dark:text-[#F5F5F7]"
                />
              </div>

              {/* Quick instructions */}
              <div className="rounded-2xl border border-[#E5E5EA] bg-zinc-50/70 p-3.5 text-[11px] text-zinc-500 dark:border-[#2C2C2E] dark:bg-black/40 dark:text-zinc-400">
                <p className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Instrucciones de extracción en x.com:
                </p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                  <li>Inicia sesión en x.com en tu navegador.</li>
                  <li>Presiona F12 y abre la pestaña Application (o Almacenamiento).</li>
                  <li>En Cookies &gt; https://x.com, copia auth_token y ct0.</li>
                </ol>
              </div>

              {savedSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Ajustes guardados correctamente</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleClearSession}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-400"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Cerrar sesión</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] rounded-2xl border border-[#E5E5EA] bg-white px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-zinc-300"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] rounded-2xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
                  >
                    Guardar y Conectar
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
