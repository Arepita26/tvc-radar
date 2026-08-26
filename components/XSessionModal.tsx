"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface XSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: () => void;
}

export const XSessionModal: React.FC<XSessionModalProps> = ({
  isOpen,
  onClose,
  onSessionUpdated,
}) => {
  const [authToken, setAuthToken] = useState("");
  const [ct0, setCt0] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthToken(localStorage.getItem("tvc_x_auth_token") || "");
      setCt0(localStorage.getItem("tvc_x_ct0") || "");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    const cleanAuth = authToken.trim();
    const cleanCt0 = ct0.trim();

    localStorage.setItem("tvc_x_auth_token", cleanAuth);
    localStorage.setItem("tvc_x_ct0", cleanCt0);

    try {
      const res = await fetch("/api/scan?hours=24", {
        headers: {
          "x-auth-token": cleanAuth,
          "x-ct0": cleanCt0,
        },
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Sesión conectada con éxito. Total fuentes verificadas: ${data.data?.totalScannedSources || 0}.`,
        });
        onSessionUpdated();
      } else {
        setTestResult({
          success: false,
          message: data.error || "No se pudo autenticar con los datos ingresados.",
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Error de red al comprobar la sesión.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem("tvc_x_auth_token");
    localStorage.removeItem("tvc_x_ct0");
    setAuthToken("");
    setCt0("");
    setTestResult(null);
    onSessionUpdated();
  };

  const isConnected = Boolean(authToken && ct0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Conexión de Sesión X (Twitter)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Habilita el escaneo directo de tweets sin bloqueos de IP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status banner */}
          <div
            className={`flex items-center gap-3 rounded-xl border p-3 text-xs ${
              isConnected
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300"
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
            )}
            <div>
              <p className="font-semibold">
                {isConnected ? "Sesión de X configurada" : "Sesión de X pendiente"}
              </p>
              <p className="mt-0.5 text-[11px] opacity-90">
                {isConnected
                  ? "Las credenciales están listas para consultar los tweets en tiempo real."
                  : "Ingresa tus cookies de sesión de X para activar el escaneo de todas las cuentas."}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Cookie: auth_token
              </label>
              <input
                type="password"
                placeholder="Ejemplo: 4a2b9f87c..."
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Cookie: ct0 (CSRF Token)
              </label>
              <input
                type="password"
                placeholder="Ejemplo: 89f4bc1e2..."
                value={ct0}
                onChange={(e) => setCt0(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-900"
              />
            </div>
          </div>

          {/* 3-Step Guide */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
              <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
              <span>¿Cómo obtener auth_token y ct0 en 15 segundos?</span>
            </div>
            <ol className="mt-2 space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
              <li>
                <strong>1.</strong> Abre <span className="font-mono">x.com</span> en tu navegador con tu sesión iniciada.
              </li>
              <li>
                <strong>2.</strong> Presiona <kbd className="rounded border bg-white px-1 dark:border-zinc-700 dark:bg-zinc-800">F12</kbd> (o clic derecho &gt; <em>Inspeccionar</em>).
              </li>
              <li>
                <strong>3.</strong> Ve a la pestaña <strong>Aplicación</strong> (o <em>Almacenamiento</em>) &gt; <strong>Cookies</strong> &gt; <span className="font-mono">https://x.com</span>.
              </li>
              <li>
                <strong>4.</strong> Copia el valor de <span className="font-mono text-blue-600 dark:text-blue-400">auth_token</span> y de <span className="font-mono text-blue-600 dark:text-blue-400">ct0</span> y pégalos arriba.
              </li>
            </ol>
          </div>

          {/* Test feedback */}
          {testResult && (
            <div
              className={`rounded-xl border p-3 text-xs ${
                testResult.success
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-800 dark:text-rose-300"
              }`}
            >
              <p className="font-medium">{testResult.message}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          {isConnected ? (
            <button
              onClick={handleClearSession}
              type="button"
              className="text-xs text-rose-600 hover:underline dark:text-rose-400"
            >
              Eliminar sesión
            </button>
          ) : (
            <span className="text-xs text-zinc-400">
              Datos guardados localmente
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Cerrar
            </button>

            <button
              onClick={handleSaveAndTest}
              type="button"
              disabled={isTesting || !authToken || !ct0}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`}
              />
              <span>{isTesting ? "Verificando..." : "Guardar y Conectar"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
