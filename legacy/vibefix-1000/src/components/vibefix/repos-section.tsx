"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "./section";
import { fetchJson, type ReposResponse } from "./types";

export function ReposSection() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    | { status: "ok"; data: ReposResponse }
    | { status: "error"; message: string }
    | null
  >(null);

  // Loading derivado del estado de la petición (evita setState síncrono en efecto).
  const loading = result === null;
  const error = result?.status === "error" ? result.message : null;
  const data = result?.status === "ok" ? result.data : null;

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<ReposResponse>("/api/repos", { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setResult({ status: "ok", data: res });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({
          status: "error",
          message: "No se pudieron cargar las repos. Revisa tu conexión.",
        });
      });
    return () => controller.abort();
  }, [attempt]);

  function reload() {
    setResult(null);
    setAttempt((a) => a + 1);
  }

  return (
    <Section
      id="repos"
      eyebrow="# repos"
      title="Repos adelantadas que estudiar"
      description="Doce repositorios que anticipan hacia dónde va el vibe coding: agentes autónomos, benchmarks, memoria y contexto. El análisis semanal los estudia para proponer soluciones."
    >
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <AlertTriangle className="size-6 text-amber-400" aria-hidden="true" />
          <p className="text-sm text-zinc-300">{error}</p>
          <Button
            variant="outline"
            onClick={reload}
            className="h-11 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
          >
            <RefreshCw className="size-4" aria-hidden="true" /> Reintentar
          </Button>
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl bg-zinc-800/70" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((repo) => (
            <Card
              key={repo.name}
              className="gap-3 border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-emerald-500/40 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 break-words font-mono text-sm font-semibold text-emerald-400">
                  {repo.name}
                </span>
                <Badge
                  variant="outline"
                  className="shrink-0 border-zinc-700 bg-zinc-950 text-zinc-400"
                >
                  {repo.category}
                </Badge>
              </div>

              <p className="text-sm leading-relaxed text-zinc-400">
                {repo.description}
              </p>

              <p className="text-sm leading-relaxed text-zinc-300">
                <span className="text-zinc-500">Por qué estudiarla: </span>
                {repo.why}
              </p>

              <Button
                asChild
                variant="outline"
                className="mt-auto h-11 border-zinc-700 bg-transparent text-zinc-200 hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-300"
              >
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir la repos ${repo.name} en una pestaña nueva`}
                >
                  Ver repo
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}
