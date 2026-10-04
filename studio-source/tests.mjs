import { readFileSync } from 'node:fs';
import nodeCrypto from 'node:crypto';
import { createContext, Script, runInContext } from 'node:vm';
import assert from 'node:assert/strict';

const webcrypto = nodeCrypto.webcrypto;
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const openTag = '<script id="quote-rescue-app">';
const start = html.indexOf(openTag);
const end = html.indexOf('</script>', start);
if (start < 0 || end < 0) throw new Error('embedded quote-rescue-app script not found');
const source = html.slice(start + openTag.length, end);

function load(extras) {
  const sandbox = { window: {}, document: undefined };
  if (extras) Object.assign(sandbox, extras);
  const context = createContext(sandbox);
  new Script(source, { filename: 'index.html' }).runInContext(context);
  const api = sandbox.window && sandbox.window.QuoteRescue;
  if (!api || typeof api.compileEstimate !== 'function') {
    throw new Error('window.QuoteRescue.compileEstimate is missing');
  }
  return { sandbox, context, api };
}

let api;
let context;
const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// Fixtures must be built inside the sandbox realm. The app's isPlainObject()
// compares a value's prototype against its own realm's Object.prototype, so a
// host-realm clone is rejected as "Estimate must be a JSON object."
function inRealm(value) {
  return runInContext('(' + JSON.stringify(value) + ')', context);
}

function clone(preset) {
  return inRealm(api.PRESETS[preset]);
}

// Same reason as inRealm: deepStrictEqual also compares prototypes, so an
// app-returned object (sandbox realm) never equals a host-realm literal.
function sameShape(actual, expected) {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected);
}

function mustFail(result, path, snippet) {
  assert.equal(result.ok, false);
  assert.equal(result.customer, undefined);
  const hit = (result.errors || []).some(function (error) {
    return error.path === path && String(error.message).includes(snippet);
  });
  assert.equal(hit, true, JSON.stringify(result.errors));
}

function assertKeys(value, allowed) {
  Object.keys(value).forEach(function (key) {
    assert.equal(allowed.indexOf(key) !== -1, true, 'unexpected key ' + key);
  });
}

const CUSTOMER_KEYS = [
  'banner', 'compilerNote', 'contractor', 'currency', 'documentType', 'exclusions',
  'fictional', 'lineItems', 'nextStep', 'options', 'optionsNote', 'projectTitle',
  'questions', 'quoteId', 'schemaVersion', 'statements', 'subtotal', 'subtotalCents',
  'taxTreatment'
];
const LINE_KEYS = ['amount', 'amountCents', 'description', 'id', 'source'];
const STATEMENT_KEYS = ['source', 'text'];
const EXCLUSION_KEYS = ['source', 'text'];
const OPTION_KEYS = ['amount', 'amountCents', 'description', 'label', 'source'];
const QUESTION_KEYS = ['id', 'source', 'status', 'text'];
const PRIVATE_NOTES = [
  'PRIVATE-NOTE-DOOR-9F3A',
  'PRIVATE-NOTE-SERVICE-7C2E',
  'PRIVATE-NOTE-MINIMAL-4B1D'
];

function customerBundle(customer) {
  return [
    api.renderCustomerHtml(customer),
    api.customerJsonFile(customer),
    api.renderCustomerText(customer)
  ].join('\n');
}

