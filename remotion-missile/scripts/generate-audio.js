// Procedural audio generator - creates WAV files for the missile defense video
// Run: node scripts/generate-audio.js

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
const outDir = path.join(__dirname, "..", "public");

// ── WAV file writer ──
function writeWav(filename, samples) {
  const numSamples = samples.length;
  const byteRate = SAMPLE_RATE * 2; // 16-bit mono
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(val * 32767), 44 + i * 2);
  }

  const filepath = path.join(outDir, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Created: ${filepath} (${(dataSize / 1024).toFixed(0)} KB, ${(numSamples / SAMPLE_RATE).toFixed(1)}s)`);
}

// ── Audio synthesis helpers ──
function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function noise() {
  return Math.random() * 2 - 1;
}

function envelope(t, attack, sustain, release, total) {
  if (t < attack) return t / attack;
  if (t < attack + sustain) return 1;
  if (t < total) return 1 - (t - attack - sustain) / release;
  return 0;
}

function lowPass(samples, cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  const out = new Float64Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    out[i] = out[i - 1] + alpha * (samples[i] - out[i - 1]);
  }
  return out;
}

// ── 1. Horror drone (30s) ──
// Deep rumbling bass + dissonant overtones + subtle pulsing
function generateDrone() {
  const duration = 30;
  const len = SAMPLE_RATE * duration;
  const samples = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    // Fade in/out
    const env =
      t < 2 ? t / 2 : t > duration - 3 ? (duration - t) / 3 : 1;

    // Deep bass drone (40-50Hz)
    const bass = sine(42, t) * 0.3 + sine(48, t) * 0.15;

    // Dissonant mid (tritone intervals, 100-150Hz)
    const mid =
      sine(100, t) * 0.08 +
      sine(141, t) * 0.06 + // tritone
      sine(113, t) * 0.05;

    // Very slow LFO for pulsing dread
    const lfo = 0.7 + 0.3 * sine(0.3, t);

    // Subtle filtered noise for texture
    const n = noise() * 0.03;

    // Sub-bass throb
    const sub = sine(28, t) * 0.15 * (0.6 + 0.4 * sine(0.5, t));

    samples[i] = (bass + mid + sub + n) * lfo * env * 0.7;
  }

  // Low-pass filter for warmth
  const filtered = lowPass(samples, 400);
  writeWav("drone.wav", filtered);
}

// ── 2. Alert siren (4s, designed to loop) ──
function generateSiren() {
  const duration = 4;
  const len = SAMPLE_RATE * duration;
  const samples = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    // Rising/falling siren frequency 400-800Hz
    const freq = 400 + 400 * (0.5 + 0.5 * sine(0.5, t));
    const siren = sine(freq, t) * 0.25;

    // Harsh overtone
    const overtone = sine(freq * 2.01, t) * 0.08;

    // Pulsing
    const pulse = 0.7 + 0.3 * Math.abs(sine(3, t));

    samples[i] = (siren + overtone) * pulse;
  }

  writeWav("siren.wav", samples);
}

// ── 3. Missile launch (5s) ──
function generateLaunch() {
  const duration = 5;
  const len = SAMPLE_RATE * duration;
  const raw = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    // Build-up envelope
    const env = Math.min(1, t / 0.5) * (t > 4 ? (5 - t) : 1);

    // Rumble: filtered noise
    const rumble = noise() * 0.4;

    // Low roar
    const roar = sine(60 + t * 15, t) * 0.2 + sine(90 + t * 20, t) * 0.1;

    // Crackle (random high-freq bursts)
    const crackle = (Math.random() < 0.05 ? noise() * 0.3 : 0);

    // Rising whoosh
    const whoosh = sine(200 + t * 100, t) * 0.05 * Math.min(1, t);

    raw[i] = (rumble + roar + crackle + whoosh) * env;
  }

  const filtered = lowPass(raw, 2000);
  writeWav("launch.wav", filtered);
}

// ── 4. Missile travel whoosh (8s) ──
function generateWhoosh() {
  const duration = 8;
  const len = SAMPLE_RATE * duration;
  const raw = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = t < 0.5 ? t / 0.5 : t > 7 ? (8 - t) : 1;

    // Steady high-pitched whine (rising pitch = increasing speed)
    const whine = sine(800 + t * 50, t) * 0.08;
    const whine2 = sine(1200 + t * 30, t) * 0.04;

    // Wind/air noise
    const wind = noise() * 0.1;

    // Low rumble
    const rumble = sine(50, t) * 0.12 + sine(75, t) * 0.06;

    // Doppler-like pulsation
    const pulse = 0.8 + 0.2 * sine(2, t);

    raw[i] = (whine + whine2 + wind + rumble) * env * pulse;
  }

  const filtered = lowPass(raw, 3000);
  writeWav("whoosh.wav", filtered);
}

// ── 5. Explosion (4s) ──
function generateExplosion() {
  const duration = 4;
  const len = SAMPLE_RATE * duration;
  const raw = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;

    // Sharp attack, exponential decay
    const env = t < 0.01 ? t / 0.01 : Math.exp(-t * 2.5);

    // Heavy noise burst
    const blast = noise() * 0.9;

    // Deep boom
    const boom = sine(30, t) * 0.5 * Math.exp(-t * 1.5);
    const boom2 = sine(55, t) * 0.3 * Math.exp(-t * 2);

    // Cracking debris sounds
    const crack =
      t > 0.1 && t < 2
        ? (Math.random() < 0.02 ? noise() * 0.4 * Math.exp(-(t - 0.1) * 3) : 0)
        : 0;

    // Rumbling tail
    const tail = noise() * 0.15 * Math.exp(-t * 1.2) * (t > 0.05 ? 1 : 0);

    raw[i] = (blast + boom + boom2 + crack + tail) * env;
  }

  const filtered = lowPass(raw, 4000);
  writeWav("explosion.wav", filtered);
}

// ── 6. Debris impacts (6s) ──
function generateDebris() {
  const duration = 6;
  const len = SAMPLE_RATE * duration;
  const raw = new Float64Array(len);

  // Pre-compute random impact times
  const impacts = [];
  for (let t = 0.3; t < 5; t += 0.2 + Math.random() * 0.5) {
    impacts.push({
      time: t,
      intensity: 0.2 + Math.random() * 0.4,
      freq: 40 + Math.random() * 60,
    });
  }

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;

    // Overall envelope
    const env = t < 0.2 ? t / 0.2 : t > 5 ? (6 - t) : 1;

    // Whistling debris falling
    const whistle = sine(600 + 200 * sine(1.5, t), t) * 0.04 * Math.max(0, 1 - t / 4);

    // Metallic ringing
    const ring = sine(2000 + 500 * sine(0.7, t), t) * 0.02 * Math.max(0, 1 - t / 3);

    // Individual impacts
    for (const imp of impacts) {
      const dt = t - imp.time;
      if (dt >= 0 && dt < 0.3) {
        const impEnv = Math.exp(-dt * 20);
        sample += (noise() * 0.6 + sine(imp.freq, t) * 0.3) * impEnv * imp.intensity;
      }
    }

    // Background rumble
    const rumble = noise() * 0.03;

    raw[i] = (sample + whistle + ring + rumble) * env;
  }

  const filtered = lowPass(raw, 5000);
  writeWav("debris.wav", filtered);
}

// ── 7. Interceptor launch (3s) ──
function generateInterceptorLaunch() {
  const duration = 3;
  const len = SAMPLE_RATE * duration;
  const raw = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = t < 0.05 ? t / 0.05 : Math.exp(-t * 0.8);

    // Sharp hiss
    const hiss = noise() * 0.3;

    // Rising tone
    const tone = sine(300 + t * 500, t) * 0.15;

    // Pop at start
    const pop = t < 0.02 ? noise() * 0.5 : 0;

    raw[i] = (hiss + tone + pop) * env;
  }

  const filtered = lowPass(raw, 6000);
  writeWav("interceptor.wav", filtered);
}

// ── Generate all ──
console.log("Generating procedural audio files...\n");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

generateDrone();
generateSiren();
generateLaunch();
generateWhoosh();
generateExplosion();
generateDebris();
generateInterceptorLaunch();

console.log("\nDone! All audio files saved to public/");
