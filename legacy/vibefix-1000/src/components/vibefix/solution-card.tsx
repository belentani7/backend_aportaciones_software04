"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  domainLabel,
  formatCode,
  severityClass,
  severityLabel,
  type SolutionDTO,
} from "./types";

export function SolutionCard({
  solution,
  onOpen,
}: {
  solution: SolutionDTO;
  onOpen: (solution: SolutionDTO) => void;
}) {
  const tags = solution.tags.slice(0, 3);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="h-full"
    >
      <Card className="h-full gap-3 border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-emerald-500/40">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-emerald-400">
            {formatCode(solution.code)}
          </span>
          <Badge variant="outline" className={severityClass(solution.severity)}>
            {severityLabel(solution.severity)}
          </Badge>
        </div>

        <h3 className="text-base font-medium leading-snug text-zinc-100">
          {solution.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">
          {solution.problem}
        </p>

        <div className="flex flex-wrap gap-1.5">
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
          <Badge
            variant="outline"
            className="border-zinc-700 bg-zinc-950 text-zinc-400"
          >
            {domainLabel(solution.category)}
          </Badge>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-zinc-500">frecuencia reportada</span>
            <span className="font-mono text-emerald-300">
              {solution.frequency}%
            </span>
          </div>
          <Progress
            value={solution.frequency}
            aria-label={`Frecuencia reportada: ${solution.frequency}%`}
            className="h-1.5 bg-zinc-800 [&>div]:bg-emerald-400"
          />
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {tags.map((tag) => (
              <span key={tag} className="font-mono text-[11px] text-zinc-500">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <Button
          variant="outline"
          onClick={() => onOpen(solution)}
          className="mt-auto h-11 w-full border-zinc-700 bg-transparent text-zinc-200 hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-300"
          aria-haspopup="dialog"
        >
          Ver solución
        </Button>
      </Card>
    </motion.div>
  );
}
