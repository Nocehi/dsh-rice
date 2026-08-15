import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PULSE_DEFAULTS, PulseTimeline, advancePulseBpm, derivePulseActivity,
  derivePulseSignal, ecgValue, pulseStepRate, updatePulseSamples,
} from '../src/pulse.js'

test('runtime signal reads DSH snapshot state without creating another authority', () => {
  const now = 1_000_000
  const session = {
    partial:{ blocks:[] }, running:true, runningCalls:[{ name:'bash' }], lastAgentError:null,
    chat:{ legacy:{ nodes:[
      { kind:'assistant', time:now - 5_000 },
      { kind:'assistant', time:now - 4_000 },
      { kind:'model-retry', retryState:'scheduled', time:now - 1_000 },
    ] } },
  }
  const projected = derivePulseSignal(session, 9, now)
  assert.deepEqual(projected, { steps:9, partial:true, toolName:'bash', running:true, retrying:true, error:null })
  const fallback = derivePulseSignal({ ...session, chat:{ legacy:{ nodes:session.chat.legacy.nodes.slice(0, 2) } } }, undefined, now)
  assert.equal(fallback.steps, 2)
  assert.equal(fallback.retrying, false)
})

test('activity policy keeps bounded samples, preserves cutoff activity, and layers live boosts', () => {
  let samples = updatePulseSamples([], 10, 0)
  samples = updatePulseSamples(samples, 11, 5_000)
  assert.equal(Math.round(pulseStepRate(samples, 10_000)), 6)
  const signal = { steps:11, partial:true, toolName:null, running:true, retrying:false, error:null }
  const activity = derivePulseActivity(signal, samples, 10_000)
  assert.equal(activity.mode, 'think')
  assert.equal(activity.targetBpm, 126)
  assert.equal(derivePulseActivity({ ...signal, toolName:'bash' }, samples, 10_000).targetBpm, PULSE_DEFAULTS.ceilingBpm)
  assert.deepEqual(derivePulseActivity({ ...signal, retrying:true }, samples, 10_000), { targetBpm:0, mode:'flat', stepRate:0 })

  const cutoffSamples = updatePulseSamples([{ t:0, steps:20 }, { t:9_000, steps:21 }], 21, 10_001)
  assert.deepEqual(cutoffSamples, [{ t:0, steps:20 }, { t:9_000, steps:21 }])
  assert.ok(pulseStepRate(cutoffSamples, 10_001) > 0)

  samples = updatePulseSamples(samples, 3, 11_000)
  assert.deepEqual(samples, [{ t:11_000, steps:3 }])
})

test('displayed BPM uses a constant ramp and preserves the idle floor across flatline', () => {
  assert.equal(advancePulseBpm(42, 90, 1), 48)
  assert.equal(advancePulseBpm(90, 42, 0.5), 87)
  assert.equal(advancePulseBpm(88, 90, 1), 90)
  assert.equal(advancePulseBpm(42, 0, 10), PULSE_DEFAULTS.floorBpm)
  assert.equal(advancePulseBpm(0, 42, 1), PULSE_DEFAULTS.floorBpm)
})

test('ECG temporal model preserves one continuous phase function across rate changes', () => {
  const timeline = new PulseTimeline(0, 60, 10)
  assert.equal(timeline.phaseAt(-5), -5)
  timeline.advance(1, 60)
  timeline.advance(2, 120)
  assert.equal(timeline.phaseAt(1), 1)
  assert.equal(timeline.phaseAt(1.5), 2)
  assert.equal(timeline.phaseAt(2), 3)
  timeline.trimBefore(1.25)
  assert.ok(timeline.history.length >= 2)
  assert.ok(ecgValue(0.335) > ecgValue(0.14))
  assert.ok(ecgValue(0.30) < 0)
})
