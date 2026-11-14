export type EyeMotionState =
  | 'healthy'
  | 'blink'
  | 'tired'
  | 'squeeze'
  | 'overdue'
  | 'recovery';

export const EYE_MOTION_ASSET_PATHS: Record<EyeMotionState, string> = {
  healthy: '/assets/aistudio/eye_healthy_3668be00.json',
  blink: '/assets/aistudio/eye_blink_ff9efeda.json',
  tired: '/assets/aistudio/eye_tired_9143fadf.json',
  squeeze: '/assets/aistudio/eye_squeeze_bca725aa.json',
  overdue: '/assets/aistudio/eye_overdue_e6ca7719.json',
  recovery: '/assets/aistudio/eye_recovery_600c0ff4.json',
};

export interface EyeMotionInput {
  progressPercent: number;
  isBreakDue: boolean;
  isBreakSuppressed: boolean;
  isRecovering: boolean;
  isBlinking: boolean;
  isMonitoring: boolean;
}

export function selectEyeMotionState({
  progressPercent,
  isBreakDue,
  isBreakSuppressed,
  isRecovering,
  isBlinking,
  isMonitoring,
}: EyeMotionInput): EyeMotionState {
  if (isRecovering) {
    return 'recovery';
  }

  if (isBreakDue || isBreakSuppressed || progressPercent >= 100) {
    return 'overdue';
  }

  if (!isMonitoring) {
    return progressPercent >= 80
      ? 'squeeze'
      : progressPercent >= 50
      ? 'tired'
      : 'healthy';
  }

  if (progressPercent >= 80) {
    return 'squeeze';
  }

  if (isBlinking) {
    return 'blink';
  }

  if (progressPercent >= 50) {
    return 'tired';
  }

  return 'healthy';
}

export interface EyeVisualMetrics {
  openness: number;
  redness: number;
  vesselOpacity: number;
  squintTension: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function computeEyeVisualMetrics(
  motionState: EyeMotionState,
  progressPercent: number
): EyeVisualMetrics {
  const pct = Math.min(100, Math.max(0, progressPercent));

  if (motionState === 'recovery') {
    return { openness: 1.0, redness: 0.04, vesselOpacity: 0, squintTension: 0 };
  }

  if (motionState === 'overdue' || pct >= 100) {
    return { openness: 0.28, redness: 0.96, vesselOpacity: 0.96, squintTension: 1.0 };
  }

  if (motionState === 'squeeze' || pct >= 80) {
    const t = clamp01((pct - 80) / 19);
    return {
      openness: 0.50 - t * 0.20,
      redness: 0.58 + t * 0.34,
      vesselOpacity: 0.55 + t * 0.37,
      squintTension: 0.45 + t * 0.50,
    };
  }

  if (motionState === 'tired' || pct >= 50) {
    const t = clamp01((pct - 50) / 30);
    return {
      openness: 0.85 - t * 0.17,
      redness: 0.18 + t * 0.24,
      vesselOpacity: 0.14 + t * 0.26,
      squintTension: 0.10 + t * 0.20,
    };
  }

  if (motionState === 'blink') {
    return {
      openness: 1.0,
      redness: pct >= 40 ? ((pct - 40) / 10) * 0.12 : 0,
      vesselOpacity: 0,
      squintTension: 0,
    };
  }

  const preTiredRedness = pct >= 40 ? ((pct - 40) / 10) * 0.1 : 0;
  return {
    openness: 1.0,
    redness: preTiredRedness,
    vesselOpacity: preTiredRedness * 0.6,
    squintTension: 0,
  };
}

const LAYER_Z_PRIORITY: Record<string, number> = {
  'Upper eyelid': 0,
  'Eye outline': 1,
  'Lower lid': 2,
  'Eye highlights': 3,
  Pupil: 4,
  Iris: 5,
  Sclera: 6,
};

export interface LottieJsonLike {
  layers?: Array<{ nm?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export function normalizeEyeLottieData<T extends LottieJsonLike>(data: T): T {
  if (!Array.isArray(data.layers)) return data;
  const sortedLayers = [...data.layers].sort((a, b) => {
    const pa = LAYER_Z_PRIORITY[a.nm ?? ''] ?? 99;
    const pb = LAYER_Z_PRIORITY[b.nm ?? ''] ?? 99;
    return pa - pb;
  });
  return {
    ...data,
    layers: sortedLayers,
  };
}
