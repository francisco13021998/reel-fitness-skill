// Inventory and prepare every clip/image in the user's reel folder, and match file names to the transcript.
//
//   node assets.cjs scan <carpetaUsuario> <proyecto>
//     Probes every video/image (recursively), copies/transcodes it into <proyecto>/assets/media/,
//     and writes <proyecto>/work/assets.json. Talking clips (lots of speech) are flagged as A-roll candidates.
//   node assets.cjs match <proyecto>
//     Reads work/assets.json + the transcript (work/tx/words.json or work/tx/reel.json) and suggests,
//     for each B-roll file, the moments where words from its file name are spoken.
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const VID = /\.(mp4|mov|m4v|webm|mkv|avi)$/i;
const IMG = /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i;
const STOP = new Set(["de", "la", "el", "los", "las", "y", "en", "con", "un", "una", "del", "al", "para", "por", "img", "vid", "video", "clip", "foto", "image", "imagen", "copy", "final", "editado"]);
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokens = (name) => fold(path.basename(name, path.extname(name))).split(/[^a-z0-9ñ]+/).filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t) && t.length > 2);
const slug = (name) => fold(path.basename(name, path.extname(name))).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "media";

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/editado|node_modules|^\./i.test(e.name)) walk(p, out); }
    else if (VID.test(e.name) || IMG.test(e.name)) out.push(p);
  }
  return out;
}

function probe(file) {
  const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file], { encoding: "utf8" }));
  const v = j.streams.find((s) => s.codec_type === "video") || {};
  const a = j.streams.find((s) => s.codec_type === "audio");
  let w = v.width, h = v.height;
  const rot = Math.abs(+((v.side_data_list || []).find((d) => d.rotation !== undefined) || {}).rotation || +(v.tags || {}).rotate || 0);
  if (rot === 90 || rot === 270) [w, h] = [h, w];
  return { w, h, dur: +(j.format.duration || 0), hasAudio: !!a, fps: v.r_frame_rate };
}

