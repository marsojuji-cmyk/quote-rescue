# Quote Rescue

**Compiles a contractor estimate into a customer decision pack that says "I don't know" wherever the quote is silent.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-GitHub%20Pages-2ea44f.svg)](https://marsojuji-cmyk.github.io/quote-rescue/)

A local-first quote-to-decision-pack compiler. A structured estimate goes in, its facts are validated against the source, and a customer decision pack comes out. A quote that silently assumes warranty terms is how disputes start, so where the source is silent the pack asks a question instead of inventing a promise. The compiler is deterministic, offline and inspectable; no LLM runs in the browser. Built by Marcus Richards in Calgary.

**Live demo:** https://marsojuji-cmyk.github.io/quote-rescue/

## What it guarantees

Each of these is covered by `studio-source/tests.mjs`:

- **No invented terms.** Unknown, blank or missing terms (warranty, disposal, hardware, schedule) stay questions and never become facts.
- **Exact money or no pack.** Amounts must be exact, non-negative, finite cents. `-1`, `-0`, `null`, `Infinity` and sub-cent values fail validation with a path, and no customer pack is emitted.
- **Private notes stay private.** Inspector notes and hostile markup stay out of the customer HTML, prototype keys are rejected, and unknown fields stay out of the pack.
- **Deterministic.** The same source rebuilds the same customer document.
- **Stale packs can't export.** A late hash is dropped by revision token, and pending hashes don't enable exports.
- **Out of scope by statement.** The pack says it doesn't approve the quote, reserve a date or form a contract.

## Quickstart

```bash
git clone https://github.com/marsojuji-cmyk/quote-rescue && cd quote-rescue
node studio-source/tests.mjs        # 13 passed
open index.html                      # the gallery, offline
```

Open `customer-sample.html` for the compiled pack, or `customer-sample.pdf` for the exported PDF.

## How it fails

| Condition | Behaviour |
|---|---|
| Invalid amount (negative, null, non-finite, not an exact cent) | Validation reports the JSON path and the pack is not emitted, so a misleading pack can't be downloaded |
| A supplied fact is edited after compiling | The compiled pack is marked stale and must be regenerated |
| Web Crypto unavailable | The hash reports unavailable and the pack still compiles. This is exercised only in Node's `vm`, not in a real browser |
| Source silent on a term | The term becomes a "Confirm …" question in the pack |

SHA-256 establishes **consistency, not truth or authenticity**: it proves a document is unchanged, not that the estimate is correct.

## Evidence

- `node studio-source/tests.mjs`, run locally 2026-10-07 on Node 22: **13 passed**.
- 30/30 headless-Chrome checks with `pageErrors = []`, recorded 2026-10-04 in the committed [`studio-source/BUILD-REPORT.md`](studio-source/BUILD-REPORT.md). The raw `BROWSER-VERIFICATION.json` it cites is not committed. The repo has no CI workflow, so neither suite runs automatically.
- The worked example matches the committed `customer-sample.html`: CAD 1,400.00 + 1,800.00 = 3,200.00 before tax, four unanswered terms, and no exclusions or options listed.

## What it does

A contractor's estimate goes in. What comes out is a decision pack a customer can *act* on — and, critically, a list of the questions the source never answered.

| Input | Output |
|---|---|
| Line items with amounts | CAD total, before tax, source-mapped |
| Terms the estimate states | Facts, each traceable to its source path |
| Terms the estimate omits | **Questions with no source fact — never invented promises** |

Worked example (fictional; the compiled pack is [`customer-sample.html`](customer-sample.html)):

```
Entry door replacement — Fictional Doorwright Co.
  Removal + installation .................... CAD 1,400.00   /lineItems/0
  Insulated steel entry-door unit ............ CAD 1,800.00   /lineItems/1
  ─────────────────────────────────────────────────────────
  Total (before tax) ......................... CAD 3,200.00

Questions the source did not answer (6):
  • Warranty   — no source fact supplied
  • Disposal   — no source fact supplied
  • Hardware   — no source fact supplied
  • Schedule   — no source fact supplied
  • Exclusions — none listed in the source
  • Options    — none listed in the source
```

That question list is the product. A quote that silently assumes warranty terms is how disputes start.

## Boundaries (read before real use)

- The sample contractor, project, and amounts are **fiction**. The `FICTIONAL DEMO` banner is part of the artifact.
- SHA256 establishes **consistency, not truth or authenticity**. A hash proves a document is unchanged; it says nothing about whether the estimate is correct.
- Not technical, legal, or contractual advice. Human verification is required before any real-world contractor use.
- No customer records, no credentials, no rig secrets are in this repository.
- The CAD 350 manual-reviewed pilot price discussed in the design notes is an **unvalidated hypothesis**, not an offer.

## Why it exists

The rig that built it works the way the product does: state what is known, name what is unknown, and refuse to let an unverified claim become a fact. The compiler's refusal to invent a warranty term is the same discipline as a build log refusing to claim a test passed when it did not.

## Status

Working demo, published on GitHub Pages. No CI yet. The CAD 350 pilot price is an unvalidated hypothesis.

## License

MIT. See `LICENSE`.
