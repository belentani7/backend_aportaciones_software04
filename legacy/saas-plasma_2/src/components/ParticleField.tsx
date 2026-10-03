'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { Points, BufferGeometry, BufferAttribute, ShaderMaterial, AdditiveBlending } from 'three';

extend({ Points, BufferGeometry, BufferAttribute, ShaderMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    points: any;
    bufferGeometry: any;
    bufferAttribute: any;
    shaderMaterial: any;
  }
}

const particleVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  varying float vSize;
  uniform float uTime;
  uniform float uProgress;
  
  void main() {
    vColor = customColor;
    vSize = size;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    float dist = length(mvPosition.xyz);
    float pulse = sin(uTime * 2.0 + dist * 10.0) * 0.5 + 0.5;
    
    gl_PointSize = size * (300.0 / -mvPosition.z) * (0.5 + pulse * 0.5) * uProgress;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vSize;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= smoothstep(0.5, 0.0, dist);
    
    vec3 color = vColor;
    float glow = 1.0 - dist * 2.0;
    color += vec3(glow * 0.5);
    
    gl_FragColor = vec4(color, alpha * 0.8);
  }
`;

function ParticleSystem({ count = 3000, color1 = '#8b3eff', color2 = '#d946ef', color3 = '#f4f4f5' }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const c3 = new THREE.Color(color3);
    
    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
      
      sizes[i] = 0.5 + Math.random() * 2;
      
      const t = Math.random();
      let color;
      if (t < 0.33) color = c1;
      else if (t < 0.66) color = c2;
      else color = c3;
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions: arr, sizes, colors };
  }, [count, color1, color2, color3]);
  
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  
  if (!geometryRef.current) {
    geometryRef.current = new THREE.BufferGeometry();
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions.positions, 3));
    geometryRef.current.setAttribute('size', new THREE.BufferAttribute(positions.sizes, 1));
    geometryRef.current.setAttribute('customColor', new THREE.BufferAttribute(positions.colors, 3));
  }
  
  return (
    <points>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 1 },
        }}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        vertexColors={true}
      >
        <primitive
          object={geometryRef.current}
          dispose={null}
        />
      </shaderMaterial>
    </points>
  );
}

interface ParticleFieldProps {
  className?: string;
  count?: number;
  color1?: string;
  color2?: string;
  color3?: string;
}

export function ParticleField({ 
  className = '', 
  count = 2000, 
  color1 = '#8b3eff', 
  color2 = '#d946ef', 
  color3 = '#f4f4f5' 
}: ParticleFieldProps) {
  return (
    <div className={`relative w-full h-full ${className}`} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#000000']} />
        <ParticleSystem count={count} color1={color1} color2={color2} color3={color3} />
      </Canvas>
    </div>
  );
}

function OrbitalParticles({ count = 1000, radius = 3, speed = 0.5 }) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  if (!geometryRef.current) {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const orbits = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    
    const c1 = new THREE.Color('#8b3eff');
    const c2 = new THREE.Color('#d946ef');
    const c3 = new THREE.Color('#e879f9');
    
    for (let i = 0; i < count; i++) {
      const r = radius * (0.5 + Math.random() * 0.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      sizes[i] = 1 + Math.random() * 3;
      
      const t = Math.random();
      let color = c1.lerp(c2, t).lerp(c3, t * 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      orbits[i * 3] = (Math.random() - 0.5) * 0.5;
      orbits[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      orbits[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    geometryRef.current = new THREE.BufferGeometry();
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometryRef.current.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometryRef.current.setAttribute('orbit', new THREE.BufferAttribute(orbits, 3));
    geometryRef.current.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  }
  
  useFrame((state) => {
    if (!geometryRef.current || !materialRef.current) return;
    
    const positions = geometryRef.current.getAttribute('position');
    const orbits = geometryRef.current.getAttribute('orbit');
    const phases = geometryRef.current.getAttribute('phase');
    
    if (positions && orbits && phases) {
      const t = state.clock.elapsedTime * speed;
      
      for (let i = 0; i < count; i++) {
        const phase = phases.getX(i);
        const ox = orbits.getX(i);
        const oy = orbits.getY(i);
        const oz = orbits.getZ(i);
        
        positions.setX(i, positions.getX(i) + Math.sin(t + phase) * ox * 0.01);
        positions.setY(i, positions.getY(i) + Math.cos(t + phase) * oy * 0.01);
        positions.setZ(i, positions.getZ(i) + Math.sin(t * 0.7 + phase) * oz * 0.01);
      }
      
      positions.needsUpdate = true;
    }
    
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  const orbitalVertexShader = `
    attribute float size;
    attribute vec3 customColor;
    attribute vec3 orbit;
    attribute float phase;
    varying vec3 vColor;
    varying float vSize;
    uniform float uTime;
    
    void main() {
      vColor = customColor;
      vSize = size;
      
      vec3 pos = position;
      pos.x += sin(uTime + phase) * orbit.x;
      pos.y += cos(uTime + phase) * orbit.y;
      pos.z += sin(uTime * 0.7 + phase) * orbit.z;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      gl_PointSize = size * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  
  const orbitalFragmentShader = `
    varying vec3 vColor;
    varying float vSize;
    
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      
      vec3 color = vColor;
      float glow = 1.0 - dist * 2.0;
      color += vec3(glow * 0.3);
      
      gl_FragColor = vec4(color, alpha * 0.9);
    }
  `;
  
  return (
    <points>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={orbitalVertexShader}
        fragmentShader={orbitalFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        vertexColors={true}
      />
    </points>
  );
}

interface OrbitalFieldProps {
  className?: string;
  count?: number;
  radius?: number;
  speed?: number;
}

export function OrbitalField({ 
  className = '', 
  count = 800, 
  radius = 4, 
  speed = 0.3 
}: OrbitalFieldProps) {
  return (
    <div className={`relative w-full h-full ${className}`} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#000000']} />
        <OrbitalParticles count={count} radius={radius} speed={speed} />
      </Canvas>
    </div>
  );
}

export default ParticleField;