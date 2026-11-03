/**
 * Emisembe Writer — Google Docs add-on (server side).
 *
 * Files in the Apps Script project:
 *   Code.gs        (this file)
 *   WriterCore.gs  (copy of writer/core/writer-core.js — prompts, diff, grammar helpers)
 *   Sidebar.html   (the sidebar UI)
 *   appsscript.json
 *
 * AI engines (pick one in the sidebar's Settings):
 *   gemini  — Google Gemini API, has a free tier (free key from aistudio.google.com)
 *   claude  — Anthropic Claude API, pay per use (key from console.anthropic.com)
 *   ollama  — offline AI on your own PC. Apps Script runs on Google's servers and
 *             cannot reach your PC, so for this engine the SIDEBAR (which runs in
 *             your browser) talks to Ollama directly; this file only builds the
 *             prompt (preparePrompt) and processes the answer (finishResult).
 * Grammar can also use LanguageTool online, which is free and needs no key.
 */

var CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
var CLAUDE_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'];
var GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/';
var GEMINI_DEFAULT = 'gemini-2.5-flash';
var ENGINES = ['gemini', 'claude', 'ollama'];

// ----------------------------------------------------------------- menu
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Open Writer', 'showSidebar')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Emisembe Writer');
  DocumentApp.getUi().showSidebar(html);
}

// ----------------------------------------------------------------- settings
function props_() {
  return PropertiesService.getUserProperties();
}

function getSettings() {
  var p = props_();
  var hasClaude = !!p.getProperty('apiKey');
  return {
    engine: p.getProperty('engine') || (hasClaude ? 'claude' : 'gemini'),
    hasKey: hasClaude,
    model: p.getProperty('model') || CLAUDE_MODELS[0],
    hasGeminiKey: !!p.getProperty('geminiKey'),
    geminiModel: p.getProperty('geminiModel') || GEMINI_DEFAULT,
    ollamaUrl: p.getProperty('ollamaUrl') || 'http://localhost:11434',
    ollamaModel: p.getProperty('ollamaModel') || 'gemma3:4b',
    grammarEngine: p.getProperty('grammarEngine') || 'languagetool',
    explainLang: p.getProperty('explainLang') || 'en',
    enVariant: p.getProperty('enVariant') || 'en-US',
    voiceProfile: p.getProperty('voiceProfile') || WriterCore.DEFAULT_VOICE,
    voiceSamples: p.getProperty('voiceSamples') || WriterCore.DEFAULT_SAMPLES,
    styles: Object.keys(WriterCore.STYLES).map(function (k) { return { value: k, label: WriterCore.STYLES[k].label }; })
  };
}

function saveSettings(s) {
  var p = props_();
  if (s.apiKey && String(s.apiKey).trim()) p.setProperty('apiKey', String(s.apiKey).trim());
  if (s.geminiKey && String(s.geminiKey).trim()) p.setProperty('geminiKey', String(s.geminiKey).trim());
  if (s.removeKeys) { p.deleteProperty('apiKey'); p.deleteProperty('geminiKey'); }
  if (ENGINES.indexOf(s.engine) !== -1) p.setProperty('engine', s.engine);
  if (CLAUDE_MODELS.indexOf(s.model) !== -1) p.setProperty('model', s.model);
  ['geminiModel', 'ollamaUrl', 'ollamaModel', 'grammarEngine', 'explainLang', 'enVariant'].forEach(function (k) {
    if (s[k] && String(s[k]).trim()) p.setProperty(k, String(s[k]).trim());
  });
  // A single user property can hold about 9 KB.
  ['voiceProfile', 'voiceSamples'].forEach(function (k) {
    if (typeof s[k] === 'string') p.setProperty(k, s[k].slice(0, 8500));
  });
  return getSettings();
}

