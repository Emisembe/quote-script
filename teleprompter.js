(() => {
  'use strict';

  const LIBRARY_KEY = 'teleprompter.library';
  const SETTINGS_KEY = 'teleprompter.settings';

  const defaultSettings = {
    fontSize: 48,
    speed: 40,
    opacity: 100,
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif",
    mirrorMode: 0 // 0 none, 1 horizontal, 2 vertical, 3 both
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
  }

  applySettingsToUI();

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
    saveSettings();
  });

  function setFontSize(v) {
    settings.fontSize = v;
    fontSizeRange.value = v;
    pFontSize.value = v;
    fontSizeLabel.textContent = v;
    scriptTrack.style.fontSize = v + 'px';
    saveSettings();
  }

  function setSpeed(v) {
    settings.speed = v;
    speedRange.value = v;
    pSpeed.value = v;
    speedLabel.textContent = v;
    saveSettings();
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

  startBtn.addEventListener('click', () => {
    if (!scriptText.value.trim()) {
      scriptText.focus();
      return;
    }
    scriptTrack.textContent = scriptText.value;
    scriptTrack.style.fontSize = settings.fontSize + 'px';
    scriptTrack.style.fontFamily = settings.fontFamily;
    scrim.style.opacity = settings.opacity / 100;
    applyMirrorClass();
    scrollPos = 0;
    applyScrollTransform();
    editorView.classList.remove('active');
    prompterView.classList.add('active');
    document.documentElement.classList.add('prompter-active');
    setPlaying(false);
    showControls();
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

  function applyScrollTransform() {
    scriptTrack.style.transform = `translateY(-${scrollPos}px)`;
  }

  function tick(ts) {
    if (!playing) return;
    if (lastTs !== null) {
      const dt = (ts - lastTs) / 1000;
      scrollPos += settings.speed * dt;
      applyScrollTransform();
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

  playBtn.addEventListener('click', () => setPlaying(!playing));

  resetBtn.addEventListener('click', () => {
    scrollPos = 0;
    applyScrollTransform();
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

  // ---------- Center guide line ----------
  centerlineBtn.addEventListener('click', () => {
    centerLine.classList.toggle('on');
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
        e.preventDefault();
        setPlaying(!playing);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSpeed(Math.min(150, settings.speed + 5));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSpeed(Math.max(5, settings.speed - 5));
        break;
      case '+':
      case '=':
        setFontSize(Math.min(140, settings.fontSize + 4));
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