function speechRatio(file, dur) {
  if (!dur) return 0;
  const log = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-vn", "-af", "silencedetect=noise=-35dB:d=0.5", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  let sil = 0;
  const re = /silence_duration: ([\d.]+)/g;
  let m;
  while ((m = re.exec(log))) sil += +m[1];
  return +Math.max(0, 1 - sil / dur).toFixed(2);
}

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === "scan") {
  const src = path.resolve(a1), P = path.resolve(a2);
  const media = path.join(P, "assets/media");
  fs.mkdirSync(media, { recursive: true });
  fs.mkdirSync(path.join(P, "work"), { recursive: true });
  const used = new Set();
  const list = walk(src).sort((x, y) => x.localeCompare(y, "es", { numeric: true })).map((file) => {
    const kind = VID.test(file) ? "video" : "image";
    const info = probe(file);
    let base = slug(file);
    while (used.has(base)) base += "-b";
    used.add(base);
    const item = { file, name: path.basename(file), kind, ...info, tokens: tokens(file) };
    if (kind === "video") {
      item.speech = info.hasAudio ? speechRatio(file, info.dur) : 0;
      item.aroll = item.speech >= 0.45 && info.dur >= 6;
      // B-roll proxy: fits inside 1080x1920, 30 fps, H.264, short GOP, no audio (A-roll is prepared separately)
      item.src = `assets/media/${base}.mp4`;
      if (!item.aroll) execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", file, "-vf", "scale='min(1080,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-g", "15", "-pix_fmt", "yuv420p", "-an", path.join(P, item.src)]);
    } else {
      const ext = /\.(jpe?g|png|webp|gif)$/i.test(file) ? path.extname(file).toLowerCase() : ".jpg";
      item.src = `assets/media/${base}${ext}`;
      if (ext === path.extname(file).toLowerCase()) fs.copyFileSync(file, path.join(P, item.src));
      else execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", file, "-frames:v", "1", path.join(P, item.src)]);
    }
    item.orientation = item.w && item.h ? (item.h > item.w * 1.15 ? "vertical" : item.w > item.h * 1.15 ? "horizontal" : "cuadrada") : "?";
    return item;
  });
  fs.writeFileSync(path.join(P, "work/assets.json"), JSON.stringify(list, null, 1));
  for (const it of list) console.log(`${it.aroll ? "A-ROLL " : it.kind === "video" ? "B-ROLL " : "IMAGEN "} ${it.name}  ${it.w}x${it.h} ${it.orientation}${it.dur && it.kind === "video" ? ` ${it.dur.toFixed(1)}s` : ""}${it.kind === "video" ? ` voz=${it.speech}` : ""}  -> ${it.src}  [${it.tokens.join(", ")}]`);
} else if (cmd === "match") {
  const P = path.resolve(a1);
  const list = JSON.parse(fs.readFileSync(path.join(P, "work/assets.json"), "utf8"));
  const cutF = path.join(P, "work/tx/words.json"), reelF = path.join(P, "work/tx/reel.json");
  const words = fs.existsSync(cutF) ? JSON.parse(fs.readFileSync(cutF, "utf8")).words : JSON.parse(fs.readFileSync(reelF, "utf8")).chunks.flatMap((c) => c.words);
  const W = words.map((w) => ({ ...w, f: fold(w.w).replace(/[^a-z0-9ñ]/g, "") }));
  const stem = (t) => t.slice(0, Math.max(4, Math.min(6, t.length - 1)));
  for (const it of list.filter((x) => !x.aroll)) {
    const hits = [];
    for (const t of it.tokens) for (const w of W) if (w.f && (w.f === t || (t.length >= 4 && w.f.startsWith(t)) || (t.length > 4 && w.f.startsWith(stem(t))))) hits.push({ t: w.s, word: w.w });
    hits.sort((x, y) => x.t - y.t);
    it.matches = hits.filter((h, i) => i === 0 || h.t - hits[i - 1].t > 0.8).slice(0, 6);
    console.log(`${it.name}: ${it.matches.length ? it.matches.map((h) => `${h.t.toFixed(2)}s "${h.word}"`).join(", ") : "sin coincidencias por nombre (decide por contenido: mira un fotograma)"}`);
  }
  fs.writeFileSync(path.join(P, "work/assets.json"), JSON.stringify(list, null, 1));
} else if (cmd === "overlays") {
  // Detect images/text the user already embedded in the A-roll (e.g. study screenshots added in CapCut):
  // the face/torso band (y 420-1120) suddenly changes brightness for a sustained stretch.
  const P = path.resolve(a1);
  const vid = path.join(P, "assets/reel.mp4");
  const band = (crop) => {
    const log = spawnSync("ffmpeg", ["-hide_banner", "-i", vid, "-vf", `crop=${crop},fps=10,signalstats,metadata=print:key=lavfi.signalstats.YAVG`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 }).stderr;
    const ys = [...log.matchAll(/YAVG=([\d.]+)/g)].map((m) => +m[1]);
    const med = ys.slice().sort((x, y) => x - y)[Math.floor(ys.length / 2)];
    return { ts: [...log.matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]), dev: ys.map((y) => Math.abs(y - med)) };
  };
  const top = band("1080:420:0:0"), mid = band("1080:700:0:420");
  const ts = mid.ts;
  const on = mid.dev.map((d, i) => d > 18 || (top.dev[i] || 0) > 22);
  const wins = [];
  let st = null;
  on.forEach((v, i) => {
    if (v && st === null) st = ts[i];
    if ((!v || i === on.length - 1) && st !== null) { const en = ts[i]; if (en - st >= 0.6) wins.push([+st.toFixed(2), +en.toFixed(2)]); st = null; }
  });
  fs.writeFileSync(path.join(P, "work/overlays.json"), JSON.stringify(wins));
  console.log(wins.length ? `Posibles imágenes ya insertadas en el A-roll (verifícalo con un fotograma): ${wins.map(([a, b]) => `${a}-${b}s`).join(", ")}` : "No se detectan imágenes insertadas en el A-roll.");
} else {
  console.error("usage: node assets.cjs scan <carpeta> <proyecto> | match <proyecto> | overlays <proyecto>");
  process.exit(1);
}
