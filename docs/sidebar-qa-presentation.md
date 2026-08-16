# Optional dsh-sidebar-qa presentation integration

`dsh-rice` can present `dsh-sidebar-qa` with the same lightweight interaction geometry as the rice-owned shell without changing the plugin's session, model, prompt, or persistence semantics.

## Activation boundary

The integration is optional.

- `dsh-rice` keeps no static or package dependency on `dsh-better-sidebar` or `dsh-sidebar-qa`.
- The selection popover is styled only under the plugin-owned `[data-dsh-sidebar-qa]` body host.
- The Ask tab is wrapped only when the live Better Sidebar registry exposes the exact descriptor id `dsh-sidebar-qa:ask`.
- If Better Sidebar or Sidebar QA is absent, the integration contributes no behavior.

The Ask tab wrapper is intentionally a compatibility seam rather than an upstream contract. Better Sidebar 0.12 exposes `getTab()` and registry subscription but no descriptor replacement API, so rice temporarily replaces that descriptor's `component` reference in place and restores the original component on disposal. No Sidebar QA CSS-module class name is consumed.

## Presentation changes

The selection action becomes a compact contextual surface with a reduced shadow and borderless semantic fill. Coarse-pointer environments keep a 44px minimum target.

Within the Ask tab, rice scopes changes to structural chrome:

- the follow-up switcher loses its surrounding divider weight;
- follow-up pills keep Sidebar QA's own active-state semantics while using tighter geometry;
- `新追问` becomes a compact `+` action while its original button text remains in the DOM;
- the textarea and send button become one composer seat;
- the send button keeps the original button and keyboard behavior while presenting an embedded arrow/working indicator;
- assistant Markdown, quoted evidence, transcript streaming, follow-up lineage, and title behavior remain owned by Sidebar QA.

## Deliberately unchanged

This integration does not change:

- `answerProvider`, `answerModel`, or reasoning effort;
- summarization or title-model configuration;
- context construction or grounding policy;
- session creation, parent/child lineage, or persistence;
- Better Sidebar panel sizing or tab topology;
- Sidebar QA host routes or settings.

Model-quality experiments therefore stay in Sidebar QA configuration instead of becoming presentation policy in `dsh-rice`.
