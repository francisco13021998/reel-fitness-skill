// Final audio master on the rendered MP4: two-pass loudness to -14 LUFS / -1 dBTP (Instagram/TikTok target).
// The render's own limiter usually lands around -16 LUFS once SFX are mixed in. Video stream is copied (no re-encode).
// Usage: node master.cjs "<render>.mp4"   → replaces the file in place (via a temp file)
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const inp = path.resolve(process.argv[2]);
const m = spawnSync("ffmpeg", ["-hide_banner", "-i", inp, "-af", "loudnorm=I=-14:TP=-1:LRA=9:print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const j = JSON.parse(m.slice(m.lastIndexOf("{"), m.lastIndexOf("}") + 1));
const ln = `loudnorm=I=-14:TP=-1:LRA=9:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
const tmp = inp.replace(/\.mp4$/i, ".master-tmp.mp4");
const sr = execFileSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", inp], { encoding: "utf8" }).trim() || "48000";
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", inp, "-c:v", "copy", "-af", ln, "-ar", sr, "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", tmp]);
fs.renameSync(tmp, inp);
console.log(`masterizado: ${j.input_i} → -14 LUFS, pico ≤ -1 dBTP (${path.basename(inp)})`);
