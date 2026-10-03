'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/audit', label: 'Audit' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/docs', label: 'Docs' },
];

function NavLogo() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.3;
      groupRef.current.rotation.x = Math.cos(t * 0.2) * 0.1;
    }
    if (meshRef.current) {
      meshRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <torusKnotGeometry args={[0.4, 0.15, 100, 16, 2, 3]} />
        <meshPhysicalMaterial
          color="#8b3eff"
          metalness={0.8}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.3}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>
      <mesh position={[0, 0, 0]} scale={1.3}>
        <torusKnotGeometry args={[0.4, 0.15, 100, 16, 3, 2]} />
        <meshPhysicalMaterial
          color="#d946ef"
          metalness={0.6}
          roughness={0.2}
          transparent
          opacity={0.3}
          transmission={0.5}
          thickness={0.3}
        />
      </mesh>
      <pointLight position={[0, 2, 2]} color="#8b3eff" intensity={2} />
      <pointLight position={[0, -2, -2]} color="#d946ef" intensity={1} />
    </group>
  );
}

function LogoCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: 36, height: 36, display: 'block' }}
    >
      <ambientLight color="#ffffff" intensity={0.5} />
      <NavLogo />
    </Canvas>
  );
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_0_40px_rgba(139,62,255,0.1)]'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-3" aria-label="Saas Plasma Home">
          <LogoCanvas />
          <span className="font-display text-xl font-bold text-gradient-uv hidden sm:block">
            SaaS Plasma
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm font-medium text-milky-400 transition-colors hover:text-milky-100 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-uv-500 after:to-plasma-500 after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="glass px-5 py-2 text-sm font-body font-medium text-milky-300 transition hover:text-milky-100 hover:glass-elevated"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="glass-elevated glow-uv px-5 py-2 text-sm font-body font-semibold text-milky-50 transition hover:scale-105"
          >
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden glass p-2 rounded-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-milky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/10 py-6 px-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-lg font-medium text-milky-400 transition hover:text-milky-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <Link
                  href="/login"
                  className="glass px-5 py-3 text-center font-body font-medium text-milky-300 transition hover:text-milky-100 hover:glass-elevated"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="glass-elevated glow-uv px-5 py-3 text-center font-body font-semibold text-milky-50 transition hover:scale-105"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Navigation;