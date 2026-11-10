/**
 * audio.js
 * Sintetizador retro de 8 bits usando Web Audio API nativo.
 * No requiere archivos externos (.mp3 / .wav) y evita problemas de CORS.
 */

window.AudioEngine = (function () {
  let ctx = null;
  let muted = false;

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function playTone(freq, type, duration, vol = 0.08, delay = 0, slideTo = null) {
    if (muted) return;
    const c = getContext();
    if (!c) return;

    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = type || 'square';
    osc.frequency.setValueAtTime(Math.max(20, freq), now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  return {
    isMuted: function () {
      return muted;
    },

    toggleMute: function () {
      muted = !muted;
      if (!muted) {
        this.playSelect();
      }
      return muted;
    },

    // Bip de texto estilo RPG retro
    playTextBlip: function (speaker) {
      if (muted) return;
      let baseFreq = 320;
      if (speaker === 'jtp') baseFreq = 235;
      else if (speaker === 'ayudante') baseFreq = 390;
      else if (speaker === 'alerta') baseFreq = 510;

      const jitter = (Math.random() - 0.5) * 40;
      playTone(baseFreq + jitter, 'square', 0.03, 0.032);
    },

    // Sonido al elegir opción o botón RPG
    playSelect: function () {
      playTone(440, 'square', 0.055, 0.065, 0);
      playTone(660, 'square', 0.085, 0.065, 0.05);
    },

    // Sonido de rotación de perilla, tornillo de Fortín o rama de mercurio
    playDialTick: function (fine = true) {
      const freq = fine ? 700 : 460;
      playTone(freq, 'triangle', 0.025, 0.055, 0);
    },

    // Giro de llave de vidrio esmerilado (Ampolla de Regnault o Kipp)
    playValve: function () {
      playTone(280, 'triangle', 0.07, 0.08, 0, 520);
      playTone(540, 'sine', 0.05, 0.06, 0.07, 310);
    },

    // Burbujeo de gas (Kipp, tren lavador o campana de Víctor Meyer)
    playBubble: function () {
      playTone(210, 'sine', 0.08, 0.07, 0, 580);
      playTone(260, 'sine', 0.09, 0.07, 0.11, 690);
      playTone(310, 'sine', 0.08, 0.06, 0.22, 760);
    },

    // Motor de bomba de vacío rotatoria
    playPump: function () {
      for (let i = 0; i < 5; i++) {
        playTone(95 + (i % 2) * 18, 'sawtooth', 0.07, 0.05, i * 0.08, 70);
      }
      playTone(480, 'sine', 0.14, 0.06, 0.42);
    },

    // Bip de estabilización de balanza analítica
    playBalanceBeep: function () {
      playTone(880, 'sine', 0.08, 0.08, 0);
      playTone(1318.5, 'sine', 0.18, 0.08, 0.09);
    },

    // Encendido de mechero Bunsen / calefacción
    playFlame: function () {
      playTone(150, 'sawtooth', 0.15, 0.07, 0, 340);
      playTone(280, 'triangle', 0.18, 0.06, 0.1, 180);
    },

    // Caída de ampollita de vidrio o toque de varilla
    playGlassClink: function () {
      playTone(1480, 'sine', 0.06, 0.07, 0);
      playTone(2120, 'sine', 0.11, 0.06, 0.05);
    },

    // Registro de punto experimental en la libreta
    playRecordPoint: function () {
      playTone(523.25, 'triangle', 0.06, 0.07, 0);
      playTone(783.99, 'square', 0.09, 0.07, 0.06);
    },

    // Sonido de error o advertencia
    playError: function () {
      playTone(195, 'sawtooth', 0.14, 0.085, 0, 130);
      playTone(145, 'sawtooth', 0.22, 0.085, 0.14, 95);
    },

    // Fanfarria retro de logro / finalización de etapa o TP
    playFanfare: function () {
      const notes = [
        { f: 523.25, d: 0.10, t: 0.00 }, // C5
        { f: 523.25, d: 0.10, t: 0.11 }, // C5
        { f: 523.25, d: 0.10, t: 0.22 }, // C5
        { f: 523.25, d: 0.24, t: 0.33 }, // C5
        { f: 415.30, d: 0.22, t: 0.59 }, // G#4
        { f: 466.16, d: 0.22, t: 0.83 }, // A#4
        { f: 523.25, d: 0.15, t: 1.07 }, // C5
        { f: 466.16, d: 0.09, t: 1.25 }, // A#4
        { f: 523.25, d: 0.45, t: 1.36 }  // C5
      ];
      notes.forEach(n => playTone(n.f, 'square', n.d, 0.075, n.t));
    }
  };
})();
