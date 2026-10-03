'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

extend({ Html });

interface MetricCard3DProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

function MetricCard3DInner({ title, value, change, positive, icon, children }: MetricCard3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state) => {
    if (groupRef.current && !clicked) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.05;
      groupRef.current.rotation.x = Math.cos(t * 0.3) * 0.03;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setClicked((c) => !c)}
    >
      <mesh
        position={[0, 0, 0.01]}
        scale={hovered ? 1.02 : 1}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      >
        <planeGeometry args={[2.8, 1.8]} />
        <meshPhysicalMaterial
          color="#080808"
          metalness={0.1}
          roughness={0.3}
          transmission={0.1}
          thickness={0.1}
          ior={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      <mesh position={[0, 0, 0.02]} scale={hovered ? 1.01 : 1}>
        <planeGeometry args={[2.75, 1.75]} />
        <meshPhysicalMaterial
          color={positive ? "#0a1a0a" : "#1a0a0a"}
          metalness={0}
          roughness={0.8}
          transparent
          opacity={0.5}
        />
      </mesh>

      <Html
        transform
        position={[0, 0, 0.15]}
        style={{
          width: '280px',
          height: '180px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          pointerEvents: 'auto',
        }}
        wrapperClass="metric-card-html"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="glass p-2 rounded-lg">
            {icon}
          </div>
          <span className={`font-mono text-xs font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </span>
        </div>
        <div className="flex-1 flex flex-col justify-end">
          <p className="font-body text-sm text-milky-400 mb-1">{title}</p>
          <p className="font-display text-3xl font-bold text-milky-50">{value}</p>
        </div>
        {children && (
          <div className="mt-3 pt-3 border-t border-white/10">
            {children}
          </div>
        )}
      </Html>

      <mesh position={[0, 0, 0.12]} scale={hovered ? [1.02, 1.02, 1] : 1}>
        <planeGeometry args={[2.8, 1.8]} />
        <meshPhysicalMaterial
          color="#8b3eff"
          metalness={0}
          roughness={0}
          transparent
          opacity={hovered ? 0.1 : 0}
          emissive="#8b3eff"
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
    </group>
  );
}

export function MetricCard3D({ className = '', ...props }: MetricCard3DProps) {
  return (
    <div className={`relative w-full ${className}`} style={{ width: '100%', maxWidth: '320px', height: '200px' }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 3]} intensity={1} />
        <pointLight position={[-2, 2, 2]} color="#8b3eff" intensity={0.5} />
        <MetricCard3DInner {...props} />
      </Canvas>
    </div>
  );
}

interface Chart3DProps {
  data: number[];
  labels: string[];
  color?: string;
  className?: string;
  title?: string;
}

function Chart3DInner({ data, labels, color = '#8b3eff' }: Chart3DProps) {
  const maxValue = Math.max(...data);
  const barCount = data.length;
  const barWidth = 1.6 / barCount;

  return (
    <group position={[-0.8, -0.8, 0]}>
      {data.map((value, i) => {
        const height = (value / maxValue) * 1.6;
        return (
          <group key={i} position={[i * (barWidth * 1.5) + barWidth / 2, height / 2, 0]}>
            <mesh>
              <boxGeometry args={[barWidth * 0.8, height, 0.3]} />
              <meshPhysicalMaterial
                color={color}
                metalness={0.3}
                roughness={0.2}
                clearcoat={1}
                clearcoatRoughness={0.1}
                emissive={color}
                emissiveIntensity={0.2}
              />
            </mesh>
            <Html
              transform
              position={[0, -0.5, 0]}
              style={{ width: '60px', textAlign: 'center', pointerEvents: 'none' }}
            >
              <span className="font-mono text-xs text-milky-500">{labels[i]}</span>
            </Html>
            <Html
              transform
              position={[0, height / 2 + 0.15, 0]}
              style={{ width: '60px', textAlign: 'center', pointerEvents: 'none' }}
            >
              <span className="font-mono text-xs font-bold text-milky-300">{value.toLocaleString()}</span>
            </Html>
          </group>
        );
      })}
      <mesh position={[0.8, -0.8, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial
          color="#030303"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function Chart3D({ className = '', ...props }: Chart3DProps) {
  return (
    <div className={`relative w-full ${className}`} style={{ width: '100%', height: '300px' }}>
      <Canvas
        camera={{ position: [0, 1, 4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[2, 4, 3]} intensity={1} />
        <Chart3DInner {...props} />
      </Canvas>
    </div>
  );
}

interface Globe3DProps {
  className?: string;
  points?: Array<{ lat: number; lng: number; value: number }>;
}

function Globe3DInner({ points = [] }: Globe3DProps) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.001;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0005;
    }
  });

  const latLngToVector3 = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };

  return (
    <group>
      <mesh ref={sphereRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshPhysicalMaterial
          color="#030303"
          metalness={0.2}
          roughness={0.7}
          transparent
          opacity={0.6}
          transmission={0.2}
          thickness={0.1}
        />
      </mesh>
      
      <mesh position={[0, 0, 0]} scale={1.01}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshBasicMaterial
          color="#8b3eff"
          transparent
          opacity={0.05}
          wireframe
          side={THREE.BackSide}
        />
      </mesh>

      <Points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length * 3}
            array={new Float32Array(points.map(p => {
              const v = latLngToVector3(p.lat, p.lng, 1.25);
              return [v.x, v.y, v.z];
            }).flat())}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={points.length}
            array={new Float32Array(points.map(p => 2 + p.value * 5))}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-color"
            count={points.length}
            array={new Float32Array(points.map(() => [0.55, 0.25, 0.95]).flat())}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={`
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (200.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
              gl_FragColor = vec4(vColor, alpha * 0.8);
            }
          `}
          transparent
          depthWrite={false}
          vertexColors={true}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Html
        transform
        position={[0, -1.8, 0]}
        style={{ width: '200px', textAlign: 'center', pointerEvents: 'none' }}
      >
        <p className="font-body text-xs text-milky-400">Global Activity</p>
      </Html>
    </group>
  );
}

export function Globe3D({ className = '', ...props }: Globe3DProps) {
  return (
    <div className={`relative w-full ${className}`} style={{ width: '100%', height: '300px' }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 3]} intensity={1} />
        <pointLight position={[-2, 2, 2]} color="#8b3eff" intensity={1} />
        <Globe3DInner {...props} />
      </Canvas>
    </div>
  );
}

export default MetricCard3D;