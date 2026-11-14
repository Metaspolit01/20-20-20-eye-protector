import React, { useEffect, useRef } from 'react';
import { computeEyeVisualMetrics, EyeMotionState } from '../engine/eyeMotionState';

interface EyeMotionPlayerProps {
  motionState: EyeMotionState;
  progressPercent?: number;
  compact?: boolean;
  staticPose?: boolean;
}

interface CapillarySegment {
  points: Array<[number, number]>;
  width: number;
  alpha: number;
}

// Deterministic pseudo-random generator for consistent organic anatomy
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Pre-generate organic bifurcating capillaries in 240x240 logical space
const CAPILLARIES: CapillarySegment[] = (() => {
  const rand = seededRandom(202020);
  const segs: CapillarySegment[] = [];

  const addVessel = (
    startX: number,
    startY: number,
    dirX: number,
    spreadY: number,
    length: number,
    width: number
  ) => {
    const pts: Array<[number, number]> = [[startX, startY]];
    let cx = startX;
    let cy = startY;
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      cx += (dirX * length) / steps + (rand() - 0.5) * 3;
      cy += (rand() - 0.5) * spreadY;
      pts.push([cx, cy]);
      if (i === 3 || i === 4) {
        const forkAngle = (rand() - 0.5) * 14;
        segs.push({
          points: [
            [cx, cy],
            [cx + dirX * 9, cy + forkAngle * 0.5],
            [cx + dirX * 18, cy + forkAngle],
          ],
          width: width * 0.58,
          alpha: 0.62,
        });
      }
    }
    segs.push({ points: pts, width, alpha: 0.85 });
  };

  // Nasal (left) corner vessels
  addVessel(24, 122, 1, 8, 48, 1.15);
  addVessel(27, 114, 1, 9, 44, 0.9);
  addVessel(28, 130, 1, 8, 46, 0.95);
  addVessel(34, 108, 1, 7, 36, 0.72);
  addVessel(34, 135, 1, 7, 34, 0.7);

  // Temporal (right) corner vessels
  addVessel(218, 118, -1, 8, 52, 1.15);
  addVessel(214, 110, -1, 9, 46, 0.92);
  addVessel(214, 127, -1, 8, 48, 0.95);
  addVessel(206, 104, -1, 7, 38, 0.72);
  addVessel(206, 133, -1, 7, 36, 0.7);

  return segs;
})();

