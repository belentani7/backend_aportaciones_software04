"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "./section";
import { useStats } from "./use-stats";
import { SolutionCard } from "./solution-card";
import { SolutionDialog } from "./solution-dialog";
import {
  DOMAINS,
  FALLBACK_TOOLS,
  SEVERITIES,
  fetchJson,
  type SolutionsResponse,
  type SolutionDTO,
} from "./types";

const PAGE_SIZE = 9;
const ALL = "all";

export function SolutionsExplorer() {
  const { stats } = useStats();

  // Filtros
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(ALL);
  const [tool, setTool] = useState(ALL);
  const [severity, setSeverity] = useState(ALL);
  const [page, setPage] = useState(1);

  // Datos: loading derivado del "estado" de la petición para evitar
  // setState síncrono dentro del efecto.
  const [data, setData] = useState<SolutionsResponse | null>(null);
  const [state, setState] = useState<{
    key: string;
    status: "ok" | "error";
    message?: string;
  } | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [selected, setSelected] = useState<SolutionDTO | null>(null);

  const toolOptions =
    stats?.byTool && stats.byTool.length > 0
      ? stats.byTool.map((t) => t.name)
      : FALLBACK_TOOLS;

  // Debounce de búsqueda (350 ms); al aplicar, volvemos a la página 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [qInput]);

  const requestKey = [q.trim(), category, tool, severity, page, retryAttempt].join(
    "|"
  );
  const loading = state?.key !== requestKey;
  const error =
    state?.key === requestKey && state.status === "error"
      ? state.message ?? "Error inesperado."
      : null;

  // Fetch paginado con abort al cambiar filtros.
  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category !== ALL) params.set("category", category);
    if (tool !== ALL) params.set("tool", tool);
    if (severity !== ALL) params.set("severity", severity);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    fetchJson<SolutionsResponse>(`/api/solutions?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res);
        setState({ key: requestKey, status: "ok" });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({
          key: requestKey,
          status: "error",
          message:
            "No se pudieron cargar las soluciones. Comprueba tu conexión e inténtalo de nuevo.",
        });
      });

    return () => controller.abort();
  }, [q, category, tool, severity, page, requestKey]);

  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleClear() {
    setQInput("");
    setCategory(ALL);
    setTool(ALL);
    setSeverity(ALL);
    setPage(1);
  }

  function handleRetry() {
    setState(null);
    setRetryAttempt((r) => r + 1);
  }

  return (
    <Section
      id="solutions"
      eyebrow="# explorador"
      title="Explorador de soluciones"
      description="Busca por problema, causa o tag, y filtra por dominio, herramienta y severidad. Cada solución incluye plan de acción, fix de referencia y prevención."
    >
      {/* Controles */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          />
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Buscar por problema, causa o tag…"
            aria-label="Buscar soluciones"
            className="h-11 border-zinc-800 bg-zinc-900 pl-9 text-base md:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex">
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filtrar por dominio"
              className="h-11 w-full border-zinc-800 bg-zinc-900 lg:w-48"
            >
              <SelectValue placeholder="Dominio" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900">
              <SelectItem value={ALL}>Todos los dominios</SelectItem>
              {DOMAINS.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={tool}
            onValueChange={(value) => {
              setTool(value);
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filtrar por herramienta"
              className="h-11 w-full border-zinc-800 bg-zinc-900 lg:w-44"
            >
              <SelectValue placeholder="Herramienta" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900">
              <SelectItem value={ALL}>Todas las herramientas</SelectItem>
              {toolOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={severity}
            onValueChange={(value) => {
              setSeverity(value);
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filtrar por severidad"
              className="h-11 w-full border-zinc-800 bg-zinc-900 lg:w-36"
            >
              <SelectValue placeholder="Severidad" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900">
              <SelectItem value={ALL}>Toda severidad</SelectItem>
              {SEVERITIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleClear}
          className="h-11 shrink-0 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-emerald-300"
        >
          <RotateCcw className="size-4" aria-hidden="true" /> Limpiar
        </Button>
      </div>

      {/* Contador */}
      <p className="mt-4 text-sm text-zinc-400" aria-live="polite">
        <span className="font-mono text-emerald-400">
          {loading && !data ? "···" : total}
        </span>{" "}
        soluciones encontradas
      </p>

      {/* Resultados */}
      <div className="mt-4 min-h-[420px]">
        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <AlertTriangle className="size-6 text-amber-400" aria-hidden="true" />
            <p className="max-w-md text-sm text-zinc-300">{error}</p>
            <Button
              variant="outline"
              onClick={handleRetry}
              className="h-11 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
            >
              Reintentar
            </Button>
          </div>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-64 rounded-xl bg-zinc-800/70"
              />
            ))}
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-10 text-center">
            <SearchX className="size-6 text-zinc-500" aria-hidden="true" />
            <p className="text-sm text-zinc-400">
              Sin resultados para esos filtros. Prueba con otros términos o
              limpia los filtros.
            </p>
            <Button
              variant="outline"
              onClick={handleClear}
              className="h-11 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
            >
              Limpiar filtros
            </Button>
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((solution) => (
                <SolutionCard
                  key={solution.id}
                  solution={solution}
                  onOpen={setSelected}
                />
              ))}
            </div>

            {/* Paginación */}
            <nav
              aria-label="Paginación de soluciones"
              className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            >
              <Button
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-11 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
              >
                <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
              </Button>
              <span className="font-mono text-sm text-zinc-400">
                Página {data.page} de {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-11 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
              >
                Siguiente <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </nav>
          </>
        ) : null}
      </div>

      <SolutionDialog solution={selected} onClose={() => setSelected(null)} />
    </Section>
  );
}
