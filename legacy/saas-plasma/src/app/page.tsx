import Link from 'next/link';
import PlasmaBackground from '@/components/PlasmaBackground';
import { ScrollItem } from '@/components/InfiniteScroll';

const FEATURES = [
  {
    title: 'Plasma shader background',
    body: 'Real-time GLSL plasma with milky light rays, chromatic aberration and mouse-reactive flow.',
  },
  {
    title: 'Scroll choreography',
    body: 'Spring-based reveal animations, scroll progress indicator and infinite scroll primitives.',
  },
  {
    title: 'UV / blacklight design system',
    body: 'Tailwind theme with ultra-violet, plasma and milky palettes plus glassmorphism utilities.',
  },
  {
    title: 'Next.js App Router',
    body: 'React Server Components, metadata API and route-level optimization out of the box.',
  },
  {
    title: 'Framer Motion',
    body: 'Declarative animation with reduced-motion support baked into the global styles.',
  },
  {
    title: 'Deploy ready',
    body: 'Vercel, Netlify and Cloudflare Pages configurations included in the repository.',
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <PlasmaBackground className="h-full w-full" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="label mb-6">SaaS Plasma</p>
        <h1 className="headline-1 text-gradient-uv">Build in the dark. Ship in plasma.</h1>
        <p className="body-lg mt-6 max-w-2xl text-milky-400">
          A production-ready starter for immersive products: real-time shaders, cinematic motion and a
          design system tuned for ultra-violet interfaces.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#features"
            className="glass-elevated glow-uv rounded-full px-8 py-3 font-heading font-semibold text-milky-50 transition hover:scale-105"
          >
            Explore features
          </a>
          <Link
            href="/audit"
            className="glass rounded-full px-8 py-3 font-heading font-semibold text-milky-300 transition hover:text-milky-50"
          >
            Abrir Plasma Audit
          </Link>
          <a
            href="https://github.com/belentani7/saas-plasma"
            className="glass rounded-full px-8 py-3 font-heading font-semibold text-milky-300 transition hover:text-milky-50"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section id="features" className="relative mx-auto max-w-6xl px-6 py-24">
        <h2 className="section-title text-gradient-milky text-center">
          Everything the starter ships with
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <ScrollItem key={feature.title} index={index} className="glass rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold text-milky-50">{feature.title}</h3>
              <p className="body-sm mt-2 text-milky-400">{feature.body}</p>
            </ScrollItem>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-white/5 py-10 text-center">
        <p className="label">© 2026 Belentani — SaaS Plasma</p>
      </footer>
    </main>
  );
}
