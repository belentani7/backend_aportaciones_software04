"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Database,
  Layers,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "./section";
import { useStats } from "./use-stats";
import { severityClass, severityLabel, type StatsDTO } from "./types";

const SEVERITY_ORDER = ["critica", "alta", "media", "baja"] as const;

export function StatsSection() {
  const { stats, loading, error, retry } = useStats();

  const miniCards = [
    {
      label: "Total soluciones",
      value: stats?.total != null ? String(stats.total) : "—",
      icon: Database,
    },
    {
      label: "Herramientas cubiertas",
      value: stats?.byTool?.length ? String(stats.byTool.length) : "—",
      icon: Wrench,
    },
    {
      label: "Dominios",
      value: stats?.byDomain?.length ? String(stats.byDomain.length) : "—",
      icon: Layers,
    },
    {
      label: "Frecuencia media",
      value: stats?.avgFrequency != null ? `${Math.round(stats.avgFrequency)}%` : "—",
      icon: BarChart3,
    },
  ];

  const severities = stats?.bySeverity
    ? SEVERITY_ORDER.map((name) => {
        const match = stats.bySeverity.find(
          (s) => s.name.toLowerCase() === name
        );
        return match ? { name: match.name, count: match.count } : null;
      }).filter((s): s is { name: string; count: number } => s !== null)
    : [];

  return (
    <Section
      id="stats"
      eyebrow="# estadisticas"
      title="El problema, en números"
      description="Panorama del compendio: cuántas soluciones, en qué dominios y herramientas se concentran, y con qué frecuencia reporta la comunidad cada tipo de fallo."
    >
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <AlertTriangle className="size-6 text-amber-400" aria-hidden="true" />
          <p className="text-sm text-zinc-300">
            No se pudieron cargar las estadísticas. Comprueba tu conexión e
            inténtalo de nuevo.
          </p>
          <Button
            variant="outline"
            onClick={retry}
            className="h-11 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
          >
            <RefreshCw className="size-4" aria-hidden="true" /> Reintentar
          </Button>
        </div>
      ) : (
        <>
          {/* Mini-cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-[88px] rounded-xl bg-zinc-800/70"
                  />
                ))
              : miniCards.map((card) => (
                  <div
                    key={card.label}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-400">{card.label}</span>
                      <card.icon
                        className="size-4 shrink-0 text-emerald-400"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="font-mono text-2xl font-semibold text-zinc-100">
                      {card.value}
                    </span>
                  </div>
                ))}
          </div>

          {/* Gráficos de barras CSS */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {loading ? (
              <>
                <Skeleton className="h-80 rounded-xl bg-zinc-800/70" />
                <Skeleton className="h-80 rounded-xl bg-zinc-800/70" />
              </>
            ) : stats?.byDomain && stats.byTool ? (
              <>
                <BarChart
                  title="Soluciones por dominio"
                  icon={Layers}
                  data={stats.byDomain.map((d) => ({
                    label: d.label,
                    count: d.count,
                  }))}
                />
                <BarChart
                  title="Soluciones por herramienta"
                  icon={Boxes}
                  data={stats.byTool.map((t) => ({
                    label: t.name,
                    count: t.count,
                  }))}
                />
              </>
            ) : null}
          </div>

          {/* Severidad */}
          {stats && severities.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <span className="mr-1 font-mono text-sm text-zinc-500">
                &gt; severidad:
              </span>
              {severities.map((s) => (
                <Badge
                  key={s.name}
                  variant="outline"
                  className={severityClass(s.name)}
                >
                  {severityLabel(s.name)} ·{" "}
                  <span className="font-mono">{s.count}</span>
                </Badge>
              ))}
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
}

function BarChart({
  title,
  icon: Icon,
  data,
}: {
  title: string;
  icon: typeof Layers;
  data: { label: string; count: number }[];
}) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...sorted.map((d) => d.count));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 font-mono text-sm text-zinc-400">
        <Icon className="size-4 text-emerald-400" aria-hidden="true" />
        &gt; {title}
      </h3>
      <div className="space-y-3">
        {sorted.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-zinc-400 sm:w-40 sm:text-sm">
              {row.label}
            </span>
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800"
              role="img"
              aria-label={`${row.label}: ${row.count} soluciones`}
            >
              <motion.div
                className="h-full rounded-full bg-emerald-400"
                initial={{ width: 0 }}
                whileInView={{ width: `${(row.count / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-xs text-zinc-400">
              {row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
