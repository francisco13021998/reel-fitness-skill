// Only for RAW multi-clip input: build the cut A-roll from an edit decision list.
// Usage: node build-cut.cjs <projectDir>
// Reads  <project>/work/edl.json: [{ clip: N, s, e, line }]   (source seconds; `line` = spoken sentence index;
//        several pieces may share a line when a pause inside a sentence was removed)
//        <project>/work/tx/clipN.json   (from transcribe.cjs, one per clip)
//        <project>/assets/clips/clipN.mp4 (1080x1920 30 fps proxies)
// Writes <project>/assets/reel.mp4 and <project>/work/tx/words.json (words on the edited timeline)
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const P = path.resolve(process.argv[2] || ".");
const W = path.join(P, "work");
const edl = JSON.parse(fs.readFileSync(path.join(W, "edl.json"), "utf8"));
const tmp = path.join(W, "cut");
fs.mkdirSync(tmp, { recursive: true });
const tx = {};
const words = (n) => (tx[n] = tx[n] || JSON.parse(fs.readFileSync(path.join(W, `tx/clip${n}.json`), "utf8")).chunks.flatMap((c) => c.words));

const fr = (t) => Math.round(t * 30) / 30;
let t = 0;
const parts = [], out = [], segs = [];
edl.forEach((seg, i) => {
  const s = fr(seg.s), e = fr(seg.e), d = +(e - s).toFixed(4);
  const file = path.join(tmp, `p${String(i).padStart(3, "0")}.mp4`);
  const fade = Math.min(0.04, d / 4);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", s.toFixed(4), "-i", path.join(P, `assets/clips/clip${seg.clip}.mp4`), "-t", d.toFixed(4),
    "-af", `afade=t=in:d=${fade},afade=t=out:st=${(d - fade).toFixed(4)}:d=${fade}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-g", "15", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", file]);
  parts.push(file);
  for (const w of words(seg.clip)) {
    const mid = (w.s + w.e) / 2;
    if (mid >= s && mid <= e) out.push({ w: w.w, s: +(t + Math.max(0, w.s - s)).toFixed(3), e: +(t + Math.min(d, w.e - s)).toFixed(3), line: seg.line ?? i });
  }
  segs.push({ i, clip: seg.clip, src: [s, e], at: +t.toFixed(3), d });
  t += d;
});
fs.writeFileSync(path.join(tmp, "list.txt"), parts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(tmp, "list.txt"), "-c", "copy", path.join(P, "assets/reel.mp4")]);
fs.writeFileSync(path.join(W, "tx/words.json"), JSON.stringify({ duration: +t.toFixed(3), cuts: segs.map((x) => x.at), words: out }, null, 1));
console.log(`reel.mp4 ${t.toFixed(2)}s, ${segs.length} pieces, ${out.length} words`);
