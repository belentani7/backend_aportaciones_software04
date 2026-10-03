"use client";

import { useEffect, useState } from "react";
import { Check, Copy, History, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchJson, tierMeta, type TranslationDTO, type TranslationHistoryResponse, type TranslationResponse } from "./types";

const TARGETS = [
  { value: "claude-code", label: "Claude Code" },
  { value: "cursor", label: "Cursor" },
  { value: "chatgpt", label: "ChatGPT / GPT" },
  { value: "generico", label: "Genérico (cualquier IA)" },
];

const PLACEHOLDER =
  "Ej: hola necesito que me hagas una web para vender mis cuadros con carrito y colores bonitos, algo moderno...";

export function TranslatorSection() {
  const [text, setText] = useState("");
  const [target, setTarget] = useState("claude-code");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationDTO | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<TranslationDTO[]>([]);

  async function loadHistory() {
    try {
      const res = await fetchJson<TranslationHistoryResponse>(
        "/api/translate?limit=6"
      );
      setHistory(res.items);
    } catch {
      // historial no crítico
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function translate() {
    if (text.trim().length < 10) {
      setError("Escribe al menos 10 caracteres describiendo lo que quieres.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetchJson<TranslationResponse>("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), target }),
      });
      setResult(res.item);
      void loadHistory();
    } catch {
      setError("No se pudo traducir. Inténtalo de nuevo en unos segundos.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPrompt() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.aiPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar: tu navegador bloqueó el portapapeles.");
    }
  }

  const tier = result ? tierMeta(result.tier) : null;

  return (
    <div
      id="translator"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 md:py-20"
    >
      <div className="mb-8">
        <p className="font-mono text-sm text-emerald-400"># traductor-humano-ia</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Traductor de lenguaje humano → lenguaje de la IA
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Tu idea de LinguaForge/Meta-Skill hecha herramienta viva: escribe lo
          que quieres en lenguaje normal y recibe un prompt estructurado
          (rol, contexto, tarea, restricciones, formato) listo para pegar en
          tu agente. Cada traducción sugiere además el tier de modelo según
          el enrutado de meta-skill.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Entrada */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-200">
              1 · Escribe en humano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              aria-label="Texto en lenguaje humano a traducir"
              rows={7}
              maxLength={4000}
              className="resize-none border-zinc-800 bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-emerald-500/40"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="translator-target"
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  Herramienta de destino
                </label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger
                    id="translator-target"
                    className="h-11 border-zinc-700 bg-zinc-950 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-950">
                    {TARGETS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={translate}
                disabled={submitting}
                className="h-11 bg-emerald-500 px-5 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
                aria-label="Traducir al lenguaje de la IA"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Traduciendo…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" aria-hidden />
                    Traducir
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-zinc-600">
              {text.length}/4000 caracteres · cada traducción queda en el
              historial
            </p>
            {error ? (
              <p role="alert" className="text-xs text-rose-300">
                {error}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Salida */}
        <Card className="border-emerald-500/20 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm text-zinc-200">
                2 · Prompt en lenguaje de IA
              </CardTitle>
              {result && tier ? (
                <Badge
                  variant="outline"
                  className={`shrink-0 font-mono text-[10px] ${tier.cls}`}
                  title={result.tierHint ?? tier.hint}
                >
                  {tier.label}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!result && !submitting ? (
              <p className="rounded-md border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-600">
                El prompt estructurado aparecerá aquí: rol, contexto, tarea,
                restricciones y formato de salida.
              </p>
            ) : null}
            {submitting ? (
              <div className="space-y-2" aria-busy="true">
                {[80, 60, 70, 50].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded bg-zinc-800"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            ) : null}
            {result ? (
              <>
                <dl className="grid gap-2 text-xs">
                  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2.5">
                    <dt className="font-mono text-[10px] uppercase text-emerald-400">
                      rol
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-zinc-300">
                      {result.framework.role}
                    </dd>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2.5">
                    <dt className="font-mono text-[10px] uppercase text-emerald-400">
                      contexto
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-zinc-300">
                      {result.framework.context}
                    </dd>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2.5">
                    <dt className="font-mono text-[10px] uppercase text-emerald-400">
                      tarea
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-zinc-300">
                      {result.framework.task}
                    </dd>
                  </div>
                  {result.framework.constraints.length > 0 ? (
                    <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2.5">
                      <dt className="font-mono text-[10px] uppercase text-emerald-400">
                        restricciones
                      </dt>
                      <dd>
                        <ul className="mt-1 list-inside list-disc space-y-0.5 text-zinc-300">
                          {result.framework.constraints.map((c, i) => (
                            <li key={i} className="leading-relaxed">
                              {c}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  ) : null}
                  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2.5">
                    <dt className="font-mono text-[10px] uppercase text-emerald-400">
                      formato de salida
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-zinc-300">
                      {result.framework.outputFormat}
                    </dd>
                  </div>
                </dl>

                <div className="rounded-md border border-emerald-500/25 bg-zinc-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase text-emerald-400">
                      prompt final (copiar)
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPrompt}
                      className="h-8 border-zinc-700 px-2.5 text-xs text-zinc-300 hover:text-emerald-300"
                      aria-label="Copiar prompt final al portapapeles"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3.5 text-emerald-400" aria-hidden />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" aria-hidden />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="vf-scroll max-h-48 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-emerald-200/90">
                    {result.aiPrompt}
                  </pre>
                </div>
                {tier ? (
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    <span className={`mr-1.5 font-semibold ${tier.cls.split(" ").pop()}`}>
                      {tier.label}:
                    </span>
                    {result.tierHint ?? tier.hint}
                  </p>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Historial */}
      {history.length > 0 ? (
        <Card className="mt-4 border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-200">
              <History className="size-4 text-zinc-400" aria-hidden />
              Traducciones recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="vf-scroll grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1">
              {history.map((h) => (
                <li key={h.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setText(h.humanInput);
                      setResult(h);
                      setCopied(false);
                      setError(null);
                    }}
                    className="w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 p-2.5 text-left transition-colors hover:border-emerald-500/30"
                  >
                    <span className="line-clamp-1 text-xs text-zinc-300">
                      {h.humanInput}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-zinc-600">
                      tier: {h.tier} ·{" "}
                      {new Date(h.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
