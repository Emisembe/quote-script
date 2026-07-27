(() => {
  'use strict';

  const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

  const pairingScreen = document.getElementById('pairing-screen');
  const controlScreen = document.getElementById('control-screen');
  const statusEl = document.getElementById('status');
  const controlStatusEl = document.getElementById('control-status');

  const offerInput = document.getElementById('offer-input');
  const genAnswerBtn = document.getElementById('gen-answer-btn');
  const answerPanel = document.getElementById('answer-panel');
  const answerOutput = document.getElementById('answer-output');
  const copyAnswerBtn = document.getElementById('copy-answer-btn');

  const toggleBtn = document.getElementById('toggle-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const resetBtn = document.getElementById('reset-btn');
  const speedUpBtn = document.getElementById('speed-up-btn');
  const speedDownBtn = document.getElementById('speed-down-btn');
  const fontUpBtn = document.getElementById('font-up-btn');
  const fontDownBtn = document.getElementById('font-down-btn');
  const mirrorBtn = document.getElementById('mirror-btn');
  const guideBtn = document.getElementById('guide-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const speedReadout = document.getElementById('speed-readout');
  const fontReadout = document.getElementById('font-readout');
  const timeReadout = document.getElementById('time-readout');
  const progressFill = document.getElementById('progress-fill');

  let pc = null;
  let dc = null;

  function waitForIceGatheringComplete(peer, timeoutMs = 4000) {
    if (peer.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        peer.removeEventListener('icegatheringstatechange', check);
        resolve();
      }, timeoutMs);
      function check() {
        if (peer.iceGatheringState === 'complete') {
          clearTimeout(timer);
          peer.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      }
      peer.addEventListener('icegatheringstatechange', check);
    });
  }

  function send(type) {
    if (dc && dc.readyState === 'open') dc.send(JSON.stringify({ type }));
  }

  function showControlScreen() {
    pairingScreen.classList.remove('active');
    controlScreen.classList.add('active');
  }

  function showPairingScreen() {
    controlScreen.classList.remove('active');
    pairingScreen.classList.add('active');
    statusEl.textContent = 'Not connected';
    statusEl.classList.remove('connected');
    offerInput.value = '';
    answerOutput.value = '';
    answerPanel.style.display = 'none';
  }

  genAnswerBtn.addEventListener('click', async () => {
    const code = offerInput.value.trim();
    if (!code) return;
    genAnswerBtn.disabled = true;
    genAnswerBtn.textContent = 'Generating…';
    try {
      const offer = JSON.parse(atob(code));
      if (pc) pc.close();
      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.ondatachannel = (e) => wireDataChannel(e.channel);
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          showPairingScreen();
        }
      };
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGatheringComplete(pc);
      answerOutput.value = btoa(JSON.stringify(pc.localDescription));
      answerPanel.style.display = 'block';
      statusEl.textContent = 'Waiting for the teleprompter to connect…';
    } catch (err) {
      statusEl.textContent = 'That code looks invalid — copy it again from the teleprompter';
    } finally {
      genAnswerBtn.disabled = false;
      genAnswerBtn.textContent = 'Generate my code';
    }
  });

  copyAnswerBtn.addEventListener('click', () => {
    if (!answerOutput.value) return;
    answerOutput.select();
    navigator.clipboard?.writeText(answerOutput.value).catch(() => {});
  });

  function wireDataChannel(channel) {
    dc = channel;
    dc.onopen = () => {
      statusEl.textContent = '🟢 Connected';
      statusEl.classList.add('connected');
      showControlScreen();
    };
    dc.onclose = () => showPairingScreen();
    dc.onerror = () => showPairingScreen();
    dc.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type !== 'state') return;
      toggleBtn.textContent = msg.playing ? '⏸ Pause' : '▶ Play';
      toggleBtn.classList.toggle('playing', msg.playing);
      speedReadout.textContent = msg.speed;
      fontReadout.textContent = msg.fontSize + 'px';
      timeReadout.textContent = msg.time;
      progressFill.style.width = (msg.pct || 0) + '%';
    };
  }

  toggleBtn.addEventListener('click', () => send('toggle'));
  prevBtn.addEventListener('click', () => send('prevPara'));
  nextBtn.addEventListener('click', () => send('nextPara'));
  resetBtn.addEventListener('click', () => send('reset'));
  speedUpBtn.addEventListener('click', () => send('speedUp'));
  speedDownBtn.addEventListener('click', () => send('speedDown'));
  fontUpBtn.addEventListener('click', () => send('fontUp'));
  fontDownBtn.addEventListener('click', () => send('fontDown'));
  mirrorBtn.addEventListener('click', () => send('mirror'));
  guideBtn.addEventListener('click', () => send('guide'));

  disconnectBtn.addEventListener('click', () => {
    if (dc) dc.close();
    if (pc) pc.close();
    dc = null;
    pc = null;
    showPairingScreen();
  });
})();
