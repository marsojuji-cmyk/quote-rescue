# Quote Rescue

**A local-first quote-to-decision-pack compiler.** Structured estimate in → validated source facts → a customer decision pack that says *"I don't know"* where the source was silent.

Built by Marcus Richards in Calgary. No LLM runs inside the browser — the compiler is deterministic, offline, and inspectable.

**▶ Live demo:** https://marsojuji-cmyk.github.io/quote-rescue/

---

## What it actually does

A contractor's estimate goes in. What comes out is a decision pack a customer can *act* on — and, critically, a list of the questions the source never answered.

| Input | Output |
|---|---|
| Line items with amounts | CAD total, before tax, source-mapped |
| Terms the estimate states | Facts, each traceable to its source path |
| Terms the estimate omits | **Questions with no source fact — never invented promises** |

Worked example (fictional, `customer-sample.json`):

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

## What it refuses to do

These refusals are enforced in code with tests, not stated in prose:

| Refusal | Enforcement |
|---|---|
| Invent warranty / disposal / hardware promises | Unanswered terms surface as questions, never as facts |
| Accept negative, null, `0.001`, or `Infinity` amounts | Validation blocks the export — a misleading pack cannot be downloaded |
| Leak inspector notes into the customer pack | Standalone export carries source facts only |
| Approve a quote / reserve a date / form a contract | Explicitly out of scope, stated in the pack itself |

## Verification

```
30/30  browser flows        (BROWSER-VERIFICATION.json, 2026-10-04)
 13/13  node unit tests     (studio-source/tests.mjs)
```

Editable-fact staleness is covered: change a supplied fact and the previously compiled pack is marked stale; regenerating is required. Presets (`door`, `service`, `minimal`) each invalidate correctly.

## Run it

```bash
git clone https://github.com/marsojuji-cmyk/quote-rescue
cd quote-rescue
node studio-source/tests.mjs        # 13/13
open index.html                      # the gallery, offline
```

Open `customer-sample.html` for the compiled pack, or `customer-sample.pdf` for the exported PDF.

## Boundaries — read before real use

- The sample contractor, project, and amounts are **fiction**. The `FICTIONAL DEMO` banner is part of the artifact.
- SHA256 establishes **consistency, not truth or authenticity**. A hash proves a document is unchanged; it says nothing about whether the estimate is correct.
- Not technical, legal, or contractual advice. Human verification is required before any real-world contractor use.
- No customer records, no credentials, no rig secrets are in this repository.
- The CAD 350 manual-reviewed pilot price discussed in the design notes is an **unvalidated hypothesis**, not an offer.

## Why it exists

The rig that built it works the way the product does: state what is known, name what is unknown, and refuse to let an unverified claim become a fact. The compiler's refusal to invent a warranty term is the same discipline as a build log refusing to claim a test passed when it did not.

## License

MIT — see `LICENSE`.
