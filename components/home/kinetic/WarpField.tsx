'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WarpFieldProps {
  teamColor: string;   // hex — tint for a fraction of the streaks
  density?: number;    // particle count override (mobile passes fewer)
}

// World bounds
const W = 36;   // spread X
const H = 14;   // spread Y
const NEAR = 7; // recycle past this z
const FAR = -50;

export default function WarpField({ teamColor, density = 320 }: WarpFieldProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // WebGL unavailable — paper substrate stays, page intact
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55, mount.clientWidth / mount.clientHeight, 0.1, 120,
    );
    camera.position.z = NEAR + 1;

    const N = density;

    // Each streak = a line segment along z: [head, tail]
    const positions  = new Float32Array(N * 2 * 3);
    const colors     = new Float32Array(N * 2 * 3);
    const velocities = new Float32Array(N);

    // Near-black ink, tuned for the light paper background (#F4F4F0).
    const ink  = new THREE.Color(0x0a0a0a);
    const team = new THREE.Color(teamColor);
    const red  = new THREE.Color(0xe61919);

    const seed = (i: number, randomZ: boolean) => {
      const x = (Math.random() - 0.5) * W;
      const y = (Math.random() - 0.5) * H;
      const z = randomZ ? FAR + Math.random() * (NEAR - FAR) : FAR;
      velocities[i] = 0.06 + Math.random() * 0.14;

      const o = i * 6;
      positions[o]     = x; positions[o + 1] = y; positions[o + 2] = z;
      positions[o + 3] = x; positions[o + 4] = y; positions[o + 5] = z - 1;

      // 78% ink · 14% team color · 8% race red
      const r = Math.random();
      const c = r < 0.78 ? ink : r < 0.92 ? team : red;
      colors[o]     = c.r; colors[o + 1] = c.g; colors[o + 2] = c.b;
      colors[o + 3] = c.r; colors[o + 4] = c.g; colors[o + 5] = c.b;
    };
    for (let i = 0; i < N; i++) seed(i, true);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent:  true,
      opacity:      0.32,
    });
    scene.add(new THREE.LineSegments(geometry, material));

    // ── Scroll velocity → warp boost ───────────────────────────────
    let lastScrollY = window.scrollY;
    let boost = 0;
    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      boost = Math.min(boost + dy * 0.012, 7);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Mouse parallax ─────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const ro = new ResizeObserver(() => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    // ── Loop ───────────────────────────────────────────────────────
    const cam = { x: 0, y: 0 };
    let raf: number;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      boost *= 0.94; // decay back to cruise speed

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < N; i++) {
        const o = i * 6;
        const v = velocities[i] * (1 + boost);
        pos[o + 2] += v;
        // Tail stretches with speed — the streak IS the velocity
        pos[o + 5] = pos[o + 2] - (0.6 + v * 9);
        if (pos[o + 2] > NEAR) seed(i, false);
      }
      geometry.attributes.position.needsUpdate = true;

      cam.x += (mouse.x * 0.6 - cam.x) * 0.035;
      cam.y += (-mouse.y * 0.35 - cam.y) * 0.035;
      camera.position.x = cam.x;
      camera.position.y = cam.y;
      camera.lookAt(0, 0, FAR / 2);

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // scene built once; teamColor only affects initial tint distribution

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />;
}
