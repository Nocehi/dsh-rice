/**
 * Session-pulse activity policy and ECG temporal model.
 * Adapted from the MIT-licensed CHIRAL PULSE HeartLine/ECG implementation;
 * see docs/session-pulse.md for provenance and license text.
 */
export const PULSE_DEFAULTS = Object.freeze({
  floorBpm: 42,
  ceilingBpm: 150,
  activityWindowMs: 10_000,
  stepWeight: 6,
  thinkingBoost: 38,
  toolBoost: 52,
  runningBoost: 10,
  rampBpmPerSecond: 6,
  retryFreshMs: 120_000,
  paperSpeedPxPerSecond: 30,
})

function settledNodes(session) {
  const legacy = session?.chat?.legacy?.nodes
  if (Array.isArray(legacy)) return legacy
  return Array.isArray(session?.nodes) ? session.nodes : []
}

function fallbackSteps(session) {
  let steps = 0
  for (const node of settledNodes(session)) {
    if (node?.kind === 'assistant') steps += 1
  }
  return steps
}

function retryingNow(session, nowEpochMs, freshMs) {
  const nodes = settledNodes(session)
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index]
    if (node?.kind !== 'model-retry') continue
    return node.retryState === 'scheduled'
      && Number.isFinite(node.time)
      && node.time > nowEpochMs - freshMs
  }
  return false
}

/** Normalize one DSH conversation snapshot into the small signal set the presentation consumes. */
export function derivePulseSignal(session, projectedSteps, nowEpochMs = Date.now(), config = PULSE_DEFAULTS) {
  const runningCalls = Array.isArray(session?.runningCalls) ? session.runningCalls : []
  const toolName = typeof runningCalls[0]?.name === 'string' && runningCalls[0].name !== ''
    ? runningCalls[0].name
    : null
  const steps = Number.isFinite(projectedSteps) ? projectedSteps : fallbackSteps(session)
  return Object.freeze({
    steps: Math.max(0, steps),
    partial: session?.partial !== null && session?.partial !== undefined,
    toolName,
    running: session?.running === true,
    retrying: retryingNow(session, nowEpochMs, config.retryFreshMs),
    error: session?.lastAgentError ?? null,
  })
}

/** Keep a single pre-cutoff baseline plus step-count changes inside the bounded activity window. */
export function updatePulseSamples(samples, steps, nowMs, windowMs = PULSE_DEFAULTS.activityWindowMs) {
  const now = Number.isFinite(nowMs) ? nowMs : 0
  const value = Number.isFinite(steps) ? Math.max(0, steps) : 0
  const cutoff = now - windowMs
  let baseline
  const next = []
  for (const sample of Array.isArray(samples) ? samples : []) {
    if (!Number.isFinite(sample?.t) || !Number.isFinite(sample?.steps) || sample.t > now) continue
    const copy = { t: sample.t, steps: sample.steps }
    if (sample.t < cutoff) baseline = copy
    else next.push(copy)
  }
  if (baseline !== undefined) next.unshift(baseline)
  const last = next[next.length - 1]
  if (last === undefined) return Object.freeze([Object.freeze({ t: now, steps: value })])
  if (value < last.steps) return Object.freeze([Object.freeze({ t: now, steps: value })])
  if (value !== last.steps) next.push({ t: now, steps: value })
  return Object.freeze(next.map(sample => Object.freeze(sample)))
}

/** Step velocity decays naturally while no new step arrives because the denominator extends to now. */
export function pulseStepRate(samples, nowMs) {
  if (!Array.isArray(samples) || samples.length < 2) return 0
  const first = samples[0]
  const last = samples[samples.length - 1]
  const delta = Math.max(0, last.steps - first.steps)
  const span = Math.max(1, nowMs - first.t)
  return (delta / span) * 60_000
}

/** Map runtime signal + recent step velocity to a synthetic activity pulse. No runtime authority is created here. */
export function derivePulseActivity(signal, samples, nowMs, config = PULSE_DEFAULTS) {
  if (signal.retrying) return Object.freeze({ targetBpm: 0, mode: 'flat', stepRate: 0 })
  const stepRate = pulseStepRate(samples, nowMs)
  const base = Math.min(config.ceilingBpm, Math.max(config.floorBpm, config.floorBpm + stepRate * config.stepWeight))
  const targetBpm = Math.min(config.ceilingBpm, Math.max(config.floorBpm,
    base
      + (signal.toolName !== null ? config.toolBoost : 0)
      + (signal.partial ? config.thinkingBoost : 0)
      + (signal.running ? config.runningBoost : 0)))
  const mode = signal.toolName !== null ? 'tool' : signal.partial ? 'think' : signal.running ? 'run' : 'idle'
  return Object.freeze({ targetBpm, mode, stepRate })
}

