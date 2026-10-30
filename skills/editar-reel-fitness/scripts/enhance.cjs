// Quality pass on the A-roll (run BEFORE emphasis.cjs): voice EQ + de-esser + two-pass loudness to -14 LUFS / -1 dBTP.
// Video is left untouched — stream copy, no sharpening, no recompression, no color grading.
// Usage: node enhance.cjs <proyecto>
//   reads assets/reel-original.mp4 (created from assets/reel.mp4 on first run) → writes assets/reel-base.mp4 and assets/reel.mp4
// No noise reduction on purpose: CapCut exports usually carry a music bed under the voice and denoise would smear it.
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const P = path.resolve(process.argv[2] || ".");
const orig = path.join(P, "assets/reel-original.mp4"), base = path.join(P, "assets/reel-base.mp4"), out = path.join(P, "assets/reel.mp4");
if (!fs.existsSync(orig)) fs.copyFileSync(out, orig);

const EQ = "highpass=f=60,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1.2:g=2.5,highshelf=f=9000:g=1.5,deesser=i=0.4";
// pass 1: measure
const m = spawnSync("ffmpeg", ["-hide_banner", "-i", orig, "-af", `${EQ},loudnorm=I=-14:TP=-1:LRA=7:print_format=json`, "-f", "null", "-"], { encoding: "utf8" }).stderr;
const j = JSON.parse(m.slice(m.lastIndexOf("{"), m.lastIndexOf("}") + 1));
const ln = `loudnorm=I=-14:TP=-1:LRA=7:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
// pass 2: apply
const sr = execFileSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", orig], { encoding: "utf8" }).trim() || "48000";
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", orig, "-af", `${EQ},${ln}`, "-ar", sr,
  "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", base]);
fs.copyFileSync(base, out);
console.log(`reel-base.mp4 listo: voz ecualizada, de-esser, ${j.input_i} → -14 LUFS (pico ≤ -1 dBTP); vídeo sin tocar`);
