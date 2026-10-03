import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ExternalLink,
  FileJson,
  Fingerprint,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  AUDIT_CRITERIA,
  type AuditComponent,
  isPerfectScore,
} from "@shared/audit";

const criterionLabels: Record<(typeof AUDIT_CRITERIA)[number], string> = {
  backend: "Backend",
  frontend: "Frontend",
  utilidad: "Utilidad",
  relevancia: "Relevancia",
  potencial: "Potencial",
  identidad: "Identidad",
};

const numberFormat = new Intl.NumberFormat("es-ES");

function ScoreBar({
  label,
  score,
  compact = false,
}: {
  label: string;
  score: number;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span>{label}</span>
        <span className={score === 10 ? "text-emerald-300" : "text-foreground"}>
          {score}/10
        </span>
      </div>
      <Progress
        value={score * 10}
        className="h-1.5 bg-white/[0.07] [&>div]:bg-gradient-to-r [&>div]:from-cyan-300 [&>div]:to-emerald-300"
      />
    </div>
  );
}

function QueryNotice({
  loading,
  error,
  empty,
  label,
}: {
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  label: string;
}) {
  if (loading)
    return (
      <div className="rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.05] p-5 text-sm text-cyan-100">
        Cargando {label}…
      </div>
    );
  if (error)
    return (
      <div className="rounded-2xl border border-rose-200/20 bg-rose-200/[0.05] p-5 text-sm text-rose-100">
        No se pudo cargar {label}. Actualiza la vista para reintentar.
      </div>
    );
  if (empty)
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground">
        Aún no hay datos para {label}.
      </div>
    );
  return null;
}

