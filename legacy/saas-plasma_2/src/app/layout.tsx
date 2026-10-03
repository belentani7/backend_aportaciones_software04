import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SaaS Plasma — UV / Blacklight Starter',
  description:
    'Ultra-violet plasma SaaS starter built with Next.js, React Three Fiber, Framer Motion and Tailwind CSS.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-body bg-black text-milky-50 antialiased">{children}</body>
    </html>
  );
}
