"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bug,
  Gauge,
  GitBranch,
  Lightbulb,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "./section";
import {
  fetchJson,
  formatDate,
  type WeeklyDTO,
  type WeeklyResponse,
} from "./types";

const FINDING_ICONS = [Sparkles, Bug, Gauge, ShieldAlert, ScanSearch];

export function WeeklySection() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    | { status: "ok"; data: WeeklyResponse }
    | { status: "error"; message: string }
    | null
  >(null);
  const [generating, setGenerating] = useState(false);

  // Loading derivado del estado de la petición (evita setState síncrono en efecto).
  const loading = result === null;
  const error = result?.status === "error" ? result.message : null;
  const data = result?.status === "ok" ? result.data : null;

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<WeeklyResponse>("/api/weekly", { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setResult({ status: "ok", data: res });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({
          status: "error",
          message: "No se pudo cargar el análisis semanal. Revisa tu conexión.",
        });
      });
    return () => controller.abort();
  }, [attempt]);

  function reload() {
    setResult(null);
    setAttempt((a) => a + 1);
  }

  // El más reciente primero (defensivo: ordenamos por generatedAt).
  const items = data
    ? [...data.items].sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      )
    : [];
  const featured = items[0];
  const history = items.slice(1);

  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    try {
      await fetchJson<{ item: WeeklyDTO }>("/api/weekly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      toast.success("Nuevo análisis semanal generado con fuentes frescas.");
      reload();
    } catch {
      toast.error(
        "No se pudo generar el análisis. Inténtalo de nuevo en unos minutos."
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Section
      id="weekly"
      eyebrow="# analisis-semanal"
      title="Análisis semanal"
      description="Cada semana la IA revisa fuentes frescas (issues, Reddit, HN, encuestas), resume la tendencia del momento y propone una solución o skill nueva."
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
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-xl bg-zinc-800/70" />
          <Skeleton className="h-16 rounded-xl bg-zinc-800/70" />
        </div>
      ) : !featured ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">
            Aún no hay análisis generados. Lanza el primer análisis semanal con
            fuentes frescas.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="h-11 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Analizando fuentes y generando…
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden="true" />
                Generar ahora
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.dueForNew ? (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 size-5 shrink-0 text-amber-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-amber-200">
                    Análisis semanal pendiente
                  </p>
                  <p className="text-sm text-amber-200/70">
                    Hay fuentes nuevas sin analizar. Genera un nuevo análisis
                    con IA (puede tardar ~20&nbsp;segundos).
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="h-11 shrink-0 bg-amber-500 font-medium text-zinc-950 hover:bg-amber-400"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Analizando fuentes y generando…
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Generar ahora
                  </>
                )}
              </Button>
            </div>
          ) : null}

          {/* Análisis más reciente */}
          <article className="rounded-xl border border-emerald-500/20 bg-zinc-900 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 font-mono text-emerald-300"
              >
                <Terminal className="size-3" aria-hidden="true" />
                {featured.weekLabel}
              </Badge>
              <span className="text-xs text-zinc-500">
                {formatDate(featured.generatedAt)}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold leading-snug text-zinc-100 sm:text-2xl">
              {featured.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              {featured.trendSummary}
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {/* Solución propuesta */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-emerald-400">
                  &gt; solución propuesta esta semana
                </p>
                <p className="font-medium text-zinc-100">
                  {featured.proposedSolution.name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  {featured.proposedSolution.description}
                </p>
                <ol className="mt-3 space-y-2">
                  {featured.proposedSolution.steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-relaxed text-zinc-300"
                    >
                      <span className="shrink-0 font-mono text-emerald-400">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-col gap-4">
                {/* Idea de skill */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-emerald-400">
                    <Lightbulb className="size-4" aria-hidden="true" />
                    &gt; idea de skill
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    {featured.skillIdea}
                  </p>
                </div>

                {/* Repos estudiadas */}
                <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-emerald-400">
                    <GitBranch className="size-4" aria-hidden="true" />
                    &gt; repos estudiadas
                  </p>
                  <ul className="vf-scroll max-h-48 space-y-3 overflow-y-auto pr-1">
                    {featured.reposStudied.map((repo) => (
                      <li key={repo.name} className="text-sm">
                        <span className="font-mono text-emerald-300">
                          {repo.name}
                        </span>
                        <span className="block text-xs leading-relaxed text-zinc-400">
                          {repo.why}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Hallazgos clave */}
            {featured.keyFindings.length > 0 ? (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="mb-3 font-mono text-xs uppercase tracking-wider text-emerald-400">
                  &gt; hallazgos clave
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {featured.keyFindings.map((finding, i) => {
                    const Icon =
                      FINDING_ICONS[i % FINDING_ICONS.length] ?? Sparkles;
                    return (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm leading-relaxed text-zinc-300"
                      >
                        <Icon
                          className="mt-0.5 size-4 shrink-0 text-emerald-400"
                          aria-hidden="true"
                        />
                        <span>{finding}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </article>

          {/* Historial */}
          {history.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
              <h3 className="mb-2 font-mono text-sm text-zinc-400">
                &gt; historial de análisis
              </h3>
              <Accordion type="single" collapsible className="vf-scroll">
                {history.map((week) => (
                  <AccordionItem
                    key={week.id}
                    value={week.id}
                    className="border-zinc-800"
                  >
                    <AccordionTrigger className="min-w-0 gap-3 py-4 text-left hover:no-underline">
                      <span className="flex min-w-0 flex-col gap-0.5 text-left">
                        <span className="font-mono text-xs text-emerald-400">
                          {week.weekLabel}
                        </span>
                        <span className="truncate text-sm font-medium text-zinc-200">
                          {week.title}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">
                        {week.trendSummary}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : null}
        </div>
      )}
    </Section>
  );
}