test('API loads in the vm while document boot stays off', function () {
  const loaded = load({ crypto: webcrypto, TextEncoder: TextEncoder, Uint8Array: Uint8Array });
  api = loaded.api;
  context = loaded.context;
  assert.equal(loaded.sandbox.document, undefined);
  [
    'parseEstimateJson', 'validateEstimate', 'compileEstimate', 'customerBlocks',
    'renderCustomerHtml', 'renderCustomerText', 'canonicalJson', 'prettyJson',
    'customerJsonFile', 'inputHashMaterial', 'outputHashMaterial', 'sha256Hex',
    'webCryptoStatus', 'classifyHashFailure', 'settleTrace', 'downloadName', 'escapeHtml'
  ].forEach(function (name) {
    assert.equal(typeof api[name], 'function', name);
  });
  assert.equal(api.COMPILER_VERSION, 'quote-rescue-compiler/1');
  assert.equal(api.SCHEMA_VERSION, '1');
  assert.equal(api.CANON_VERSION, 'quote-rescue-canon/1');
  assert.equal(api.CUSTOMER_SCHEMA, 'quote-rescue-customer/1');
  assert.equal(api.webCryptoStatus(), 'available');
  assert.equal(Object.isFrozen(api.PRESETS), true);
  assert.equal(Object.isFrozen(api.PRESETS.door), true);
});

test('preset totals are exact cents and before tax', function () {
  const door = api.compileEstimate(clone('door'));
  const service = api.compileEstimate(clone('service'));
  const minimal = api.compileEstimate(clone('minimal'));
  assert.equal(door.ok, true);
  assert.equal(door.customer.subtotalCents, 320000);
  assert.equal(door.customer.subtotal, '3200.00');
  assert.equal(door.customer.lineItems[0].amount, '1400.00');
  assert.equal(door.customer.lineItems[0].amountCents, 140000);
  assert.equal(door.customer.lineItems[1].amount, '1800.00');
  assert.equal(door.customer.lineItems[1].amountCents, 180000);
  assert.equal(door.customer.lineItems[0].source, '/lineItems/0');
  assert.equal(service.customer.subtotalCents, 28000);
  assert.equal(service.customer.subtotal, '280.00');
  assert.equal(service.customer.lineItems[0].amount, '120.00');
  assert.equal(service.customer.lineItems[1].amount, '160.00');
  assert.equal(minimal.customer.subtotalCents, 320000);
  assert.equal(minimal.customer.subtotal, '3200.00');
  [door, service, minimal].forEach(function (result) {
    assert.equal(result.customer.currency, 'CAD');
    assert.equal(result.customer.taxTreatment, 'before-tax');
    assert.equal(Object.prototype.hasOwnProperty.call(result.customer, 'tax'), false);
    assert.equal(result.customer.banner, 'FICTIONAL DEMO');
    assert.equal(result.customer.documentType, 'quote-rescue-customer');
    assert.equal(result.customer.schemaVersion, 'quote-rescue-customer/1');
  });
});

test('money rejects anything that is not an exact cent', function () {
  function only(amount) {
    const input = clone('minimal');
    input.lineItems = [{ id: 'only', description: 'One line', amount: amount }];
    return input;
  }
  const zero = api.compileEstimate(only(0));
  const penny = api.compileEstimate(only(0.01));
  const half = api.compileEstimate(only(10.5));
  const cap = api.compileEstimate(only(10000000));
  assert.equal(zero.customer.subtotal, '0.00');
  assert.equal(zero.customer.subtotalCents, 0);
  assert.equal(penny.customer.subtotalCents, 1);
  assert.equal(penny.customer.subtotal, '0.01');
  assert.equal(half.customer.subtotal, '10.50');
  assert.equal(half.customer.subtotalCents, 1050);
  assert.equal(cap.customer.subtotal, '10000000.00');
  assert.equal(cap.customer.subtotalCents, 1000000000);
  mustFail(api.compileEstimate(only(-1)), '/lineItems/0/amount', 'nonnegative');
  mustFail(api.compileEstimate(only(-0)), '/lineItems/0/amount', 'nonnegative');
  mustFail(api.compileEstimate(only(null)), '/lineItems/0/amount', 'finite number');
  mustFail(api.compileEstimate(only('1400')), '/lineItems/0/amount', 'finite number');
  mustFail(api.compileEstimate(only(NaN)), '/lineItems/0/amount', 'finite number');
  mustFail(api.compileEstimate(only(Infinity)), '/lineItems/0/amount', 'finite number');
  mustFail(api.compileEstimate(only(0.1 + 0.2)), '/lineItems/0/amount', 'does not round');
  mustFail(api.compileEstimate(only(1.234)), '/lineItems/0/amount', '2 decimal places');
  mustFail(api.compileEstimate(only(1e-7)), '/lineItems/0/amount', 'exponent notation');
  mustFail(api.compileEstimate(only(10000001)), '/lineItems/0/amount', 'exceeds CAD 10000000.00');
  const overflow = clone('minimal');
  overflow.lineItems = [
    { id: 'a', description: 'A', amount: 6000000 },
    { id: 'b', description: 'B', amount: 6000000 }
  ];
  mustFail(api.compileEstimate(overflow), '/lineItems', 'before-tax subtotal exceeds CAD 10000000.00');
});

