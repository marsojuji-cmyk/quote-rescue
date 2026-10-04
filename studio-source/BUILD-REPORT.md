# BUILD REPORT — Quote Rescue Studio

Repair and verification pass on the existing page. Layout, presets, and compiler
behavior were left as they were. The page was **not** redesigned.

Status: **VERIFIED GREEN** — 13/13 Node checks, 30/30 headless-Chrome checks,
zero page errors. `index.html` sha256 `776ac9d0d722…` (full hash in
`BROWSER-VERIFICATION.json`).

## 1. Runtime bug (the one that shipped broken)

Preset generation called `validateEstimate` → `noteIgnored`, which read a global
`BANNED[key]` that was **never declared**. Boot threw `ReferenceError: BANNED is
not defined` and the customer view stayed empty. Fixed: `noteIgnored` now calls
the already-defined `isBanned(key)`.

A plain object map would have been the wrong stand-in — `constructor` and
`__proto__` are truthy on `Object.prototype`, so a normal lookup would treat them
as allowed. `isBanned` is a string comparison and does not have that flaw.

## 2. Realm fragility in `isPlainObject` (found by the test gate, fixed at root)

`isPlainObject` compared a value's prototype against *this realm's*
`Object.prototype`:

```js
return proto === Object.prototype || proto === null;
```

That rejects ordinary JSON objects created in **any other realm** — an iframe, a
worker, a Node `vm` context, an SSR host. In this project it made the whole
library unusable from the Node test harness, which is a real integration
constraint, not a test artifact: the same failure would hit anyone embedding the
compiler in an iframe or worker.

Fixed with a realm-agnostic test that keeps the hardening intact:

```js
if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
if (Object.prototype.toString.call(value) !== '[object Object]') return false;
var proto = Object.getPrototypeOf(value);
if (proto === null) return true;              // Object.create(null)
return Object.getPrototypeOf(proto) === null; // some realm's Object.prototype
```

Class instances, arrays, `Date`, `Map`, and objects with an injected prototype
still fail, so prototype-key rejection is unchanged. Proven by the passing
`prototype keys are rejected` test.

## 3. Test harness realm correctness

`tests.mjs` built fixtures with the **host** realm's `JSON.parse`, so
`isPlainObject` rejected every fixture and `assert.deepStrictEqual` (aliased by
`node:assert/strict`) compared prototypes across realms. Fixtures are now built
inside the sandbox realm via `runInContext`, and cross-realm structural
comparisons go through a `sameShape` helper. This is why 12 tests failed before
the fix and 13 pass after.

## 4. Files

| File | Change |
| --- | --- |
| `index.html` | `BANNED[key]` → `isBanned(key)`; `isPlainObject` made realm-agnostic. No CSS or markup change. |
| `tests.mjs` | New. Loads the embedded script in a Node `vm` with `document` undefined; 13 checks. |
| `README.md` | New. API table, demo script, receipt canonicalization, limitations. |
| `BUILD-REPORT.md` | This file. |

`hasOwn` is declared beside `isBanned` and is never referenced. It does not
throw. Left in place.

## 5. Verification — executed, not asserted

```
node tests.mjs
→ 13 passed

headless Chrome (Playwright, file:// URL)
→ 30/30 checks passed; pageErrors = []
```

Browser checks include: boot with no page error; three presets compile to exact
totals (3200.00 / 280.00 / 3200.00); stale-export invalidation on edit; edited
fact preserved verbatim; invalid JSON rejected with a visible error; **real
download readback** of customer HTML and JSON (containing 3200.00, free of the
private note); JSON allowlist (no `inputSnapshot`); live SHA-256 in the receipt;
390 px no horizontal overflow; print hides the private editor; **one network
request, all `file:`** (fully offline); zero runtime errors.

## 6. Known limits (unchanged, stated plainly)

- Chrome/Chromium verified. Safari and Firefox were not exercised.
- Web Crypto unavailable is handled (exports still work, receipt says
  unavailable) but was only exercised in the Node `vm`, not in a browser without
  `crypto.subtle`.
- The fixtures are fictional. A generated pack is a reading aid; it does not
  approve a quote, reserve a date, or form a contract.
- No server, account, upload, or analytics. Nothing leaves the machine.
