# Session activity pulse

`dsh-rice` contributes a small, read-only activity pulse to the existing
`conversation.composer.dock` list slot. It is session telemetry in the
InputBar footer, not a composer-context card: the pulse sits below the input
card and before the upstream StatsLine, and the blank-session hero does not
render it. The surface does not own Session state, create a second activity
log, or change model/tool execution.

## Layers

The implementation keeps four boundaries explicit:

1. **Runtime signal** — `derivePulseSignal()` reduces the DSH conversation
   snapshot plus the optional `sessionStats.steps` projection to the small set
   the presentation needs: step count, streaming partial, running tool, running
   turn, recent scheduled retry, and last error.
2. **Activity model** — a bounded ten-second step window produces a synthetic
   activity rate. The default presentation policy uses a 42 BPM idle floor,
   a 150 BPM ceiling, +38 while a model partial is live, +52 while a tool is
   running, +10 while a turn is in flight, and a 6 BPM/s display ramp. A fresh
   scheduled model retry is represented as a flatline. These numbers are UI
   semantics, not measured physiology or an engine health metric.
3. **ECG temporal model** — `ecgValue()` is a pure P-QRS-T-U shaped function.
   `PulseTimeline` integrates beat phase continuously so a BPM change changes
   the slope at that instant rather than recomputing old samples from a new
   rate.
4. **Canvas renderer** — the paper speed is fixed at 30 px/s. A right-to-left
   erase bar refreshes only pixels it crosses, preserving already-written
   history. `prefers-reduced-motion: reduce` disables the animation and paints
   a static trace instead.

The pulse uses DSH semantic theme variables only. It therefore follows stock
DSH themes and semantic theme providers without importing or depending on any
specific provider.

## DSH contract

The slot choice was checked against public `deepseek-ai/deepseek-harness` at
`47f943859bef60e4160492346772ded9b24f765a`. At that revision,
`conversation.composer.dock` is an additive session-scoped list rendered by
ConversationRoot as the InputBar footer only outside the blank hero. Upstream
StatsLine occupies that list at order 0; `dsh-rice.pulse` registers at order
-10 so the visual order is input card → pulse → StatsLine.

The pulse outer surface is capped by `--dsh-chat-content-width`, the same shared
conversation width axis used by StatsLine and the content-width composer
family. It remains responsive below that cap, but widening the browser no
longer expands the ECG toward viewport width or changes its visible paper
horizon indefinitely.

`sessionStats` is optional for the pulse. If its `steps` projection is absent,
the signal layer falls back to counting settled assistant nodes in the current
snapshot; no new persistence or background index is introduced.

## CHIRAL PULSE provenance

The activity-to-BPM presentation idea, fixed-paper-speed ECG treatment,
continuous phase model, and P-QRS-T-U waveform implementation were adapted
from `MoonShadow1976/chiral-pulse`, audited at
`4e5ba581468370871ff79e159c1c1b9dd31433b1` (release line v1.2.7).
`dsh-rice` does not copy CHIRAL PULSE's Death Stranding skin, copy, global CSS,
or visual assets.

CHIRAL PULSE is distributed under the MIT License:

```text
MIT License

Copyright (c) 2026 CHIRAL PULSE contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
