import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronRight, CircleDot, LockKeyhole, ShieldCheck, Sparkles, Workflow } from "lucide-react";

const heroImage = "/manus-storage/noiacore_duck_jewel_hero_bb37deed.png";

const pillars = [
  {
    icon: Workflow,
    eyebrow: "01 · ORQUESTRAÇÃO",
    title: "Escalas que entendem a operação",
    copy: "Planeje jornadas 24/7 com visibilidade de cobertura, troca de turnos e decisões guiadas por regras.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "02 · COMPLIANCE",
    title: "CLT & eSocial no fluxo",
    copy: "Transforme limites de jornada, descansos e eventos de folha em controles operacionais rastreáveis.",
  },
  {
    icon: LockKeyhole,
    eyebrow: "03 · EVIDÊNCIA",
    title: "Cada decisão deixa rastro",
    copy: "Ledger imutável, segregação por tenant e confirmação das zonas críticas para operar com confiança.",
  },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen overflow-hidden bg-[#071712] text-[#f0f7ef] selection:bg-emerald-300 selection:text-[#071712]">
      <div className="pointer-events-none fixed inset-0 opacity-50 [background-image:linear-gradient(rgba(153,255,198,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(153,255,198,.05)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a href="/" className="flex items-center gap-3" aria-label="Docker Workforce home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-200 shadow-[0_0_28px_rgba(110,231,183,.16)]">
            <CircleDot className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.24em] text-emerald-100">DOCKER</span>
            <span className="block text-[10px] uppercase tracking-[0.32em] text-emerald-200/60">Workforce OS</span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-emerald-50/65 md:flex" aria-label="Primary navigation">
          <a href="#platform" className="transition-colors hover:text-emerald-100">Plataforma</a>
          <a href="#control" className="transition-colors hover:text-emerald-100">Controle</a>
          <a href="#partner" className="transition-colors hover:text-emerald-100">Para operações</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="https://noiacore.com" target="_blank" rel="noreferrer" className="hidden text-xs uppercase tracking-[0.2em] text-emerald-100/50 transition-colors hover:text-emerald-100 sm:block">NoiaCore</a>
          {isAuthenticated ? (
            <Button asChild className="rounded-full bg-emerald-300 px-5 text-[#071712] hover:bg-emerald-200">
              <a href="/dashboard">Command Center <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          ) : (
            <Button onClick={() => startLogin()} disabled={loading} className="rounded-full bg-emerald-300 px-5 text-[#071712] hover:bg-emerald-200">
              {loading ? "Carregando…" : "Acessar plataforma"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-12 lg:grid-cols-[1.04fr_.96fr] lg:px-10 lg:pb-28 lg:pt-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-200/[0.06] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-emerald-200/80">
              <Sparkles className="h-3.5 w-3.5" /> Brazilian workforce intelligence · PT-BR / EN
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.97] tracking-[-0.055em] text-white sm:text-6xl lg:text-8xl">
              Operações que
              <span className="block bg-gradient-to-r from-emerald-100 via-emerald-300 to-teal-400 bg-clip-text text-transparent">não perdem o ritmo.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-emerald-50/65 sm:text-xl">
              Docker Workforce conecta escalas 24/7, compliance CLT/eSocial e evidência operacional em um único command center para empresas que não podem parar.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => isAuthenticated ? window.location.assign("/dashboard") : startLogin()} className="h-12 rounded-full bg-emerald-300 px-6 text-base font-semibold text-[#071712] hover:bg-emerald-200">
                {isAuthenticated ? "Abrir Command Center" : "Iniciar uma conversa"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a href="#platform" className="inline-flex h-12 items-center justify-center rounded-full border border-emerald-100/15 px-6 text-sm font-medium text-emerald-50/80 transition-colors hover:border-emerald-200/35 hover:text-white">
                Ver como funciona <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs uppercase tracking-[0.18em] text-emerald-50/42">
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Multi-tenant</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Ledger SHA-256</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> 3-node critical zones</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[540px]">
            <div className="absolute -inset-8 rounded-[3rem] bg-emerald-300/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.2rem] border border-emerald-100/15 bg-[#0d251d] p-3 shadow-[0_28px_100px_rgba(0,0,0,.46)]">
              <div className="relative overflow-hidden rounded-[1.7rem] border border-emerald-100/10 bg-[#112f25]">
                <img src={heroImage} alt="Duck Jewel, a joia central do universo NoiaCore" className="aspect-[4/5] w-full object-cover opacity-90 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071712] via-transparent to-emerald-300/10" />
                <div className="absolute left-6 right-6 top-6 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-emerald-100/55">
                  <span>Node 01 · Verve</span><span>Secure / Live</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-200/65"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" /> First Guardian Protocol</div>
                  <p className="max-w-xs text-2xl font-medium leading-tight text-white">A joia é a operação. A prova é o rastro.</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-emerald-100/15 bg-[#0b211a]/90 px-4 py-3 backdrop-blur md:block">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/45">Critical zone</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-100"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Quorum confirmed</div>
            </div>
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-7xl border-t border-emerald-100/10 px-6 py-16 lg:px-10 lg:py-24">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Uma camada operacional, não mais uma tela</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Do primeiro turno à última evidência.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-emerald-50/50">Um sistema construído para RH, operações, contabilidade e liderança decidirem com a mesma fonte de verdade.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.eyebrow} className="group rounded-[1.6rem] border border-emerald-100/10 bg-emerald-50/[0.035] p-6 transition-colors hover:border-emerald-200/25 hover:bg-emerald-50/[0.07]">
                <pillar.icon className="h-6 w-6 text-emerald-300" />
                <p className="mt-10 text-[10px] uppercase tracking-[0.2em] text-emerald-200/55">{pillar.eyebrow}</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-emerald-50/55">{pillar.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="control" className="mx-auto grid max-w-7xl gap-6 border-t border-emerald-100/10 px-6 py-16 lg:grid-cols-[.85fr_1.15fr] lg:px-10 lg:py-24">
          <div className="rounded-[1.7rem] border border-emerald-100/10 bg-[#0d251d] p-7 sm:p-9">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Operational signal</p>
            <div className="mt-10 space-y-5">
              {[["Cobertura", "94%", "+12% vs. ontem"], ["Regras críticas", "02", "requerem atenção"], ["Eventos rastreados", "1.284", "cadeia íntegra"]].map(([label, value, note]) => (
                <div key={label} className="flex items-end justify-between border-b border-emerald-100/10 pb-5 last:border-0 last:pb-0">
                  <div><div className="text-sm text-emerald-50/55">{label}</div><div className="mt-1 text-xs text-emerald-200/35">{note}</div></div>
                  <div className="text-3xl font-semibold tracking-[-0.05em] text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div id="partner" className="rounded-[1.7rem] border border-emerald-300/15 bg-gradient-to-br from-emerald-300/15 via-emerald-100/[0.04] to-transparent p-7 sm:p-9">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Para empresas que cuidam do detalhe</p>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl">A próxima operação começa quando todos sabem o que fazer.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-emerald-50/60">O Docker Workforce organiza a complexidade sem apagar o contexto humano. Português e English na mesma camada, com uma base pronta para o Brasil inteiro.</p>
            <a href="mailto:duck-beats@hotmail.com?subject=Docker%20Workforce%20-%20pr%C3%B3ximos%20passos" className="mt-8 inline-flex items-center text-sm font-semibold text-emerald-200 transition-colors hover:text-white">Falar sobre uma operação-piloto <ArrowRight className="ml-2 h-4 w-4" /></a>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 border-t border-emerald-100/10 px-6 py-8 text-xs text-emerald-50/35 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <span>Docker Workforce · A NoiaCore operational system</span>
        <span>Authorship: belentani.eu · noiacore.com</span>
      </footer>
    </div>
  );
}