/** Advance the displayed non-flat rate by a constant ramp while preserving the configured idle floor. */
export function advancePulseBpm(currentBpm, targetBpm, dtSeconds, config = PULSE_DEFAULTS) {
  const requested = Number.isFinite(targetBpm) ? targetBpm : config.floorBpm
  if (requested <= 0) return config.floorBpm
  const current = Math.max(config.floorBpm, Number.isFinite(currentBpm) ? currentBpm : config.floorBpm)
  const target = Math.max(config.floorBpm, requested)
  const dt = Number.isFinite(dtSeconds) ? Math.max(0, dtSeconds) : 0
  const step = config.rampBpmPerSecond * dt
  const diff = target - current
  if (diff > step) return current + step
  if (diff < -step) return current - step
  return target
}

function bump(phase, center, width, amplitude) {
  let distance = phase - center
  distance -= Math.round(distance)
  return amplitude * Math.exp(-(distance * distance) / (2 * width * width))
}

/** One normalized P-QRS-T-U cardiac-looking cycle; pure presentation, not measured physiology. */
export function ecgValue(phase) {
  return (
    bump(phase, 0.14, 0.030, 0.16)
    - bump(phase, 0.30, 0.011, 0.26)
    + bump(phase, 0.335, 0.016, 1.0)
    - bump(phase, 0.375, 0.011, 0.34)
    + bump(phase, 0.52, 0.048, 0.26)
    + bump(phase, 0.80, 0.012, 0.05)
  )
}

/**
 * Continuous beat-phase history used by renderers. Rate changes alter slope at
 * the change point instead of recomputing `time * bpm`, so already-painted and
 * newly-painted samples stay on one unbroken phase function.
 */
export class PulseTimeline {
  constructor(nowSeconds = 0, bpm = PULSE_DEFAULTS.floorBpm, lookbackSeconds = 30) {
    this.reset(nowSeconds, bpm, lookbackSeconds)
  }

  reset(nowSeconds = 0, bpm = PULSE_DEFAULTS.floorBpm, lookbackSeconds = 30) {
    const now = Number.isFinite(nowSeconds) ? nowSeconds : 0
    const rate = Number.isFinite(bpm) ? Math.max(0, bpm) : PULSE_DEFAULTS.floorBpm
    const lookback = Number.isFinite(lookbackSeconds) ? Math.max(0, lookbackSeconds) : 0
    this.now = now
    this.phase = 0
    this.history = [
      { t: now - lookback, phase: -(lookback * rate) / 60 },
      { t: now, phase: 0 },
    ]
  }

  advance(nowSeconds, bpm) {
    if (!Number.isFinite(nowSeconds) || nowSeconds <= this.now) return this.phase
    const rate = Number.isFinite(bpm) ? Math.max(0, bpm) : 0
    const dt = nowSeconds - this.now
    this.phase += (rate / 60) * dt
    this.now = nowSeconds
    this.history.push({ t: this.now, phase: this.phase })
    return this.phase
  }

  phaseAt(timeSeconds) {
    const history = this.history
    if (!Number.isFinite(timeSeconds) || history.length === 0) return this.phase
    if (timeSeconds <= history[0].t) return history[0].phase
    const last = history[history.length - 1]
    if (timeSeconds >= last.t) return last.phase
    let low = 0
    let high = history.length - 1
    while (high - low > 1) {
      const middle = (low + high) >> 1
      if (history[middle].t <= timeSeconds) low = middle
      else high = middle
    }
    const a = history[low]
    const b = history[high]
    if (b.t === a.t) return b.phase
    const mix = (timeSeconds - a.t) / (b.t - a.t)
    return a.phase + mix * (b.phase - a.phase)
  }

  trimBefore(minSeconds) {
    while (this.history.length > 2 && this.history[1].t < minSeconds) this.history.shift()
  }
}