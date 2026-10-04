# Quote Rescue Studio

Quote Rescue is a local, deterministic estimate compiler. Open `index.html` in a browser. It reads a JSON estimate, checks it, and builds a customer page plus an evidence inspector. No server, account, or network call is required. Nothing in the page is an AI model.

The fixtures are fictional. A generated pack is a reading aid. It does not approve a quote, reserve a date, or form a contract.

## Open the demo

Open `index.html` from this directory (`file://` is enough). The entry-door preset is loaded and generated on startup. The customer page should show `FICTIONAL DEMO` and a before-tax subtotal of CAD 3200.00.

If the customer page stays empty, the browser console has a page error. Generation is synchronous. Hashing, when Web Crypto is available, finishes afterward and does not change the customer text.

## Demo script

1. Leave the entry-door preset as loaded. Confirm CAD 3200.00, the two line items (1400.00 and 1800.00), the finish and dimensions statements, and questions for warranty, disposal, hardware, schedule, exclusions, and options.
2. In the evidence inspector, open Source mapping, Missing information, and Run receipt. Mapping rows are JSON pointers into the estimate. The receipt names the compiler and either shows SHA-256 hex or an honest unavailable/error state.
3. Click Garage service. The previous pack is marked stale and copy, download, and print turn off. Click Generate decision pack. The subtotal is CAD 280.00. Warranty, schedule, and hardware stay questions because the source says unknown.
4. Click Minimal door, then Generate. The subtotal is CAD 3200.00. Missing facts stay questions. The page does not invent a warranty, date, or hardware price.
5. Edit one fact. Confirm the stale banner. Generate again and confirm the exports turn back on after the receipt settles.
6. Copy the customer pack, download customer HTML, and download customer JSON. Those outputs are the customer document only.
7. Print while the pack is current. The browser print stylesheet hides the inspector and the source editor. If exports are off, the printed page is a hold message instead of the customer sheet.
8. Replace the source with `{` or set a line amount negative, then Generate. The customer page clears and the error lists a JSON pointer. Reset reloads the entry-door preset and generates it.

## `window.QuoteRescue`

The compiler is attached to `window.QuoteRescue` before the page boots. The same functions run in Node when the embedded script is evaluated with `document` disabled. Names:

| Member | Role |
| --- | --- |
| `parseEstimateJson(text)` | Parse source text. Strips a leading BOM. Rejects non-strings and text over `MAX_SOURCE_CHARS`. |
| `validateEstimate(value)` | Check types, ids, money, and allowed keys. `{ ok:false, errors:[{path, message}] }` or a validated snapshot. |
| `compileEstimate(value)` | Validate and build the customer document plus inspector mappings, questions, ignored paths, and withheld paths. |
| `customerBlocks(customer)` | Ordered blocks used by the HTML and text renderers. |
| `renderCustomerHtml(customer)` | Standalone customer HTML. Inline CSS only. No scripts and no external URLs. |
| `renderCustomerText(customer)` | Plain-text customer pack used by copy. |
| `customerJsonFile(customer)` | Pretty customer JSON, sorted keys, trailing newline. |
| `canonicalJson(value)` | Hash serialization. Sorted object keys, array order kept. |
| `prettyJson(value)` | Indented form of the same key policy. |
| `inputHashMaterial(snapshot)` | Versioned canonical validated input, including private notes when they were supplied. |
| `outputHashMaterial(customer)` | Versioned canonical customer payload with `receipt` removed. |
| `sha256Hex(text)` | Promise of lowercase SHA-256 hex, or a rejection with `code: 'UNAVAILABLE'`. |
| `webCryptoStatus()` | `'available'` or `'unavailable'`. |
| `classifyHashFailure(error)` | `'unavailable'` when `error.code` is `UNAVAILABLE`, otherwise `'error'`. |
| `settleTrace(spec)` | `{ accept, enableExports }` from `runToken`, `liveToken`, `stale`, and `hashStatus`. |
| `downloadName(quoteId, ext)` | Portable customer filename. `ext === 'json'` selects JSON; anything else is HTML. |
| `escapeHtml(value)` | Escapes `& < > " '`. |
| `PRESETS` | Frozen `door`, `service`, and `minimal` fixtures. |
| `COMPILER_VERSION`, `SCHEMA_VERSION`, `CANON_VERSION`, `CUSTOMER_SCHEMA`, `MAX_SOURCE_CHARS`, `MAX_CENTS` | Compiler constants. |
| `TRACE_NOTE`, `SERIAL_NOTE` | Receipt wording. |

