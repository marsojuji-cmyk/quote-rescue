# Independent substitute analysis review

Provenance: Hermes delegated analysis subagent; NOT Grok Build. Blueprint-only review returned APPROVE_WITH_CONDITIONS. Raven accepts all five conditions below before build.

1. Preserve supplied strings verbatim; customer statements only from explicit fields using fixed templates and JSON-pointer mappings. Missing, blank and explicitly unknown values must not become promises. Money exactly representable in cents; reject excess precision, unsafe cent values and unsafe aggregate totals. Fix output ordering and test identical input -> identical document content excluding receipt metadata.
2. Customer HTML and customer JSON exports omit raw source, private notes, inspector content and rig provenance. Notes never feed customer copy. Any source download separately labelled Private source backup—not for sharing. Test unique private-note markers absent from customer HTML/JSON/print. Customer HTML no scripts or external resources.
3. Invalidate on typing/import/preset changes. Block customer copy/download/print while stale or invalid. Last valid packet may remain only behind unmistakable stale state. Async hashing tied to revision token so old completion cannot re-enable exports.
4. Hash versioned UTF-8 deterministic serialization of validated input snapshot and customer document payload excluding receipt. Document serialization rules. SHA256 consistency only, not authenticity/truth. Feature detect Web Crypto for file URL; unavailable/error never blocks generation or pretends cryptographic checksum. Timestamp and hashing separate from deterministic compiler output.
5. Hard cut line: before-tax only, no pilot-price UI or optional tax support. Three presets, fidelity/privacy/stale tests, standalone export and real browser verification first.

Raven disposition: ALL ACCEPTED. This artifact plus BLUEPRINT.md define the build contract. No code implementation performed by review lane.
