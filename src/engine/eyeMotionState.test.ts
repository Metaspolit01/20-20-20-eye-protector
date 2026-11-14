import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectEyeMotionState,
  EYE_MOTION_ASSET_PATHS,
  normalizeEyeLottieData,
} from './eyeMotionState.ts';

test('selectEyeMotionState maps timer progress and alert states accurately', () => {
  assert.equal(
    selectEyeMotionState({
      progressPercent: 10,
      isBreakDue: false,
      isBreakSuppressed: false,
      isRecovering: false,
      isBlinking: false,
      isMonitoring: true,
    }),
    'healthy'
  );

  assert.equal(
    selectEyeMotionState({
      progressPercent: 30,
      isBreakDue: false,
      isBreakSuppressed: false,
      isRecovering: false,
      isBlinking: true,
      isMonitoring: true,
    }),
    'blink'
  );

  assert.equal(
    selectEyeMotionState({
      progressPercent: 60,
      isBreakDue: false,
      isBreakSuppressed: false,
      isRecovering: false,
      isBlinking: false,
      isMonitoring: true,
    }),
    'tired'
  );

  assert.equal(
    selectEyeMotionState({
      progressPercent: 85,
      isBreakDue: false,
      isBreakSuppressed: false,
      isRecovering: false,
      isBlinking: true,
      isMonitoring: true,
    }),
    'squeeze'
  );

  assert.equal(
    selectEyeMotionState({
      progressPercent: 100,
      isBreakDue: true,
      isBreakSuppressed: true,
      isRecovering: false,
      isBlinking: false,
      isMonitoring: true,
    }),
    'overdue'
  );

  assert.equal(
    selectEyeMotionState({
      progressPercent: 0,
      isBreakDue: false,
      isBreakSuppressed: false,
      isRecovering: true,
      isBlinking: false,
      isMonitoring: true,
    }),
    'recovery'
  );

  assert.ok(EYE_MOTION_ASSET_PATHS.healthy.endsWith('.json'));
  assert.ok(EYE_MOTION_ASSET_PATHS.overdue.endsWith('.json'));
});

test('normalizeEyeLottieData orders Pupil, Iris, and Highlights above Sclera', () => {
  const normalized = normalizeEyeLottieData({
    layers: [
      { nm: 'Eye outline' },
      { nm: 'Sclera' },
      { nm: 'Iris' },
      { nm: 'Pupil' },
      { nm: 'Eye highlights' },
      { nm: 'Upper eyelid' },
      { nm: 'Lower lid' },
    ],
  });
  const names = normalized.layers?.map((l) => l.nm) ?? [];
  assert.ok(names.indexOf('Eye highlights') < names.indexOf('Sclera'));
  assert.ok(names.indexOf('Pupil') < names.indexOf('Sclera'));
  assert.ok(names.indexOf('Iris') < names.indexOf('Sclera'));
  assert.ok(names.indexOf('Upper eyelid') < names.indexOf('Sclera'));
});

import { computeEyeVisualMetrics } from './eyeMotionState.ts';

test('computeEyeVisualMetrics progressively squeezes and reddens eye near break', () => {
  const healthy = computeEyeVisualMetrics('healthy', 20);
  const tired = computeEyeVisualMetrics('tired', 65);
  const nearBreakEarly = computeEyeVisualMetrics('squeeze', 82);
  const nearBreakLate = computeEyeVisualMetrics('squeeze', 96);
  const overdue = computeEyeVisualMetrics('overdue', 100);

  assert.equal(healthy.openness, 1.0);
  assert.equal(healthy.redness, 0);

  assert.ok(tired.openness < healthy.openness);
  assert.ok(tired.redness > healthy.redness);

  assert.ok(nearBreakEarly.openness < tired.openness);
  assert.ok(nearBreakEarly.redness >= 0.58);
  assert.ok(nearBreakEarly.vesselOpacity >= 0.55);

  assert.ok(nearBreakLate.openness < nearBreakEarly.openness);
  assert.ok(nearBreakLate.redness > nearBreakEarly.redness);
  assert.ok(nearBreakLate.squintTension > nearBreakEarly.squintTension);

  assert.ok(overdue.openness <= nearBreakLate.openness);
  assert.ok(overdue.redness >= 0.95);
});
