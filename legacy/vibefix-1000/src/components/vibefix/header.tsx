"use client";

import { Badge } from "@/components/ui/badge";
import { useStats } from "./use-stats";

const NAV = [
  { href: "#github", label: "Perfil GitHub" },
  { href: "#income", label: "Ingresos" },
  { href: "#translator", label: "Traductor IA" },
  { href: "#solutions", label: "Soluciones" },
  { href: "#weekly", label: "Análisis semanal" },
  { href: "#method", label: "Metodología" },
];

export function Header() {
  const { stats } = useStats();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 md:h-16 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="#top"
            className="truncate font-mono text-lg font-semibold tracking-tight text-emerald-400 transition-colors hover:text-emerald-300"
            aria-label="VibeFix 1000 — volver arriba"
          >
            vibefix<span className="text-emerald-500">▞</span>1000
          </a>
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 font-mono text-emerald-300"
            title="Soluciones en el compendio"
          >
            {stats?.total != null ? `${stats.total} fixes` : "···"}
          </Badge>
        </div>

        <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex h-11 items-center rounded-md px-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-emerald-300"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
