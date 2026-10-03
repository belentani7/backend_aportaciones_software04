"use client";

import { motion } from "framer-motion";
import { ArrowDown, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStats } from "./use-stats";

// Datos reales investigados (Task 1) — cinta de hallazgos.
// Comillas tipográficas para evitar problemas de entidades en JSX.
const FINDINGS: ReadonlyArray<string> = [
  "METR (2025): los devs con IA tardan un 19% MÁS, aunque creen ser un 24% más rápidos",
  "Stack Overflow 2025: el 46% desconfía de la precisión de la IA; solo el 3% confía plenamente",
  "El 66% pierde tiempo depurando código de IA ‘casi correcto’",
  "Claude Code: usuarios agotan límites ‘más rápido de lo esperado’ (BBC, 2025)",
];

export function Hero() {
  const { stats } = useStats();

  const chips: { value: string; label: string }[] = [
    { value: stats?.total != null ? String(stats.total) : "—", label: "soluciones" },
    { value: stats?.byDomain?.length ? String(stats.byDomain.length) : "10", label: "dominios" },
    { value: stats?.byTool?.length ? String(stats.byTool.length) : "10", label: "herramientas" },
    {
      value: stats?.avgFrequency != null ? `${Math.round(stats.avgFrequency)}%` : "—",
      label: "frecuencia media",
    },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10 sm:px-6 md:pt-20 md:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <p className="font-mono text-sm text-emerald-400">
            <Radar className="mr-2 inline size-4 -translate-y-0.5" aria-hidden="true" />
            $ vibefix --compendio
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-5xl md:text-6xl">
            <span className="text-emerald-400">1000 soluciones reales</span>{" "}
            para el vibe coding real
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Compilado a partir de quejas reales de usuarios de Claude Code,
            Copilot, Cursor y más: issues de GitHub, Reddit, Hacker News y la
            encuesta Stack Overflow 2025.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Cifras clave">
            {chips.map((chip) => (
              <li
                key={chip.label}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
              >
                <span className="font-mono text-base font-semibold text-emerald-300">
                  {chip.value}
                </span>{" "}
                <span className="text-xs text-zinc-400">{chip.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-11 bg-emerald-500 px-6 font-medium text-zinc-950 hover:bg-emerald-400"
            >
              <a href="#solutions">
                Explorar soluciones
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-zinc-700 bg-transparent px-6 font-medium text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
            >
              <a href="#weekly">Ver análisis semanal</a>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Cinta de hallazgos: scroll horizontal automático, pausa al hover */}
      <div
        className="relative overflow-hidden border-y border-zinc-800 bg-zinc-900/40 py-3 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        role="marquee"
        aria-label="Hallazgos de investigación"
      >
        <div className="vf-marquee flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex items-center">
              {FINDINGS.map((finding) => (
                <span
                  key={finding}
                  className="flex items-center gap-2 whitespace-nowrap px-6 text-sm text-zinc-400"
                >
                  <span className="font-mono text-emerald-400" aria-hidden="true">
                    &gt;
                  </span>
                  {finding}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
