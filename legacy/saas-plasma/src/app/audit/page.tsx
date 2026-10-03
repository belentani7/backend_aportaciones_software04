"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { leads } from "@/data/leads";
import type { AuditResult } from "@/lib/audit";

const PROTOCOL = [
  {
    step: "01",
    title: "Entrada",
    body: "Escribes owner/repo. Se valida el formato antes de tocar la red.",
  },
  {
    step: "02",
    title: "Lectura",
    body: "GitHub REST: metadatos + arbol completo del repo (una sola pasada).",
  },
  {
    step: "03",
    title: "Evaluacion",
    body: "13 criterios ponderados (SDD/G0-G4 + checklist de produccion de 30).",
  },
  {
    step: "04",
    title: "Salida",
    body: "Score 0-100, grado, que falta y el siguiente paso concreto.",
  },
];

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#grade)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="grade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b3eff" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-milky-50">{score}</span>
        <span className="label text-plasma-300">GRADO {grade}</span>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [repo, setRepo] = useState("belentani7/secure-t");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  async function run(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Error desconocido.");
        setResult(null);
      } else {
        setResult(data as AuditResult);
      }
    } catch {
      setError("No se pudo conectar con la API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen px-6 pb-24 pt-28">
      <div className="mx-auto max-w-5xl">
        <p className="label mb-4 text-plasma-300">PLASMA AUDIT — AUDITORIA 100</p>
        <h1 className="headline-1 text-gradient-uv">
          Audita cualquier repo en segundos
        </h1>
        <p className="body-lg mt-5 max-w-2xl text-milky-400">
          Pega un repositorio publico y obten su score documental y de
          produccion: README, licencia, reglas de agentes, cadena PRD/SRS/SDD/ADR,
          CI, tests, seguridad y deploy. Es el diagnostico que abre la consultoria.
        </p>

        <form onSubmit={run} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repo"
            aria-label="Repositorio owner/repo"
            className="glass w-full rounded-full px-6 py-3 font-mono text-milky-50 outline-none placeholder:text-milky-500 focus:ring-2 focus:ring-uv-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="glass-elevated glow-uv rounded-full px-8 py-3 font-heading font-semibold text-milky-50 transition hover:scale-105 disabled:opacity-60"
          >
            {loading ? "Auditando..." : "Auditar repo"}
          </button>
        </form>

        {error && (
          <p className="mt-6 rounded-2xl border border-plasma-600/40 bg-plasma-950/30 p-4 text-milky-200">
            {error}
          </p>
        )}

        {result && (
          <section className="mt-12 grid gap-8 lg:grid-cols-[auto_1fr]">
            <div className="glass flex flex-col items-center gap-4 rounded-3xl p-8">
              <ScoreRing score={result.score} grade={result.grade} />
              <p className="body-sm text-milky-400">
                {result.passed}/{result.total} criterios
              </p>
              <p className="font-mono text-xs text-milky-500">
                {result.language ?? "n/d"} · {result.stars} stars
              </p>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-3xl p-6">
                <h2 className="section-title text-gradient-milky">
                  {result.repo}
                </h2>
                {result.description && (
                  <p className="body-sm mt-2 text-milky-400">{result.description}</p>
                )}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {result.checks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 px-4 py-2"
                    >
                      <span
                        className={
                          check.passed
                            ? "text-plasma-300"
                            : "text-milky-600"
                        }
                        aria-hidden="true"
                      >
                        {check.passed ? "●" : "○"}
                      </span>
                      <span className="body-sm text-milky-200">{check.label}</span>
                      <span className="ml-auto font-mono text-xs text-milky-500">
                        {check.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {result.recommendations.length > 0 && (
                <div className="glass rounded-3xl p-6">
                  <h3 className="font-heading text-lg font-semibold text-milky-50">
                    Que falta (prioridad)
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {result.recommendations.map((rec) => (
                      <li key={rec} className="body-sm text-milky-300">
                        — {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <a
                href="https://belentani.vercel.app"
                className="glass-elevated glow-uv inline-block rounded-full px-8 py-3 font-heading font-semibold text-milky-50"
              >
                Solicitar auditoria completa (48h)
              </a>
            </div>
          </section>
        )}

        <section className="mt-20">
          <h2 className="section-title text-gradient-milky text-center">
            Protocolo
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROTOCOL.map((p) => (
              <div key={p.step} className="glass rounded-2xl p-6">
                <span className="font-mono text-sm text-plasma-300">{p.step}</span>
                <h3 className="mt-3 font-heading text-lg font-semibold text-milky-50">
                  {p.title}
                </h3>
                <p className="body-sm mt-2 text-milky-400">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="section-title text-gradient-plasma">
            Red de prospeccion (5 leads)
          </h2>
          <p className="body-sm mt-3 max-w-2xl text-milky-400">
            Repos con traccion reciente y brecha de documentacion o seguridad. El
            boton de arriba es la demo; el informe es la puerta de entrada.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => (
              <div key={lead.repo} className="glass rounded-2xl p-6">
                <a
                  href={`https://github.com/${lead.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-milky-50 hover:text-plasma-300"
                >
                  {lead.repo}
                </a>
                <p className="label mt-2 text-plasma-300">
                  {lead.segment} · {lead.stars} stars
                </p>
                <p className="body-sm mt-3 text-milky-400">{lead.angle}</p>
                <p className="body-sm mt-3 text-milky-300">Oferta: {lead.offer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 glass rounded-3xl p-8">
          <h2 className="section-title text-gradient-uv">Como funciona</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-heading font-semibold text-milky-50">
                Que hace el boton
              </h3>
              <p className="body-sm mt-2 text-milky-400">
                Valida el formato, consulta la API publica de GitHub, recorre el
                arbol del repo y puntua 13 criterios. No escribe nada en el repo:
                solo lee.
              </p>
              <h3 className="mt-5 font-heading font-semibold text-milky-50">
                Que protocolo sigue
              </h3>
              <p className="body-sm mt-2 text-milky-400">
                SDD E0-E7 y gates G0-G4: primero el diagnostico, luego la cadena
                PRD, SRS, SDD, ADR y plan; el codigo obedece a los documentos.
              </p>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-milky-50">
                Por que este color
              </h3>
              <p className="body-sm mt-2 text-milky-400">
                Ultra-violeta y plasma (luz negra) comunican IA, laboratorio y
                tecnologia creativa; es la identidad de saas-plasma. El estado
                pasa a verde/ambar segun el score, nunca decorativo.
              </p>
              <h3 className="mt-5 font-heading font-semibold text-milky-50">
                Objetivo real (profesional y artistico)
              </h3>
              <p className="body-sm mt-2 text-milky-400">
                Convertir la auditoria en ingresos de consultoria y, a la vez,
                demostrar criterio de arquitectura. La misma pieza sirve como
                portfolio tecnico y como experiencia visual de marca.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-8 inline-block font-heading text-sm font-semibold text-plasma-300 hover:text-milky-50"
          >
            ← Volver al inicio
          </Link>
        </section>
      </div>
    </main>
  );
}
