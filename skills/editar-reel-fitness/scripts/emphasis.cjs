// "Weight" moments baked into the A-roll: the picture turns grey and the voice is processed.
// Usage: node emphasis.cjs <proyecto> <t0-t1> [<t0-t1> ...] [--voz=eco|grave] [--sin-gris]
//   --voz=eco    natural pitch, clear echo repeats trailing the phrase (approved by the user for "no progresas")
//   --voz=grave  deeper, fuller, compressed, short slap echo
//   --sin-gris   keep the colour
// Always starts from assets/reel-original.mp4 (created on first run), so it can be re-run safely. Writes assets/reel.mp4.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const VOZ = (args.find((a) => a.startsWith("--voz=")) || "--voz=eco").slice(6);
const GRIS = !args.includes("--sin-gris");
const [proj, ...wins] = args.filter((a) => !a.startsWith("--"));
if (!proj || !wins.length) { console.error("usage: node emphasis.cjs <proyecto> <t0-t1> ... [--voz=eco|grave] [--sin-gris]"); process.exit(1); }
const P = path.resolve(proj);
const out = path.join(P, "assets/reel.mp4");
const first = path.join(P, "assets/reel-original.mp4");
if (!fs.existsSync(first)) fs.copyFileSync(out, first);
// start from the quality-pass output when enhance.cjs has run, otherwise from the untouched original
const orig = fs.existsSync(path.join(P, "assets/reel-base.mp4")) ? path.join(P, "assets/reel-base.mp4") : first;
const W = wins.map((w) => w.split("-").map(Number));
const sr = +execFileSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", orig], { encoding: "utf8" }).trim() || 48000;

// picture: saturation 1 → 0 in 0.1 s at t0, back to 1 over 0.15 s after t1
const sat = W.map(([a, b]) => `if(between(t,${a - 0.1},${a}),(${a}-t)/0.1,if(between(t,${a},${b}),0,if(between(t,${b},${b + 0.15}),(t-${b})/0.15,1)))`)
  .reduce((acc, r) => `min(${acc},${r})`, "1");
let fc = GRIS ? `[0:v]hue=s='${sat}'[v];` : `[0:v]null[v];`;

// voice: base track muted inside each window (20 ms ramps); processed copy of the window mixed back in
// eco (very soft, approved): one faint repeat at 240 ms, no compression/boost (avoids saturation); voice dips to 90 % for 0.3 s after so the echo repeats are heard, then recovers
const tail = (b) => (VOZ === "eco" ? `if(between(t,${b},${b + 0.3}),0.9,if(between(t,${b + 0.3},${b + 0.4}),0.9+0.1*(t-${b + 0.3})/0.1,1))` : `if(between(t,${b},${b + 0.02}),(t-${b})/0.02,1)`);
const mute = W.map(([a, b]) => `if(between(t,${a - 0.02},${a}),(${a}-t)/0.02,if(between(t,${a},${b}),0,${tail(b)}))`)
  .reduce((acc, r) => `min(${acc},${r})`, "1");
fc += `[0:a]volume='${mute}':eval=frame[base];`;
const F = 0.93;
const CHAIN = {
  grave: (d) => `asetrate=${Math.round(sr * F)},aresample=${sr},atempo=${(1 / F).toFixed(4)},bass=g=7:f=110,equalizer=f=2500:t=q:w=1:g=3,` +
    `acompressor=threshold=0.1:ratio=4:attack=5:release=80,volume=2.2,afade=t=in:d=0.02,afade=t=out:st=${(d - 0.03).toFixed(3)}:d=0.03,` +
    `apad=pad_dur=0.6,aecho=1.0:1.0:90|170:0.28|0.14,alimiter=limit=0.95:level=false`,
  eco: (d) => `highpass=f=90,volume=1.0,afade=t=in:d=0.02,afade=t=out:st=${(d - 0.03).toFixed(3)}:d=0.03,` +
    `apad=pad_dur=0.45,aecho=1.0:1.0:240:0.15,alimiter=limit=0.89:attack=5:release=50:level=false`,
};
const parts = ["[base]"];
W.forEach(([a, b], i) => {
  const ms = Math.round(a * 1000);
  fc += `[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,${(CHAIN[VOZ] || CHAIN.eco)(b - a)},adelay=${ms}|${ms}[fx${i}];`;
  parts.push(`[fx${i}]`);
});
fc += `${parts.join("")}amix=inputs=${parts.length}:duration=first:normalize=0[a]`;
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", orig, "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-g", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-ar", String(sr), out]);
console.log(`reel.mp4 rehecho: ${wins.join(", ")} · voz=${VOZ}${GRIS ? " · gris" : ""}`);