test('core validation reports a path and does not emit a customer pack', function () {
  const badJson = api.parseEstimateJson('{');
  mustFail(badJson, '/', 'not valid JSON');
  mustFail(api.parseEstimateJson(null), '/', 'Source text must be a string');
  mustFail(api.parseEstimateJson('x'.repeat(api.MAX_SOURCE_CHARS + 1)), '/', 'longer than ' + api.MAX_SOURCE_CHARS);
  const bom = api.parseEstimateJson('\uFEFF' + JSON.stringify(clone('minimal')));
  assert.equal(bom.ok, true);
  assert.equal(api.compileEstimate(bom.value).customer.subtotal, '3200.00');
  mustFail(api.validateEstimate(null), '/', 'JSON object');
  mustFail(api.validateEstimate([]), '/', 'JSON object');
  const currency = clone('door');
  currency.currency = 'USD';
  mustFail(api.compileEstimate(currency), '/currency', 'must be "CAD"');
  const schema = clone('door');
  schema.schemaVersion = 1;
  mustFail(api.compileEstimate(schema), '/schemaVersion', 'string "1"');
  const fictional = clone('door');
  fictional.fictional = 'yes';
  mustFail(api.compileEstimate(fictional), '/fictional', 'boolean');
  const quote = clone('door');
  quote.quoteId = 'quote id';
  mustFail(api.compileEstimate(quote), '/quoteId', 'letters, digits');
  const missing = clone('door');
  delete missing.lineItems;
  mustFail(api.compileEstimate(missing), '/lineItems', 'must be an array');
  const empty = clone('door');
  empty.lineItems = [];
  mustFail(api.compileEstimate(empty), '/lineItems', 'at least one item');
  const blank = clone('door');
  blank.lineItems[0].description = '   ';
  mustFail(api.compileEstimate(blank), '/lineItems/0/description', 'blank');
  const duplicate = clone('door');
  duplicate.lineItems[1].id = 'remove';
  mustFail(api.compileEstimate(duplicate), '/lineItems/1/id', 'repeats /lineItems/0/id');
  const facts = clone('door');
  facts.facts[1].id = facts.facts[0].id;
  mustFail(api.compileEstimate(facts), '/facts/1/id', 'repeats /facts/0/id');
  const control = clone('minimal');
  control.contractor = 'A\u0000B';
  mustFail(api.compileEstimate(control), '/contractor', 'control characters');
  const exclusion = clone('minimal');
  exclusion.exclusions = [''];
  mustFail(api.compileEstimate(exclusion), '/exclusions/0', 'blank');
  const option = clone('minimal');
  option.options = [{ label: 'Hardware', amount: -5 }];
  mustFail(api.compileEstimate(option), '/options/0/amount', 'nonnegative');
});

