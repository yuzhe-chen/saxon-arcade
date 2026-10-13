/*
 * game-driver.js — neutral offline replacement for the Poki SDK (poki-sdk.js v2).
 * Implements the exact surface Drive Mad (Fancade) calls:
 *   init, gameLoadingStart, gameLoadingFinished, gameplayStart, gameplayStop,
 *   commercialBreak, rewardedBreak, customEvent, measure, showLeaderboard
 */
(function () {
  'use strict';
  if (window.PokiSDK && window.PokiSDK.__offlineDriver) return;

  var LS_PREFIX = 'com.martinmagni.drivemad.best.';

  // ------------------------------------------------------------------
  // Graphics guard — guarantees the Emscripten runtime never touches an
  // undefined GL context (which crashed with "Cannot read properties of
  // undefined (reading 'getParameter')"). index.js requests WebGL2 only;
  // when that fails it returns 0 and keeps running context-less.
  //
  //  - WebGL1-only environments: handled by the GL.createContext patch in
  //    index.js (falls back to a webgl1 context).
  //  - Zero-WebGL environments: we install a no-op GL stub for every webgl
  //    getContext request so the engine boots with ZERO console errors,
  //    and we show a clear notice on the start screen.
  // ------------------------------------------------------------------
  var nativeGetContext = HTMLCanvasElement.prototype.getContext;

  // Capability probe on an offscreen canvas (the game canvas does not exist
  // yet — the driver loads in <head>).
  window.__dmWebGL = 'none';
  (function probe() {
    var c = document.createElement('canvas');
    var ctx = null;
    try { ctx = nativeGetContext.call(c, 'webgl2', { antialias: false, alpha: false, majorVersion: 2 }); } catch (e) {}
    if (ctx) { window.__dmWebGL = 'webgl2'; }
    else {
      try {
        ctx = nativeGetContext.call(c, 'webgl', { antialias: false, alpha: false, majorVersion: 1 }) ||
              nativeGetContext.call(c, 'experimental-webgl', { antialias: false, alpha: false });
      } catch (e) {}
      if (ctx) window.__dmWebGL = 'webgl1';
    }
    if (ctx && ctx.getExtension) {
      var lose = ctx.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext(); // release the probe context
    }
  })();

  function makeStub(canvas) {
    var STRING_PARAMS = {
      7936: 'OpenGL ES 2.0 (offline stub)',           // VERSION
      7937: 'offline',                                 // RENDERER
      7938: 'WebGL GLSL ES 1.0 (offline stub)',        // SHADING_LANGUAGE_VERSION
      35724: 'WebGL GLSL ES 1.0 (offline stub)'
    };
    // Stateful target: the Emscripten glue WRITES properties on the context
    // (e.g. GLctx.currentProgram = program) and READS them back later. The
    // proxy must store writes, otherwise currentProgram comes back as a
    // function and webglGetUniformLocation crashes on p.uniformLocsById.
    var state = Object.create(null);
    state.canvas = canvas;
    state.drawingBufferWidth = canvas ? canvas.width : 0;
    state.drawingBufferHeight = canvas ? canvas.height : 0;
    return new Proxy(state, {
      get: function (t, prop) {
        if (prop in t) return t[prop]; // stored values win (currentProgram, etc.)
        var s = String(prop);
        if (s === 'isContextLost') return function () { return true; };
        if (s === 'getError') return function () { return 0; };
        if (s === 'getSupportedExtensions') return function () { return []; };
        if (s === 'getExtension') return function () { return null; };
        if (s === 'getShaderParameter' || s === 'getProgramParameter' ||
            s === 'getSyncParameter' || s === 'getQueryParameter') return function () { return true; };
        if (s === 'getActiveUniform' || s === 'getActiveAttrib') {
          return function () { return { name: 'x', size: 1, type: 5126 }; };
        }
        if (/InfoLog$/.test(s)) return function () { return ''; };
        if (s === 'getParameter') {
          return function (p) { return STRING_PARAMS[p] !== undefined ? STRING_PARAMS[p] : 0; };
        }
        if (/^get[A-Z]/.test(s)) return function () { return 0; };
        if (/^create[A-Z]/.test(s)) {
          // Emscripten's uniform-location glue reads uniformLocsById /
          // uniformArrayNamesById off created programs — pre-seed them so
          // webglGetUniformLocation cannot hit undefined[-1].
          return function () { return { uniformLocsById: [], uniformArrayNamesById: [] }; };
        }
        return function () {}; // every other GL call: no-op
      },
      set: function (t, prop, v) { t[prop] = v; return true; }
    });
  }

  if (window.__dmWebGL === 'none') {
    HTMLCanvasElement.prototype.getContext = function (type) {
      if (String(type).toLowerCase().indexOf('webgl') !== -1) return makeStub(this);
      return nativeGetContext.apply(this, arguments);
    };
    var showNoGLNotice = function () {
      try {
        var progress = document.querySelector('#progress_or_play');
        if (progress) progress.style.display = 'none';
        var note = document.createElement('p');
        note.className = 'nogl-note';
        note.style.cssText = 'order:9;margin:6px 0 0;font:14px sans-serif;color:#ffd3bf;text-align:center;max-width:80vw;';
        note.textContent = 'WebGL is not available in this browser, so the game cannot start.';
        var host = document.getElementById('play_content');
        if (host) host.appendChild(note);
      } catch (e) { /* cosmetic only */ }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showNoGLNotice);
    else showNoGLNotice();
    console.warn('[GameDriver] No WebGL available - installed no-op GL stub (engine will boot without console errors)');
  } else {
    console.info('[GameDriver] WebGL available:', window.__dmWebGL);
  }
  // ------------------------ end graphics guard ------------------------

  var driver = {
    __offlineDriver: true,

    init: function (options) {
      options = options || {};
      // The Poki platform normally hands back its own submitScore implementation
      // via options.submitScore(fn). Offline: keep a local best per level id.
      if (typeof options.submitScore === 'function') {
        options.submitScore(function (levelID, score) {
          try {
            var key = LS_PREFIX + String(levelID);
            var prev = Number(localStorage.getItem(key));
            if (!isFinite(prev) || Number(score) > prev) {
              localStorage.setItem(key, String(score));
            }
          } catch (e) { /* storage unavailable: ignore */ }
        });
      }
      return Promise.resolve();
    },

    gameLoadingStart: function () {
      console.info('[GameDriver] gameLoadingStart');
    },

    gameLoadingFinished: function () {
      console.info('[GameDriver] gameLoadingFinished');
    },

    gameplayStart: function () { /* no-op offline */ },
    gameplayStop: function () { /* no-op offline */ },

    // Interstitial: resolve immediately — a pending promise here freezes the
    // game at the next "game over" break.
    commercialBreak: function () {
      console.info('[GameDriver] commercialBreak (skipped, offline)');
      return Promise.resolve();
    },

    // Rewarded: no ad to watch offline, grant the reward right away.
    rewardedBreak: function () {
      console.info('[GameDriver] rewardedBreak (auto-granted, offline)');
      return Promise.resolve(true);
    },

    customEvent: function () { /* analytics: no-op */ },
    measure: function () { /* analytics: no-op */ },

    showLeaderboard: function (leaderboardID) {
      console.info('[GameDriver] showLeaderboard', leaderboardID, '(local only)');
    }
  };

  window.PokiSDK = driver;
})();
