const clamp01 = (value) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

const FAILURE_EVENTS = Object.freeze({
  'wrong-cable': ['breaker-blackout', 'pressure-fog'],
  'weld-overheat': ['breaker-blackout', 'weld-spark-burst', 'pressure-fog'],
  'valve-slip': ['valve-kick', 'pressure-pulse'],
});

export function deriveMaintenanceFeedback(previous = {}, next = {}) {
  const events = [];
  if (next.phase && next.phase !== previous.phase) events.push(`phase-${next.phase}`);
  if (next.lastSoftFailure && (
    next.lastSoftFailure !== previous.lastSoftFailure
    || next.failureCount !== previous.failureCount
  )) {
    events.push(...(FAILURE_EVENTS[next.lastSoftFailure] ?? []));
  }
  if (next.complete === true && previous.complete !== true) events.push('power-cascade');

  const powerStability = clamp01((Number.isFinite(next.repairQuality) ? next.repairQuality : 0) / 100);
  return Object.freeze({
    events: Object.freeze(events),
    blackout: events.includes('breaker-blackout') ? 1 : 0,
    fogBurst: events.includes('pressure-fog') ? 1 : 0,
    cameraImpulse: events.includes('valve-kick') ? 0.65 : 0,
    weldHeat: clamp01(next.weldHeat),
    weldProgress: clamp01(next.weldProgress),
    valveProgress: clamp01(next.valveProgress),
    valveResistance: clamp01(next.valveResistance),
    powerSections: next.complete === true ? 6 : 0,
    powerStability,
    excludedCables: Object.freeze(Array.isArray(next.excludedCables) ? [...next.excludedCables] : []),
  });
}
