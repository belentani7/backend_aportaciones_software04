"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Github, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchJson,
  githubCategoryLabel,
  type GithubResponse,
} from "./types";

const CATEGORY_CHIPS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "ia-agentes", label: "Agentes IA" },
  { key: "idiomas", label: "Idiomas" },
  { key: "seguridad", label: "Seguridad" },
  { key: "educacion", label: "Educación" },
  { key: "herramientas", label: "Herramientas" },
  { key: "social", label: "Social" },
  { key: "otros", label: "Otros" },
];

export function GithubSection() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    | { status: "ok"; data: GithubResponse }
    | { status: "error"; message: string }
    | null
  >(null);
  const [filter, setFilter] = useState("all");

  // Loading derivado del estado de la petición (evita setState síncrono en efecto).
  const loading = result === null;
  const error = result?.status === "error" ? result.message : null;
  const data = result?.status === "ok" ? result.data : null;

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<GithubResponse>("/api/github", { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setResult({ status: "ok", data: res });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({
          status: "error",
          message: "No se pudo cargar el análisis del perfil de GitHub.",
        });
      });
    return () => controller.abort();
  }, [attempt]);

  function reload() {
    setResult(null);
    setAttempt((a) => a + 1);
  }

  const repos = useMemo(() => {
    if (!data) return [];
    return filter === "all"
      ? data.repos
      : data.repos.filter((r) => r.category === filter);
  }, [data, filter]);

  return (
    <div
      id="github"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 md:py-20"
    >
      <div className="mb-8">
        <p className="font-mono text-sm text-emerald-400"># perfil-verificado</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Análisis real de github.com/belentani7
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Descripciones verificadas del perfil público de GitHub y mapeo de
          monetización por repo. Datos obtenidos directamente de github.com —
          no supuestos.
        </p>
      </div>

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
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-36 w-full rounded-xl bg-zinc-800/70" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl bg-zinc-800/70" />
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Tarjeta de perfil real */}
          <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-3 text-lg">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 font-mono text-sm font-bold text-emerald-300"
                >
                  PB
                </span>
                <span className="text-zinc-100">
                  {data.profile.name}
                  <a
                    href={data.profile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 font-mono text-xs font-normal text-emerald-400 hover:text-emerald-300"
                  >
                    @{data.profile.user}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </span>
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 font-mono text-emerald-300"
                >
                  {data.total} repos públicos
                </Badge>
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/10 font-mono text-amber-300"
                >
                  {data.withMonetization} monetizables
                </Badge>
              </div>
            </div>
            <CardContent className="mt-3 space-y-3 p-0">
              <p className="text-sm leading-relaxed text-zinc-300">
                {data.profile.bio}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span>{data.profile.location}</span>
                <span aria-hidden>·</span>
                {data.profile.languages.map((l) => (
                  <Badge
                    key={l}
                    variant="outline"
                    className="border-zinc-700 font-mono text-[10px] text-zinc-300"
                  >
                    {l}
                  </Badge>
                ))}
              </div>
              <p className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-emerald-200/90">
                <strong className="font-semibold text-emerald-300">
                  Lectura del perfil:{" "}
                </strong>
                el activo más raro aquí no es el código, es la combinación PT
                nativo + ES + EN + CA + experiencia real en agentes IA. Esa
                combinación vale más en localización MTPE y consultoría que
                cualquier repo individual.
              </p>
            </CardContent>
          </Card>

          {/* Filtros */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar repos por categoría"
          >
            {CATEGORY_CHIPS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                aria-pressed={filter === c.key}
                className={`h-9 rounded-md border px-3 text-xs font-mono transition-colors ${
                  filter === c.key
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Grid de repos */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((r) => (
              <Card
                key={r.name}
                className="flex flex-col border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700"
              >
                <CardHeader className="p-0 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="break-words font-mono text-sm font-semibold text-emerald-400">
                      {r.name}
                    </CardTitle>
                    {r.relatedPath != null ? (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-amber-500/40 bg-amber-500/10 font-mono text-[10px] text-amber-300"
                        title="Vía de ingreso asociada"
                      >
                        <TrendingUp className="mr-1 h-3 w-3" aria-hidden />
                        Ruta {r.relatedPath}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge
                      variant="outline"
                      className="border-zinc-700 text-[10px] text-zinc-400"
                    >
                      {githubCategoryLabel(r.category)}
                    </Badge>
                    {r.language ? (
                      <Badge
                        variant="outline"
                        className="border-zinc-700 font-mono text-[10px] text-zinc-400"
                      >
                        {r.language}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 p-0">
                  <p className="text-xs leading-relaxed text-zinc-300">
                    {r.description}
                  </p>
                  <p className="mt-auto rounded-md border border-emerald-500/15 bg-emerald-500/5 p-2.5 text-[11px] leading-relaxed text-emerald-200/80">
                    <strong className="text-emerald-300">Monetización: </strong>
                    {r.monetization}
                  </p>
                  <a
                    href={`https://github.com/belentani7/${r.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-emerald-300"
                  >
                    <Github className="h-3.5 w-3.5" aria-hidden />
                    Ver repo
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
