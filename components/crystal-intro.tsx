"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const FLAG = "daily-ledger:entry-played-3d";

type Phase = "assembling" | "impact" | "docking" | "idle";

const DOCK_SIZE = 64; // px — size of the ambient badge once it settles into a corner
const DOCK_MARGIN = 20; // px

/** Randomly displaces each vertex outward along its normal so a clean cone reads as a rough, faceted rock crystal. */
function roughen(geometry: THREE.BufferGeometry, amount: number) {
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const jitter = 1 + (Math.random() - 0.5) * amount;
    v.copy(n.multiplyScalar(v.length() * jitter));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** A jagged zig-zag "lightning" line between two points, the classic recursive-midpoint-displacement bolt. */
function makeLightningGeometry(from: THREE.Vector3, to: THREE.Vector3, segments = 7, jitter = 0.16) {
  const points = [from.clone()];
  for (let i = 1; i < segments; i++) {
    const p = from.clone().lerp(to, i / segments);
    p.x += (Math.random() - 0.5) * jitter;
    p.y += (Math.random() - 0.5) * jitter;
    p.z += (Math.random() - 0.5) * jitter;
    points.push(p);
  }
  points.push(to.clone());
  return new THREE.BufferGeometry().setFromPoints(points);
}

/** Canvas-generated radial glow + streak texture used for the finale starburst sprite. */
function makeStarburstTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(190,235,255,0.85)");
  grad.addColorStop(0.6, "rgba(120,200,255,0.25)");
  grad.addColorStop(1, "rgba(80,160,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(210,240,255,0.55)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * size * 0.48, cy + Math.sin(angle) * size * 0.48);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Full-screen cinematic crystal assembly played once per session.
 * Rough dark facets fly in from every direction laced with flickering
 * lightning, weld together with a radiant flash + starburst, then the
 * whole scene shrinks into a small glowing badge parked in a corner —
 * it never blocks the page underneath.
 */
export function CrystalIntro() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("assembling");
  const [flash, setFlash] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(FLAG)) return;
    sessionStorage.setItem(FLAG, "1");
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    function computeFullRect() {
      setRect({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight });
    }
    if (phase === "assembling" || phase === "impact") {
      computeFullRect();
      window.addEventListener("resize", computeFullRect);
      return () => window.removeEventListener("resize", computeFullRect);
    }
    setRect({
      top: window.innerHeight - DOCK_SIZE - DOCK_MARGIN,
      left: window.innerWidth - DOCK_SIZE - DOCK_MARGIN,
      width: DOCK_SIZE,
      height: DOCK_SIZE,
    });
  }, [visible, phase]);

  useEffect(() => {
    if (!visible || !mountRef.current) return;
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.3, 0.8, 0.12);
    composer.addPass(bloom);

    scene.add(new THREE.AmbientLight(0x18324a, 0.55));
    const key = new THREE.PointLight(0x6fe3ff, 8, 26);
    key.position.set(3, 3, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0x3d6bff, 5, 26);
    rim.position.set(-3, -2.5, -3);
    scene.add(rim);

    // ---- background starfield, echoing the reference's deep-space backdrop ----
    const starGeo = new THREE.BufferGeometry();
    const starCount = 200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 40;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      starPos[i * 3 + 2] = -10 - Math.random() * 20;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xbfe0ff, size: 0.05, transparent: true, opacity: 0.5 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ---- the final, fully-assembled rough crystal (hidden until impact) ----
    const gemMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0b1e28,
      emissive: 0x3ddbd9,
      emissiveIntensity: 0.55,
      metalness: 0.3,
      roughness: 0.35,
      flatShading: true,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      transparent: true,
      opacity: 0.98,
    });
    const gemGroup = new THREE.Group();
    const topGeo = roughen(new THREE.ConeGeometry(1, 1.3, 6, 1), 0.22);
    const top = new THREE.Mesh(topGeo, gemMaterial);
    top.position.y = 0.55;
    const bottomGeo = roughen(new THREE.ConeGeometry(1, 2.05, 6, 2), 0.22);
    const bottom = new THREE.Mesh(bottomGeo, gemMaterial);
    bottom.rotation.x = Math.PI;
    bottom.position.y = -0.92;
    gemGroup.add(top, bottom);
    gemGroup.visible = false;
    scene.add(gemGroup);

    // internal lightning veins that flicker across the assembled crystal
    const gemBoltMat = new THREE.LineBasicMaterial({ color: 0xaeefff, transparent: true, opacity: 0.9 });
    const gemBolts: THREE.Line[] = [];
    for (let i = 0; i < 5; i++) {
      const line = new THREE.Line(new THREE.BufferGeometry(), gemBoltMat);
      gemGroup.add(line);
      gemBolts.push(line);
    }
    function refreshGemBolts() {
      for (const line of gemBolts) {
        const a = new THREE.Vector3((Math.random() - 0.5) * 0.8, 1 - Math.random() * 2.6, (Math.random() - 0.5) * 0.8);
        const b = new THREE.Vector3((Math.random() - 0.5) * 0.8, 1 - Math.random() * 2.6, (Math.random() - 0.5) * 0.8);
        line.geometry.dispose();
        line.geometry = makeLightningGeometry(a, b, 6, 0.18);
      }
    }

    // ---- rough shards that fly in and weld together ----
    const shardCount = 8;
    const shards: THREE.Mesh[] = [];
    for (let i = 0; i < shardCount; i++) {
      const geo = roughen(new THREE.ConeGeometry(0.34, 0.85, 5), 0.28);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0a1a24,
        emissive: 0x5fd0ff,
        emissiveIntensity: 1.3,
        metalness: 0.4,
        roughness: 0.4,
        flatShading: true,
      });
      const shard = new THREE.Mesh(geo, mat);
      const angle = (i / shardCount) * Math.PI * 2 + Math.random() * 0.4;
      const radius = 4.2 + Math.random() * 1.8;
      shard.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 4.5, Math.sin(angle) * radius);
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(shard);
      shards.push(shard);
    }

    // arcs of electricity jumping between the scattered shards as they close in
    const shardBoltMat = new THREE.LineBasicMaterial({ color: 0x8fe3ff, transparent: true, opacity: 0.8 });
    const shardBolts: THREE.Line[] = [];
    for (let i = 0; i < 6; i++) {
      const line = new THREE.Line(new THREE.BufferGeometry(), shardBoltMat);
      scene.add(line);
      shardBolts.push(line);
    }
    function refreshShardBolts() {
      for (const line of shardBolts) {
        const a = shards[Math.floor(Math.random() * shards.length)];
        const b = shards[Math.floor(Math.random() * shards.length)];
        line.geometry.dispose();
        line.geometry = makeLightningGeometry(a.position, b.position, 6, 0.5);
      }
    }

    // ---- particle burst, triggered at the moment of impact ----
    const particleCount = 160;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < particleCount; i++) {
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(0.02 + Math.random() * 0.05);
      velocities.push(dir);
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x9fe8ff,
      size: 0.05,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ---- radiant starburst sprite behind the crystal for the "Final Ascendance" moment ----
    const starburstTexture = makeStarburstTexture();
    const starburstMat = new THREE.SpriteMaterial({
      map: starburstTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starburst = new THREE.Sprite(starburstMat);
    starburst.scale.set(0.1, 0.1, 1);
    starburst.position.z = -0.3;
    scene.add(starburst);

    function resize() {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const start = performance.now();
    const ASSEMBLE_MS = 2100;
    let impacted = false;
    let particleActive = false;
    let particleStart = 0;
    let lastBoltRefresh = 0;

    function triggerImpact() {
      impacted = true;
      shards.forEach((s) => (s.visible = false));
      shardBolts.forEach((l) => (l.visible = false));
      gemGroup.visible = true;
      gemGroup.scale.setScalar(0.001);
      particleActive = true;
      particleStart = performance.now();
      particleMat.opacity = 1;
      starburstMat.opacity = 1;
      const posAttr = particleGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) posAttr.setXYZ(i, 0, 0, 0);
      posAttr.needsUpdate = true;

      setFlash(1);
      setTimeout(() => setFlash(0), 60);
      setPhase("impact");
      setTimeout(() => setPhase("docking"), 1400);
      setTimeout(() => setPhase("idle"), 2600);
    }

    function animate(now: number) {
      raf = requestAnimationFrame(animate);
      const elapsed = now - start;
      const t = Math.min(elapsed / ASSEMBLE_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      stars.rotation.y += 0.0003;

      if (now - lastBoltRefresh > 110) {
        lastBoltRefresh = now;
        if (impacted) refreshGemBolts();
        else refreshShardBolts();
      }

      if (!impacted) {
        shards.forEach((shard, i) => {
          shard.position.lerp(new THREE.Vector3(0, 0, 0), 0.018 + eased * 0.05);
          shard.rotation.x += 0.02;
          shard.rotation.y += 0.016;
          const mat = shard.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 1.1 + Math.sin(now * 0.02 + i) * 0.6 + Math.random() * 0.25;
        });
        if (t >= 1) triggerImpact();
      } else {
        const growth = Math.min((now - particleStart) / 400, 1);
        const punch =
          growth < 1 ? 0.001 + (1.18 - 0.001) * (1 - Math.pow(1 - growth, 3)) : 1 + Math.sin(now * 0.004) * 0.025;
        gemGroup.scale.setScalar(punch);
        gemGroup.rotation.y += 0.006;
        gemMaterial.emissiveIntensity = 0.5 + Math.sin(now * 0.003) * 0.15;

        const burstAge = now - particleStart;
        const burstScale = Math.min(burstAge / 500, 1);
        starburst.scale.setScalar(0.1 + burstScale * 5.5);
        starburstMat.opacity = Math.max(0, 0.9 - burstAge / 2400);
      }

      if (particleActive) {
        const posAttr = particleGeo.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          posAttr.setXYZ(
            i,
            posAttr.getX(i) + velocities[i].x,
            posAttr.getY(i) + velocities[i].y,
            posAttr.getZ(i) + velocities[i].z
          );
        }
        posAttr.needsUpdate = true;
        const age = now - particleStart;
        particleMat.opacity = Math.max(0, 1 - age / 1100);
        if (age > 1100) particleActive = false;
      }

      camera.position.x = Math.sin(now * 0.0002) * 0.25;
      camera.position.y = Math.cos(now * 0.00025) * 0.15;
      camera.lookAt(0, -0.1, 0);

      composer.render();
    }
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      composer.dispose();
      renderer.dispose();
      gemMaterial.dispose();
      gemBoltMat.dispose();
      shardBoltMat.dispose();
      starburstTexture.dispose();
      starburstMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      shards.forEach((s) => {
        s.geometry.dispose();
        (s.material as THREE.Material).dispose();
      });
      [...gemBolts, ...shardBolts].forEach((l) => l.geometry.dispose());
      particleGeo.dispose();
      particleMat.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [visible]);

  if (!visible || !rect) return null;

  const isFull = phase === "assembling" || phase === "impact";

  return (
    <>
      {/* Black backdrop only while the scene is full-screen — fades away as it docks */}
      <div
        className="pointer-events-none fixed inset-0 z-[95] bg-[#05070c] transition-opacity duration-700 ease-out"
        style={{ opacity: isFull ? 1 : 0 }}
      />

      <div
        className="pointer-events-none fixed z-[96] overflow-hidden transition-all duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: isFull ? 0 : 9999,
          boxShadow: isFull ? "none" : "0 0 18px 2px rgb(var(--teal) / 0.45)",
        }}
      >
        <div ref={mountRef} className="h-full w-full" />
      </div>

      {/* Full-screen impact flash */}
      <div
        className="pointer-events-none fixed inset-0 z-[97] bg-white transition-opacity duration-500 ease-out"
        style={{ opacity: flash }}
      />
    </>
  );
}