test('prototype keys are rejected and unknown fields stay out of the customer pack', function () {
  function withExtra(extra) {
    return JSON.parse(JSON.stringify(clone('minimal')).slice(0, -1) + ',' + extra + '}');
  }
  ['"__proto__":{"polluted":true}', '"constructor":{"polluted":true}', '"prototype":{"polluted":true}'].forEach(function (extra) {
    const hostile = withExtra(extra);
    const result = api.validateEstimate(hostile);
    assert.equal(result.ok, false);
    assert.equal(result.errors.some(function (error) {
      return error.message === 'This key is not allowed.';
    }), true, JSON.stringify(result.errors));
  });
  assert.equal(Object.prototype.polluted, undefined);
  const nested = JSON.parse(JSON.stringify(clone('door')).replace(
    '"id":"remove"',
    '"id":"remove","__proto__":{"x":1}'
  ));
  mustFail(api.compileEstimate(nested), '/lineItems/0/__proto__', 'not allowed');
  const input = clone('door');
  input.tax = 15;
  input.guarantee = 'lifetime seal';
  input.lineItems[0].sku = 'SKU-9';
  const result = api.compileEstimate(input);
  assert.equal(result.ok, true);
  assert.equal(result.customer.tax, undefined);
  assert.equal(result.customer.guarantee, undefined);
  assert.equal(result.customer.lineItems[0].sku, undefined);
  assert.equal(result.inspector.ignoredPaths.indexOf('/tax') !== -1, true);
  assert.equal(result.inspector.ignoredPaths.indexOf('/guarantee') !== -1, true);
  assert.equal(result.inspector.ignoredPaths.indexOf('/lineItems/0/sku') !== -1, true);
  assert.equal(customerBundle(result.customer).includes('lifetime seal'), false);
  assert.equal(customerBundle(result.customer).includes('SKU-9'), false);
  assertKeys(result.customer, CUSTOMER_KEYS);
});

test('unknown, blank, and missing terms stay questions', function () {
  const door = api.compileEstimate(clone('door'));
  sameShape(door.customer.statements.map(function (item) { return item.text; }), [
    'Finish: primed white',
    'Dimensions: site confirmation required'
  ]);
  sameShape(door.customer.questions.map(function (item) { return item.id; }), [
    'q-term-warranty', 'q-term-disposal', 'q-term-hardware', 'q-term-schedule',
    'q-exclusions', 'q-options'
  ]);
  door.customer.questions.forEach(function (question) {
    assert.equal(question.status, 'missing');
  });
  assert.equal(door.customer.questions[0].text, 'Confirm Warranty. No source fact was supplied for warranty.');
  assert.equal(api.renderCustomerHtml(door.customer).includes('Warranty:'), false);
  const service = api.compileEstimate(clone('service'));
  assert.equal(service.customer.statements.length, 0);
  sameShape(service.customer.questions.map(function (item) { return item.status; }), [
    'unknown', 'unknown', 'unknown', 'missing', 'missing', 'missing'
  ]);
  assert.equal(service.customer.questions[0].text, 'Confirm Warranty. The source marks this unknown.');
  assert.equal(service.customer.questions[0].source, '/facts/0/value');
  assert.equal(service.customer.questions[3].id, 'q-term-disposal');
  const serviceHtml = api.renderCustomerHtml(service.customer);
  assert.equal(serviceHtml.includes('Warranty: unknown'), false);
  assert.equal(serviceHtml.includes('marks this unknown'), true);
  const blank = clone('minimal');
  blank.facts = [
    { id: 'warranty', label: 'Warranty', value: '   ' },
    { id: 'schedule', label: 'Schedule', value: ' Unknown ' }
  ];
  const compiled = api.compileEstimate(blank);
  assert.equal(compiled.customer.statements.length, 0);
  assert.equal(compiled.customer.questions[0].status, 'blank');
  assert.equal(compiled.customer.questions[0].text, 'Confirm Warranty. The source value is blank.');
  assert.equal(compiled.customer.questions[1].status, 'unknown');
  const stated = clone('minimal');
  stated.facts = [{ id: 'warranty', label: 'Warranty', value: 'none supplied' }];
  const statedPack = api.compileEstimate(stated);
  assert.equal(statedPack.customer.statements[0].text, 'Warranty: none supplied');
  assert.equal(statedPack.customer.questions.some(function (question) {
    return question.id === 'q-term-warranty';
  }), false);
});

