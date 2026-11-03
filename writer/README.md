# Emisembe Writer

Your own writing tool for **English and German**: **Paraphrase**, **Grammar check** and **Humanise**.
It has **CEFR levels A1–C2** and a **My voice** switch that rewrites text the way you write, in either language.

It comes in two versions that use the same "brain" (`core/writer-core.js`):

| | Desktop app (`app/`) | Google Docs add-on (`google-docs/`) |
|---|---|---|
| Where | Your browser, on your PC | Sidebar inside Google Docs |
| AI engine | Offline (Ollama) · Gemini (free tier) · Claude (paid) | Gemini (free tier) · Claude (paid) · Offline (Ollama, experimental) |
| Grammar | AI, LanguageTool offline, or LanguageTool online | LanguageTool online (free, no key) or AI |
| Internet needed | No (offline engine) | Yes (Google Docs itself is online) |

### Which AI engine?

| Engine | Cost | What you need |
|---|---|---|
| **Google Gemini** | Free, with daily limits | A free key from <https://aistudio.google.com> → "Get API key" (just a Google account) |
| **Claude** | Pay per use (see Costs) | A key from <https://console.anthropic.com> with credit |
| **Offline (Ollama)** | Free | Ollama on your PC + about 8 GB free disk (see below) |

You can switch engines at any time in **Settings**. Everything else (levels, My voice, languages) works the same.
On Gemini's free tier, Google may use your text to improve its products, so don't use it for private documents.
If a Gemini model stops working, click **Find models** in Settings and pick another one.

---

## What each option does

- **Paraphrase** has eight styles: Standard, Fluency, Formal/Business, Friendly, Simple, Academic, Shorter and Longer. Set **Change** to Light, Medium or Strong.
- **Humanise** makes text sound like a real person wrote it. It varies sentence length, uses plain words and removes stock phrases. It cannot guarantee that "AI detectors" will be fooled, because no tool reliably can.
- **Grammar check** underlines real errors. Each error comes with a short explanation, written for the level you picked (A1 explanations use very simple words). You can apply fixes one by one, or all at once. Explanations can be in English or German.
- **Level** sets the result's level, from A1 up to C2. **Keep** leaves your current level as it is. German levels also follow German grammar steps, for example no Konjunktiv or Genitiv at A1/A2.
- **Output** can be Same, English or Deutsch. Picking the other language translates and rewrites in one step.
- **My voice** writes in your style: direct, warm and structured, with your typical phrases. It never invents facts. Edit it under **Settings → My voice**, and paste a few real emails of yours, both English and German. The more samples you add, the better the imitation.

---

## Desktop app — setup on your PC (Windows)

Your laptop (i5-1135G7, **32 GB RAM**) can run an offline AI model well. Without a strong graphics card it runs on the processor, so expect about **10–30 seconds** for a paragraph with `gemma3:4b`.

### ⚠️ 1. Free up disk space first

Your C: drive shows **473 of 477 GB used**. That leaves about 4 GB, which is not enough. You need **at least 8 GB**, and about **20 GB** is comfortable.

- Go to **Settings → System → Storage → Cleanup recommendations / Temporary files**.
- Empty **Downloads** and the **Recycle Bin**. Uninstall apps you don't use.
- Move videos and photos to an external drive or Google Drive.
- Optional: keep the AI models on another drive. Set the environment variable `OLLAMA_MODELS` to a folder there, e.g. `D:\ollama-models`, then restart Ollama.

### 2. Download this folder

Download the whole `writer` folder and **keep its structure**. `app/index.html` needs `core/writer-core.js` next to it.

### 3. Install Ollama and the model

1. Double-click **`app/setup-windows.bat`**. It checks your disk space, opens the Ollama download page if Ollama is missing, lets the app talk to Ollama, and downloads `gemma3:4b` (about 3.3 GB).
2. **Quit Ollama:** right-click the llama icon near the clock → Quit. Then **start it again**. This step is required once, so that Ollama picks up the new setting.

### 4. Start writing

Double-click **`app/start-writer.bat`** (or open `app/index.html` in Chrome or Edge). A green dot that says **Offline · gemma3:4b** means everything is connected. Press **Ctrl+Enter** to run.

**Better quality (slower):** run `ollama pull gemma3:12b` in a terminal, then pick it under Settings → Offline model. It needs about 8 GB of disk and is about 3× slower.

### Optional: very fast offline grammar checking (LanguageTool)

