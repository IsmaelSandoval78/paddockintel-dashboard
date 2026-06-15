'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ShapeUtils, Vector2 } from 'three';
import { gsap } from 'gsap';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry, Feature } from 'geojson';
import type { Circuit } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────

const DEG          = Math.PI / 180;
const R            = 1;
const CAM_Z        = 2.7;
const DOT_R_ACTIVE = 0.016;
const DOT_R_HIST   = 0.011;
const DOT_R_SEL    = 1.8;
const AUTO_SPEED   = 0.0010;

const REGION_VIEW: Record<string, { lat: number; lng: number }> = {
  all:              { lat: 30,  lng: -30 },
  europe:           { lat: 50,  lng:  10 },
  americas:         { lat: 10,  lng: -80 },
  asia:             { lat: 25,  lng: 100 },
  africaMiddleEast: { lat: 10,  lng:  35 },
  oceania:          { lat: -25, lng: 135 },
};

// ─── Coordinate helpers ───────────────────────────────────────────

// lat/lng → 3D point on sphere — same formula used for circuit dots
// theta is negated so East longitude appears to the right from the camera
function toV3(lat: number, lng: number, r = R): THREE.Vector3 {
  const phi   = (90 - lat) * DEG;
  const theta = -lng * DEG;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function toRot(lat: number, lng: number) {
  return {
    y: -Math.PI / 2 - lng * DEG,
    x: -lat * DEG * 0.45,
  };
}

// ─── Build globe geometry from TopoJSON (3D polygons, no UV/texture) ──
// Since we use the same toV3() as the circuit dots, orientation is
// guaranteed correct — no UV mapping to worry about.

async function buildCountryMeshes(scene: THREE.Group) {
  const raw      = await import('world-atlas/countries-110m.json');
  const topo     = raw.default as unknown as Topology<{ countries: GeometryCollection }>;
  const geojson  = feature(topo, topo.objects.countries) as FeatureCollection;

  const LAND_R   = R * 1.004;
  const LINE_R   = R * 1.008;

  const landMat   = new THREE.MeshBasicMaterial({ color: 0xe5e3dc, side: THREE.DoubleSide });
  const borderMat = new THREE.LineBasicMaterial({ color: 0xb5b4ae });

  function buildPolygon(ring: number[][]): { mesh: THREE.Mesh | null; line: THREE.Line } {
    const pts3d = ring.map(([lng, lat]) => toV3(lat, lng, LAND_R));

    // Earcut triangulation via ShapeUtils — triangles span adjacent boundary
    // vertices (~1-3° apart) so they never dip below the ocean sphere.
    // Centroid-fan was causing dipping because centroid→boundary edges span 20-40°.
    const pts2d = ring.map(([lng, lat]) => new Vector2(lng, lat));
    let mesh: THREE.Mesh | null = null;
    try {
      const tris = ShapeUtils.triangulateShape(pts2d, []);
      if (tris.length) {
        const verts: number[] = [];
        for (const [a, b, c] of tris) {
          const pa = pts3d[a], pb = pts3d[b], pc = pts3d[c];
          verts.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z, pc.x, pc.y, pc.z);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        mesh = new THREE.Mesh(geo, landMat);
      }
    } catch {
      // skip degenerate polygons
    }

    // Border line
    const linePts = ring.map(([lng, lat]) => toV3(lat, lng, LINE_R));
    linePts.push(linePts[0]);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
    const line = new THREE.Line(lineGeo, borderMat);

    return { mesh, line };
  }

  function processFeature(f: Feature<Geometry>) {
    if (!f.geometry) return;
    const geom = f.geometry;

    const rings: number[][][] = [];
    if (geom.type === 'Polygon') {
      rings.push(...(geom.coordinates as number[][][]));
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((poly) => rings.push(...(poly as number[][][])));
    }

    rings.forEach((ring) => {
      const { mesh, line } = buildPolygon(ring);
      if (mesh) scene.add(mesh);
      scene.add(line);
    });
  }

  geojson.features.forEach(processFeature);
}

// ─── Component ────────────────────────────────────────────────────

interface Props {
  circuits: Circuit[];
  onSelect: (circuit: Circuit) => void;
  targetRegion: string;
  selectedId: number | null;
}

export default function GlobeClient({ circuits, onSelect, targetRegion, selectedId }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const globeRef      = useRef<THREE.Group | null>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const meshMapRef    = useRef(new Map<number, THREE.Mesh>());
  const dotCircuitRef = useRef(new Map<THREE.Mesh, Circuit>());
  const autoRotRef    = useRef(true);
  const rafRef        = useRef(0);
  const selIdRef      = useRef<number | null>(null);
  const dragRef       = useRef({ active: false, x: 0, y: 0, dist: 0 });
  const onSelectRef   = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // ── Init scene (once) ──────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el || rendererRef.current) return;

    const W = el.clientWidth  || 400;
    const H = el.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.z = CAM_Z;

    // ── Globe group ────────────────────────────────────────────────
    const globe = new THREE.Group();
    scene.add(globe);
    globeRef.current = globe;

    const init = toRot(REGION_VIEW.all.lat, REGION_VIEW.all.lng);
    globe.rotation.y = init.y;
    globe.rotation.x = init.x;

    // ── Ocean sphere — editorial water, not blue-tech ─────────────
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R, 72, 72),
      new THREE.MeshBasicMaterial({ color: 0xc0cdd4 }),
    ));

    // ── Country land + borders (async) ─────────────────────────────
    buildCountryMeshes(globe);

    // ── Circuit dots ──────────────────────────────────────────────
    const matActive = new THREE.MeshBasicMaterial({ color: 0xe10600 });
    const matHist   = new THREE.MeshBasicMaterial({ color: 0xb5b4ae });
    const geoActive = new THREE.SphereGeometry(DOT_R_ACTIVE, 10, 10);
    const geoHist   = new THREE.SphereGeometry(DOT_R_HIST,    8,  8);

    const dotMeshes: THREE.Mesh[] = [];
    circuits.forEach((c) => {
      const dot = new THREE.Mesh(
        c.is_active ? geoActive : geoHist,
        c.is_active ? matActive : matHist,
      );
      dot.position.copy(toV3(c.lat, c.lng, R * 1.025));
      globe.add(dot);
      dotMeshes.push(dot);
      meshMapRef.current.set(c.id, dot);
      dotCircuitRef.current.set(dot, c);
    });

    // ── Raycaster ──────────────────────────────────────────────────
    const rc    = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function ndc(e: { clientX: number; clientY: number }) {
      const r = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - r.left) / r.width)  * 2 - 1;
      mouse.y = -((e.clientY - r.top)  / r.height) * 2 + 1;
    }

    function hitTest(): Circuit | null {
      rc.setFromCamera(mouse, camera);
      const hits = rc.intersectObjects(dotMeshes);
      return hits.length ? (dotCircuitRef.current.get(hits[0].object as THREE.Mesh) ?? null) : null;
    }

    function onMove(e: MouseEvent) {
      if (dragRef.current.active) return;
      ndc(e);
      renderer.domElement.style.cursor = hitTest() ? 'pointer' : 'grab';
    }

    function onClick(e: MouseEvent) {
      if (dragRef.current.dist > 6) return;
      ndc(e);
      const circuit = hitTest();
      if (!circuit) return;
      meshMapRef.current.get(selIdRef.current ?? -1)?.scale.setScalar(1);
      meshMapRef.current.get(circuit.id)?.scale.setScalar(DOT_R_SEL);
      selIdRef.current = circuit.id;
      onSelectRef.current(circuit);
    }

    function onTouchEnd(e: TouchEvent) {
      if (dragRef.current.dist > 10) return;
      ndc(e.changedTouches[0]);
      const circuit = hitTest();
      if (!circuit) return;
      meshMapRef.current.get(selIdRef.current ?? -1)?.scale.setScalar(1);
      meshMapRef.current.get(circuit.id)?.scale.setScalar(DOT_R_SEL);
      selIdRef.current = circuit.id;
      onSelectRef.current(circuit);
    }

    // ── Drag to rotate ──────────────────────────────────────────────
    function onDown(e: MouseEvent) {
      dragRef.current = { active: true, x: e.clientX, y: e.clientY, dist: 0 };
      autoRotRef.current = false;
      renderer.domElement.style.cursor = 'grabbing';
    }
    function onUp() {
      dragRef.current.active = false;
      renderer.domElement.style.cursor = 'grab';
      setTimeout(() => { autoRotRef.current = true; }, 2000);
    }
    function onDrag(e: MouseEvent) {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      dragRef.current.dist += Math.abs(dx) + Math.abs(dy);
      globe.rotation.y -= dx * 0.004;
      globe.rotation.x  = Math.max(-1.1, Math.min(1.1, globe.rotation.x + dy * 0.004));
      dragRef.current.x  = e.clientX;
      dragRef.current.y  = e.clientY;
    }

    renderer.domElement.addEventListener('mousemove', onMove);
    renderer.domElement.addEventListener('click',     onClick);
    renderer.domElement.addEventListener('mousedown', onDown);
    renderer.domElement.addEventListener('touchend',  onTouchEnd);
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup',   onUp);

    // ── Resize ─────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    // ── Animate ────────────────────────────────────────────────────
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      if (autoRotRef.current) globe.rotation.y += AUTO_SPEED;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      renderer.domElement.removeEventListener('mousemove', onMove);
      renderer.domElement.removeEventListener('click',     onClick);
      renderer.domElement.removeEventListener('mousedown', onDown);
      renderer.domElement.removeEventListener('touchend',  onTouchEnd);
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup',   onUp);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      rendererRef.current = null;
      globeRef.current    = null;
      meshMapRef.current.clear();
      dotCircuitRef.current.clear();
    };
  }, [circuits]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Continent fly-to ───────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    const view = REGION_VIEW[targetRegion] ?? REGION_VIEW.all;
    const { y, x } = toRot(view.lat, view.lng);
    autoRotRef.current = false;
    gsap.killTweensOf(globeRef.current.rotation);
    gsap.to(globeRef.current.rotation, {
      y, x,
      duration: 1.5,
      ease: 'power3.inOut',
      onComplete: () => { autoRotRef.current = true; },
    });
  }, [targetRegion]);

  // ── Selected circuit highlight ─────────────────────────────────
  useEffect(() => {
    if (selectedId === null) {
      meshMapRef.current.forEach((dot) => dot.scale.setScalar(1));
      selIdRef.current = null;
      return;
    }
    meshMapRef.current.get(selectedId)?.scale.setScalar(DOT_R_SEL);
    selIdRef.current = selectedId;
  }, [selectedId]);

  return <div ref={containerRef} className="w-full h-full" style={{ cursor: 'grab' }} />;
}
