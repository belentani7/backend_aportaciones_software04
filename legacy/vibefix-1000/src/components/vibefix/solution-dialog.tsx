"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  domainLabel,
  formatCode,
  severityClass,
  severityLabel,
  type SolutionDTO,
} from "./types";

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-xs uppercase tracking-wider text-emerald-400">
        &gt; {label}
      </p>
      <p className="text-sm leading-relaxed text-zinc-300">{children}</p>
    </div>
  );
}

export function SolutionDialog({
  solution,
  onClose,
}: {
  solution: SolutionDTO | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={solution !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="vf-scroll max-h-[85vh] overflow-y-auto border-zinc-800 bg-zinc-900 sm:max-w-2xl">
        {solution ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-emerald-400">
                  {formatCode(solution.code)}
                </span>
                <Badge
                  variant="outline"
                  className={severityClass(solution.severity)}
                >
                  {severityLabel(solution.severity)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-zinc-700 bg-zinc-950 font-mono text-zinc-300"
                >
                  {solution.tool}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-zinc-700 bg-zinc-950 text-zinc-400"
                >
                  {solution.environment}
                </Badge>
              </div>
              <DialogTitle className="text-left text-xl leading-snug">
                {solution.title}
              </DialogTitle>
              <DialogDescription className="text-left">
                {domainLabel(solution.category)} · frecuencia reportada{" "}
                <span className="font-mono text-emerald-300">
                  {solution.frequency}%
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <Block label="problema">{solution.problem}</Block>

              <Block label="causa raíz">{solution.rootCause}</Block>

              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-emerald-400">
                  &gt; plan de acción
                </p>
                <ol className="space-y-2">
                  {solution.steps.map((step, i) => (
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

              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-emerald-400">
                  &gt; fix de referencia
                </p>
                <pre className="vf-scroll max-h-72 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-emerald-300">
                  {solution.codeFix}
                </pre>
              </div>

              <Block label="prevención">{solution.prevention}</Block>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs leading-relaxed text-zinc-500">
                <span className="font-mono text-zinc-400">fuente:</span>{" "}
                {solution.source}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
