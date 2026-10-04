# QUOTE RESCUE / Demonstrator blueprint v1

## 1 Goal and authority
Marcus directs Raven to own the project and do the execution, demonstrating to a friend the sophistication of their rig and collaboration. Build a refined runnable browser product in this session, bounded by the original one-hour intent and no incremental cash outlay. Prioritize a completed, honest demonstration over broad speculative autonomy. Permission covers local reversible build, tests, packaging and presentation. No public publication, outreach, payment, new subscriptions, secrets, crons, model changes or live rig changes.

## 2 Deliverables
Self-contained offline-capable index.html, user guide, demo walkthrough, small test harness if helpful. A dependency-free browser workbench, no backend or network calls required. Primary Compare/Inspect surface; refined warm ivory editorial paper + near-black inspector + restrained forest accent, typography chosen deliberately (local Georgia headings and local humanist sans). No gradients/glassmorphism, fake dashboards, three-feature-card marketing templates. Responsive at 390px and 1440px. Reduced-motion support. Keyboard accessibility. Render initially populated with explicit FICTIONAL DEMO data, not a blank upload screen. Prominent Quote Rescue brand and one-sentence problem.

## 3 Measured baseline
Existing launch kit at /Users/user/.hermes/workspace/quote-rescue/LAUNCH-KIT.md has 63 lines, offer copy and fictional prose, but no interactive product, export, source inspector or automated validator. Baseline capability: proposal only. Existing audio at QUOTE-RESCUE-AVA.mp3 is unrelated to application's behavior.

## 4 Small coherent slice
Pipeline: editable structured estimate JSON -> validation -> deterministic decision-pack generation -> rendered customer view + evidence inspector -> copy/download HTML/JSON and print/PDF via browser print. No simulated LLM agents or fabricated execution traces: this is a deterministic document compiler, not natural-language inference. Name it clearly in the evidence drawer. Actual rig collaboration is shown in a README with lane provenance, not pretend agents working inside the app.

Use a typed estimate object with schemaVersion, fictional (boolean), currency (CAD only for v1), contractor, projectTitle, quoteId, lineItems (id, description, amount), facts (id, label, value), exclusions array, options array (label, amount, description only if explicitly supplied), and optional notes. Each fact output carries source reference to JSON pointer. Inputs plain text rendered safely, never interpreted HTML. Original fact values and monetary totals preserved. Amounts finite nonnegative numeric bounded sane values; integer-cent computation and subtotal. Tax UNKNOWN unless explicit supported tax amount supplied (may omit entirely, show before tax). No invented good/better/best options, guarantees, warranty or schedule. Source facts missing = named question to confirm, not affirmative claim. Invoice/contract approval cannot be executed; generate next-step copy only.

Preset A fictional entry door: line items Removal + installation 1400; insulated steel entry-door unit 1800, total CAD 3200 before tax. Facts: finish primed white, dimensions site confirmation required; warranty absent; disposal absent; hardware absent. All supplied illustrative figures clearly fictional, not market estimates. Preset B fictional garage door servicing: inspection 120, adjustment 160, total 280; warranty, schedule, hardware unknown. Preset C minimal 'Replace entry door' 3200; demonstrates missing data without invention. User may edit JSON, import JSON locally, reset preset.

Must support invalid JSON, missing fields, wrong currency, negative amount, nonfinite/null amount, duplicate line IDs, blank descriptions. Keep last valid packet untouched when validation fails; error visible; disable export for stale outputs or explicitly mark stale and prevent confusing it with current source. Simpler recommended: clear output on invalid Generate. Generate runs synchronously and shows actual measured browser elapsed time only; no fake progress delays or simulated agent animations. Show real fact/source count and missing-question count only computed from current data. No invented quality/clarity score or claimed lift/revenue.

Evidence inspector tabs/panel: Source mapping, Missing information, Run receipt (compiler version, local timestamp, input/output hashes with Web Crypto when supported and honest unavailable state otherwise; no hash fallback falsely labelled cryptographic). Receipt generated only by actual run. An editable-input revision must mark result stale until regenerated. Price offer CAD350 is separate illustrative pilot price, not quote price, and clearly unvalidated. File data stays in browser memory, no unnecessary localStorage of client quotes. Export shareable standalone customer HTML without raw source/private notes; receipt says trace integrity is not truth verification. Print customer document only.

## 5 Impact arithmetic
No monetary ROI asserted. Compare baseline 0 runnable flows / 0 exports to completed tested flow and export counts measured by Raven. Commercial hypothesis from existing kit: CAD350 per manual-reviewed quote pack, unvalidated. Shipping criterion: functional application, not profit.

## 6 Verification criteria — Raven owns gate
Open local page in real browser; inspect screenshot 1440x900 and narrow viewport; check no JS errors and no external network dependencies. Exercise all three presets, edit fact and regenerate, bad JSON, negative/null amount, duplicate IDs, hostile markup text escaped, reset, customer export parse/readback with exact price and facts, stale export blocked, print CSS. Independently recompute 3200/280 totals using tool. Download filenames portable. All buttons have real behavior. Include data-testid hooks and expose minimal pure compiler functions via window.QuoteRescue for direct deterministic tests; browser interaction still required. Test harness dependency-free Node if architecture permits; no npm installs needed. Surface source-text fixtures explicitly fictional. No personal rig state or customer data in shareable artifact.

## 7 Ownership and routing
Raven authors spec/verification; analysis subagent provides critical review (fallback provenance explicit); Cursor code builder preferred. Current cursor-headless status reports host-hold pulse critical load15.43; attempt dispatch and honor refusal. Codex fallback builds if refused, no force bypass. Code builders confined to isolated project source or worktree. Existing kit/audio preserved. No edits to Hermes repo.

## 8 Falsifiers and stop
Reject demo if exported price/facts drift, unknown terms turn into promises, invalid input silently produces a valid-looking new packet, or source HTML executes. Stop at one refined working slice; don't build cloud SaaS, agents, CRM, scraping or payment infrastructure. Demand remains unvalidated until a real buyer commits. Build budget max one bounded implementation round + a necessary defect repair; no additive polishing beyond acceptance.

## 9 Rollback
New isolated directory /Users/user/.hermes/workspace/quote-rescue/studio-source and build worktree only. Existing launch kit unchanged. No production deploy; rollback means stop local preview/server and retain files for archive. No destructive deletion required.

## 10 Council gate
Pending independent read-only review; builder must use review amendments accepted by Raven before implementation. Current direct build scope comes from Marcus's latest messages. No claim of Grok involvement unless actual Grok execution occurs.
