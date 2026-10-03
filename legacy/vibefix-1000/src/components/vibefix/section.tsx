"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Envoltura de sección con ancla, animación de entrada sutil y
 * cabecera con eyebrow estilo terminal (# seccion).
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 md:py-20"
    >
      <div className="mb-8">
        <p className="font-mono text-sm text-emerald-400">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </motion.section>
  );
}
