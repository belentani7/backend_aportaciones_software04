import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PLASMA AUDIT — Auditoria 100 de repositorios',
  description:
    'Audita cualquier repositorio de GitHub: score documental y de produccion (SDD, CI, tests, seguridad, deploy) con Next.js y la API de GitHub.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-body bg-black text-milky-50 antialiased">{children}</body>
    </html>
  );
}