test('options and exclusions are copied only when supplied and stay out of the subtotal', function () {
  const input = clone('minimal');
  input.exclusions = ['Painting is not included'];
  input.options = [{ label: 'Brass hardware', amount: 40, description: '   ' }];
  const result = api.compileEstimate(input);
  assert.equal(result.customer.subtotalCents, 320000);
  assert.equal(result.customer.exclusions[0].text, 'Painting is not included');
  assert.equal(result.customer.exclusions[0].source, '/exclusions/0');
  assert.equal(result.customer.options[0].amount, '40.00');
  assert.equal(result.customer.options[0].description, undefined);
  assert.equal(result.customer.optionsNote, 'Priced alternatives are not included in the before-tax subtotal.');
  assert.equal(result.customer.questions.some(function (question) { return question.id === 'q-exclusions'; }), false);
  assert.equal(result.customer.questions.some(function (question) { return question.id === 'q-options'; }), false);
});

test('private notes and hostile markup stay out of customer HTML', function () {
  const packs = ['door', 'service', 'minimal'].map(function (name) {
    return api.compileEstimate(clone(name));
  });
  packs.forEach(function (result) {
    const bundle = customerBundle(result.customer);
    PRIVATE_NOTES.forEach(function (marker) {
      assert.equal(bundle.includes(marker), false, marker);
    });
    sameShape(result.inspector.withheldPaths, ['/notes']);
    const html = api.renderCustomerHtml(result.customer);
    assert.equal(html.startsWith('<!DOCTYPE html>\n'), true);
    assert.equal(html.includes('<script'), false);
    assert.equal(html.includes('</script>'), false);
    assert.equal((html.match(/<\/style>/g) || []).length, 1);
    assert.equal(/\s(?:src|href)\s*=/i.test(html), false);
    assert.equal(/https?:\/\//.test(html), false);
    assert.equal(html.includes('FICTIONAL DEMO'), true);
    const parsed = JSON.parse(api.customerJsonFile(result.customer));
    assert.equal(parsed.notes, undefined);
    assert.equal(parsed.receipt, undefined);
    assertKeys(parsed, CUSTOMER_KEYS);
    parsed.lineItems.forEach(function (item) { assertKeys(item, LINE_KEYS); });
    parsed.statements.forEach(function (item) { assertKeys(item, STATEMENT_KEYS); });
    parsed.questions.forEach(function (item) { assertKeys(item, QUESTION_KEYS); });
  });
  const input = clone('minimal');
  const hostile = '<script>alert("x")</script>';
  input.projectTitle = hostile;
  input.contractor = 'A&B"\'<>';
  input.lineItems[0].description = hostile;
  input.facts = [{ id: 'finish', label: hostile, value: 'primed "white"' }];
  input.exclusions = [hostile];
  input.options = [{ label: hostile, amount: 1, description: hostile }];
  input.notes = 'PRIVATE-NOTE-DOOR-9F3A <script>secret</script>';
  const result = api.compileEstimate(input);
  const html = api.renderCustomerHtml(result.customer);
  const json = api.customerJsonFile(result.customer);
  const text = api.renderCustomerText(result.customer);
  assert.equal(html.includes('<script'), false);
  assert.equal(html.includes('</script>'), false);
  assert.equal(html.includes('secret'), false);
  assert.equal(html.includes('PRIVATE-NOTE-DOOR-9F3A'), false);
  assert.equal(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'), true);
  assert.equal(html.includes('A&amp;B&quot;&#39;&lt;&gt;'), true);
  assert.equal(json.includes('PRIVATE-NOTE-DOOR-9F3A'), false);
  assert.equal(json.includes('secret'), false);
  assert.equal(text.includes('PRIVATE-NOTE-DOOR-9F3A'), false);
  assert.equal(text.includes('secret'), false);
  const roundTrip = JSON.parse(json);
  assert.equal(roundTrip.projectTitle, hostile);
  assert.equal(roundTrip.notes, undefined);
  assert.equal(api.escapeHtml(`<>&"'`), '&lt;&gt;&amp;&quot;&#39;');
  assert.equal(api.downloadName('QR-DEMO-A', 'html'), 'quote-rescue-QR-DEMO-A-customer.html');
  assert.equal(api.downloadName('../etc/passwd', 'json'), 'quote-rescue-..etcpasswd-customer.json');
  assert.equal(api.downloadName('', 'zip'), 'quote-rescue-quote-customer.html');
});

test('the same source rebuilds the same customer document', function () {
  const first = api.compileEstimate(clone('door'));
  const second = api.compileEstimate(clone('door'));
  assert.equal(api.canonicalJson(first.customer), api.canonicalJson(second.customer));
  assert.equal(api.renderCustomerHtml(first.customer), api.renderCustomerHtml(second.customer));
  assert.equal(api.customerJsonFile(first.customer), api.customerJsonFile(second.customer));
  assert.equal(api.customerJsonFile(first.customer).endsWith('\n'), true);
  const door = clone('door');
  const reversed = {};
  Object.keys(door).reverse().forEach(function (key) { reversed[key] = door[key]; });
  const reordered = api.compileEstimate(reversed);
  assert.equal(api.canonicalJson(reordered.customer), api.canonicalJson(first.customer));
  assert.equal(api.inputHashMaterial(reordered.inputSnapshot), api.inputHashMaterial(first.inputSnapshot));
  const swapped = clone('door');
  swapped.lineItems.reverse();
  const swappedPack = api.compileEstimate(swapped);
  assert.notEqual(api.canonicalJson(swappedPack.customer), api.canonicalJson(first.customer));
  assert.equal(swappedPack.customer.lineItems[0].description, 'insulated steel entry-door unit');
  assert.equal(swappedPack.customer.subtotal, '3200.00');
  const pretty = api.parseEstimateJson(JSON.stringify(clone('service'), null, 2));
  const compact = api.parseEstimateJson(JSON.stringify(clone('service')));
  const prettyPack = api.compileEstimate(pretty.value);
  const compactPack = api.compileEstimate(compact.value);
  assert.equal(api.inputHashMaterial(prettyPack.inputSnapshot), api.inputHashMaterial(compactPack.inputSnapshot));
  assert.equal(api.canonicalJson(prettyPack.customer), api.canonicalJson(compactPack.customer));
});

test('hash material is versioned canonical JSON and ignores a customer receipt', function () {
  assert.equal(api.canonicalJson({ b: 1, a: { d: true, c: [2, 1] } }), '{"a":{"c":[2,1],"d":true},"b":1}');
  assert.equal(api.canonicalJson(-0), '0');
  assert.equal(api.canonicalJson('a"b'), '"a\\"b"');
  assert.throws(function () { api.canonicalJson(NaN); });
  const door = api.compileEstimate(clone('door'));
  const inputMaterial = api.inputHashMaterial(door.inputSnapshot);
  const outputMaterial = api.outputHashMaterial(door.customer);
  assert.equal(inputMaterial.indexOf('quote-rescue-canon/1\ninput\n{'), 0);
  assert.equal(outputMaterial.indexOf('quote-rescue-canon/1\noutput\n{'), 0);
  assert.equal(inputMaterial.includes('PRIVATE-NOTE-DOOR-9F3A'), true);
  assert.equal(outputMaterial.includes('PRIVATE-NOTE'), false);
  assert.equal(outputMaterial.includes('"receipt"'), false);
  const dirty = JSON.parse(JSON.stringify(door.customer));
  dirty.receipt = { inputSha256: 'abc', compiledAt: '2020-01-01T00:00:00.000Z' };
  assert.equal(api.outputHashMaterial(dirty), outputMaterial);
  const withoutNotes = clone('door');
  delete withoutNotes.notes;
  const stripped = api.compileEstimate(withoutNotes);
  assert.notEqual(api.inputHashMaterial(stripped.inputSnapshot), inputMaterial);
  assert.equal(api.outputHashMaterial(stripped.customer), outputMaterial);
  assert.equal(stripped.inspector.withheldPaths.length, 0);
  const fictionalOff = clone('minimal');
  fictionalOff.fictional = false;
  const plain = api.compileEstimate(fictionalOff);
  assert.equal(plain.customer.banner, undefined);
  assert.equal(api.renderCustomerHtml(plain.customer).includes('FICTIONAL DEMO'), false);
});

test('revision token drops a late hash and pending hashes do not enable exports', function () {
  sameShape(
    api.settleTrace({ runToken: 2, liveToken: 2, stale: false, hashStatus: 'ready' }),
    { accept: true, enableExports: true }
  );
  sameShape(
    api.settleTrace({ runToken: 1, liveToken: 2, stale: false, hashStatus: 'ready' }),
    { accept: false, enableExports: false }
  );
  sameShape(
    api.settleTrace({ runToken: 2, liveToken: 2, stale: true, hashStatus: 'ready' }),
    { accept: false, enableExports: false }
  );
  sameShape(
    api.settleTrace({ runToken: 2, liveToken: 2, stale: false, hashStatus: 'pending' }),
    { accept: true, enableExports: false }
  );
  sameShape(
    api.settleTrace({ runToken: 2, liveToken: 2, stale: false, hashStatus: 'unavailable' }),
    { accept: true, enableExports: true }
  );
  sameShape(
    api.settleTrace({ runToken: 2, liveToken: 2, stale: false, hashStatus: 'error' }),
    { accept: true, enableExports: true }
  );
  assert.equal(api.classifyHashFailure({ code: 'UNAVAILABLE' }), 'unavailable');
  assert.equal(api.classifyHashFailure(new Error('digest failed')), 'error');
});

test('sha256 matches a known vector and is stable for hash material', async function () {
  assert.equal(
    await api.sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
  const door = api.compileEstimate(clone('door'));
  const service = api.compileEstimate(clone('service'));
  const inputHex = await api.sha256Hex(api.inputHashMaterial(door.inputSnapshot));
  const inputAgain = await api.sha256Hex(api.inputHashMaterial(door.inputSnapshot));
  const outputHex = await api.sha256Hex(api.outputHashMaterial(door.customer));
  const serviceHex = await api.sha256Hex(api.inputHashMaterial(service.inputSnapshot));
  assert.equal(inputHex, inputAgain);
  assert.equal(/^[0-9a-f]{64}$/.test(inputHex), true);
  assert.equal(/^[0-9a-f]{64}$/.test(outputHex), true);
  assert.notEqual(inputHex, outputHex);
  assert.notEqual(inputHex, serviceHex);
  const dirty = JSON.parse(JSON.stringify(door.customer));
  dirty.receipt = { outputSha256: outputHex };
  assert.equal(await api.sha256Hex(api.outputHashMaterial(dirty)), outputHex);
});

test('missing Web Crypto reports unavailable and still compiles', async function () {
  const bare = load();
  assert.equal(bare.sandbox.document, undefined);
  assert.equal(bare.api.webCryptoStatus(), 'unavailable');
  const compiled = bare.api.compileEstimate(runInContext('(' + JSON.stringify(bare.api.PRESETS.door) + ')', bare.context));
  assert.equal(compiled.ok, true);
  assert.equal(compiled.customer.subtotal, '3200.00');
  let caught = null;
  try {
    await bare.api.sha256Hex('abc');
  } catch (error) {
    caught = error;
  }
  assert.equal(caught !== null, true);
  assert.equal(caught.code, 'UNAVAILABLE');
  assert.equal(bare.api.classifyHashFailure(caught), 'unavailable');
});

let failed = 0;
for (const entry of tests) {
  try {
    await entry.fn();
    console.log('ok - ' + entry.name);
  } catch (error) {
    failed += 1;
    console.error('not ok - ' + entry.name);
    console.error(error && error.stack ? error.stack : error);
  }
}
console.log(failed ? failed + ' failed of ' + tests.length : tests.length + ' passed');
if (failed) process.exit(1);