`compileEstimate` does not include the receipt. The page builds the receipt after compilation. A failed compile has no `customer`.

Customer JSON keys are only: `documentType`, `schemaVersion`, `fictional`, `currency`, `taxTreatment`, `contractor`, `projectTitle`, `quoteId`, `lineItems`, `subtotalCents`, `subtotal`, `statements`, `exclusions`, `options`, `questions`, `nextStep`, `compilerNote`, plus `banner` when `fictional` is true and `optionsNote` when an option was supplied. Line items, statements, exclusions, options, and questions use the fields those sections define. Notes, raw source, inspector rows, and extra input fields are not copied.

## Receipt canonicalization

Input SHA-256 covers this UTF-8 string:

```text
quote-rescue-canon/1
input
<canonical JSON of the validated snapshot>
```

Output SHA-256 covers:

```text
quote-rescue-canon/1
output
<canonical JSON of the customer payload>
```

Rules:

- Object keys are sorted at every level. Array order is the source order.
- Strings and booleans use `JSON.stringify`. Finite numbers do too; `-0` is written as `0`.
- The validated snapshot is what is hashed, not the editor text. Whitespace and key order in the editor do not change the hash.
- Private `notes`, when present and valid, are part of the input snapshot and therefore part of the input hash. They are not part of the customer payload or the output hash.
- If a `receipt` property is present on a customer object, `outputHashMaterial` deletes it before hashing. The timestamp and the hashes are not compiler output.
- SHA-256 here is a trace checksum of that serialization. It does not show that the estimate is true, complete, or commercially valid.
- Web Crypto is feature-detected. If it is missing or `digest` fails, generation still stands. The receipt says the checksum is unavailable or failed. It does not invent a hash.
- Each edit bumps a revision token. A hash that finishes for an older token or a stale edit cannot turn exports back on. Exports stay off while the status is still `pending`.

## Checks the compiler actually makes

- Currency must be `CAD`. `schemaVersion` must be the string `"1"`. `fictional` must be boolean. Ids are 1–64 characters from letters, digits, and `. _ : -`.
- Amounts are finite, nonnegative numbers whose decimal form is an exact cent total up to CAD 10000000.00. Extra precision, exponent notation, and unsafe sums are errors. Nothing is rounded.
- Blank descriptions, duplicate ids, bad JSON, and the wrong shape fail the run. The previous customer pack is cleared in the page.
- `__proto__`, `constructor`, and `prototype` are rejected. Other unsupported fields are listed as ignored and omitted from the customer document.
- A fact value of `unknown` (any case, surrounding space ignored) becomes a question labelled unknown. A blank or null value becomes a blank question. Warranty, disposal, hardware, and schedule, plus exclusions and options, become missing questions when the source does not supply them.
- Supplied option amounts are shown separately. They are not added to the before-tax subtotal.
- Customer HTML escapes `& < > " '` and ships no script and no external resource. The plain-text copy is text, not HTML.

## Limitations

- Before tax only. No tax field, no other currency, no schema other than `"1"`.
- The commercial CAD 350 pilot price from the launch kit is not a control in this page and is not validated.
- Notes are left out of customer HTML, JSON, and text. They are still in the source you edit, and in the input hash. That is not a security boundary against someone who has the file.
- File-URL Web Crypto support depends on the browser. Unavailable hashing is a real state, not a failed compile.
- Copy, download, and print need the browser. The Node tests call the compiler directly and do not boot the page.
- There is no account, storage, network, payment, or model call.

## Tests

From this directory:

```sh
node tests.mjs
```

If `node` is not on `PATH`:

```sh
~/.hermes/node/bin/node tests.mjs
```

`tests.mjs` reads `index.html`, evaluates the embedded script in a Node `vm` with `document` set to `undefined`, and uses `window.QuoteRescue`. No packages are installed. The process exits non-zero if any check fails.
