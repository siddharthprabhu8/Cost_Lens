const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

// Load the TypeScript units with explicit boundary mocks, without provider calls or ledger writes.
function load(file, overrides = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => Object.hasOwn(overrides, id) ? overrides[id] : id.startsWith('.') ? load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), `${id}.ts`)), overrides) : require(id);
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}
const { dailySpend, rangeStart } = load('lib/spend-range.ts');
const { generateDemoRecords } = load('data/demo-data.ts');
const { OpenRouterError } = load('lib/openrouter.ts');
const now = new Date('2026-09-27T12:00:00Z');

for (const range of [7, 30, 90, 365]) test(`chart includes exactly ${range} UTC days, including the first and current day`, () => {
  const start = rangeStart(range, now);
  const records = [
    { recordedAt: new Date(start).toISOString(), cost: 2 },
    { recordedAt: new Date(start - 1).toISOString(), cost: 100 },
    { recordedAt: now.toISOString(), cost: 3 },
    { recordedAt: '2026-09-27T13:00:00Z', cost: 100 },
  ];
  const days = dailySpend(records, range, now);
  assert.equal(days.length, range);
  assert.equal(days[0].value, 2);
  assert.equal(days.at(-1).value, 3);
  assert.equal(days.reduce((sum, day) => sum + day.value, 0), 5);
});

test('sample data stays consistent across navigation and changes with refresh', () => {
  const session = { email: 'demo@example.com', seed: 42, generatedAt: now.toISOString() };
  const records = generateDemoRecords(session);
  assert.deepEqual(records, generateDemoRecords(session));
  assert.notDeepEqual(records, generateDemoRecords({ ...session, seed: 43 }));
  assert.equal(new Set(records.map(r => r.timestamp.slice(0, 10))).size, 365);
  assert.equal(new Set(records.map(r => r.id)).size, records.length);
  assert.ok(records.some(r => r.status === 'failed'));
  assert.equal(new Set(records.map(r => r.attribution.customer)).size, 6);
  for (const record of records) {
    assert.equal(record.totalTokens, record.inputTokens + record.outputTokens);
    assert.ok(Date.parse(record.timestamp) <= now.getTime());
    assert.ok(record.cost === null || record.cost >= 0);
    assert.equal(record.attribution.metadata.source, "gateway");
  }
});

const body = { model: 'openai/gpt-4o-mini', messages: [{ role: 'user', content: 'Private prompt should not be stored' }], feature: 'summary', customer: 'acme' };
function route(completion, append) {
  return load('app/api/openrouter/chat/route.ts', {
    '../../../../lib/openrouter': { createTrackedCompletion: completion, OpenRouterError },
    '../../../../lib/ledger-store': { appendUsageRecord: append },
  }).POST;
}
const request = (value = body) => new Request('http://localhost/api/openrouter/chat', { method: 'POST', body: JSON.stringify(value) });
for (const [name, error, status] of [
  ['rate limit', new OpenRouterError('Rate limited', 429), 429],
  ['provider failure', new OpenRouterError('Unavailable', 503), 503],
  ['network failure', new TypeError('fetch failed'), 502],
]) test(`${name} is saved with attribution while retaining HTTP error status`, async () => {
  const saved = [];
  const response = await route(async () => { throw error; }, async r => saved.push(r))(request());
  const result = await response.json();
  assert.equal(response.status, status);
  assert.equal(result.persisted, true);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].status, 'failed');
  assert.equal(saved[0].attribution.customer, 'acme');
  assert.equal(saved[0].cost, null);
  assert.ok(saved[0].latencyMs >= 0);
  assert.ok(!JSON.stringify(saved).includes(body.messages[0].content));
});

test('storage failures do not misclassify successful completions', async () => {
  let attempts = 0;
  const response = await route(async () => ({ completion: { id: 'success' }, usage: { id: 'success', status: 'success' } }), async () => { attempts++; throw new Error('disk full'); })(request());
  const result = await response.json();
  assert.equal(result.persisted, false);
  assert.equal(result.usage.status, 'success');
  assert.equal(attempts, 1);
});

test('failure logging reports storage errors without masking provider errors', async () => {
  const response = await route(async () => { throw new OpenRouterError('Rate limited', 429); }, async () => { throw new Error('disk full'); })(request());
  assert.equal(response.status, 429);
  const result = await response.json();
  assert.equal(result.persisted, false);
  assert.ok(result.persistenceError);
});

test('invalid client input is rejected without calling or logging a provider request', async () => {
  const fail = () => { throw new Error('Must not be called'); };
  for (const value of [null, {}, { ...body, messages: {} }, { ...body, messages: [null] }]) {
    assert.equal((await route(fail, fail)(request(value))).status, 400);
  }
});

test('non-JSON provider errors retain their HTTP status', async () => {
  const oldFetch = global.fetch;
  const oldKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test-only';
  global.fetch = async () => new Response('Bad gateway', { status: 502 });
  try {
    const { createTrackedCompletion } = load('lib/openrouter.ts');
    await assert.rejects(createTrackedCompletion(body), error => error.status === 502);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = oldKey;
  }
});

test('a failed request survives a fresh ledger read and can be retrieved by ID', async () => {
  const os = require('node:os');
  const originalDirectory = process.cwd();
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'costlens-ledger-test-'));
  try {
    process.chdir(temporaryDirectory);
    const ledger = load('lib/ledger-store.ts', { 'server-only': {} });
    const response = await route(async () => { throw new OpenRouterError('Rate limited', 429); }, ledger.appendUsageRecord)(request());
    const result = await response.json();
    const freshLedger = load('lib/ledger-store.ts', { 'server-only': {} });
    const saved = await freshLedger.findUsageRecord(result.usage.id);
    assert.equal(saved.status, 'failed');
    assert.equal((await freshLedger.listUsageRecords()).length, 1);
  } finally {
    process.chdir(originalDirectory);
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test('background activity adds requests without changing historical usage', () => {
  const session = { email: 'presenter@example.com', seed: 24, generatedAt: now.toISOString() };
  const before = generateDemoRecords(session);
  const updated = { ...session, updates: [{ at: '2026-09-27T12:00:20Z', seed: 99 }] };
  const after = generateDemoRecords(updated);
  assert.ok(after.length > before.length);
  const byId = new Map(after.map(record => [record.id, record]));
  for (const record of before) assert.deepEqual(byId.get(record.id), record);
  assert.deepEqual(after, generateDemoRecords(JSON.parse(JSON.stringify(updated))));
  assert.equal(new Set(after.map(record => record.id)).size, after.length);
  assert.ok(after.reduce((sum, record) => sum + (record.cost ?? 0), 0) > before.reduce((sum, record) => sum + (record.cost ?? 0), 0));
});
