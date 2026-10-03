"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, type StatsDTO } from "./types";

// Caché a nivel de módulo: Header, Hero, StatsSection y el explorador comparten
// la misma petición a /api/stats sin duplicar fetches.
let cache: StatsDTO | null = null;
let inflight: Promise<StatsDTO> | null = null;

/** Validación defensiva: nunca cachear payloads con forma inesperada. */
function isStats(v: unknown): v is StatsDTO {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Partial<StatsDTO>;
  return (
    typeof s.total === "number" &&
    typeof s.avgFrequency === "number" &&
    Array.isArray(s.byDomain) &&
    Array.isArray(s.byTool) &&
    Array.isArray(s.bySeverity) &&
    Array.isArray(s.byEnvironment)
  );
}

async function loadStats(): Promise<StatsDTO> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetchJson<StatsDTO>("/api/stats")
      .then((data) => {
        if (!isStats(data)) throw new Error("Payload de /api/stats inválido");
        cache = data;
        return data;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }
  return inflight;
}

type StatsState = { key: number; status: "ok" | "error" } | null;

export function useStats(): {
  stats: StatsDTO | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
} {
  const [stats, setStats] = useState<StatsDTO | null>(cache);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<StatsState>(
    cache ? { key: 0, status: "ok" } : null
  );

  // Loading derivado: pendiente mientras el estado no corresponda al intento actual.
  const loading = state?.key !== attempt;
  const error = state?.key === attempt && state.status === "error";

  useEffect(() => {
    if (cache) return;
    const controller = new AbortController();
    loadStats()
      .then((data) => {
        if (controller.signal.aborted) return;
        setStats(data);
        setState({ key: attempt, status: "ok" });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ key: attempt, status: "error" });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    if (cache) return;
    setState(null);
    setAttempt((a) => a + 1);
  }, []);

  return { stats, loading, error, retry };
}
