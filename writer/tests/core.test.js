// Run with: node --test writer/tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core/writer-core.js');

test('rewrite prompt includes level, language and voice', () => {
  const p = C.buildRewrite({ mode: 'paraphrase', style: 'formal', strength: 1, level: 'A2', outLang: 'de',
    voice: true, voiceProfile: 'Direct. Warm.', voiceSamples: '# note\nHello there.', text: 'hi' });
  assert.match(p.system, /CEFR A2/);
  assert.match(p.system, /German at A2/);
  assert.match(p.system, /in German/);
  assert.match(p.system, /LIGHT/);
  assert.match(p.system, /professional/);
  assert.match(p.system, /Direct\. Warm\./);
  assert.match(p.system, /Hello there\./);
  assert.doesNotMatch(p.system, /# note/);
  assert.equal(p.user, '<text>\nhi\n</text>');
});

test('voice is left out when off, level "auto" keeps level', () => {
  const p = C.buildRewrite({ mode: 'humanise', level: 'auto', outLang: 'same', voice: false, text: 'x' });
  assert.doesNotMatch(p.system, /PERSONAL VOICE/);
  assert.match(p.system, /same language level/);
  assert.match(p.system, /real person wrote it/);
});

test('grammar prompt carries schema and explanation language', () => {
  const p = C.buildGrammar({ level: 'A1', explainLang: 'de', text: 'Ich habe gegangen.' });
  assert.ok(p.schema.properties.issues);
  assert.match(p.system, /in German/);
  assert.match(p.system, /very simple words/);
});

test('cleanOutput strips lead-ins, think blocks and wrapping quotes', () => {
  assert.equal(C.cleanOutput('<think>hmm</think>Here is the rewritten text:\n\nHello world.'), 'Hello world.');
  assert.equal(C.cleanOutput('Hier ist der Text:\nHallo Welt.'), 'Hallo Welt.');
  assert.equal(C.cleanOutput('"Hello world."'), 'Hello world.');
  assert.equal(C.cleanOutput('<text>\nHi\n</text>'), 'Hi');
});

test('parseJson handles fences and extra prose', () => {
  assert.deepEqual(C.parseJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(C.parseJson('Sure! {"a":2} done'), { a: 2 });
  assert.throws(() => C.parseJson('nope'));
});

test('locateIssues finds repeated words in order and applyIssue shifts offsets', () => {
  const text = 'I has a dog and I has a cat.';
  const issues = C.locateIssues(text, [
    { original: 'has', replacement: 'have', type: 'grammar', explanation: '' },
    { original: 'has', replacement: 'have', type: 'grammar', explanation: '' },
    { original: 'missing', replacement: 'x', type: 'grammar', explanation: '' }
  ]);
  assert.equal(issues[0].offset, 2);
  assert.equal(issues[1].offset, 18);
  assert.equal(issues[2].offset, -1);
  const all = C.applyAll(text, issues);
  assert.equal(all.text, 'I have a dog and I have a cat.');
  const one = C.applyIssue(text, issues, 0);
  assert.equal(one.text, 'I have a dog and I has a cat.');
  assert.equal(one.issues[1].offset, 19);
});

test('fromLanguageTool maps matches', () => {
  const text = 'Das ist ein Fehlr.';
  const out = C.fromLanguageTool(text, [{ offset: 12, length: 5, message: 'Tippfehler', replacements: [{ value: 'Fehler' }], rule: { category: { name: 'Typos' } } }]);
  assert.deepEqual(out[0], { original: 'Fehlr', replacement: 'Fehler', type: 'Typos', explanation: 'Tippfehler', offset: 12, length: 5 });
});

test('diffWords marks only changed words', () => {
  const segs = C.diffWords('I like big dogs.', 'I love big dogs.');
  const changed = segs.filter(s => s.changed).map(s => s.text.trim());
  assert.deepEqual(changed, ['love']);
  assert.equal(segs.map(s => s.text).join(''), 'I love big dogs.');
  const de = C.diffWords('Ich möchte Äpfel.', 'Ich möchte Birnen.');
  assert.deepEqual(de.filter(s => s.changed).map(s => s.text), ['Birnen']);
});

test('wordCount', () => {
  assert.equal(C.wordCount('  one two\nthree '), 3);
  assert.equal(C.wordCount(''), 0);
});
