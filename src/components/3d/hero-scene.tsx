'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function FloatingShape({ position, color, speed = 1, distort = 0.5 }: { position: [number, number, number], color: string, speed?: number, distort?: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1 * speed;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2 * speed;
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={meshRef} position={position}>
                <sphereGeometry args={[1, 64, 64]} />
                <MeshDistortMaterial
                    color={color}
                    envMapIntensity={1}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    metalness={0.1}
                    roughness={0.1}
                    distort={distort}
                    speed={2}
                    transparent={true}
                    opacity={0.8}
                />
            </mesh>
        </Float>
    );
}

export function HeroScene() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none fade-in-0 duration-1000">
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} color="#6366f1" />
                <directionalLight position={[-10, 5, 5]} intensity={0.5} color="#06b6d4" />

                {/* Environment for reflections */}
                <Environment preset="city" />

                {/* Floating Abstract Shapes */}
                <group position={[3, 1, 0]}>
                    <FloatingShape position={[0, 0, 0]} color="#4f46e5" speed={1.2} distort={0.4} />
                </group>

                <group position={[-3, -1, -2]}>
                    <FloatingShape position={[0, 0, 0]} color="#06b6d4" speed={0.8} distort={0.6} />
                </group>

                <group position={[0, 2, -5]}>
                    <FloatingShape position={[0, 0, 0]} color="#c026d3" speed={0.5} distort={0.3} />
                </group>

            </Canvas>
        </div>
    );
}
