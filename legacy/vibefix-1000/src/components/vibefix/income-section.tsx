"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Calculator,
  ExternalLink,
  FileSearch,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchJson,
  incomeCategoryLabel,
  type IncomeResponse,
  type IncomePathDTO,
} from "./types";

const EFFORT_CLS: Record<string, string> = {
  bajo: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  medio: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  alto: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

const MAX_HOURS = 40;
const PLATFORM_FEE_DEFAULT = 0.1; // 10% conservador si la ruta no tiene fee conocido

function fmtEur(n: number): string {
  return n.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function IncomeSection() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    | { status: "ok"; data: IncomeResponse }
    | { status: "error"; message: string }
    | null
  >(null);
  const [detail, setDetail] = useState<IncomePathDTO | null>(null);

  // Estado de la calculadora
  const [calcPath, setCalcPath] = useState<string>("1");
  const [hours, setHours] = useState(15);
  const [rate, setRate] = useState(50);

  const loading = result === null;
  const error = result?.status === "error" ? result.message : null;
  const data = result?.status === "ok" ? result.data : null;

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<IncomeResponse>("/api/income", { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setResult({ status: "ok", data: res });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({
          status: "error",
          message: "No se pudieron cargar las rutas de ingreso.",
        });
      });
    return () => controller.abort();
  }, [attempt]);

  const selectedPath = useMemo(
    () => data?.items.find((p) => String(p.code) === calcPath) ?? data?.items[0] ?? null,
    [data, calcPath]
  );

  const calc = useMemo(() => {
    if (!selectedPath) return null;
    const lo = selectedPath.rateMinPerHour;
    const hi = selectedPath.rateMaxPerHour;
    const clampedRate =
      lo > 0
        ? Math.min(hi, Math.max(lo, rate))
        : 0; // rutas de producto: sin tarifa horaria
    const feePct =
      selectedPath.platforms.length > 0
        ? PLATFORM_FEE_DEFAULT
        : PLATFORM_FEE_DEFAULT;
    const weeksPerMonth = 4.33;
    const gross = hours * clampedRate * weeksPerMonth;
    const net = gross * (1 - feePct);
    const hoursFor2k =
      clampedRate > 0 ? Math.ceil(2000 / (1 - feePct) / clampedRate / weeksPerMonth) : 0;
    const hoursFor5k =
      clampedRate > 0 ? Math.ceil(5000 / (1 - feePct) / clampedRate / weeksPerMonth) : 0;
    return { clampedRate, gross, net, feePct, hoursFor2k, hoursFor5k };
  }, [selectedPath, hours, rate]);

  function reload() {
    setResult(null);
    setAttempt((a) => a + 1);
  }

  return (
    <div
      id="income"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 md:py-20"
    >
      <div className="mb-8">
        <p className="font-mono text-sm text-emerald-400"># motor-de-ingresos</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Rutas de ingreso reales, verificables y con la matemática a la vista
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          10 rutas construidas sobre tus repos reales y sobre tarifas de
          mercado documentadas con fuente. Cada ruta incluye plataformas con
          sus comisiones reales, evidencia con enlace y plan de acción.
        </p>
      </div>

      {/* Advertencia honesta — obligatoria */}
      <div
        role="note"
        className="mb-8 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"
      >
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-amber-400"
          aria-hidden="true"
        />
        <div className="space-y-1 text-sm leading-relaxed text-amber-200/90">
          <p className="font-semibold text-amber-300">
            Nadie puede garantizar ingresos — ni esta app, ni ninguna.
          </p>
          <p>
            Lo que sí hay aquí: tarifas de mercado documentadas, demanda
            medida con fuentes, comisiones reales de plataformas y un plan
            paso a paso. La garantía no existe; la probabilidad se trabaja con
            datos. Si alguien te promete 2k–5k €/mes garantizados, es una
            estafa. Lo que sigue es lo real.
          </p>
        </div>
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
          <Skeleton className="h-40 w-full rounded-xl bg-zinc-800/70" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl bg-zinc-800/70" />
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Calculadora con matemática visible */}
          <Card className="border-emerald-500/20 bg-zinc-900/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
                <Calculator className="size-4 text-emerald-400" aria-hidden />
                Calculadora honesta (fórmula visible)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="min-w-0 space-y-4">
                <div>
                  <label
                    htmlFor="calc-path"
                    className="mb-1.5 block text-xs font-medium text-zinc-400"
                  >
                    Ruta
                  </label>
                  <Select
                    value={calcPath}
                    onValueChange={(v) => {
                      setCalcPath(v);
                      const p = data.items.find((x) => String(x.code) === v);
                      if (p && p.rateMinPerHour > 0) setRate(p.rateMinPerHour);
                    }}
                  >
                    <SelectTrigger
                      id="calc-path"
                      className="h-11 w-full min-w-0 border-zinc-700 bg-zinc-950 text-sm [&>span]:truncate"
                    >
                      <SelectValue placeholder="Elige una ruta" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 border-zinc-800 bg-zinc-950">
                      {data.items.map((p) => (
                        <SelectItem key={p.code} value={String(p.code)}>
                          {p.code}. {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPath && selectedPath.rateMinPerHour > 0 ? (
                  <>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <label htmlFor="calc-hours" className="font-medium text-zinc-400">
                          Horas/semana dedicadas
                        </label>
                        <span className="font-mono text-emerald-300">{hours} h</span>
                      </div>
                      <input
                        id="calc-hours"
                        type="range"
                        min={5}
                        max={MAX_HOURS}
                        step={1}
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded bg-zinc-800 accent-emerald-400"
                      />
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <label htmlFor="calc-rate" className="font-medium text-zinc-400">
                          Tarifa por hora
                        </label>
                        <span className="font-mono text-emerald-300">
                          {calc?.clampedRate ?? rate} €/h
                        </span>
                      </div>
                      <input
                        id="calc-rate"
                        type="range"
                        min={Math.max(10, selectedPath.rateMinPerHour)}
                        max={Math.max(30, selectedPath.rateMaxPerHour)}
                        step={1}
                        value={calc?.clampedRate ?? rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded bg-zinc-800 accent-emerald-400"
                      />
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Rango de mercado documentado: {selectedPath.rateMinPerHour}–
                        {selectedPath.rateMaxPerHour} €/h
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-400">
                    Esta ruta es de <strong className="text-zinc-200">producto</strong>{" "}
                    (no se cobra por hora). La matemática va por volumen de
                    ventas: revisa su ficha para el desglose real.
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm">
                {calc && selectedPath && selectedPath.rateMinPerHour > 0 ? (
                  <>
                    <p className="text-xs text-zinc-500">
                      {hours} h × {calc.clampedRate} €/h × 4,33 semanas ={" "}
                      <span className="text-zinc-300">{fmtEur(calc.gross)}</span>{" "}
                      bruto/mes
                    </p>
                    <p className="text-xs text-zinc-500">
                      − {Math.round(calc.feePct * 100)}% comisión plataforma ≈{" "}
                      <span className="text-lg font-semibold text-emerald-300">
                        {fmtEur(calc.net)} neto/mes
                      </span>
                    </p>
                    <div className="mt-3 space-y-1.5 border-t border-zinc-800 pt-3 text-xs">
                      <p className="text-zinc-400">
                        Para{" "}
                        <span className="font-semibold text-emerald-300">2.000 €/mes</span>{" "}
                        →{" "}
                        <span className="text-zinc-200">
                          {calc.hoursFor2k} h/semana a {calc.clampedRate} €/h
                        </span>
                      </p>
                      <p className="text-zinc-400">
                        Para{" "}
                        <span className="font-semibold text-emerald-300">5.000 €/mes</span>{" "}
                        →{" "}
                        <span className="text-zinc-200">
                          {calc.hoursFor5k} h/semana a {calc.clampedRate} €/h
                        </span>{" "}
                        (o subir tarifa)
                      </p>
                      <p className="pt-1 text-[11px] leading-relaxed text-amber-300/80">
                        Nota honesta: estas horas son de trabajo cobrado. Conseguir
                        clientes ocupa tiempo extra al principio — por eso el plan
                        de cada ruta empieza por un paquete concreto y un canal.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Selecciona una ruta con tarifa horaria para ver la
                    matemática completa.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rutas */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((p) => (
              <Card
                key={p.id}
                className="flex flex-col border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-emerald-500/30"
              >
                <CardHeader className="p-0 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs text-zinc-500">
                      RUTA {String(p.code).padStart(2, "0")}
                    </span>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] ${EFFORT_CLS[p.effort] ?? ""}`}
                    >
                      esfuerzo {p.effort}
                    </Badge>
                  </div>
                  <CardTitle className="pt-1 text-sm font-semibold leading-snug text-zinc-100">
                    {p.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-300"
                    >
                      {incomeCategoryLabel(p.category)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-zinc-700 text-[10px] text-zinc-400"
                    >
                      <Calendar className="mr-1 h-3 w-3" aria-hidden />
                      1er ingreso: {p.timeToFirstIncome}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 p-0">
                  <p className="line-clamp-3 text-xs leading-relaxed text-zinc-400">
                    {p.summary}
                  </p>
                  <p className="rounded-md border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-[11px] leading-relaxed text-emerald-200/90">
                    {p.realRate}
                  </p>
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    <TrendingUp className="mr-1 inline h-3 w-3" aria-hidden />
                    {p.demandLevel}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-auto h-11 border-zinc-700 bg-transparent text-xs text-zinc-200 hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-300"
                    onClick={() => setDetail(p)}
                    aria-label={`Ver plan completo de la ruta ${p.code}: ${p.title}`}
                  >
                    Ver plan y evidencias
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* Dialog detalle de ruta */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-zinc-800 bg-zinc-950 sm:rounded-xl">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6 text-left text-lg leading-snug text-zinc-100">
                  <span className="font-mono text-xs text-zinc-500">
                    RUTA {String(detail.code).padStart(2, "0")} ·{" "}
                    {incomeCategoryLabel(detail.category)}
                  </span>
                  <br />
                  {detail.title}
                </DialogTitle>
                <DialogDescription className="pt-2 text-left text-sm leading-relaxed text-zinc-400">
                  {detail.summary}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <p className="text-xs font-semibold text-zinc-300">
                    Tarifa real documentada
                  </p>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-emerald-300">
                    {detail.realRate}
                  </p>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                    <FileSearch className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                    Evidencia verificable
                  </p>
                  <ul className="space-y-2">
                    {detail.evidence.map((ev) => (
                      <li
                        key={ev.url + ev.source}
                        className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs"
                      >
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-emerald-300 hover:text-emerald-200"
                        >
                          {ev.source}
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                        <p className="mt-0.5 leading-relaxed text-zinc-400">{ev.claim}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-zinc-300">
                    Plataformas y comisiones reales
                  </p>
                  <ul className="space-y-2">
                    {detail.platforms.map((pl) => (
                      <li
                        key={pl.name}
                        className="flex flex-col gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <a
                            href={pl.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-zinc-200 hover:text-emerald-300"
                          >
                            {pl.name}
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                          <p className="text-zinc-500">{pl.note}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-amber-500/40 bg-amber-500/10 font-mono text-[10px] text-amber-300"
                        >
                          {pl.fee}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-zinc-300">
                    Plan de acción (paso a paso)
                  </p>
                  <ol className="space-y-2">
                    {detail.steps.map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-zinc-300">
                        <span className="font-mono text-emerald-400">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {detail.matchRepos.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-zinc-300">
                      Repos tuyas que sirven a esta ruta
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.matchRepos.map((r) => (
                        <a
                          key={r}
                          href={`https://github.com/belentani7/${r}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-emerald-300 transition-colors hover:border-emerald-500/40"
                        >
                          {r}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
