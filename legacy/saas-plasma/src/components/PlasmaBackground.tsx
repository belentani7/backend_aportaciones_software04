'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { plasmaUniforms, plasmaVertexShader, plasmaFragmentShader } from '@/lib/plasma-shader';

// Extend Three.js with our custom shader material
const PlasmaShaderMaterial = shaderMaterial(
  plasmaUniforms as any,
  plasmaVertexShader,
  plasmaFragmentShader
);

extend({ PlasmaShaderMaterial });

// Type augmentation for React Three Fiber
declare module '@react-three/fiber' {
  interface ThreeElements {
    plasmaShaderMaterial: any;
  }
}

interface PlasmaBackgroundProps {
  className?: string;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  showGrain?: boolean;
  showScanlines?: boolean;
  children?: React.ReactNode;
}

export function PlasmaBackground({
  className = '',
  quality = 'auto',
  showGrain = true,
  showScanlines = true,
  children,
}: PlasmaBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0 });
  const lastTimeRef = useRef(performance.now());

  // Detect low power device
  useEffect(() => {
    const checkLowPower = () => {
      const isLow = 
        window.innerWidth < 768 ||
        navigator.hardwareConcurrency <= 4 ||
        /Android|iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
      setIsLowPower(isLow);
    };
    checkLowPower();
    window.addEventListener('resize', checkLowPower);
    return () => window.removeEventListener('resize', checkLowPower);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const qualitySettings = useMemo(() => {
    if (quality === 'low' || isLowPower) {
      return { dpr: [1, 1.5] as [number, number], aa: false, qualityLevel: 0.5 };
    }
    if (quality === 'high') {
      return { dpr: [1, 2] as [number, number], aa: true, qualityLevel: 1.0 };
    }
    // auto
    return { dpr: [1, 2] as [number, number], aa: true, qualityLevel: isLowPower ? 0.5 : 1.0 };
  }, [quality, isLowPower]);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
        mouseRef.current.vx = (mouseRef.current.x - mouseRef.current.lastX) / dt * 16;
        mouseRef.current.vy = (mouseRef.current.y - mouseRef.current.lastY) / dt * 16;
        mouseRef.current.lastX = mouseRef.current.x;
        mouseRef.current.lastY = mouseRef.current.y;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const now = performance.now();
        const dt = now - lastTimeRef.current;
        lastTimeRef.current = now;
        
        mouseRef.current.x = touch.clientX - rect.left;
        mouseRef.current.y = touch.clientY - rect.top;
        mouseRef.current.vx = (mouseRef.current.x - mouseRef.current.lastX) / dt * 16;
        mouseRef.current.vy = (mouseRef.current.y - mouseRef.current.lastY) / dt * 16;
        mouseRef.current.lastX = mouseRef.current.x;
        mouseRef.current.lastY = mouseRef.current.y;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      style={{ position: 'relative', width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      {mounted && (
        <div className="absolute inset-0 -z-10">
          <Canvas
            camera={{ position: [0, 0, 1], fov: 75, near: 0.1, far: 1000 }}
            gl={{ 
              antialias: qualitySettings.aa, 
              alpha: true,
              preserveDrawingBuffer: false,
              powerPreference: 'high-performance',
            }}
            dpr={qualitySettings.dpr}
            style={{ width: '100%', height: '100%', display: 'block' }}
            shadows={false}
          >
            <PlasmaPlane qualityLevel={qualitySettings.qualityLevel} mouse={mouseRef.current} />
          </Canvas>
          
          {/* Gradient overlay for text readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />
          
          {/* Milky light rays overlay */}
          <div className="milky-rays" />
        </div>
      )}

      {/* Film grain overlay */}
      {showGrain && mounted && (
        <div className="grain pointer-events-none absolute inset-0 -z-5" aria-hidden="true" />
      )}

      {/* Scanlines overlay */}
      {showScanlines && mounted && (
        <div className="scanlines pointer-events-none absolute inset-0 -z-5" aria-hidden="true" />
      )}

      {/* UV Grid subtle overlay */}
      {mounted && (
        <div className="uv-grid pointer-events-none absolute inset-0 -z-5 opacity-30" aria-hidden="true" />
      )}

      {children}
    </div>
  );
}

function PlasmaPlane({ qualityLevel, mouse }: { qualityLevel: number; mouse: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (!materialRef.current) return;
    
    const { clock, size } = state;
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uResolution.value = [size.width, size.height];
    materialRef.current.uniforms.uMouse.value = [mouse.x, mouse.y];
    materialRef.current.uniforms.uMouseVel.value = [mouse.vx, mouse.vy];
    materialRef.current.uniforms.uQuality.value = qualityLevel;
    
    // Adjust intensity based on quality
    materialRef.current.uniforms.uOpacity.value = 0.55 * qualityLevel;
    materialRef.current.uniforms.uMilkyIntensity.value = 0.4 * qualityLevel;
    materialRef.current.uniforms.uPlasmaIntensity.value = 0.6 * qualityLevel;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -0.5]}>
      <planeGeometry args={[2, 2]} />
      <plasmaShaderMaterial 
        ref={materialRef} 
        side={THREE.DoubleSide} 
        transparent 
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default PlasmaBackground;