function ComponentCard({
  component,
  onSelect,
}: {
  component: AuditComponent;
  onSelect: () => void;
}) {
  const perfect = isPerfectScore(component.scores);
  return (
    <Card
      className={`group relative overflow-hidden border-white/[0.09] bg-white/[0.035] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/[0.055] ${!perfect ? "opacity-65 grayscale-[0.15]" : ""}`}
    >
      {perfect && (
        <>
          <div className="absolute right-0 top-0 h-20 w-20 bg-emerald-300/10 blur-2xl" />
          <div className="absolute -right-10 top-5 rotate-45 border-y border-emerald-200/25 bg-emerald-300/10 px-10 py-1 font-mono text-[9px] tracking-[0.22em] text-emerald-200">
            ✓ CERTIFIED
          </div>
        </>
      )}
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-cyan-200/20 bg-cyan-200/5 text-cyan-100"
              >
                {component.layer}
              </Badge>
              {perfect ? (
                <Badge className="border-0 bg-emerald-300/15 text-emerald-200">
                  10/10 aprobado
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-200/20 text-amber-200"
                >
                  No certificado
                </Badge>
              )}
            </div>
            <CardTitle className="font-display text-2xl tracking-tight text-white">
              {component.name}
            </CardTitle>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {component.description}
            </p>
          </div>
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-semibold ${perfect ? "border-emerald-200/20 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/70"}`}
          >
            {perfect
              ? "10"
              : (
                  Object.values(component.scores).reduce((a, b) => a + b, 0) / 6
                ).toFixed(1)}
            <span className="text-xs text-muted-foreground">/10</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {AUDIT_CRITERIA.map(criterion => (
            <ScoreBar
              key={criterion}
              label={criterionLabels[criterion]}
              score={component.scores[criterion]}
              compact
            />
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <span className="text-xs text-muted-foreground">
            ★ {numberFormat.format(component.stars)} estrellas
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelect}
            className="gap-2 text-cyan-100 hover:bg-cyan-200/10 hover:text-white"
          >
            Ver ficha <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [active, setActive] = useState<"overview" | "stack" | "identity">(
    "overview"
  );
  const [selected, setSelected] = useState<AuditComponent | null>(null);
  const componentsQuery = trpc.audit.components.useQuery();
  const summaryQuery = trpc.audit.summary.useQuery();
  const stackQuery = trpc.audit.approvedStack.useQuery();
  const exportQuery = trpc.audit.exportJson.useQuery();
  const loading =
    componentsQuery.isLoading || summaryQuery.isLoading || stackQuery.isLoading;
  const queryError =
    componentsQuery.isError || summaryQuery.isError || stackQuery.isError;
  const components = componentsQuery.data ?? [];
  const summary = summaryQuery.data;
  const averageRows = useMemo(
    () =>
      summary
        ? AUDIT_CRITERIA.map(criterion => ({
            criterion,
            value: summary.average[criterion],
          }))
        : [],
    [summary]
  );

  const downloadJson = () => {
    if (!exportQuery.data) return;
    const blob = new Blob([JSON.stringify(exportQuery.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "forge10-auditoria.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#071013] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.09),transparent_25%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1480px]">
        <aside
          className="hidden w-72 shrink-0 flex-col border-r border-white/[0.08] px-7 py-8 lg:flex"
          aria-label="Navegación principal de Forge10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-200 to-emerald-300 text-[#071013]">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-tight">
                Forge10
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Technical audit system
              </div>
            </div>
          </div>
          <nav className="mt-16 space-y-2" aria-label="Secciones de auditoría">
            <div className="mb-4 px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Workspace
            </div>
            {[
              { id: "overview", label: "Auditoría general", icon: Gauge },
              { id: "stack", label: "Stack 10/10", icon: Layers3 },
              { id: "identity", label: "Identidad Forge10", icon: ShieldCheck },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id as typeof active)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active === item.id ? "bg-cyan-200/10 text-cyan-100" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-emerald-200/15 bg-emerald-200/[0.05] p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              <Sparkles className="h-4 w-4" />
              Filtro activo
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Solo los componentes con seis criterios perfectos entran en la
              pila certificada.
            </p>
          </div>
        </aside>
        <main className="min-w-0 flex-1 bg-[linear-gradient(rgba(103,232,249,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.025)_1px,transparent_1px)] bg-[size:32px_32px] px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
          <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{" "}
                PROTOCOLO ACTIVO · 06 CRITERIOS
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Precisión <span className="text-cyan-200">certificada.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Forge10 convierte la evaluación técnica en una decisión visible:
                seis criterios, una escala estricta y cero atajos.
              </p>
            </div>
            <Button
              aria-label="Descargar informe JSON de Forge10"
              onClick={downloadJson}
              variant="outline"
              className="w-fit gap-2 border-white/15 bg-white/[0.03] text-white hover:bg-white/10"
            >
              <FileJson className="h-4 w-4" /> Exportar JSON
            </Button>
          </header>
          <div
            className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6"
            aria-label="Criterios del protocolo Forge10"
          >
            {AUDIT_CRITERIA.map((criterion, index) => (
              <div key={criterion} className="border-l border-cyan-200/30 pl-2">
                <div className="font-mono text-[10px] text-cyan-200/60">
                  0{index + 1}
                </div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {criterionLabels[criterion]}
                </div>
              </div>
            ))}
          </div>
          <nav
            className="mt-6 flex gap-2 overflow-x-auto border-b border-white/[0.08] pb-3 lg:hidden"
            aria-label="Secciones de auditoría móvil"
          >
            {[
              ["overview", "Auditoría"],
              ["stack", "Stack 10/10"],
              ["identity", "Identidad"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-current={active === id ? "page" : undefined}
                onClick={() => setActive(id as typeof active)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs ${active === id ? "bg-cyan-200/15 text-cyan-100" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </nav>
          {active === "overview" &&
            (loading ? (
              <QueryNotice loading label="la auditoría" />
            ) : queryError ? (
              <QueryNotice error label="la auditoría" />
            ) : !summary || !components.length ? (
              <QueryNotice empty label="la auditoría" />
            ) : (
              <>
                <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Componentes auditados",
                      value: summary?.total ?? "—",
                      note: "candidatos en revisión",
                    },
                    {
                      label: "Certificados",
                      value: summary?.approved ?? "—",
                      note: "pasan el filtro 10/10",
                    },
                    {
                      label: "Tasa de aprobación",
                      value: `${summary?.approvalRate ?? "—"}%`,
                      note: "exigencia máxima",
                    },
                    {
                      label: "Criterios perfectos",
                      value: summary?.perfectCriteria ?? "—",
                      note: "seis por certificado",
                    },
                  ].map(metric => (
                    <Card
                      key={metric.label}
                      className="border-white/[0.08] bg-white/[0.035]"
                    >
                      <CardContent className="p-5">
                        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {metric.label}
                        </div>
                        <div className="mt-3 font-display text-3xl text-white">
                          {metric.value}
                        </div>
                        <div className="mt-2 text-xs text-emerald-200/70">
                          {metric.note}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </section>
                <section className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
                  <Card className="border-white/[0.08] bg-white/[0.035]">
                    <CardHeader>
                      <div className="flex items-end justify-between">
                        <div>
                          <CardTitle className="font-display text-xl text-white">
                            Lectura de la auditoría
                          </CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Promedio por criterio sobre todos los candidatos.
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          Escala <span className="text-white">0—10</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-5 sm:grid-cols-2">
                      {averageRows.map(({ criterion, value }) => (
                        <ScoreBar
                          key={criterion}
                          label={criterionLabels[criterion]}
                          score={value}
                        />
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-200/15 bg-emerald-200/[0.05]">
                    <CardContent className="flex h-full flex-col justify-between p-6">
                      <div>
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-emerald-200">
                          <ShieldCheck className="h-4 w-4" /> Regla de
                          certificación
                        </div>
                        <p className="mt-6 font-display text-3xl leading-tight text-white">
                          Seis dieces.
                          <br />
                          <span className="text-emerald-200">
                            Una decisión.
                          </span>
                        </p>
                      </div>
                      <p className="mt-8 text-sm leading-6 text-muted-foreground">
                        Un componente solo es aprobado cuando backend, frontend,
                        utilidad, relevancia, potencial e identidad alcanzan
                        exactamente 10/10.
                      </p>
                    </CardContent>
                  </Card>
                </section>
                <section className="mt-10">
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                        REGISTRO DE CANDIDATOS
                      </div>
                      <h2 className="mt-2 font-display text-2xl text-white">
                        Componentes en revisión
                      </h2>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {components.length} fichas · filtro automático activo
                    </div>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {componentsQuery.isLoading ? (
                      <QueryNotice loading label="componentes candidatos" />
                    ) : componentsQuery.isError ? (
                      <QueryNotice error label="componentes candidatos" />
                    ) : components.length ? (
                      components.map(component => (
                        <ComponentCard
                          key={component.id}
                          component={component}
                          onSelect={() => setSelected(component)}
                        />
                      ))
                    ) : (
                      <QueryNotice empty label="componentes candidatos" />
                    )}
                  </div>
                </section>
              </>
            ))}
          {active === "stack" &&
            (stackQuery.isLoading ? (
              <QueryNotice loading label="Stack 10/10" />
            ) : stackQuery.isError ? (
              <QueryNotice error label="Stack 10/10" />
            ) : !(
                stackQuery.data?.backend.length ||
                stackQuery.data?.frontend.length
              ) ? (
              <QueryNotice empty label="Stack 10/10" />
            ) : (
              <section className="mt-10">
                <div className="max-w-2xl">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                    ARQUITECTURA CERTIFICADA
                  </div>
                  <h2 className="mt-2 font-display text-4xl text-white">
                    Stack 10/10
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    La selección que sobrevive al filtro completo, agrupada por
                    capa y respaldada por una justificación por criterio.
                  </p>
                </div>
                <div className="mt-8 grid gap-6 xl:grid-cols-2">
                  {(["backend", "frontend"] as const).map(layer => (
                    <Card
                      key={layer}
                      className="border-emerald-200/15 bg-emerald-200/[0.045]"
                    >
                      <CardHeader>
                        <CardTitle className="font-display text-2xl capitalize text-white">
                          {layer}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {stackQuery.data?.[layer].map(component => (
                          <div
                            key={component.id}
                            className="rounded-2xl border border-white/10 bg-black/10 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-display text-xl text-white">
                                  {component.name}
                                </div>
                                <a
                                  className="mt-1 block text-xs text-cyan-200/80 hover:text-cyan-100"
                                  href={component.repository}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Repositorio de origen{" "}
                                  <ExternalLink className="ml-1 inline h-3 w-3" />
                                </a>
                              </div>
                              <Badge className="bg-emerald-300/15 text-emerald-200">
                                10/10
                              </Badge>
                            </div>
                            <div className="mt-5 grid gap-3">
                              {AUDIT_CRITERIA.map(criterion => (
                                <div
                                  key={criterion}
                                  className="border-t border-white/[0.08] pt-3"
                                >
                                  <div className="flex justify-between text-xs text-emerald-100">
                                    <span>{criterionLabels[criterion]}</span>
                                    <span>10/10</span>
                                  </div>
                                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {component.justifications[criterion]}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          {active === "identity" && (
            <section className="mt-10 max-w-4xl">
              <div className="mb-6">
                <QueryNotice
                  loading={summaryQuery.isLoading}
                  error={summaryQuery.isError}
                  label="las métricas de identidad"
                />
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                MANIFIESTO DEL PROYECTO
              </div>
              <h2 className="mt-2 font-display text-4xl text-white">Forge10</h2>
              <blockquote className="mt-8 border-l-2 border-cyan-200 pl-5 font-display text-2xl leading-relaxed text-white">
                “No todo lo que funciona merece entrar en la pila. Forge10
                certifica lo que resiste una mirada exigente.”
              </blockquote>
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Precisión",
                    text: "La escala es estricta: solo 10/10 cuenta como perfecto.",
                  },
                  {
                    title: "Trazabilidad",
                    text: "Cada puntuación tiene una justificación y un origen verificable.",
                  },
                  {
                    title: "Identidad",
                    text: "La tecnología aprobada debe reforzar una visión coherente de producto.",
                  },
                ].map(item => (
                  <Card
                    key={item.title}
                    className="border-white/[0.08] bg-white/[0.035]"
                  >
                    <CardContent className="p-5">
                      <div className="font-display text-xl text-white">
                        {item.title}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {item.text}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="mt-6 border-white/[0.08] bg-white/[0.035]">
                <CardHeader>
                  <CardTitle className="font-display text-xl text-white">
                    Métricas globales
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                  {summaryQuery.isLoading ? (
                    <QueryNotice loading label="las métricas" />
                  ) : summaryQuery.isError ? (
                    <QueryNotice error label="las métricas" />
                  ) : summary ? (
                    Object.entries(summary.average).map(
                      ([criterion, value]) => (
                        <div
                          key={criterion}
                          className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-sm"
                        >
                          <span className="capitalize text-muted-foreground">
                            {criterion}
                          </span>
                          <span className="font-medium text-white">
                            {value}/10
                          </span>
                        </div>
                      )
                    )
                  ) : (
                    <QueryNotice empty label="las métricas" />
                  )}
                </CardContent>
              </Card>
            </section>
          )}
        </main>
      </div>
      {selected && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forge10-component-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0d1a1d] p-6 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="mb-3 bg-cyan-200/10 text-cyan-100">
                  Ficha técnica
                </Badge>
                <h3
                  id="forge10-component-title"
                  className="font-display text-3xl text-white"
                >
                  {selected.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {selected.description}
                </p>
              </div>
              <Button
                aria-label="Cerrar ficha técnica"
                variant="ghost"
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-white"
              >
                Cerrar
              </Button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {AUDIT_CRITERIA.map(criterion => (
                <div
                  key={criterion}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <ScoreBar
                    label={criterionLabels[criterion]}
                    score={selected.scores[criterion]}
                  />
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {selected.justifications[criterion]}
                  </p>
                </div>
              ))}
            </div>
            <a
              href={selected.repository}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white"
            >
              {selected.repository} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
