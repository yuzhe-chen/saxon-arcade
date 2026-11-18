/* Knesset Combat 26' — synthesized audio: SFX, original music loops, announcer. */
(function () {
  var A = KC.Audio = { ctx: null, sfxOn: true, musicOn: true, voiceOn: true, track: null };
  var noiseBuf = null;

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { A.ctx = new AC(); } catch (e) { return; }
    var c = A.ctx;
    A.master = c.createGain(); A.master.gain.value = 0.9; A.master.connect(c.destination);
    var comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(A.master);
    A.sfx = c.createGain(); A.sfx.gain.value = 0.55; A.sfx.connect(comp);
    A.music = c.createGain(); A.music.gain.value = 0.16; A.music.connect(comp);
    noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (A.pendingTrack) { var t = A.pendingTrack; A.pendingTrack = null; A.playMusic(t); }
  };

  function env(g, t, a, peak, dec) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function osc(type, f0, f1, t, dur, vol, dest) {
    var c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(dest || A.sfx); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(t, dur, vol, ftype, f0, f1, q, dest) {
    var c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; f.type = ftype || 'lowpass'; f.frequency.setValueAtTime(f0 || 2000, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.Q.value = q || 0.8;
    env(g, t, 0.004, vol, dur);
    s.connect(f); f.connect(g); g.connect(dest || A.sfx);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  A.play = function (name, p) {
    if (!A.ctx || !A.sfxOn) return;
    var t = A.ctx.currentTime + 0.005; p = p || 1;
    switch (name) {
      case 'hitL': noise(t, 0.09, 0.7, 'lowpass', 2400, 600); osc('sine', 170, 60, t, 0.1, 0.8); break;
      case 'hitH': noise(t, 0.16, 0.9, 'lowpass', 1800, 300); osc('sine', 120, 38, t, 0.2, 1.0); osc('square', 90, 40, t, 0.08, 0.25); break;
      case 'hitS': noise(t, 0.3, 1.0, 'lowpass', 2600, 200); osc('sine', 100, 30, t, 0.35, 1.0); osc('sawtooth', 220, 50, t, 0.2, 0.3); break;
      case 'block': osc('square', 1100, 700, t, 0.04, 0.25); noise(t, 0.05, 0.4, 'highpass', 3000); break;
      case 'whiff': noise(t, 0.12, 0.25, 'bandpass', 500, 2400, 1.5); break;
      case 'dash': noise(t, 0.16, 0.3, 'bandpass', 2600, 700, 1.2); osc('sine', 170, 80, t, 0.1, 0.12); break;
      case 'jump': osc('sine', 260, 520, t, 0.08, 0.2); break;
      case 'land': osc('sine', 90, 50, t, 0.07, 0.35); break;
      case 'proj': osc('square', 380, 900, t, 0.16, 0.18); osc('triangle', 760, 1500, t, 0.16, 0.15); break;
      case 'rush': noise(t, 0.3, 0.4, 'bandpass', 300, 1800, 2); osc('sawtooth', 110, 220, t, 0.25, 0.15); break;
      case 'super':
        [261.6, 329.6, 392, 523.2].forEach(function (f, i) { osc('sawtooth', f, f * 1.5, t + i * 0.04, 0.6, 0.12); });
        noise(t, 0.7, 0.5, 'bandpass', 400, 4000, 1.2); break;
      case 'beam': osc('sawtooth', 70, 140, t, 0.9, 0.25); noise(t, 0.9, 0.35, 'bandpass', 900, 3000, 3); break;
      case 'boom': noise(t, 0.7, 1.0, 'lowpass', 1600, 80); osc('sine', 90, 25, t, 0.8, 1.0); break;
      case 'ko': noise(t, 0.9, 1.0, 'lowpass', 2200, 60); osc('sine', 80, 22, t, 1.1, 1.0); osc('sawtooth', 300, 40, t, 0.9, 0.2); break;
      case 'gavel':
        [0, 0.2].forEach(function (d) { osc('sine', 340, 160, t + d, 0.09, 0.9); osc('triangle', 900, 300, t + d, 0.03, 0.4); noise(t + d, 0.05, 0.6, 'bandpass', 1400, 600, 3); });
        break;
      case 'move': osc('square', 520, 520, t, 0.04, 0.12); break;
      case 'select': osc('square', 660, 990, t, 0.09, 0.18); osc('triangle', 1320, 1320, t + 0.05, 0.08, 0.1); break;
      case 'back': osc('square', 420, 240, t, 0.1, 0.15); break;
      case 'deny': osc('square', 160, 120, t, 0.15, 0.2); break;
      case 'unlock':
        [523.2, 659.3, 784, 1046.5, 1318.5].forEach(function (f, i) { osc('square', f, f, t + i * 0.09, 0.18, 0.14); osc('triangle', f * 2, f * 2, t + i * 0.09, 0.2, 0.08); });
        break;
      case 'cheer': noise(t, 1.6 * p, 0.35 * p, 'bandpass', 900, 2600, 0.6); noise(t + 0.05, 1.4 * p, 0.25 * p, 'bandpass', 1500, 1100, 0.8); break;
      case 'tick': osc('sine', 1200, 1200, t, 0.03, 0.12); break;
    }
  };

  /* ---------- music: tiny step sequencer (original tunes, E Phrygian-dominant) ---------- */
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  var TRACKS = {
    fight: {
      bpm: 132,
      bass: [[40, 0, 0, 40, 0, 0, 40, 0, 41, 0, 0, 41, 0, 0, 44, 0], [40, 0, 0, 40, 0, 0, 40, 0, 45, 0, 0, 45, 0, 44, 41, 0],
        [45, 0, 0, 45, 0, 0, 45, 0, 44, 0, 0, 44, 0, 0, 41, 0], [40, 0, 0, 40, 0, 41, 0, 44, 45, 0, 44, 0, 41, 0, 40, 0]],
      lead: [[76, 0, 77, 0, 80, 0, 77, 76, 77, 0, 0, 76, 74, 0, 76, 0], [80, 0, 81, 0, 80, 77, 0, 76, 77, 0, 76, 0, 74, 72, 74, 0],
        [81, 0, 80, 0, 81, 83, 0, 81, 80, 0, 77, 0, 80, 0, 0, 0], [76, 77, 80, 77, 76, 0, 74, 0, 72, 74, 76, 0, 77, 0, 76, 0]],
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], hat: 2
    },
    menu: {
      bpm: 96,
      bass: [[40, 0, 0, 0, 0, 0, 47, 0, 0, 0, 0, 0, 45, 0, 0, 0], [41, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 44, 0, 0, 0],
        [45, 0, 0, 0, 0, 0, 52, 0, 0, 0, 0, 0, 48, 0, 0, 0], [40, 0, 0, 0, 0, 0, 44, 0, 0, 0, 0, 0, 41, 0, 0, 0]],
      lead: [[64, 0, 68, 0, 71, 0, 76, 0, 71, 0, 68, 0, 64, 0, 0, 0], [65, 0, 68, 0, 72, 0, 77, 0, 72, 0, 68, 0, 65, 0, 0, 0],
        [69, 0, 72, 0, 76, 0, 81, 0, 76, 0, 72, 0, 69, 0, 0, 0], [68, 0, 71, 0, 74, 0, 76, 0, 77, 0, 76, 0, 74, 0, 72, 0]],
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: 4
    }
  };
  var seq = { timer: null, step: 0, next: 0 };
  A.playMusic = function (name) {
    if (!A.ctx) { A.pendingTrack = name; return; }
    if (A.track === name) return;
    A.stopMusic();
    A.track = name;
    var tr = TRACKS[name]; if (!tr) return;
    seq.step = 0; seq.next = A.ctx.currentTime + 0.1;
    var stepDur = 60 / tr.bpm / 4;
    seq.timer = setInterval(function () {
      if (!A.ctx) return;
      while (seq.next < A.ctx.currentTime + 0.15) {
        if (A.musicOn) playStep(tr, seq.step, seq.next, stepDur);
        seq.step = (seq.step + 1) % 64; seq.next += stepDur;
      }
    }, 30);
  };
  A.stopMusic = function () { if (seq.timer) clearInterval(seq.timer); seq.timer = null; A.track = null; };
  function playStep(tr, step, t, sd) {
    var bar = (step / 16) | 0, s = step % 16;
    var b = tr.bass[bar][s];
    if (b) { osc('sawtooth', mtof(b), mtof(b), t, sd * 1.8, 0.35, A.music); osc('sine', mtof(b - 12), mtof(b - 12), t, sd * 2, 0.5, A.music); }
    var l = tr.lead[bar][s];
    if (l) { osc('square', mtof(l), mtof(l), t, sd * 1.6, 0.13, A.music); osc('triangle', mtof(l + 12), mtof(l + 12), t, sd * 1.2, 0.06, A.music); }
    if (tr.kick[s]) osc('sine', 150, 40, t, 0.14, 0.9, A.music);
    if (tr.snare[s]) noise(t, 0.12, 0.45, 'highpass', 1500, null, 0.7, A.music);
    if (s % tr.hat === 0) noise(t, 0.03, 0.18, 'highpass', 7000, null, 0.7, A.music);
  }

  /* ---------- announcer (browser speech synthesis, optional) ---------- */
  var voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return null;
    var vs = window.speechSynthesis.getVoices() || [];
    var pref = vs.filter(function (v) { return /en[-_](US|GB)/i.test(v.lang) && /male|daniel|fred|alex|google uk english male/i.test(v.name); });
    return pref[0] || vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
  }
  if (window.speechSynthesis) { try { window.speechSynthesis.onvoiceschanged = function () { voice = pickVoice(); }; } catch (e) { /* ignore */ } }
  A.say = function (text, opts) {
    if (!A.voiceOn || !window.speechSynthesis) return;
    try {
      opts = opts || {};
      if (opts.interrupt !== false) window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      if (!voice) voice = pickVoice();
      if (voice) u.voice = voice;
      u.rate = opts.rate || 0.95; u.pitch = opts.pitch || 0.55; u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch (e) { /* speech not available */ }
  };
})();
