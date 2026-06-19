// scripts/testGroqUrgency.js
// ─────────────────────────────────────────────────────────────
// Live Groq API Stress Test Script
//
// Run with: node scripts/testGroqUrgency.js
//
// Tests the urgency classification with various complaint
// scenarios to verify the Groq integration is working end-to-end.
// ─────────────────────────────────────────────────────────────

'use strict';

require('dotenv').config();

// ── Minimal stub for Complaint model (no DB needed) ───────────
// We intercept the module loader BEFORE requiring the service
const Module = require('module');
const originalLoad = Module._load;

const complaintStub = {
  findByIdAndUpdate: async (id, update) => {
    console.log(`  [DB Stub] findByIdAndUpdate("${id}", ${JSON.stringify(update)})`);
    return {};
  },
};

Module._load = function (request, parent, isMain) {
  // Match both relative and absolute paths to Complaint model
  if (/[/\\]models[/\\]Complaint(\.js)?$/.test(request)) {
    return complaintStub;
  }
  return originalLoad.call(this, request, parent, isMain);
};

// Now import the service (Complaint references are intercepted above)
const {
  classifyUrgencyWithGroq,
  detectAndUpdateUrgency,
  _resetGroqClientForTest,
} = require('../src/services/urgencyService');

// Restore original loader (good practice)
Module._load = originalLoad;

// ── Test cases ────────────────────────────────────────────────
const TEST_COMPLAINTS = [
  {
    description:
      'There is a massive sewage overflow on the main road near Sector 5 market. Sewage water is flooding the street and entering homes. This is a health emergency!',
    expectedUrgency: 'High',
    label: 'Sewage overflow emergency',
  },
  {
    description:
      'The streetlight on MG Road near the bus stop has been broken for the past 3 days. It becomes very dark at night and is a safety concern.',
    expectedUrgency: 'Medium',
    label: 'Broken streetlight',
  },
  {
    description:
      'The park bench near the children playing area has some faded paint. It would look nicer if it were repainted.',
    expectedUrgency: 'Low',
    label: 'Faded park bench paint (low urgency)',
  },
  {
    description:
      'There is an exposed live electrical wire hanging from a pole on Gandhi Nagar Street. A child almost touched it this morning. URGENT!',
    expectedUrgency: 'High',
    label: 'Exposed electrical wire hazard',
  },
  {
    description:
      'Our area has not received tap water for 2 consecutive days. We are buying expensive water bottles. Please resolve this.',
    expectedUrgency: 'Medium',
    label: 'Water supply disruption',
  },
];

// ── ANSI color helpers ────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const pass = (msg) => console.log(`  ${GREEN}✅ PASS${RESET}  ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}⚠️  MISMATCH${RESET}  ${msg}`);
const fail = (msg) => console.log(`  ${RED}❌ FAIL${RESET}  ${msg}`);
const info = (msg) => console.log(`  ${CYAN}ℹ  ${RESET}  ${msg}`);

// ── Main test runner ──────────────────────────────────────────
const runTests = async () => {
  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}  NagrikSevaSetu — Groq Urgency Classification Test     ${RESET}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}\n`);

  if (!process.env.GROQ_API_KEY) {
    console.error(`${RED}ERROR: GROQ_API_KEY not set in .env${RESET}`);
    process.exit(1);
  }

  info(`GROQ_API_KEY: ${process.env.GROQ_API_KEY.slice(0, 12)}... (truncated)`);
  info(`Model: llama-3.1-8b-instant\n`);

  let passed = 0;
  let mismatches = 0;
  let failed = 0;
  const startTotal = Date.now();

  // ── Individual complaint tests ──────────────────────────────
  for (const tc of TEST_COMPLAINTS) {
    console.log(`${BOLD}Test: ${tc.label}${RESET}`);
    const snippet = tc.description.length > 90 ? tc.description.slice(0, 87) + '...' : tc.description;
    console.log(`  Description: "${snippet}"`);
    console.log(`  Expected:    ${YELLOW}${tc.expectedUrgency}${RESET}`);

    const start = Date.now();
    try {
      const result = await classifyUrgencyWithGroq(tc.description);
      const elapsed = Date.now() - start;
      const color = result === tc.expectedUrgency ? GREEN : YELLOW;
      console.log(`  Got:         ${color}${result}${RESET}  (${elapsed}ms)`);

      if (result === tc.expectedUrgency) {
        pass(`Correctly classified as "${result}"`);
        passed++;
      } else {
        warn(`Got "${result}", expected "${tc.expectedUrgency}" (AI may vary slightly)`);
        mismatches++;
      }
    } catch (error) {
      const elapsed = Date.now() - start;
      fail(`Error after ${elapsed}ms: ${error.message}`);
      failed++;
    }
    console.log();
  }

  // ── Concurrent request test ─────────────────────────────────
  console.log(`${BOLD}Test: Concurrent requests (5 parallel calls)${RESET}`);
  info('Sending 5 requests simultaneously to test concurrency...');
  const concurrentStart = Date.now();
  try {
    const promises = TEST_COMPLAINTS.map((tc) => classifyUrgencyWithGroq(tc.description));
    const results = await Promise.all(promises);
    const elapsed = Date.now() - concurrentStart;
    pass(`All 5 concurrent requests completed in ${elapsed}ms`);
    info(`Results: [${results.join(', ')}]`);
    passed++;
  } catch (error) {
    fail(`Concurrent test failed: ${error.message}`);
    failed++;
  }
  console.log();

  // ── detectAndUpdateUrgency pipeline test ────────────────────
  console.log(`${BOLD}Test: detectAndUpdateUrgency() full pipeline${RESET}`);
  info('Running full pipeline with fake MongoDB ID (DB is stubbed)...');
  try {
    _resetGroqClientForTest(); // Ensure fresh client
    await detectAndUpdateUrgency(
      '507f1f77bcf86cd799439011',
      'Large pothole near school entrance, near Lal Bahadur Shastri School. Children are tripping over it.',
      null
    );
    pass('detectAndUpdateUrgency() completed without throwing');
    passed++;
  } catch (error) {
    fail(`detectAndUpdateUrgency() failed: ${error.message}`);
    failed++;
  }
  console.log();

  // ── Missing API key fallback test ───────────────────────────
  console.log(`${BOLD}Test: Graceful fallback when API key is missing${RESET}`);
  const savedKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  _resetGroqClientForTest();
  try {
    const result = await classifyUrgencyWithGroq('Test complaint');
    if (result === 'Medium') {
      pass(`Returns "Medium" as default when API key is missing (got: "${result}")`);
      passed++;
    } else {
      fail(`Expected "Medium" fallback, got "${result}"`);
      failed++;
    }
  } catch (error) {
    fail(`Fallback threw instead of returning Medium: ${error.message}`);
    failed++;
  } finally {
    process.env.GROQ_API_KEY = savedKey;
    _resetGroqClientForTest();
  }
  console.log();

  // ── Summary ────────────────────────────────────────────────
  const totalElapsed = Date.now() - startTotal;
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}`);
  console.log(
    `${BOLD}Results: ` +
    `${GREEN}${passed} passed${RESET} | ` +
    `${YELLOW}${mismatches} mismatches (AI variability)${RESET} | ` +
    `${failed > 0 ? RED : ''}${failed} failed${RESET} | ` +
    `${totalElapsed}ms total`
  );
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}\n`);

  // Only exit with error if there were hard failures (not AI mismatches)
  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch((err) => {
  console.error('Unhandled error in test runner:', err);
  process.exit(1);
});
