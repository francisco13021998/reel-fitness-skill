// Word-level Spanish transcription with whisper.cpp (large-v3-turbo + DTW timing).
// Splits the audio at silences and transcribes each utterance on its own through a local
// whisper-server, which avoids Whisper merging repeated takes and smearing timestamps.
//
// Usage: node transcribe.cjs <audio.wav 16k mono> <out.json> [silenceSeconds=0.3]
// Output: { duration, chunks: [{ k, s, e, text, words: [{ w, s, e, p }] }] }  (absolute seconds)
const { execFileSync, spawnSync, spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const [wav, outFile, silArg] = process.argv.slice(2);
if (!wav || !outFile) { console.error("usage: node transcribe.cjs <audio.wav> <out.json> [silence]"); process.exit(1); }
const SIL = silArg || "0.3";
const MODELS = path.join(os.homedir(), ".cache/hyperframes/whisper/models");
const MODEL = path.join(MODELS, "ggml-large-v3-turbo.bin");
const PORT = 8178;
const tmp = path.join(path.dirname(path.resolve(outFile)), "chunks");
fs.mkdirSync(tmp, { recursive: true });

const serverExe = [path.join(os.homedir(), "scoop/apps/whisper-cpp/current/whisper-server.exe")].find((p) => fs.existsSync(p)) || "whisper-server";

async function up() { try { await fetch(`http://127.0.0.1:${PORT}/`); return true; } catch { return false; } }
async function transcribe(file) {
  const fd = new FormData();
  fd.append("file", new Blob([fs.readFileSync(file)]), path.basename(file));
  fd.append("response_format", "verbose_json");
  fd.append("temperature", "0");
  const r = await fetch(`http://127.0.0.1:${PORT}/inference`, { method: "POST", body: fd, signal: AbortSignal.timeout(120000) });
  return r.json();
}

(async () => {
  if (!fs.existsSync(MODEL)) throw new Error(`Missing model ${MODEL}. Download: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin`);
  let server = null;
  if (!(await up())) {
    // greedy decoding, no temperature fallback: avoids hallucination loops on noise chunks
    server = spawn(serverExe, ["-m", MODEL, "-l", "es", "-t", String(Math.max(4, os.cpus().length - 4)), "-bs", "1", "-bo", "1", "-nf", "-mc", "0", "-sns", "-dtw", "large.v3.turbo", "--port", String(PORT)], { stdio: "ignore" });
    for (let i = 0; i < 120 && !(await up()); i++) await new Promise((r) => setTimeout(r, 1000));
  }
  try {
    const log = spawnSync("ffmpeg", ["-hide_banner", "-i", wav, "-af", `silencedetect=noise=-35dB:d=${SIL}`, "-f", "null", "-"], { encoding: "utf8" }).stderr;
    const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(log).slice(1).reduce((a, v, i) => a + parseFloat(v) * [3600, 60, 1][i], 0);
    const sil = [];
    const re = /silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g;
    let m;
    while ((m = re.exec(log))) sil.push([parseFloat(m[1]), parseFloat(m[2])]);
    let regions = [];
    let cur = 0;
    for (const [s, e] of sil) { if (s > cur) regions.push([cur, s]); cur = e; }
    if (cur < dur) regions.push([cur, dur]);
    regions = regions.filter(([s, e]) => e - s >= 0.25);
    const chunks = [];
    for (let k = 0; k < regions.length; k++) {
      const [s, e] = regions[k];
      const ps = Math.max(0, s - 0.15), pe = Math.min(dur, e + 0.15);
      const cw = path.join(tmp, `c${k}.wav`);
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", ps.toFixed(3), "-to", pe.toFixed(3), "-i", wav, cw]);
      const words = [];
      try {
        const j = await transcribe(cw);
        for (const seg of j.segments || []) for (const w of seg.words || []) {
          const txt = w.word;
          if (/^\s*\[/.test(txt) || !txt.trim()) continue;
          const abs = { w: txt.trim(), s: +(ps + w.start).toFixed(3), e: +(ps + w.end).toFixed(3), p: +(w.probability || 0).toFixed(2) };
          // merge sub-word pieces (" rend" + "ir") using the leading space
          if (!/^\s/.test(txt) && words.length) { const last = words[words.length - 1]; last.w += txt.trim(); last.e = abs.e; }
          else words.push(abs);
        }
      } catch (err) { console.error(`chunk ${k}: ${err.message}`); }
      const text = words.map((x) => x.w).join(" ");
      chunks.push({ k, s: +s.toFixed(3), e: +e.toFixed(3), text, words });
      console.log(`#${k} [${s.toFixed(2)}-${e.toFixed(2)}] ${text}`);
    }
    fs.writeFileSync(outFile, JSON.stringify({ duration: +dur.toFixed(3), chunks }, null, 1));
  } finally {
    if (server) server.kill();
  }
})();
