export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="max-w-xl leading-relaxed">
          VibeFix 1000 — construido con Next.js 16, Prisma y z-ai SDK. Análisis
          semanal generado con IA a partir de fuentes públicas.
        </p>
        <p className="shrink-0 font-mono">
          © {year} vibefix<span className="text-emerald-500">▞</span>1000
        </p>
      </div>
    </footer>
  );
}
