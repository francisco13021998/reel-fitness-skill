// Grow the skill's sound library with CC0 effects from Openverse (freesound et al.), so reels don't all sound the same.
// Usage: node fetch-sfx.cjs <categoria> "<búsqueda en inglés>" [max=2] [maxSeconds=4]
//   e.g. node fetch-sfx.cjs tension "suspense riser" 3 6
// Saves to ../assets/sfx/<categoria>-<slug>.mp3 (silence trimmed, loudness evened) and records credits in ../assets/sfx/credits.json.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const [cat, query, maxArg, secArg] = process.argv.slice(2);
if (!cat || !query) { console.error('usage: node fetch-sfx.cjs <categoria> "<query>" [max] [maxSeconds]'); process.exit(1); }
const MAX = +(maxArg || 2), MAXS = +(secArg || 4);
const DIR = path.join(__dirname, "../assets/sfx");
const credFile = path.join(DIR, "credits.json");
const credits = fs.existsSync(credFile) ? JSON.parse(fs.readFileSync(credFile, "utf8")) : {};
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28);

(async () => {
  const url = `https://api.openverse.org/v1/audio/?q=${encodeURIComponent(query)}&license=cc0&page_size=20`;
  let j;
  for (let a = 0; a < 3 && !j; a++) {
    try { j = await (await fetch(url, { signal: AbortSignal.timeout(40000) })).json(); } catch (e) { console.error(`intento ${a + 1}: ${e.message}`); }
  }
  if (!j) process.exit(2);
  const picks = (j.results || []).filter((r) => r.url && r.duration && r.duration <= MAXS * 1000 && r.duration >= 250).slice(0, MAX);
  for (const r of picks) {
    const name = `${cat}-${slug(r.title)}`;
    const out = path.join(DIR, `${name}.mp3`);
    if (fs.existsSync(out)) { console.log(`ya existe ${name}`); continue; }
    const tmp = path.join(DIR, `_tmp_${Date.now()}`);
    try {
      const buf = Buffer.from(await (await fetch(r.url, { signal: AbortSignal.timeout(60000) })).arrayBuffer());
      fs.writeFileSync(tmp, buf);
      // trim leading silence, even out loudness, mono 44.1 kHz mp3
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tmp, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "1", "-b:a", "160k", out]);
      const dur = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], { encoding: "utf8" }).trim();
      credits[name] = { title: r.title, creator: r.creator, license: `${r.license} ${r.license_version || ""}`.trim(), source: r.foreign_landing_url, duration: +dur.toFixed(2) };
      console.log(`ok ${name} (${dur.toFixed(2)} s) — ${r.title} / ${r.creator}`);
    } catch (e) { console.error(`fallo ${r.title}: ${e.message}`); }
    finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
  }
  fs.writeFileSync(credFile, JSON.stringify(credits, null, 1));
})();
