import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Move } from 'lucide-react';

export type ResonancePresetId = 'codeswitch' | 'rhotic' | 'sibilant';

interface ResonancePreset {
  id: ResonancePresetId;
  label: string;
  ipaTag: string;
  amplitude: number;
  freq: number;
  ringSpeed: number;
  metricReadout: string;
}

const RESONANCE_PRESETS: ResonancePreset[] = [
  {
    id: 'codeswitch',
    label: 'Hinglish Switch',
    ipaTag: '/pɑːniː/ ↔ /wɔtəɹ/',
    amplitude: 0.14,
    freq: 3.0,
    ringSpeed: 0.42,
    metricReadout: 'GOP 0.94 · Zero Penalty',
  },
  {
    id: 'rhotic',
    label: 'Rhotic /ɹ/ Dip',
    ipaTag: 'F3 < 2450 Hz',
    amplitude: 0.21,
    freq: 4.5,
    ringSpeed: 0.62,
    metricReadout: 'F1 420 · F2 1180 · F3 2190 Hz',
  },
  {
    id: 'sibilant',
    label: 'Sibilant /s/',
    ipaTag: 'Centroid 6.2 kHz',
    amplitude: 0.11,
    freq: 6.5,
    ringSpeed: 0.78,
    metricReadout: 'Alveolar Groove · 6180 Hz',
  },
];

interface InkOrbitHeroCanvasProps {
  isDark: boolean;
  reducedMotion?: boolean;
  onSelectPreset?: (presetId: ResonancePresetId) => void;
}

function createContactShadowTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 14, 128, 128, 120);
    if (isDark) {
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
      grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.26)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      grad.addColorStop(0, 'rgba(24, 24, 27, 0.26)');
      grad.addColorStop(0.55, 'rgba(24, 24, 27, 0.08)');
      grad.addColorStop(1, 'rgba(24, 24, 27, 0)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

class AcousticStandingWaveCurve extends THREE.Curve<THREE.Vector3> {
  private radius: number;
  private lobes: number;
  private verticalAmp: number;

  constructor(radius = 1.62, lobes = 6, verticalAmp = 0.18) {
    super();
    this.radius = radius;
    this.lobes = lobes;
    this.verticalAmp = verticalAmp;
  }

  override getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const angle = t * Math.PI * 2;
    const radialMod = this.radius + Math.cos(angle * this.lobes) * 0.09;
    const x = Math.cos(angle) * radialMod;
    const z = Math.sin(angle) * radialMod;
    const y = Math.sin(angle * this.lobes) * this.verticalAmp;
    return optionalTarget.set(x, y, z);
  }
}