LanguageTool is a dedicated grammar checker for English and German. It is very fast and fully offline. Its explanations are not adapted to your level.

1. Install Java 17+ from <https://adoptium.net>.
2. Download <https://languagetool.org/download/LanguageTool-stable.zip> and unzip it into the `app` folder.
3. Double-click **`app/start-languagetool.bat`** and keep that window open.
4. In Writer, go to **Settings → Checker → LanguageTool on this PC**.

### Use the desktop app without Ollama (no disk space needed)

Go to **Settings → Engine** and pick **Cloud: Google Gemini** (free key) or **Cloud: Claude** (paid key), then paste the key. Keys stay in this browser on your PC only.

---

## Google Docs add-on — setup

The sidebar works without any key for **grammar checking** (LanguageTool online). For Paraphrase and Humanise, pick an AI engine in **⚙ Settings**: Gemini (free key), Claude (paid key) or Offline.

1. Open a Google Doc → **Extensions → Apps Script**.
2. In the editor, create these files and paste the contents:
   - `Code.gs` ← `google-docs/Code.gs`
   - Click **+ → Script** and name it `WriterCore`, then paste ← `core/writer-core.js`
   - Click **+ → HTML** and name it `Sidebar`, then paste ← `google-docs/Sidebar.html`
   - Click **Project Settings (⚙)**, tick **"Show appsscript.json"**, then replace its content with ← `google-docs/appsscript.json`
3. Click **Save**, then reload the Google Doc.
4. Open **Extensions → Emisembe Writer → Open Writer**. Google asks for permission the first time; allow it.
5. In the sidebar, open **⚙ Settings**, choose the AI engine, paste its key (Gemini or Claude), and click **Save**.

**Offline AI in Google Docs (experimental):** choose **Offline AI on my PC (Ollama)**. The sidebar runs in your browser, so it can talk to Ollama on your PC directly. Click **Test connection** to check. Chrome may ask you to allow access to devices on your local network: click **Allow**. Chrome might still block Google Docs from reaching your PC. If it does, use the desktop app for offline work.

**Using it:** select text in the document → **Get selected text** → choose your options → **Rephrase / Check grammar** → **Replace selection** (or **Insert below**).

**Every document:** a script made this way belongs to that one document. Two simple ways to use it everywhere:

- Keep this doc as a **template**, and use *File → Make a copy* for new documents. The script is copied too.
- Or, in Apps Script, use **Deploy → Test deployments → Editor add-on** to test it on another document.

---

## Costs (cloud only)

The offline engine and Gemini's free tier cost nothing. With Claude you pay per use; there's no subscription and no daily limit. Rough cost for one rewrite of a ~150-word paragraph:

| Model | Approx. cost per rewrite |
|---|---|
| Claude Opus 5.5 (default, best) | ~1–2 US cents |
| Claude Sonnet 5.5 | under 1 cent |
| Claude Haiku 5.5 | a fraction of a cent |

These figures are based on prices as of late 2026; check <https://console.anthropic.com> for current prices. Turning **My voice** on adds the voice profile to each request, which costs a little more. You can set a monthly spending limit in the Anthropic console.

---

## Privacy

- **Offline engine and LanguageTool on this PC:** your text never leaves your computer.
- **Claude:** text is sent to Anthropic's API to be processed.
- **LanguageTool online:** text is sent to languagetool.org.
- The setup sets `OLLAMA_ORIGINS=*` so the app, opened as a local file, can talk to Ollama. This also means web pages open in your browser could send requests to Ollama while it is running. They can only use your model; they can't read your files. To undo it, run `setx OLLAMA_ORIGINS ""` and restart Ollama.

---

## Files

```
writer/
  core/writer-core.js     prompts, CEFR levels, voice profile, diff + grammar helpers (shared)
  app/index.html          desktop app (open in Chrome/Edge)
  app/setup-windows.bat   one-time offline setup (Ollama + model)
  app/start-writer.bat    opens the app
  app/start-languagetool.bat  optional offline grammar server
  google-docs/Code.gs     add-on server code (Docs selection, Gemini, Claude, LanguageTool)
  google-docs/Sidebar.html  add-on sidebar UI
  google-docs/appsscript.json  add-on manifest (permissions)
  guides/                 detailed step-by-step guides (open in a browser, or see the Google Docs copies)
  tests/core.test.js      unit tests:  node --test writer/tests/core.test.js
```

If you change the prompts, change `core/writer-core.js`. Then paste it into the Apps Script `WriterCore` file again so both versions stay the same.
