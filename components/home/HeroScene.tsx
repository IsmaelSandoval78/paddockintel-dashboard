'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HeroSceneProps {
  teamColor: string;
}

const PARTICLE_COUNT = 200;
const W = 30; // world units wide
const H = 8;  // world units tall
const D = 4;  // world units deep

export default function HeroScene({ teamColor }: HeroSceneProps) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const mouseRef  = useRef({ x: 0, y: 0 });
  const colorRef  = useRef(teamColor);

  useEffect(() => { colorRef.current = teamColor; }, [teamColor]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ───────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene + Camera ─────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 6;

    // ── Geometry ───────────────────────────────────────────────────
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT);
    const sizes      = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * W;
      positions[i * 3 + 1] = (Math.random() - 0.5) * H;
      positions[i * 3 + 2] = (Math.random() - 0.5) * D;
      // Faster particles in the foreground (z > 0)
      const depth   = (positions[i * 3 + 2] + D / 2) / D; // 0..1
      velocities[i] = 0.02 + depth * 0.05;
      sizes[i]      = 0.04 + depth * 0.06;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const color    = new THREE.Color(teamColor);
    const material = new THREE.PointsMaterial({
      color,
      size: 0.08,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Mouse ──────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── Resize ─────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (!mount) return;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    // ── Animation loop ─────────────────────────────────────────────
    const camTarget = { x: 0, y: 0 };
    let raf: number;

    const tick = () => {
      raf = requestAnimationFrame(tick);

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3] += velocities[i];
        if (pos[i * 3] > W / 2) {
          pos[i * 3]     = -W / 2;
          pos[i * 3 + 1] = (Math.random() - 0.5) * H;
          pos[i * 3 + 2] = (Math.random() - 0.5) * D;
          const depth    = (pos[i * 3 + 2] + D / 2) / D;
          velocities[i]  = 0.02 + depth * 0.05;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // Smooth camera parallax — subtle 3D depth illusion
      camTarget.x += (mouseRef.current.x * 0.25  - camTarget.x) * 0.04;
      camTarget.y += (-mouseRef.current.y * 0.12 - camTarget.y) * 0.04;
      camera.rotation.y = camTarget.x;
      camera.rotation.x = camTarget.y;

      renderer.render(scene, camera);
    };
    tick();

    // ── Cleanup ────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // teamColor applied via colorRef; scene is created once

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
