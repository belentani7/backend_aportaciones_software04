"use client";

import { motion } from "framer-motion";
import { AlertTriangle, GitBranch, Layers, Radar, RefreshCw } from "lucide-react";
import { Section } from "./section";

const STEPS = [
  {
    n: "01",
    icon: Radar,
    title: "Recolección",
    text: "Issues de GitHub, Reddit, Hacker News y la encuesta Stack Overflow 2025: quejas reales de desarrolladores, no casos ideales.",
  },
  {
    n: "02",
    icon: GitBranch,
    title: "Deduplicación",
    text: "Las quejas se agrupan en 100 arquetipos de problema reales, cada uno con su causa raíz identificada y documentada.",
  },
  {
    n: "03",
    icon: Layers,
    title: "Expansión ×10",
    text: "Cada arquetipo se resuelve para 10 combos herramienta + entorno (Claude Code, Copilot, Cursor…), hasta las 1000 soluciones del compendio.",
  },
  {
    n: "04",
    icon: RefreshCw,
    title: "Ciclo semanal",
    text: "La IA analiza fuentes frescas cada semana, resume la tendencia y propone una nueva solución o una idea de skill para la comunidad.",
  },
];

export function Methodology() {
  return (
    <Section
      id="method"
      eyebrow="# metodologia"
      title="Metodología"
      description="Cómo se construye el compendio: de la queja cruda en foros a una solución aplicable y verificable."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
          >
            <div className="flex h-full flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-3xl font-semibold text-emerald-400/80">
                  {step.n}
                </span>
                <step.icon
                  className="size-5 text-zinc-500"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-mono text-sm font-medium text-zinc-100">
                &gt; {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {step.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-amber-400"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-amber-200/80">
          Nota honesta: los datos provienen de fuentes públicas (2024–2026).
          Las frecuencias son estimaciones de reportes comunitarios, no
          métricas auditadas.
        </p>
      </div>
    </Section>
  );
}
