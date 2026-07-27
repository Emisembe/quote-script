(() => {
  'use strict';

  const LIBRARY_KEY = 'teleprompter.library';
  const SETTINGS_KEY = 'teleprompter.settings';

  const DRAFT_KEY = 'teleprompter.draft';

  const defaultSettings = {
    fontSize: 48,
    speed: 40,
    opacity: 100,
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif",
    mirrorMode: 0, // 0 none, 1 horizontal, 2 vertical, 3 both
    backdropColor: '#000000',
    countdownEnabled: true
  };

  let settings = loadSettings();

  // ---------- DOM refs ----------
  const editorView = document.getElementById('editor-view');
  const prompterView = document.getElementById('prompter-view');
  const scriptText = document.getElementById('script-text');
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('file-input');
  const clearBtn = document.getElementById('clear-btn');
  const downloadBtn = document.getElementById('download-btn');
  const startBtn = document.getElementById('start-btn');
  const saveNameInput = document.getElementById('save-name');
  const saveBtn = document.getElementById('save-btn');
  const libraryList = document.getElementById('script-library');
  const libraryEmpty = document.getElementById('library-empty');

  const fontSizeRange = document.getElementById('font-size-range');
  const fontSizeLabel = document.getElementById('font-size-label');
  const speedRange = document.getElementById('speed-range');
  const speedLabel = document.getElementById('speed-label');
  const fontFamilySelect = document.getElementById('font-family');

  const scriptTrack = document.getElementById('script-track');
  const prompterStage = document.getElementById('prompter-stage');
  const centerLine = document.getElementById('center-line');
  const cameraBg = document.getElementById('camera-bg');
  const scrim = document.getElementById('scrim');
  const cameraError = document.getElementById('camera-error');

  const pFontSize = document.getElementById('p-font-size');
  const pSpeed = document.getElementById('p-speed');
  const pOpacity = document.getElementById('p-opacity');
  const pFontSizeValue = document.getElementById('p-font-size-value');
  const pSpeedValue = document.getElementById('p-speed-value');
  const pOpacityValue = document.getElementById('p-opacity-value');

  const backBtn = document.getElementById('back-btn');
  const playBtn = document.getElementById('play-btn');
  const resetBtn = document.getElementById('reset-btn');
  const mirrorBtn = document.getElementById('mirror-btn');
  const cameraBtn = document.getElementById('camera-btn');
  const flipCamBtn = document.getElementById('flip-cam-btn');
  const centerlineBtn = document.getElementById('centerline-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const hideControlsBtn = document.getElementById('hide-controls-btn');
  const showControlsTab = document.getElementById('show-controls-tab');
  const controlsBar = document.getElementById('prompter-controls');

  const countdownToggle = document.getElementById('countdown-toggle');
  const countdownOverlay = document.getElementById('countdown-overlay');
  const countdownNumber = document.getElementById('countdown-number');
  const progressFill = document.getElementById('progress-fill');
  const timeReadout = document.getElementById('time-readout');
  const fontDecBtn = document.getElementById('font-dec');
  const fontIncBtn = document.getElementById('font-inc');
  const backdropBlackBtn = document.getElementById('backdrop-black');
  const backdropGreenBtn = document.getElementById('backdrop-green');
  const prevParaBtn = document.getElementById('prev-para-btn');
  const nextParaBtn = document.getElementById('next-para-btn');

  // ---------- Settings persistence ----------
  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...defaultSettings };
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function applySettingsToUI() {
    fontSizeRange.value = settings.fontSize;
    fontSizeLabel.textContent = settings.fontSize;
    speedRange.value = settings.speed;
    speedLabel.textContent = settings.speed;
    fontFamilySelect.value = settings.fontFamily;
    pFontSize.value = settings.fontSize;
    pSpeed.value = settings.speed;
    pOpacity.value = settings.opacity;
    pFontSizeValue.textContent = settings.fontSize + 'px';
    pSpeedValue.textContent = settings.speed;
    pOpacityValue.textContent = settings.opacity + '%';
    countdownToggle.checked = settings.countdownEnabled;
    backdropBlackBtn.classList.toggle('active', settings.backdropColor === '#000000');
    backdropGreenBtn.classList.toggle('active', settings.backdropColor !== '#000000');
  }

  applySettingsToUI();

  // ---------- Draft autosave (so a stray refresh never loses typed work) ----------
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  if (savedDraft && savedDraft.trim()) {
    scriptText.value = savedDraft;
  }
  let draftTimer = null;
  scriptText.addEventListener('input', () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => localStorage.setItem(DRAFT_KEY, scriptText.value), 400);
  });

  countdownToggle.addEventListener('change', () => {
    settings.countdownEnabled = countdownToggle.checked;
    saveSettings();
  });

  // ---------- Script library (localStorage) ----------
  function loadLibrary() {
    try {
      return JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveLibrary(list) {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(list));
  }

  function renderLibrary() {
    const list = loadLibrary();
    libraryList.innerHTML = '';
    libraryEmpty.style.display = list.length ? 'none' : 'block';
    list
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .forEach(item => {
        const li = document.createElement('li');
        const date = new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        li.innerHTML = `
          <span class="name">${escapeHtml(item.name)}</span>
          <span class="meta">${date}</span>
        `;
        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn';
        loadBtn.textContent = 'Load';
        loadBtn.onclick = () => {
          scriptText.value = item.text;
          saveNameInput.value = item.name;
        };
        const delBtn = document.createElement('button');
        delBtn.className = 'btn danger';
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => {
          if (confirm(`Delete "${item.name}"?`)) {
            saveLibrary(loadLibrary().filter(x => x.id !== item.id));
            renderLibrary();
          }
        };
        li.appendChild(loadBtn);
        li.appendChild(delBtn);
        libraryList.appendChild(li);
      });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  saveBtn.addEventListener('click', () => {
    const name = saveNameInput.value.trim() || `Script ${new Date().toLocaleString()}`;
    const text = scriptText.value;
    if (!text.trim()) return;
    const list = loadLibrary();
    const existing = list.find(x => x.name === name);
    if (existing) {
      existing.text = text;
      existing.updatedAt = Date.now();
    } else {
      list.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, text, updatedAt: Date.now() });
    }
    saveLibrary(list);
    renderLibrary();
  });

  renderLibrary();

  // ---------- File load / clear / download ----------
  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      scriptText.value = reader.result;
      saveNameInput.value = file.name.replace(/\.[^.]+$/, '');
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  clearBtn.addEventListener('click', () => {
    if (scriptText.value.trim() && !confirm('Clear the script text?')) return;
    scriptText.value = '';
  });

  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([scriptText.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(saveNameInput.value.trim() || 'script')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ---------- Editor-side setting controls ----------
  fontSizeRange.addEventListener('input', () => setFontSize(+fontSizeRange.value));
  speedRange.addEventListener('input', () => setSpeed(+speedRange.value));
  fontFamilySelect.addEventListener('change', () => {
    settings.fontFamily = fontFamilySelect.value;
    scriptTrack.style.fontFamily = settings.fontFamily;
    saveSettings();
  });

  // ---------- Prompter-side setting controls ----------
  pFontSize.addEventListener('input', () => setFontSize(+pFontSize.value));
  pSpeed.addEventListener('input', () => setSpeed(+pSpeed.value));
  pOpacity.addEventListener('input', () => {
    settings.opacity = +pOpacity.value;
    scrim.style.opacity = settings.opacity / 100;
    pOpacityValue.textContent = settings.opacity + '%';
    saveSettings();
  });

  backdropBlackBtn.addEventListener('click', () => setBackdropColor('#000000'));
  backdropGreenBtn.addEventListener('click', () => setBackdropColor('#00b140'));

  function setBackdropColor(color) {
    settings.backdropColor = color;
    scrim.style.background = color;
    backdropBlackBtn.classList.toggle('active', color === '#000000');
    backdropGreenBtn.classList.toggle('active', color !== '#000000');
    saveSettings();
  }

  function setFontSize(v) {
    settings.fontSize = v;
    fontSizeRange.value = v;
    pFontSize.value = v;
    fontSizeLabel.textContent = v;
    pFontSizeValue.textContent = v + 'px';
    scriptTrack.style.fontSize = v + 'px';
    saveSettings();
    recomputeMaxScroll();
    updateProgressUI();
  }

  function setSpeed(v) {
    settings.speed = v;
    speedRange.value = v;
    pSpeed.value = v;
    speedLabel.textContent = v;
    pSpeedValue.textContent = v;
    saveSettings();
    updateProgressUI();
  }

  // ---------- View switching ----------
  let wakeLock = null;

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch {
      // ignore - not fatal, screen may just dim if unsupported
    }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && playing && prompterView.classList.contains('active')) {
      requestWakeLock();
    }
  });

  function renderScript(text) {
    scriptTrack.innerHTML = '';
    paragraphEls = text.split(/\n{2,}/).map(para => {
      const div = document.createElement('div');
      div.className = 'para';
      div.textContent = para;
      scriptTrack.appendChild(div);
      return div;
    });
  }

  startBtn.addEventListener('click', () => {
    if (!scriptText.value.trim()) {
      scriptText.focus();
      return;
    }
    renderScript(scriptText.value);
    scriptTrack.style.fontSize = settings.fontSize + 'px';
    scriptTrack.style.fontFamily = settings.fontFamily;
    scrim.style.background = settings.backdropColor;
    scrim.style.opacity = settings.opacity / 100;
    applyMirrorClass();
    scrollPos = 0;
    hasStartedOnce = false;
    applyScrollTransform();
    editorView.classList.remove('active');
    prompterView.classList.add('active');
    document.documentElement.classList.add('prompter-active');
    setPlaying(false);
    showControls();
    requestAnimationFrame(() => {
      recomputeMaxScroll();
      updateProgressUI();
    });
  });

  backBtn.addEventListener('click', exitToEditor);

  function exitToEditor() {
    setPlaying(false);
    stopCamera();
    releaseWakeLock();
    document.documentElement.classList.remove('prompter-active');
    prompterView.classList.remove('active');
    editorView.classList.add('active');
  }

  // ---------- Scrolling engine ----------
  let playing = false;
  let scrollPos = 0;
  let lastTs = null;
  let paragraphEls = [];
  let maxScroll = 1;
  let hasStartedOnce = false;

  function applyScrollTransform() {
    scriptTrack.style.transform = `translateY(-${scrollPos}px)`;
  }

  function recomputeMaxScroll() {
    maxScroll = Math.max(1, scriptTrack.scrollHeight - prompterStage.clientHeight);
  }

  function fmtTime(s) {
    s = Math.max(0, Math.round(s));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function updateProgressUI() {
    const pct = maxScroll ? Math.min(100, (scrollPos / maxScroll) * 100) : 0;
    progressFill.style.width = pct + '%';
    const elapsed = settings.speed ? scrollPos / settings.speed : 0;
    const total = settings.speed ? maxScroll / settings.speed : 0;
    timeReadout.textContent = `${fmtTime(elapsed)} / ${fmtTime(total)}`;
  }

  function tick(ts) {
    if (!playing) return;
    if (lastTs !== null) {
      const dt = (ts - lastTs) / 1000;
      scrollPos += settings.speed * dt;
      if (scrollPos >= maxScroll) {
        scrollPos = maxScroll;
        applyScrollTransform();
        updateProgressUI();
        setPlaying(false);
        return;
      }
      applyScrollTransform();
      updateProgressUI();
    }
    lastTs = ts;
    requestAnimationFrame(tick);
  }

  function setPlaying(v) {
    playing = v;
    lastTs = null;
    playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
    playBtn.classList.toggle('active', playing);
    if (playing) {
      requestAnimationFrame(tick);
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }

  function beginCountdownThenPlay() {
    if (!settings.countdownEnabled) {
      setPlaying(true);
      return;
    }
    let n = 3;
    countdownNumber.textContent = n;
    countdownOverlay.classList.add('show');
    const iv = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(iv);
        countdownOverlay.classList.remove('show');
        setPlaying(true);
      } else {
        countdownNumber.textContent = n;
      }
    }, 800);
  }

  playBtn.addEventListener('click', () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (!hasStartedOnce) {
      hasStartedOnce = true;
      beginCountdownThenPlay();
    } else {
      setPlaying(true);
    }
  });

  resetBtn.addEventListener('click', () => {
    scrollPos = 0;
    hasStartedOnce = false;
    applyScrollTransform();
    updateProgressUI();
  });

  // ---------- Paragraph navigation (jump by blank-line-separated section) ----------
  function currentParaIndex() {
    const centerLocal = scrollPos + prompterStage.clientHeight / 2;
    let idx = 0;
    for (let i = 0; i < paragraphEls.length; i++) {
      if (paragraphEls[i].offsetTop <= centerLocal) idx = i;
      else break;
    }
    return idx;
  }

  function jumpToParagraph(idx) {
    if (!paragraphEls.length) return;
    idx = Math.max(0, Math.min(paragraphEls.length - 1, idx));
    const el = paragraphEls[idx];
    const target = el.offsetTop - prompterStage.clientHeight / 2 + el.offsetHeight / 2;
    scrollPos = Math.max(0, Math.min(maxScroll, target));
    applyScrollTransform();
    updateProgressUI();
  }

  prevParaBtn.addEventListener('click', () => jumpToParagraph(currentParaIndex() - 1));
  nextParaBtn.addEventListener('click', () => jumpToParagraph(currentParaIndex() + 1));

  // ---------- Quick on-screen font size nudge ----------
  fontDecBtn.addEventListener('click', () => setFontSize(Math.max(20, settings.fontSize - 4)));
  fontIncBtn.addEventListener('click', () => setFontSize(Math.min(200, settings.fontSize + 4)));

  window.addEventListener('resize', () => {
    if (prompterView.classList.contains('active')) recomputeMaxScroll();
  });

  // ---------- Mirror ----------
  const mirrorClasses = ['', 'mirror-h', 'mirror-v', 'mirror-hv'];
  const mirrorLabels = ['🪞 Mirror: off', '🪞 Mirror: horiz', '🪞 Mirror: vert', '🪞 Mirror: both'];

  function applyMirrorClass() {
    prompterStage.classList.remove('mirror-h', 'mirror-v', 'mirror-hv');
    const cls = mirrorClasses[settings.mirrorMode];
    if (cls) prompterStage.classList.add(cls);
    mirrorBtn.textContent = mirrorLabels[settings.mirrorMode];
    mirrorBtn.classList.toggle('active', settings.mirrorMode !== 0);
  }

  mirrorBtn.addEventListener('click', () => {
    settings.mirrorMode = (settings.mirrorMode + 1) % mirrorClasses.length;
    applyMirrorClass();
    saveSettings();
  });

  // ---------- Camera see-through background ----------
  let cameraStream = null;
  let facingMode = 'user';

  async function startCamera() {
    try {
      cameraError.classList.remove('show');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available (needs HTTPS or localhost).');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }, audio: false
      });
      cameraStream = stream;
      cameraBg.srcObject = stream;
      cameraBg.classList.add('on');
      cameraBtn.classList.add('active');
      flipCamBtn.style.display = 'inline-block';
    } catch (err) {
      showCameraError(err.message || 'Could not access camera.');
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    cameraBg.srcObject = null;
    cameraBg.classList.remove('on');
    cameraBtn.classList.remove('active');
    flipCamBtn.style.display = 'none';
  }

  function showCameraError(msg) {
    cameraError.textContent = msg;
    cameraError.classList.add('show');
    setTimeout(() => cameraError.classList.remove('show'), 4000);
  }

  cameraBtn.addEventListener('click', () => {
    if (cameraStream) stopCamera();
    else startCamera();
  });

  flipCamBtn.addEventListener('click', () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    stopCamera();
    startCamera();
  });

  // ---------- Eye-line reading guide ----------
  centerlineBtn.addEventListener('click', () => {
    centerLine.classList.toggle('on');
    prompterStage.classList.toggle('spotlight-on');
    centerlineBtn.classList.toggle('active');
  });

  // ---------- Fullscreen ----------
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || function () {}).call(document.documentElement).catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // ---------- Auto-hide controls ----------
  let hideTimer = null;

  function showControls() {
    controlsBar.classList.remove('hidden');
    showControlsTab.classList.remove('show');
    scheduleAutoHide();
  }

  function scheduleAutoHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (playing) hideControls();
    }, 4000);
  }

  function hideControls() {
    controlsBar.classList.add('hidden');
    showControlsTab.classList.add('show');
  }

  hideControlsBtn.addEventListener('click', hideControls);
  showControlsTab.addEventListener('click', showControls);
  ['pointermove', 'touchstart', 'click'].forEach(evt => {
    controlsBar.addEventListener(evt, scheduleAutoHide);
  });
  prompterStage.addEventListener('click', () => {
    if (controlsBar.classList.contains('hidden')) showControls();
  });

  // ---------- Keyboard shortcuts ----------
  document.addEventListener('keydown', (e) => {
    if (!prompterView.classList.contains('active')) return;
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        playBtn.click();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSpeed(Math.min(150, settings.speed + 5));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSpeed(Math.max(5, settings.speed - 5));
        break;
      case 'PageDown':
        e.preventDefault();
        jumpToParagraph(currentParaIndex() + 1);
        break;
      case 'PageUp':
        e.preventDefault();
        jumpToParagraph(currentParaIndex() - 1);
        break;
      case '+':
      case '=':
        setFontSize(Math.min(200, settings.fontSize + 4));
        break;
      case '-':
        setFontSize(Math.max(20, settings.fontSize - 4));
        break;
      case 'm':
      case 'M':
        settings.mirrorMode = (settings.mirrorMode + 1) % mirrorClasses.length;
        applyMirrorClass();
        saveSettings();
        break;
      case 'c':
      case 'C':
        if (cameraStream) stopCamera(); else startCamera();
        break;
      case 'f':
      case 'F':
        fullscreenBtn.click();
        break;
      case 'Escape':
        exitToEditor();
        break;
    }
  });
})();
