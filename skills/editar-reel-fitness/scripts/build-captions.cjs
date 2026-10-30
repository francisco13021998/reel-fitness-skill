// Build <project>/assets/captions.json from the Whisper words + plan.json fixes/keywords.
// Usage: node build-captions.cjs <projectDir>
// Words source (first found): work/tx/words.json (cut flow, edited timeline) or work/tx/reel.json (pre-cut reel).
// plan.json fields used:
//   "fixes":    [[from, to, prevStartsWith?], ...]  exact-word replacements (Whisper mishearings),
//               optional 3rd item = the previous word must start with it (context guard)
//   "keywords": ["dinero", "cafeína", ...]           words shown in blue + harder bounce (case/punctuation-insensitive)
const fs = require("fs");
const path = require("path");

const P = path.resolve(process.argv[2] || ".");
const plan = JSON.parse(fs.readFileSync(path.join(P, "plan.json"), "utf8"));
const cutFile = path.join(P, "work/tx/words.json");
const reelFile = path.join(P, "work/tx/reel.json");
let words, duration;
if (fs.existsSync(cutFile)) {
  const j = JSON.parse(fs.readFileSync(cutFile, "utf8"));
  words = j.words; duration = j.duration;
} else {
  const j = JSON.parse(fs.readFileSync(reelFile, "utf8"));
  words = j.chunks.flatMap((c) => c.words); duration = j.duration;
}
words = words.map((w) => ({ w: w.w, s: w.s, e: w.e }));

const orig = words.map((w) => w.w);
for (const [from, to, prev] of plan.fixes || []) {
  words.forEach((w, i) => {
    if (orig[i] !== from) return;
    if (prev && !(i > 0 && orig[i - 1].startsWith(prev))) return;
    w.w = to;
  });
}
words = words.filter((w) => w.w !== "");

const norm = (s) => s.toLowerCase().replace(/[.,:;!?¡¿"]/g, "");
const KEY = new Set((plan.keywords || []).map(norm));
for (let i = 0; i < words.length; i++) {
  words[i].k = KEY.has(norm(words[i].w)) ? 1 : 0;
  if (i + 1 < words.length) words[i].e = Math.min(words[i].e, words[i + 1].s);
  words[i].s = +words[i].s.toFixed(3);
  words[i].e = +Math.max(words[i].e, words[i].s + 0.1).toFixed(3);
  if (i && words[i].s < words[i - 1].s + 0.02) words[i].s = +(words[i - 1].s + 0.02).toFixed(3);
}
fs.writeFileSync(path.join(P, "assets/captions.json"), JSON.stringify({ duration, words }, null, 1));
console.log(words.map((w) => (w.k ? w.w.toUpperCase() : w.w)).join(" "));