// Pre-bake a 512x512 photorealistic human blue iris texture once
let cachedIrisCanvas: HTMLCanvasElement | null = null;
function getPhotorealisticIrisTexture(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedIrisCanvas) return cachedIrisCanvas;

  const size = 512;
  const half = size / 2;
  const maxR = size * 0.48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const rand = seededRandom(90421);

  // 1. Soft feathered limbal ring base
  const limbusGrad = ctx.createRadialGradient(half, half, maxR * 0.35, half, half, maxR);
  limbusGrad.addColorStop(0.0, '#135785');
  limbusGrad.addColorStop(0.42, '#1d78b0');
  limbusGrad.addColorStop(0.74, '#13537d');
  limbusGrad.addColorStop(0.89, '#0b2b44');
  limbusGrad.addColorStop(0.96, 'rgba(8, 22, 38, 0.92)');
  limbusGrad.addColorStop(1.0, 'rgba(8, 22, 38, 0)');

  ctx.beginPath();
  ctx.arc(half, half, maxR, 0, Math.PI * 2);
  ctx.fillStyle = limbusGrad;
  ctx.fill();

  // Clip interior textures to iris circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(half, half, maxR * 0.97, 0, Math.PI * 2);
  ctx.clip();

  // 2. Deep radial iris crypts (dark negative shadows)
  for (let i = 0; i < 65; i++) {
    const a = rand() * Math.PI * 2;
    const r0 = maxR * (0.28 + rand() * 0.16);
    const r1 = maxR * (0.58 + rand() * 0.30);
    const spread = 0.04 + rand() * 0.05;
    ctx.beginPath();
    ctx.moveTo(half + Math.cos(a) * r0, half + Math.sin(a) * r0);
    ctx.quadraticCurveTo(
      half + Math.cos(a + spread * 0.6) * ((r0 + r1) * 0.5),
      half + Math.sin(a + spread * 0.6) * ((r0 + r1) * 0.5),
      half + Math.cos(a) * r1,
      half + Math.sin(a) * r1
    );
    ctx.quadraticCurveTo(
      half + Math.cos(a - spread * 0.6) * ((r0 + r1) * 0.5),
      half + Math.sin(a - spread * 0.6) * ((r0 + r1) * 0.5),
      half + Math.cos(a) * r0,
      half + Math.sin(a) * r0
    );
    ctx.fillStyle = `rgba(5, 22, 42, ${0.18 + rand() * 0.24})`;
    ctx.fill();
  }

  // 3. 260 organic wavy radial stroma collagen fibers
  for (let i = 0; i < 260; i++) {
    const baseAngle = (i / 260) * Math.PI * 2 + (rand() - 0.5) * 0.025;
    const rStart = maxR * (0.25 + rand() * 0.14);
    const rEnd = maxR * (0.76 + rand() * 0.19);
    const rMid = (rStart + rEnd) * 0.5;
    const bend = (rand() - 0.5) * 0.09;

    ctx.beginPath();
    ctx.moveTo(half + Math.cos(baseAngle) * rStart, half + Math.sin(baseAngle) * rStart);
    ctx.quadraticCurveTo(
      half + Math.cos(baseAngle + bend) * rMid,
      half + Math.sin(baseAngle + bend) * rMid,
      half + Math.cos(baseAngle + bend * 0.4) * rEnd,
      half + Math.sin(baseAngle + bend * 0.4) * rEnd
    );

    const tone = rand();
    if (tone > 0.68) {
      ctx.strokeStyle = `rgba(170, 228, 252, ${0.14 + rand() * 0.24})`;
      ctx.lineWidth = 1.2 + rand() * 1.4;
    } else if (tone > 0.28) {
      ctx.strokeStyle = `rgba(74, 178, 228, ${0.18 + rand() * 0.22})`;
      ctx.lineWidth = 1.0 + rand() * 1.3;
    } else {
      ctx.strokeStyle = `rgba(18, 86, 134, ${0.20 + rand() * 0.22})`;
      ctx.lineWidth = 1.4 + rand() * 1.5;
    }
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // 4. Subtle warm amber/hazel central heterochromia & collarette ring
  const heteroGrad = ctx.createRadialGradient(half, half, maxR * 0.22, half, half, maxR * 0.58);
  heteroGrad.addColorStop(0.0, 'rgba(188, 152, 92, 0.34)');
  heteroGrad.addColorStop(0.45, 'rgba(148, 168, 136, 0.18)');
  heteroGrad.addColorStop(1.0, 'rgba(56, 189, 248, 0)');
  ctx.beginPath();
  ctx.arc(half, half, maxR * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = heteroGrad;
  ctx.fill();

  // Organic zig-zag collarette ring
  ctx.beginPath();
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r = maxR * (0.48 + (i % 2 === 0 ? 0.03 : -0.02) + (rand() - 0.5) * 0.015);
    const x = half + Math.cos(a) * r;
    const y = half + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(186, 232, 252, 0.28)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Subtle Fuchs' contraction furrows near outer iris
  for (let k = 0; k < 2; k++) {
    const r = maxR * (0.74 + k * 0.09);
    ctx.beginPath();
    ctx.arc(half, half, r, 0.2, Math.PI * 1.85);
    ctx.strokeStyle = 'rgba(6, 22, 40, 0.22)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  ctx.restore();

  cachedIrisCanvas = canvas;
  return canvas;
}

// Pre-generate organic clustered upper and lower eyelash geometry
interface LashSpec {
  t: number;
  length: number;
  curlX: number;
  thickness: number;
  alpha: number;
}

const UPPER_LASHES: LashSpec[] = (() => {
  const rand = seededRandom(4177);
  const lashes: LashSpec[] = [];
  const count = 42;
  for (let i = 0; i < count; i++) {
    const baseT = 0.08 + (i / (count - 1)) * 0.87;
    // Slight clustering jitter so lashes group naturally rather than looking like a comb
    const clusterJitter = (rand() - 0.5) * 0.016;
    const t = Math.min(0.96, Math.max(0.06, baseT + clusterJitter));
    const archWeight = Math.sin(t * Math.PI) * 0.65 + t * 0.55;
    const length = (6.5 + archWeight * 15.5) * (0.76 + rand() * 0.46);
    // Lashes near nasal corner angle slightly inward/upward; center-to-outer sweep smoothly outward
    const curlX = (t - 0.24) * 20 + (rand() - 0.5) * 4.2;
    const thickness = (0.7 + archWeight * 0.65) * (0.85 + rand() * 0.3);
    const alpha = 0.65 + rand() * 0.28;
    lashes.push({ t, length, curlX, thickness, alpha });
  }
  return lashes;
})();

const LOWER_LASHES: LashSpec[] = (() => {
  const rand = seededRandom(8831);
  const lashes: LashSpec[] = [];
  const count = 16;
  for (let i = 0; i < count; i++) {
    const t = 0.14 + (i / (count - 1)) * 0.72 + (rand() - 0.5) * 0.02;
    const length = (4.2 + Math.sin(t * Math.PI) * 4.4) * (0.75 + rand() * 0.45);
    const curlX = (0.45 - t) * 11 + (rand() - 0.5) * 2.5;
    lashes.push({
      t,
      length,
      curlX,
      thickness: 0.55 + rand() * 0.3,
      alpha: 0.38 + rand() * 0.22,
    });
  }
  return lashes;
})();

function evalCubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function drawTaperedLash(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  baseHalfWidth: number,
  color: string
) {
  const dx = tx - bx;
  const dy = ty - by;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  ctx.beginPath();
  ctx.moveTo(bx + nx * baseHalfWidth, by + ny * baseHalfWidth);
  ctx.quadraticCurveTo(cx + nx * baseHalfWidth * 0.35, cy + ny * baseHalfWidth * 0.35, tx, ty);
  ctx.quadraticCurveTo(cx - nx * baseHalfWidth * 0.35, cy - ny * baseHalfWidth * 0.35, bx - nx * baseHalfWidth, by - ny * baseHalfWidth);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export const EyeMotionPlayer: React.FC<EyeMotionPlayerProps> = ({
  motionState,
  progressPercent = 0,
  compact = false,
  staticPose = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<EyeMotionState>(motionState);
  const progressRef = useRef<number>(progressPercent);
  stateRef.current = motionState;
  progressRef.current = progressPercent;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const irisTex = getPhotorealisticIrisTexture();
    const cssSize = compact ? 36 : 244;
    const dpr = Math.min(2.5, Math.max(2, window.devicePixelRatio || 2));
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);

    let rafId = 0;
    const startTime = performance.now();

    let curOpenness = 1.0;
    let curGazeX = 0;
    let curGazeY = 0;
    let curPupilR = 17.0;
    let curRedness = 0;
    let curVessels = 0;
    let curSquint = 0;
    let blinkAmount = 0;
    let lastBlinkTrigger = -1;
    let prevState: EyeMotionState = stateRef.current;

    const renderFrame = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      const st: EyeMotionState = staticPose ? 'healthy' : stateRef.current;
      const pct = staticPose ? 0 : progressRef.current;

      if (staticPose) {
        curOpenness = 1.0;
        curRedness = 0;
        curVessels = 0;
        curSquint = 0;
        curPupilR = 16.8;
        curGazeX = 0;
        curGazeY = 0;
      } else {
        if (st === 'blink' && prevState !== 'blink') {
          lastBlinkTrigger = elapsedSec;
        }
        prevState = st;

        if (lastBlinkTrigger >= 0) {
          const bt = elapsedSec - lastBlinkTrigger;
          if (bt < 0.12) {
            blinkAmount = bt / 0.12;
          } else if (bt < 0.34) {
            blinkAmount = 1 - (bt - 0.12) / 0.22;
          } else {
            blinkAmount = 0;
            if (st !== 'blink') lastBlinkTrigger = -1;
          }
        } else {
          blinkAmount = 0;
        }

        const target = computeEyeVisualMetrics(st, pct);
        const squintTremor =
          st === 'squeeze'
            ? Math.sin(elapsedSec * 5.2) * 0.025
            : st === 'overdue'
            ? Math.sin(elapsedSec * 2.4) * 0.03
            : 0;

        const targetOpen = Math.max(0.22, target.openness + squintTremor);
        const targetPupil =
          st === 'overdue'
            ? 19.6
            : st === 'squeeze'
            ? 18.8 + Math.sin(elapsedSec * 1.4) * 0.4
            : st === 'tired'
            ? 18.0 + Math.sin(elapsedSec * 0.9) * 0.5
            : 16.8 + Math.sin(elapsedSec * 1.1) * 0.6;

        const effectiveOpen = Math.max(0.02, targetOpen * (1 - blinkAmount * 0.98));
        curOpenness += (effectiveOpen - curOpenness) * 0.22;
        curRedness += (target.redness - curRedness) * 0.1;
        curVessels += (target.vesselOpacity - curVessels) * 0.1;
        curSquint += (target.squintTension - curSquint) * 0.12;
        curPupilR += (targetPupil - curPupilR) * 0.1;

        const gazeSpeed = st === 'overdue' || st === 'squeeze' || st === 'tired' ? 0.55 : 0.95;
        const targetGazeX =
          Math.sin(elapsedSec * gazeSpeed) * 5.0 +
          Math.sin(elapsedSec * 2.7) * 1.5;
        const targetGazeY =
          Math.cos(elapsedSec * gazeSpeed * 0.8) * 2.3 +
          Math.sin(elapsedSec * 1.9) * 0.8;

        curGazeX += (targetGazeX - curGazeX) * 0.08;
        curGazeY += (targetGazeY - curGazeY) * 0.08;
      }

      // Clear & map 240x240 logical anatomical space onto HiDPI canvas
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = canvas.width / 240;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      // Asymmetric realistic human eye corner anchors
      const leftX = 20;
      const leftY = 125;
      const rightX = 222;
      const rightY = 117;

      // Natural relaxed human lid resting gently over top ~14% of iris (not wide-staring)
      const closeShift = (1 - curOpenness) * 14;
      const upperLift = 62 * curOpenness;
      const lowerDrop = 52 * Math.min(1, 0.22 + curOpenness * 0.78);

      const uCp1X = 68;
      const uCp1Y = 120 - upperLift + closeShift;
      const uCp2X = 160;
      const uCp2Y = 117 - upperLift * 0.94 + closeShift;

      const lCp1X = 164;
      const lCp1Y = 118 + lowerDrop + closeShift * 0.22;
      const lCp2X = 70;
      const lCp2Y = 125 + lowerDrop * 0.90 + closeShift * 0.22;

      // 1. Seamless periorbital ambient glow & soft socket depth (no hard cutoff edge)
      const auraColor =
        st === 'overdue' || (st === 'squeeze' && pct >= 90)
          ? 'rgba(239, 68, 68, 0.18)'
          : st === 'squeeze'
          ? 'rgba(249, 115, 22, 0.14)'
          : st === 'recovery'
          ? 'rgba(16, 185, 129, 0.16)'
          : 'rgba(14, 165, 233, 0.13)';

      const socketGrad = ctx.createRadialGradient(120, 120, 24, 120, 120, 118);
      socketGrad.addColorStop(0.0, auraColor);
      socketGrad.addColorStop(0.55, 'rgba(62, 42, 42, 0.18)');
      socketGrad.addColorStop(0.84, 'rgba(24, 24, 38, 0.06)');
      socketGrad.addColorStop(1.0, 'rgba(3, 16, 36, 0)');
      ctx.fillStyle = socketGrad;
      ctx.beginPath();
      ctx.arc(120, 120, 118, 0, Math.PI * 2);
      ctx.fill();

      // 2. Soft eyelid skin volume tightly hugging upper & lower orbital folds (fades smoothly to 0)
      if (!compact) {
        const lidSkinGrad = ctx.createRadialGradient(120, 112, 36, 120, 116, 102);
        lidSkinGrad.addColorStop(0.0, 'rgba(116, 80, 68, 0.24)');
        lidSkinGrad.addColorStop(0.52, 'rgba(84, 56, 52, 0.15)');
        lidSkinGrad.addColorStop(0.82, 'rgba(34, 28, 40, 0.04)');
        lidSkinGrad.addColorStop(1.0, 'rgba(3, 16, 36, 0)');
        ctx.fillStyle = lidSkinGrad;
        ctx.beginPath();
        ctx.arc(120, 116, 104, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Clip & draw anatomical eyeball inside realistic almond aperture
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.bezierCurveTo(uCp1X, uCp1Y, uCp2X, uCp2Y, rightX, rightY);
      ctx.bezierCurveTo(lCp1X, lCp1Y, lCp2X, lCp2Y, leftX, leftY);
      ctx.closePath();
      ctx.clip();

      // 3a. 3D Curved Ivory-Pearl Human Sclera
      const scleraGrad = ctx.createRadialGradient(114, 114, 16, 120, 120, 112);
      scleraGrad.addColorStop(0.0, '#fcfbf8');
      scleraGrad.addColorStop(0.48, '#f0ece6');
      scleraGrad.addColorStop(0.78, '#ccc4bc');
      scleraGrad.addColorStop(1.0, '#897f78');
      ctx.fillStyle = scleraGrad;
      ctx.fillRect(10, 40, 222, 160);

      // 3b. Progressive Crimson Strain Suffusion (medial, lateral, overall)
      if (curRedness > 0.01) {
        const washGrad = ctx.createRadialGradient(120, 120, 26, 120, 120, 108);
        washGrad.addColorStop(0, `rgba(252, 165, 165, ${curRedness * 0.20})`);
        washGrad.addColorStop(0.62, `rgba(239, 68, 68, ${curRedness * 0.45})`);
        washGrad.addColorStop(1, `rgba(185, 28, 28, ${curRedness * 0.80})`);
        ctx.fillStyle = washGrad;
        ctx.fillRect(10, 40, 222, 160);

        const leftRed = ctx.createRadialGradient(34, 122, 4, 38, 122, 56);
        leftRed.addColorStop(0, `rgba(210, 32, 32, ${curRedness * 0.88})`);
        leftRed.addColorStop(0.55, `rgba(239, 68, 68, ${curRedness * 0.48})`);
        leftRed.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = leftRed;
        ctx.fillRect(10, 40, 222, 160);

        const rightRed = ctx.createRadialGradient(206, 118, 4, 202, 118, 60);
        rightRed.addColorStop(0, `rgba(210, 32, 32, ${curRedness * 0.88})`);
        rightRed.addColorStop(0.55, `rgba(239, 68, 68, ${curRedness * 0.48})`);
        rightRed.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = rightRed;
        ctx.fillRect(10, 40, 222, 160);
      }

      // 3c. Organic Bifurcating Capillaries
      if (curVessels > 0.02) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const seg of CAPILLARIES) {
          ctx.beginPath();
          seg.points.forEach(([px, py], idx) => {
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.strokeStyle = `rgba(205, 32, 32, ${curVessels * seg.alpha})`;
          ctx.lineWidth = seg.width;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3d. Natural Medial Caruncle & Plica Semilunaris Fold (Inner Corner)
      const caruncleX = leftX + 6;
      const caruncleY = leftY;
      const caruncleGrad = ctx.createRadialGradient(caruncleX - 2, caruncleY - 1, 1, caruncleX, caruncleY, 13);
      caruncleGrad.addColorStop(0, curRedness > 0.4 ? '#d45a5a' : '#ca7d78');
      caruncleGrad.addColorStop(0.55, curRedness > 0.4 ? '#a33939' : '#9c5654');
      caruncleGrad.addColorStop(1, 'rgba(130, 68, 66, 0)');
      ctx.fillStyle = caruncleGrad;
      ctx.beginPath();
      ctx.ellipse(caruncleX, caruncleY, 12.5, 8.2, -0.08, 0, Math.PI * 2);
      ctx.fill();

      // Delicate crescent plica semilunaris membrane fold beside caruncle
      ctx.beginPath();
      ctx.moveTo(leftX + 14, leftY - 7);
      ctx.quadraticCurveTo(leftX + 17.5, leftY, leftX + 13.5, leftY + 7);
      ctx.strokeStyle = curRedness > 0.4 ? 'rgba(185, 56, 56, 0.55)' : 'rgba(168, 92, 88, 0.48)';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Soft subtle tear sheen on caruncle
      ctx.fillStyle = 'rgba(255, 238, 236, 0.45)';
      ctx.beginPath();
      ctx.ellipse(caruncleX - 1.5, caruncleY - 1.5, 2.0, 1.0, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 3e. Photorealistic Iris, Dynamic Pupil & Corneal Reflections
      // Iris sits comfortably so upper lid naturally overlaps its top ~12-15%
      const irisCx = 121 + curGazeX;
      const irisCy = 117 + curGazeY;
      const irisR = 52;

      if (irisTex) {
        ctx.drawImage(irisTex, irisCx - irisR, irisCy - irisR, irisR * 2, irisR * 2);
      } else {
        ctx.beginPath();
        ctx.arc(irisCx, irisCy, irisR, 0, Math.PI * 2);
        ctx.fillStyle = '#0284c7';
        ctx.fill();
      }

      // Crenulated dark pupillary ruff + velvety pupil
      ctx.beginPath();
      ctx.arc(irisCx, irisCy, curPupilR + 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8, 11, 16, 0.62)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(irisCx, irisCy, curPupilR, 0, Math.PI * 2);
      ctx.fillStyle = '#030508';
      ctx.fill();

      // Lower iris ambient bounce caustic (opposite window reflection)
      const causticGrad = ctx.createRadialGradient(
        irisCx + 8,
        irisCy + 22,
        2,
        irisCx + 6,
        irisCy + 18,
        31
      );
      causticGrad.addColorStop(0, 'rgba(156, 228, 255, 0.34)');
      causticGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.14)');
      causticGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.beginPath();
      ctx.arc(irisCx, irisCy, irisR * 0.90, 0, Math.PI * 2);
      ctx.fillStyle = causticGrad;
      ctx.fill();

      // Curved Window-Pane Corneal Specular Catchlight (upper-left, glassy & translucent)
      ctx.save();
      ctx.translate(irisCx - 16, irisCy - 14);
      ctx.rotate(-0.42);
      const winGrad = ctx.createLinearGradient(-8, -6, 8, 6);
      winGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
      winGrad.addColorStop(1, 'rgba(218, 242, 255, 0.66)');
      ctx.fillStyle = winGrad;
      ctx.beginPath();
      ctx.moveTo(-7.2, -4.8);
      ctx.quadraticCurveTo(0, -6.5, 7.2, -3.8);
      ctx.quadraticCurveTo(8.2, 0, 6.5, 4.5);
      ctx.quadraticCurveTo(0, 6.0, -6.8, 3.8);
      ctx.quadraticCurveTo(-8.4, 0, -7.2, -4.8);
      ctx.closePath();
      ctx.fill();

      // Subtle window mullion cross inside corneal reflection
      ctx.strokeStyle = 'rgba(12, 48, 78, 0.16)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-0.2, -5.0);
      ctx.lineTo(-0.2, 4.8);
      ctx.moveTo(-7.0, -0.2);
      ctx.lineTo(7.0, -0.2);
      ctx.stroke();
      ctx.restore();

      // Secondary crisp corneal pinpoint glint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
      ctx.beginPath();
      ctx.arc(irisCx + 17, irisCy + 13, 2.0, 0, Math.PI * 2);
      ctx.fill();

      // 3f. Smooth Feathered Upper Eyelid Shadow Cast Onto Sclera & Iris (no hard stripe)
      ctx.save();
      ctx.shadowColor = 'rgba(8, 7, 14, 0.72)';
      ctx.shadowBlur = compact ? 5 : 14;
      ctx.shadowOffsetY = compact ? 2 : 6;
      ctx.beginPath();
      ctx.moveTo(leftX - 6, leftY + 2);
      ctx.bezierCurveTo(uCp1X, uCp1Y, uCp2X, uCp2Y, rightX + 6, rightY + 2);
      ctx.lineTo(rightX + 10, 30);
      ctx.lineTo(leftX - 10, 30);
      ctx.closePath();
      ctx.fillStyle = 'rgba(10, 9, 16, 0.95)';
      ctx.fill();
      ctx.restore();

      // 3g. Moist Lower Eyelid Waterline Rim (Softly Tapered Pinkish Tarsal Shelf)
      ctx.beginPath();
      ctx.moveTo(leftX + 14, leftY + 1);
      ctx.bezierCurveTo(
        leftX + 54,
        lCp2Y - 1.2,
        rightX - 54,
        lCp1Y - 1.2,
        rightX - 6,
        rightY + 0.5
      );
      ctx.strokeStyle = curRedness > 0.45 ? 'rgba(186, 92, 92, 0.56)' : 'rgba(186, 134, 130, 0.46)';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Thin wet tear-meniscus shine along lower waterline
      ctx.beginPath();
      ctx.moveTo(leftX + 42, leftY + 2.5);
      ctx.bezierCurveTo(
        leftX + 70,
        lCp2Y - 2.6,
        rightX - 70,
        lCp1Y - 2.6,
        rightX - 30,
        rightY + 1.5
      );
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Recovery refreshed sheen
      if (st === 'recovery') {
        const recOp = 0.16 + Math.sin(elapsedSec * 4) * 0.08;
        ctx.fillStyle = `rgba(110, 231, 183, ${recOp})`;
        ctx.fillRect(10, 40, 222, 160);
      }

      ctx.restore(); // End aperture clip

      // 4. Soft Upper Eyelid Crease Fold (Subtle Natural Depth)
      const creaseLift = upperLift * 1.16 + 11;
      ctx.beginPath();
      ctx.moveTo(leftX + 10, leftY - 10);
      ctx.bezierCurveTo(
        68,
        120 - creaseLift + closeShift * 0.72,
        172,
        117 - creaseLift * 0.95 + closeShift * 0.72,
        rightX - 6,
        rightY - 9
      );
      ctx.strokeStyle = 'rgba(42, 30, 34, 0.44)';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 5. Soft Tapered Upper & Lower Lid Margins
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.bezierCurveTo(uCp1X, uCp1Y, uCp2X, uCp2Y, rightX, rightY);
      ctx.strokeStyle = '#121015';
      ctx.lineWidth = compact ? 5.2 : 2.8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Subtle outer lower-lid shadow line
      ctx.beginPath();
      ctx.moveTo(leftX + 4, leftY + 0.5);
      ctx.bezierCurveTo(lCp2X, lCp2Y + 1.0, lCp1X, lCp1Y + 1.0, rightX - 1, rightY + 0.5);
      ctx.strokeStyle = 'rgba(26, 22, 28, 0.42)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // 6. Organic Clustered & Tapered Human Eyelashes (Full eye view)
      if (!compact) {
        for (const lash of UPPER_LASHES) {
          const bx = evalCubic(leftX, uCp1X, uCp2X, rightX, lash.t);
          const by = evalCubic(leftY, uCp1Y, uCp2Y, rightY, lash.t);
          const effectiveLen = lash.length * (0.62 + curOpenness * 0.38);
          const liftY = -effectiveLen * (0.38 + curOpenness * 0.62);
          const tx = bx + lash.curlX;
          const ty = by + liftY;
          const cx = bx + lash.curlX * 0.32;
          const cy = by + liftY * 0.62;
          drawTaperedLash(
            ctx,
            bx,
            by + 0.4,
            cx,
            cy,
            tx,
            ty,
            lash.thickness,
            `rgba(16, 14, 20, ${lash.alpha})`
          );
        }

        // Delicate sparser lower eyelashes
        for (const lash of LOWER_LASHES) {
          const bx = evalCubic(rightX, lCp1X, lCp2X, leftX, lash.t);
          const by = evalCubic(rightY, lCp1Y, lCp2Y, leftY, lash.t);
          const tx = bx + lash.curlX;
          const ty = by + lash.length + 1.6;
          const cx = bx + lash.curlX * 0.42;
          const cy = by + lash.length * 0.58 + 1.2;
          drawTaperedLash(
            ctx,
            bx,
            by + 1.8,
            cx,
            cy,
            tx,
            ty,
            lash.thickness,
            `rgba(26, 22, 30, ${lash.alpha})`
          );
        }
      }

      // 7. Outer Corner Squint Creases when Squeezing Near Break
      if (curSquint > 0.04) {
        ctx.save();
        ctx.strokeStyle = `rgba(220, 72, 72, ${curSquint * 0.52})`;
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightX + 1, rightY - 1);
        ctx.quadraticCurveTo(rightX + 7, rightY - 4, rightX + 13, rightY - 7);
        ctx.moveTo(rightX + 1, rightY + 3);
        ctx.quadraticCurveTo(rightX + 7, rightY + 6, rightX + 13, rightY + 10);
        ctx.moveTo(leftX - 1, leftY - 1);
        ctx.quadraticCurveTo(leftX - 7, leftY - 4, leftX - 12, leftY - 7);
        ctx.moveTo(leftX - 1, leftY + 3);
        ctx.quadraticCurveTo(leftX - 7, leftY + 6, leftX - 12, leftY + 9);
        ctx.stroke();
        ctx.restore();
      }

      if (!staticPose) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    if (staticPose) {
      renderFrame(startTime);
      return;
    }

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [compact, staticPose]);

  return (
    <div
      data-testid={compact ? 'header-eye-badge' : 'eye-lottie-container'}
      data-eye-state={staticPose ? 'healthy' : motionState}
      data-eye-static={staticPose ? 'true' : undefined}
      className={`${
        compact ? 'w-9 h-9' : 'w-[244px] h-[244px]'
      } flex items-center justify-center pointer-events-none select-none`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label={compact ? undefined : `Eye status: ${motionState}`}
        aria-hidden={compact ? true : undefined}
      />
    </div>
  );
};
