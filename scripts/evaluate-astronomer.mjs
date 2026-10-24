import { readFile } from 'node:fs/promises';

const baseUrl = process.env.COSMOS_EVAL_URL ?? 'http://localhost:5174';
const cases = JSON.parse(await readFile(new URL('../docs/evals/astronomer-eval.json', import.meta.url), 'utf8'));

function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

const results = [];
for (const testCase of cases) {
  const response = await fetch(`${baseUrl}/api/astronomer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Real-IP': '127.0.0.2' },
    body: JSON.stringify({ question: testCase.question, context: testCase.context, mode: 'openai' }),
  });
  const payload = await response.json();
  const answer = normalize(payload.answer ?? '');
  const missing = testCase.required.filter((term) => !answer.includes(normalize(term)));
  results.push({ id: testCase.id, pass: response.ok && missing.length === 0, source: payload.source, model: payload.model, missing });
  console.log(`${missing.length === 0 ? 'PASS' : 'FAIL'} ${testCase.id} source=${payload.source ?? 'none'}${missing.length ? ` missing=${missing.join('|')}` : ''}`);
}

const passed = results.filter((result) => result.pass).length;
console.log(`\nResultado: ${passed}/${results.length} (${Math.round(passed / results.length * 100)}%)`);
if (passed !== results.length) process.exitCode = 1;