export const InkOrbitHeroCanvas: React.FC<InkOrbitHeroCanvasProps> = ({
  isDark,
  reducedMotion = false,
  onSelectPreset,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activePresetId, setActivePresetId] = useState<ResonancePresetId>('codeswitch');
  const [hudExpanded, setHudExpanded] = useState(true);
  const [webglFallback, setWebglFallback] = useState(false);

  const presetRef = useRef<ResonancePreset>(RESONANCE_PRESETS[0]);
  const isDarkRef = useRef<boolean>(isDark);
  const reducedMotionRef = useRef<boolean>(reducedMotion);

  const materialsRef = useRef<{
    coreMat: THREE.MeshPhysicalMaterial;
    glassMat: THREE.MeshPhysicalMaterial;
    gimbalMat: THREE.MeshStandardMaterial;
    ribbonMat: THREE.MeshStandardMaterial;
    waveMat: THREE.MeshStandardMaterial;
    beadMat: THREE.MeshStandardMaterial;
    shadowMat: THREE.MeshBasicMaterial;
  } | null>(null);

  useEffect(() => {
    const found = RESONANCE_PRESETS.find((p) => p.id === activePresetId) || RESONANCE_PRESETS[0];
    presetRef.current = found;
  }, [activePresetId]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  // Dynamically adapt sculpture materials when toggling Paper Light / Obsidian Dark mode
  useEffect(() => {
    isDarkRef.current = isDark;
    const mats = materialsRef.current;
    if (!mats) return;

    mats.coreMat.color.setHex(isDark ? 0x18181b : 0x121215);
    mats.glassMat.color.setHex(isDark ? 0xe4e4e7 : 0x52525b);
    mats.glassMat.opacity = isDark ? 0.16 : 0.11;
    mats.gimbalMat.color.setHex(isDark ? 0xe4e4e7 : 0x27272a);
    mats.ribbonMat.color.setHex(isDark ? 0x3f3f46 : 0x09090b);
    mats.waveMat.color.setHex(isDark ? 0xf4f4f5 : 0x18181b);
    mats.beadMat.color.setHex(isDark ? 0xfafafa : 0x18181b);

    const oldShadowTex = mats.shadowMat.map;
    const nextShadowTex = createContactShadowTexture(isDark);
    mats.shadowMat.map = nextShadowTex;
    mats.shadowMat.needsUpdate = true;
    oldShadowTex?.dispose();
  }, [isDark]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Probe software WebGL renderer before creating context
    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const probeGl = (probeCanvas.getContext('webgl2') ||
        probeCanvas.getContext('webgl')) as WebGLRenderingContext | null;
      if (!probeGl) {
        setWebglFallback(true);
        return;
      }
      const dbg = probeGl.getExtension('WEBGL_debug_renderer_info');
      const rendererName = dbg
        ? String(probeGl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
        : '';
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererName);
    } catch {
      setWebglFallback(true);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFallback(true);
      return;
    }

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;
    if (!isSoftwareGl) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    const initialW = container.clientWidth || 540;
    const initialH = container.clientHeight || 480;
    renderer.setSize(initialW, initialH, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.cursor = 'grab';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFallback(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    const scene = new THREE.Scene();

    // Environment map for physically grounded metallic & clearcoat ink speculars
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(38, initialW / initialH, 0.1, 50);
    camera.position.set(0, 0.55, 5.4);

    // Warm key + cool fill + rim lighting
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x27272a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
    keyLight.position.set(4.2, 5.5, 4.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 1.45);
    rimLight.position.set(-4.5, 2.2, -3.5);
    scene.add(rimLight);

    // Controls: draggable sculpture without hijacking page scroll
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.75;

    const onStartDrag = () => {
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onEndDrag = () => {
      renderer.domElement.style.cursor = 'grab';
    };
    controls.addEventListener('start', onStartDrag);
    controls.addEventListener('end', onEndDrag);

    // Root composite group (7 distinct parts with varied roughness)
    const orbitSculpture = new THREE.Group();
    orbitSculpture.position.set(0, 0.12, 0);
    scene.add(orbitSculpture);

    // Shader uniforms for organic liquid-ink acoustic harmonic displacement
    const coreUniforms = {
      uTime: { value: 0 },
      uAmplitude: { value: presetRef.current.amplitude },
      uFreq: { value: presetRef.current.freq },
    };

    // Part 1: Liquid-Ink Acoustic Core (roughness: 0.14, clearcoat: 1.0)
    const coreDetail = isSoftwareGl ? 3 : 5;
    const coreGeo = new THREE.IcosahedronGeometry(0.92, coreDetail);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: isDarkRef.current ? 0x18181b : 0x121215,
      metalness: 0.18,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.07,
    });
    coreMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = coreUniforms.uTime;
      shader.uniforms.uAmplitude = coreUniforms.uAmplitude;
      shader.uniforms.uFreq = coreUniforms.uFreq;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         uniform float uAmplitude;
         uniform float uFreq;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float waveA = sin(position.x * uFreq + uTime * 1.6) * cos(position.y * uFreq - uTime * 1.2);
         float waveB = sin(position.z * (uFreq * 0.85) + uTime * 1.1);
         float disp = (waveA * 0.65 + waveB * 0.35) * uAmplitude;
         transformed += normal * disp;`
      );
    };
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    orbitSculpture.add(coreMesh);

    // Part 2: Frosted Optical Glass Containment Shell (roughness: 0.44, depthWrite: false)
    const glassGeo = new THREE.SphereGeometry(1.18, isSoftwareGl ? 24 : 40, isSoftwareGl ? 18 : 28);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: isDarkRef.current ? 0xe4e4e7 : 0x52525b,
      metalness: 0.05,
      roughness: 0.44,
      transparent: true,
      opacity: isDarkRef.current ? 0.16 : 0.11,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    orbitSculpture.add(glassMesh);

    // Part 3: Inner Brushed-Platinum Harmonic Gimbal Ring (roughness: 0.22, metalness: 0.88)
    const gimbalGeo = new THREE.TorusGeometry(1.46, 0.032, isSoftwareGl ? 14 : 24, isSoftwareGl ? 64 : 112);
    const gimbalMat = new THREE.MeshStandardMaterial({
      color: isDarkRef.current ? 0xe4e4e7 : 0x27272a,
      metalness: 0.88,
      roughness: 0.22,
    });
    const gimbalMesh = new THREE.Mesh(gimbalGeo, gimbalMat);
    gimbalMesh.rotation.set(Math.PI * 0.34, Math.PI * 0.12, 0);
    orbitSculpture.add(gimbalMesh);

    // Part 4: Tilted Matte-Obsidian Ink Orbit Ribbon (roughness: 0.68, metalness: 0.12 -> delta > 0.45!)
    const ribbonGeo = new THREE.TorusGeometry(1.82, 0.048, isSoftwareGl ? 14 : 24, isSoftwareGl ? 72 : 128);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: isDarkRef.current ? 0x3f3f46 : 0x09090b,
      metalness: 0.12,
      roughness: 0.68,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.scale.set(1, 1, 0.38);
    ribbonMesh.rotation.set(-Math.PI * 0.28, Math.PI * 0.22, Math.PI * 0.08);
    orbitSculpture.add(ribbonMesh);

    // Part 5: Equatorial Acoustic Standing-Wave Filament (roughness: 0.36, metalness: 0.65)
    const waveCurve = new AcousticStandingWaveCurve(1.62, 6, 0.16);
    const waveGeo = new THREE.TubeGeometry(waveCurve, isSoftwareGl ? 72 : 128, 0.018, isSoftwareGl ? 8 : 12, true);
    const waveMat = new THREE.MeshStandardMaterial({
      color: isDarkRef.current ? 0xf4f4f5 : 0x18181b,
      metalness: 0.65,
      roughness: 0.36,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.rotation.x = Math.PI * 0.08;
    orbitSculpture.add(waveMesh);

    // Part 6: Orbital Phoneme Satellite Beads via InstancedMesh (18 instances)
    const beadCount = 18;
    const beadGeo = new THREE.SphereGeometry(0.052, isSoftwareGl ? 10 : 16, isSoftwareGl ? 10 : 16);
    const beadMat = new THREE.MeshStandardMaterial({
      color: isDarkRef.current ? 0xfafafa : 0x18181b,
      metalness: 0.72,
      roughness: 0.24,
    });
    const beadInstanced = new THREE.InstancedMesh(beadGeo, beadMat, beadCount);
    const dummyObj = new THREE.Object3D();

    const beadOrbits = Array.from({ length: beadCount }, (_, idx) => ({
      radius: idx % 2 === 0 ? 1.46 : 1.82,
      phase: (idx / beadCount) * Math.PI * 2,
      speed: idx % 2 === 0 ? 0.55 : -0.38,
      tiltX: idx % 2 === 0 ? Math.PI * 0.34 : -Math.PI * 0.28,
      tiltY: idx % 2 === 0 ? Math.PI * 0.12 : Math.PI * 0.22,
      scale: idx % 3 === 0 ? 1.25 : 0.85,
    }));

    const eulerTemp = new THREE.Euler();
    const vecTemp = new THREE.Vector3();

    const updateBeadMatrices = (elapsed: number, speedMult: number) => {
      for (let i = 0; i < beadCount; i++) {
        const b = beadOrbits[i];
        const theta = b.phase + elapsed * b.speed * speedMult;
        vecTemp.set(Math.cos(theta) * b.radius, Math.sin(theta) * b.radius, 0);
        eulerTemp.set(b.tiltX, b.tiltY, 0);
        vecTemp.applyEuler(eulerTemp);
        dummyObj.position.copy(vecTemp);
        dummyObj.scale.setScalar(b.scale);
        dummyObj.updateMatrix();
        beadInstanced.setMatrixAt(i, dummyObj.matrix);
      }
      beadInstanced.instanceMatrix.needsUpdate = true;
    };

    updateBeadMatrices(0, 1);
    beadInstanced.computeBoundingSphere();
    orbitSculpture.add(beadInstanced);

    // Part 7: Grounded Contact Shadow Plane beneath the sculpture
    const shadowTex = createContactShadowTexture(isDarkRef.current);
    const shadowGeo = new THREE.PlaneGeometry(3.9, 3.9);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.78;
    scene.add(shadowMesh);

    materialsRef.current = {
      coreMat,
      glassMat,
      gimbalMat,
      ribbonMat,
      waveMat,
      beadMat,
      shadowMat,
    };

    // Responsive ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        }
      }
    });
    resizeObserver.observe(container);

    // Paced animation loop with software WebGL fenceSync protection
    let disposed = false;
    let rafId = 0;
    let timerId = 0;
    const gl = renderer.getContext() as WebGL2RenderingContext;

    const afterDraw = (cb: () => void) => {
      if (isSoftwareGl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          if (!sync) {
            timerId = window.setTimeout(cb, 80);
            return;
          }
          const status = gl.clientWaitSync(sync, 0, 0);
          if (status === gl.TIMEOUT_EXPIRED) {
            timerId = window.setTimeout(poll, 16);
            return;
          }
          gl.deleteSync(sync);
          timerId = window.setTimeout(cb, 80);
        };
        timerId = window.setTimeout(poll, 16);
      } else {
        rafId = window.requestAnimationFrame(cb);
      }
    };

    let lastTime = performance.now();
    let elapsedAcc = 0;

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const targetPreset = presetRef.current;
      const motionMult = reducedMotionRef.current ? 0.08 : 1.0;
      elapsedAcc += dt * motionMult;

      // Smoothly interpolate shader uniforms toward selected phoneme preset
      coreUniforms.uTime.value = elapsedAcc;
      coreUniforms.uAmplitude.value += (targetPreset.amplitude - coreUniforms.uAmplitude.value) * 0.08;
      coreUniforms.uFreq.value += (targetPreset.freq - coreUniforms.uFreq.value) * 0.08;

      // Gentle multi-axis orbital precession
      const speed = targetPreset.ringSpeed * motionMult;
      orbitSculpture.rotation.y += dt * 0.22 * motionMult;
      gimbalMesh.rotation.z += dt * speed * 0.65;
      ribbonMesh.rotation.z -= dt * speed * 0.45;
      waveMesh.rotation.y -= dt * speed * 0.55;

      updateBeadMatrices(elapsedAcc, targetPreset.ringSpeed * 1.4);

      controls.update();
      renderer.render(scene, camera);
      afterDraw(tick);
    };

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onStartDrag);
      controls.removeEventListener('end', onEndDrag);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

      coreGeo.dispose();
      coreMat.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      gimbalGeo.dispose();
      gimbalMat.dispose();
      ribbonGeo.dispose();
      ribbonMat.dispose();
      waveGeo.dispose();
      waveMat.dispose();
      beadGeo.dispose();
      beadMat.dispose();
      shadowGeo.dispose();
      shadowMat.map?.dispose();
      shadowMat.dispose();
      envRT.texture.dispose();
      envRT.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      materialsRef.current = null;
    };
  }, []);

  const currentPreset =
    RESONANCE_PRESETS.find((p) => p.id === activePresetId) || RESONANCE_PRESETS[0];

  return (
    <div className="relative w-full h-[420px] sm:h-[470px] lg:h-[520px] select-none overflow-hidden">
      {/* Subtle Architectural Corner Crosshair Coordinates */}
      <div className="pointer-events-none absolute top-3 left-4 z-10 flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
        <span>INK-ORBIT · DSP-16KHZ</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{currentPreset.ipaTag}</span>
      </div>

      <div className="pointer-events-none absolute top-3 right-4 z-10 hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
        <Move className="w-3 h-3" />
        <span>Drag to orbit</span>
      </div>

      {/* Dedicated Empty Canvas Container */}
      {!webglFallback ? (
        <div
          ref={mountRef}
          className="w-full h-full"
          aria-label="Interactive 3D Ink Orbit Acoustic Resonance Sculpture"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-8">
          {/* Graceful architectural SVG fallback if WebGL is unavailable */}
          <svg
            viewBox="0 0 320 320"
            className="w-64 h-64 text-zinc-900 dark:text-zinc-100"
            aria-label="Ink Orbit Geometric Acoustic Diagram"
          >
            <circle cx="160" cy="160" r="118" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.2" />
            <ellipse
              cx="160"
              cy="160"
              rx="126"
              ry="48"
              transform="rotate(-24 160 160)"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <ellipse
              cx="160"
              cy="160"
              rx="104"
              ry="42"
              transform="rotate(32 160 160)"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
            <circle cx="160" cy="160" r="52" fill="currentColor" />
          </svg>
        </div>
      )}

      {/* Collapsible Bottom HUD Dock (Solid opaque surface — zero backdrop-filter over WebGL) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="px-3 py-2 flex items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate tabular-nums">
              {currentPreset.metricReadout}
            </span>
            <button
              type="button"
              onClick={() => setHudExpanded((prev) => !prev)}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 inline-flex items-center gap-1 cursor-pointer shrink-0"
              aria-expanded={hudExpanded}
              aria-label={hudExpanded ? 'Collapse acoustic sculpture controls' : 'Expand acoustic sculpture controls'}
            >
              <span>{hudExpanded ? 'Hide' : 'Harmonics'}</span>
              {hudExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {hudExpanded && (
            <div className="grid grid-cols-3 border-t border-zinc-200 dark:border-zinc-800 divide-x divide-zinc-200 dark:divide-zinc-800">
              {RESONANCE_PRESETS.map((preset) => {
                const isSelected = preset.id === activePresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setActivePresetId(preset.id);
                      onSelectPreset?.(preset.id);
                    }}
                    className={`px-2.5 py-2 text-[11px] font-medium transition-colors text-center truncate cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
                        : 'bg-zinc-50 text-zinc-600 hover:text-zinc-950 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