/** Lists the Gemini models this key may use for text generation (for the Settings dropdown). */
function listGeminiModels(keyFromForm) {
  var key = (keyFromForm && String(keyFromForm).trim()) || props_().getProperty('geminiKey');
  if (!key) throw new Error('Paste your Gemini key first.');
  var resp = UrlFetchApp.fetch(GEMINI_BASE + 'models?pageSize=200', {
    headers: { 'x-goog-api-key': key }, muteHttpExceptions: true
  });
  var data = {};
  try { data = JSON.parse(resp.getContentText()); } catch (e) { /* keep empty */ }
  if (resp.getResponseCode() !== 200) throw new Error(geminiError_(resp.getResponseCode(), data));
  return (data.models || [])
    .filter(function (m) {
      return (m.supportedGenerationMethods || []).indexOf('generateContent') !== -1 &&
             /gemini/i.test(m.name) && !/(embedding|image|tts|audio|live|vision)/i.test(m.name);
    })
    .map(function (m) { return String(m.name).replace(/^models\//, ''); });
}

// ----------------------------------------------------------------- document
function findBlock_(el) {
  while (el) {
    var t = el.getType();
    if (t === DocumentApp.ElementType.PARAGRAPH || t === DocumentApp.ElementType.LIST_ITEM) return el;
    el = el.getParent();
  }
  return null;
}

/** Returns the selected text, or the paragraph at the cursor if nothing is selected. */
function getSelectionText() {
  var doc = DocumentApp.getActiveDocument();
  var sel = doc.getSelection();
  if (sel) {
    var parts = [];
    sel.getRangeElements().forEach(function (re) {
      var el = re.getElement();
      if (!el.editAsText) return;
      var t = el.editAsText().getText();
      if (re.isPartial()) t = t.substring(re.getStartOffset(), re.getEndOffsetInclusive() + 1);
      parts.push(t);
    });
    return { text: parts.join('\n'), source: 'selection' };
  }
  var cur = doc.getCursor();
  if (cur) {
    var block = findBlock_(cur.getElement());
    if (block) return { text: block.editAsText().getText(), source: 'paragraph' };
  }
  return { text: '', source: 'none' };
}

function insertLinesAfter_(block, lines) {
  if (!lines.length) return;
  var parent = block.getParent();
  if (parent.getType() !== DocumentApp.ElementType.BODY_SECTION) {
    // Inside a table cell, header, etc.: keep everything in the same block.
    block.editAsText().appendText('\n' + lines.join('\n'));
    return;
  }
  var body = DocumentApp.getActiveDocument().getBody();
  var idx = body.getChildIndex(block);
  lines.forEach(function (line) { idx += 1; body.insertParagraph(idx, line); });
}

/** Replace the current selection (or the paragraph at the cursor) with newText. */
function replaceSelection(newText) {
  var doc = DocumentApp.getActiveDocument();
  var lines = String(newText).replace(/\r/g, '').split('\n');
  var sel = doc.getSelection();
  if (!sel) {
    var cur = doc.getCursor();
    var block = cur && findBlock_(cur.getElement());
    if (!block) throw new Error('Select some text (or click inside a paragraph) first.');
    block.editAsText().setText(lines[0]);
    insertLinesAfter_(block, lines.slice(1));
    return 'replaced';
  }
  var res = sel.getRangeElements().filter(function (re) { return !!re.getElement().editAsText; });
  if (!res.length) throw new Error('The selection has no text that can be replaced.');
  // Clear everything after the first element (backwards, so indexes stay valid).
  for (var i = res.length - 1; i >= 1; i--) {
    var re = res[i], el = re.getElement();
    if (re.isPartial()) {
      el.editAsText().deleteText(re.getStartOffset(), re.getEndOffsetInclusive());
    } else {
      var blk = findBlock_(el) || el;
      try { blk.removeFromParent(); } catch (e) { el.editAsText().setText(''); }
    }
  }
  var first = res[0], txt = first.getElement().editAsText();
  if (first.isPartial()) {
    txt.deleteText(first.getStartOffset(), first.getEndOffsetInclusive());
    txt.insertText(first.getStartOffset(), lines[0]);
  } else {
    txt.setText(lines[0]);
  }
  var firstBlock = findBlock_(first.getElement());
  if (firstBlock) insertLinesAfter_(firstBlock, lines.slice(1));
  return 'replaced';
}

/** Insert newText as new paragraph(s) below the selection / cursor (or at the end). */
function insertBelow(newText) {
  var doc = DocumentApp.getActiveDocument();
  var lines = String(newText).replace(/\r/g, '').split('\n');
  var sel = doc.getSelection(), block = null;
  if (sel) {
    var res = sel.getRangeElements();
    block = findBlock_(res[res.length - 1].getElement());
  } else if (doc.getCursor()) {
    block = findBlock_(doc.getCursor().getElement());
  }
  if (block && block.getParent().getType() === DocumentApp.ElementType.BODY_SECTION) {
    insertLinesAfter_(block, lines);
  } else {
    var body = doc.getBody();
    lines.forEach(function (l) { body.appendParagraph(l); });
  }
  return 'inserted';
}

// ----------------------------------------------------------------- AI engines
function callClaude_(p) {
  var key = props_().getProperty('apiKey');
  if (!key) throw new Error('Add your Claude API key in Settings (⚙) first, or switch the AI engine to Gemini (free).');
  var model = props_().getProperty('model') || CLAUDE_MODELS[0];
  var body = {
    model: model,
    max_tokens: 16000,
    system: p.system,
    messages: [{ role: 'user', content: p.user }],
    output_config: { effort: 'low' }
  };
  if (p.schema) body.output_config.format = { type: 'json_schema', schema: p.schema };
  var headers = { 'x-api-key': key, 'anthropic-version': '2026-10-21' };
  // Opus/Sonnet: if a safety classifier declines, retry on Anthropic's recommended fallback model.
  if (model !== 'claude-haiku-5-5') {
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    body.fallbacks = 'default';
  }
  var resp = UrlFetchApp.fetch(CLAUDE_URL, {
    method: 'post', contentType: 'application/json', headers: headers,
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  var code = resp.getResponseCode();
  var data = {};
  try { data = JSON.parse(resp.getContentText()); } catch (e) { /* keep empty */ }
  if (code !== 200) {
    var msg = data.error && data.error.message ? data.error.message : 'HTTP ' + code;
    if (code === 401) msg = 'Your Claude API key was rejected. Check it in Settings.';
    else if (code === 429 || code === 529) msg = 'Claude is busy or you hit a rate limit. Wait a moment and try again.';
    else if (code === 400 && /credit/i.test(msg)) msg = 'Your Anthropic account has no credit left. Add credit at console.anthropic.com, or switch to Gemini (free).';
    throw new Error(msg);
  }
  if (data.stop_reason === 'refusal') throw new Error('The AI declined to work on this text. Try rephrasing it.');
  var text = (data.content || []).filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; }).join('');
  if (data.stop_reason === 'max_tokens') text += '\n\n[Cut off: the text was too long. Try a shorter part.]';
  return text;
}

function geminiError_(code, data) {
  var msg = data && data.error && data.error.message ? data.error.message : 'HTTP ' + code;
  if (code === 400 && /api key/i.test(msg)) return 'Your Gemini key was rejected. Check it in Settings.';
  if (code === 403) return 'Your Gemini key is not allowed to use this. Create a new key at aistudio.google.com.';
  if (code === 404) return 'This Gemini model is not available for your key. In Settings, click "Find models" and pick another one.';
  if (code === 429) return 'You reached the Gemini free limit (per minute or per day). Wait a bit and try again, or try a lighter model.';
  if (code >= 500) return 'Gemini is busy right now. Try again in a moment.';
  return 'Gemini: ' + msg;
}

function callGemini_(p) {
  var key = props_().getProperty('geminiKey');
  if (!key) throw new Error('Add your free Gemini key in Settings (⚙) first. Get one at aistudio.google.com → "Get API key".');
  var model = props_().getProperty('geminiModel') || GEMINI_DEFAULT;
  var body = {
    systemInstruction: { parts: [{ text: p.system }] },
    contents: [{ role: 'user', parts: [{ text: p.user }] }],
    generationConfig: {}
  };
  if (p.schema) body.generationConfig.responseMimeType = 'application/json';
  var resp = UrlFetchApp.fetch(GEMINI_BASE + 'models/' + encodeURIComponent(model) + ':generateContent', {
    method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  var code = resp.getResponseCode();
  var data = {};
  try { data = JSON.parse(resp.getContentText()); } catch (e) { /* keep empty */ }
  if (code !== 200) throw new Error(geminiError_(code, data));
  if (data.promptFeedback && data.promptFeedback.blockReason) {
    throw new Error('Gemini declined to work on this text (' + data.promptFeedback.blockReason + '). Try rephrasing it.');
  }
  var cand = data.candidates && data.candidates[0];
  if (!cand) throw new Error('Gemini returned no answer. Try again.');
  var text = ((cand.content && cand.content.parts) || [])
    .filter(function (part) { return !part.thought; })
    .map(function (part) { return part.text || ''; }).join('');
  if (!text && cand.finishReason && cand.finishReason !== 'STOP') {
    throw new Error('Gemini stopped without an answer (' + cand.finishReason + '). Try rephrasing the text.');
  }
  if (cand.finishReason === 'MAX_TOKENS') text += '\n\n[Cut off: the text was too long. Try a shorter part.]';
  return text;
}

function callAI_(p, engine) {
  if (engine === 'claude') return callClaude_(p);
  if (engine === 'gemini') return callGemini_(p);
  throw new Error('The offline engine runs from the sidebar, not the server.');
}

function callLanguageTool_(text, outLang, enVariant) {
  var lang = outLang === 'en' ? enVariant : outLang === 'de' ? 'de-DE' : 'auto';
  var payload = { text: text, language: lang };
  if (lang === 'auto') payload.preferredVariants = enVariant + ',de-DE';
  var resp = UrlFetchApp.fetch('https://api.languagetool.org/v2/check', {
    method: 'post', payload: payload, muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) throw new Error('LanguageTool error ' + resp.getResponseCode());
  return WriterCore.fromLanguageTool(text, JSON.parse(resp.getContentText()).matches);
}

// ----------------------------------------------------------------- tool entry points
function cleanText_(opts) {
  var text = String(opts.text || '').trim();
  if (!text) throw new Error('There is no text. Select text in your document first, or type it in the box.');
  return text;
}

/** Builds the prompt for the chosen tool. Used by runTool, and by the sidebar for the offline engine. */
function preparePrompt(opts) {
  var s = getSettings();
  var text = cleanText_(opts);
  if (opts.mode === 'grammar') {
    return WriterCore.buildGrammar({ level: opts.level, explainLang: s.explainLang, enVariant: s.enVariant, text: text });
  }
  return WriterCore.buildRewrite({
    mode: opts.mode, style: opts.style, strength: Number(opts.strength) || 2, level: opts.level,
    outLang: opts.outLang, enVariant: s.enVariant, voice: !!opts.voice,
    voiceProfile: s.voiceProfile, voiceSamples: s.voiceSamples, text: text
  });
}

/** Turns the raw AI answer into what the sidebar shows. */
function finishResult(opts, raw) {
  var text = cleanText_(opts);
  if (opts.mode === 'grammar') {
    var data = WriterCore.parseJson(raw);
    return { kind: 'grammar', text: text, issues: WriterCore.locateIssues(text, data.issues || []) };
  }
  var out = WriterCore.cleanOutput(raw);
  if (!out) throw new Error('The AI returned an empty result. Try again.');
  return {
    kind: 'rewrite', output: out,
    segments: opts.outLang === 'same' ? WriterCore.diffWords(text, out) : [{ text: out, changed: false }]
  };
}

/**
 * Main entry from the sidebar for the cloud engines and LanguageTool.
 * opts: { mode, style, strength, level, outLang, voice, text }
 * Returns { kind: 'rewrite', output, segments } or { kind: 'grammar', text, issues }.
 */
function runTool(opts) {
  var s = getSettings();
  var text = cleanText_(opts);
  if (opts.mode === 'grammar' && s.grammarEngine === 'languagetool') {
    return { kind: 'grammar', text: text, issues: callLanguageTool_(text, opts.outLang, s.enVariant) };
  }
  return finishResult(opts, callAI_(preparePrompt(opts), s.engine));
}
