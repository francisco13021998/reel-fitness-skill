// Generate <project>/index.html (HyperFrames composition) from plan.json + assets/captions.json.
// Usage: node build-reel.cjs <projectDir>
// See ../SKILL.md for the plan.json schema and ../plan.example.json for a full example.
const fs = require("fs");
const path = require("path");
const { ART } = require("./art.cjs");
const GFX = require("./graphics.cjs");

const P = path.resolve(process.argv[2] || ".");
const plan = JSON.parse(fs.readFileSync(path.join(P, "plan.json"), "utf8"));
const cap = JSON.parse(fs.readFileSync(path.join(P, "assets/captions.json"), "utf8"));
const DUR = +plan.duration;
const HOOK = plan.hook;
const S = plan.stickers || [];
const CAM = plan.cam || [[0, 1, 0, "none"]];
const SHAKE = plan.shakes || [];
const FLASH = plan.flashes || [];
const RINGS = plan.rings || [];
const REDS = plan.reds || [];
const CAPSHAKE = plan.capShakes || [];
const STAMPS = plan.stamps || [];
// Callouts: big centred phrase with an icon that slams in (e.g. "NO PROGRESAS" + red X). Captions are hidden meanwhile.
// { t0, t1, text, icon: "cross" | "check" | "warning", top?: 1120 (below the chin even with a 1.3 zoom), textAt?: seconds }
const CALLOUTS = plan.callouts || [];
// Icon row with progressive reveal (e.g. "there are 3 types of X": all blurred with "?", then each mention un-blurs one).
// { items: [{ emoji, label }], top?: 1060, shows: [{ t0, t1, reveal: n }] } — reveal = how many items are uncovered
// in that show; the n-th one animates from blurred to sharp and is highlighted. Captions are hidden meanwhile.
const IROW = plan.iconRow || null;
const IROW_SHOWS = IROW ? IROW.shows : [];
const IROW_N = IROW ? IROW.items.length : 0;
const IRW = IROW_N > 4 ? { gap: 16, it: 196, disc: 150, bd: 6, emo: 96, q: 80, lab: 30, mt: 18 } : { gap: 46, it: 250, disc: 196, bd: 7, emo: 124, q: 104, lab: 30, mt: 22 };
// [t0, t1, top]: move captions to another y while something tall sits behind them (e.g. a user chart that reaches y≈1370)
const CAPMOVES = plan.captionMoves || [];
// stamp font shrinks with text length so it never leaves the frame (190 px for 1-3 chars)
const stampSize = (txt) => Math.min(190, Math.floor(900 / (String(txt).length * 0.85)));
const CAP_TOP = plan.captionsTop || 1140;
const ORIGIN_Y = plan.faceOriginY || "29%";
const BROLL = plan.broll || [];
const GRAPHICS = plan.graphics || [];

// SFX: [id, file, start, duration, volume, mediaStart] + automatic whoosh on every cutaway and pop on every sticker
const FX = (plan.sfx || []).map((f) => f.slice());
[...BROLL, ...GRAPHICS].forEach((b, i) => {
  if (b.quiet || FX.some((f) => Math.abs(f[2] - b.t0) < 0.15)) return;
  FX.push([`sfx-cut${i}`, plan.autoWhoosh || "whoosh-short", +Math.max(0, +b.t0 - 0.08).toFixed(2), 0.57, 0.3, 0]);
});
S.forEach(([t0], i) => {
  if (FX.some((f) => Math.abs(f[2] - t0) < 0.12)) return;
  FX.push([`sfx-st${i}`, plan.autoPop || "pop", +(+t0).toFixed(2), 0.7, 0.35, 0]);
});
FX.forEach((f) => { if (f[2] + f[3] > DUR) f[3] = +(DUR - f[2]).toFixed(2); });
FX.sort((a, b) => a[2] - b[2]);
const trackEnd = [];
FX.forEach((f) => { let k = trackEnd.findIndex((e) => e <= f[2]); if (k < 0) k = trackEnd.length; trackEnd[k] = f[2] + f[3]; f[6] = 5 + k; });

// Captions are hidden where something else already explains what is being said:
// the hook, full-screen graphics (unless keepCaptions), and plan.noCaptions windows
// (e.g. images/text already baked into the A-roll). Words starting inside a window are dropped.
const HIDE = [
  ...(plan.hideCaptionsOnHook === false ? [] : [[0, +HOOK.t1]]),
  ...GRAPHICS.filter((x) => x.mode !== "panel" && !x.keepCaptions).map((x) => [+x.t0, +x.t1]),
  ...BROLL.filter((x) => x.hideCaptions).map((x) => [+x.t0, +x.t1]),
  ...(plan.noCaptions || []).map(([a, b]) => [+a, +b]),
  ...(plan.callouts || []).map((c) => [+c.t0, +c.t1]),
  ...IROW_SHOWS.map((s) => [+s.t0, +s.t1]),
].sort((a, b) => a[0] - b[0]);
const inHide = (t) => HIDE.some(([a, b]) => t >= a - 0.05 && t < b);
const segOf = (t) => HIDE.filter(([a]) => a <= t).length; // groups never span a hidden window
const nextHide = (t) => Math.min(...HIDE.filter(([a]) => a > t).map(([a]) => a), Infinity);
const words = cap.words.filter((w) => !inHide(w.s)).map((w) => ({ ...w, seg: segOf(w.s) }));

// Captions: 1-3 words per group (<=16 chars), break on punctuation, no orphans, no flashes, fit to 940 px
const groups = [];
let g = [];
const flush = () => { if (g.length) groups.push(g); g = []; };
words.forEach((w) => {
  const len = g.map((x) => x.w).join(" ").length + w.w.length + 1;
  if (g.length && (len > 16 || g.length >= 3 || g[0].seg !== w.seg)) flush();
  g.push(w);
  if (/[.:?!]$/.test(w.w) || (/[,;]$/.test(w.w) && g.length >= 2)) flush();
});
flush();
for (let i = groups.length - 1; i > 0; i--) {
  const a = groups[i], b = groups[i - 1];
  if (a.length === 1 && a[0].seg === b[0].seg && !/[.:?!]$/.test(b[b.length - 1].w) && (b.map((x) => x.w).join(" ") + " " + a[0].w).length <= 18) { b.push(a[0]); groups.splice(i, 1); }
}
for (let i = 0; i < groups.length - 1; i++) {
  const a = groups[i], b = groups[i + 1];
  if (a[0].seg === b[0].seg && b[0].s - a[0].s < 0.45 && a.concat(b).map((x) => x.w).join(" ").length <= 20) { groups.splice(i, 2, a.concat(b)); i--; }
}
const G = groups.map((g, i) => {
  const next = groups[i + 1];
  let e = Math.max(g[g.length - 1].e + 0.25, g[g.length - 1].s + 0.4);
  if (next) e = Math.min(e, next[0].s);
  e = Math.min(e, nextHide(g[0].s));
  const est = g.reduce((a, w) => a + w.w.length * 0.8 * (w.k ? 86 : 78), 0) + 24 * (g.length - 1) + 30;
  const fit = +Math.min(1, 940 / est).toFixed(3);
  return { s: g[0].s, e: +Math.min(e, DUR).toFixed(3), fit, words: g.map((w) => [w.w, w.s, w.k]) };
});

const EMO = (file) => fs.readFileSync(path.join(P, file), "utf8").replace("<svg ", '<svg width="100%" height="100%" ');
const stickerHtml = (art) => {
  if (art.startsWith("emoji:")) return `<div class="st-disc st-emoji"><div class="emo">${EMO(art.slice(6))}</div></div>`;
  if (art.startsWith("img:")) return `<div class="st-disc"><img class="st-img" src="${art.slice(4)}" alt="" /></div>`;
  if (!ART[art]) throw new Error(`Unknown sticker art "${art}" — add it to scripts/art.cjs or use emoji:/img:`);
  return `<div class="st-disc">${ART[art]}</div>`;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const r2 = (n) => Math.round(n * 1000) / 1000;

// ── B-roll: the user's other clips and images ───────────────────────────────
// { t0, t1, src, mode: "full" | "frame" | "pip", start?, aspect? (w/h), focus? ("50% 30%"), kb? (images, default true), tag?, quiet? }
//   full  = full-screen cutaway (cover crop) — best for vertical media
//   frame = media in a rounded card over the navy background — best for horizontal/square media
//   pip   = card over the lower part of the frame (y≈1330) while the presenter stays visible
const BR = BROLL.map((b, i) => {
  const id = `b${i}`, t0 = r2(+b.t0), t1 = r2(+b.t1), d = r2(t1 - t0);
  const isImg = /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(b.src);
  const mode = ["frame", "pip"].includes(b.mode) ? b.mode : "full";
  const pos = b.focus ? ` style="object-position:${b.focus}"` : "";
  const media = isImg
    ? `<img id="${id}v" class="clip" src="${b.src}" alt="" data-start="${t0}" data-duration="${d}" data-track-index="1"${pos} />`
    : `<video id="${id}v" class="clip" src="${b.src}" muted playsinline data-start="${t0}" data-duration="${d}" data-media-start="${+(b.start || 0)}" data-track-index="1"${pos}></video>`;
  const inner = `<div class="br-kb" id="${id}k">${media}</div>`;
  let html, cardStyle = "";
  if (mode === "frame") {
    const asp = +b.aspect || 16 / 9;
    let w = 1000, h = Math.round(w / asp);
    if (h > 820) { h = 820; w = Math.round(h * asp); }
    cardStyle = `left:${Math.round((1080 - w) / 2)}px;top:${Math.round(240 + (820 - h) / 2)}px;width:${w}px;height:${h}px`;
    html = `      <div class="br frame" id="${id}"><div class="gfx-bg"></div><div class="br-card" id="${id}i" style="${cardStyle}">${inner}</div>${b.tag ? `<div class="br-tag">${esc(b.tag)}</div>` : ""}</div>`;
  } else if (mode === "pip") {
    html = `      <div class="br pip" id="${id}"><div class="br-in" id="${id}i">${inner}</div>${b.tag ? `<div class="br-tag pip-tag">${esc(b.tag)}</div>` : ""}</div>`;
  } else {
    html = `      <div class="br full" id="${id}"><div class="br-in" id="${id}i">${inner}</div></div>`;
  }
  let js = `tl.fromTo("#${id}", { opacity: 0 }, { opacity: 1, duration: 0.12, immediateRender: false }, ${t0});\n`;
  if (mode === "full") js += `tl.fromTo("#${id}i", { scale: 1.18 }, { scale: 1, duration: 0.4, ease: "power3.out", immediateRender: false }, ${t0});\n`;
  if (mode === "frame") js += `tl.fromTo("#${id}i", { y: 90, scale: 0.88, rotation: -2 }, { y: 0, scale: 1, rotation: 0, duration: 0.38, ease: "back.out(1.8)", immediateRender: false }, ${t0});\n`;
  if (mode === "pip") js += `tl.fromTo("#${id}", { y: 140, rotation: -4 }, { y: 0, rotation: -1.5, duration: 0.38, ease: "back.out(1.8)", immediateRender: false }, ${t0});\n`;
  if (isImg && b.kb !== false) js += `tl.fromTo("#${id}k", { scale: 1, x: 0 }, { scale: 1.1, x: ${i % 2 ? 20 : -20}, duration: ${d}, ease: "none", immediateRender: false }, ${t0});\n`;
  js += `tl.to("#${id}", { opacity: 0, duration: 0.12, ease: "power2.in" }, ${r2(t1 - 0.12)});\n`;
  return { html, js };
});

// ── Self-made motion graphics (see graphics.cjs) ────────────────────────────
const H = {
  art: (k) => { if (!ART[k]) throw new Error(`Unknown art "${k}"`); return ART[k]; },
  emoji: (e) => EMO(/\.svg$/.test(e) ? e : `assets/emoji/${e}.svg`),
  // emoji as a nested <svg> positioned inside another SVG drawing
  emojiAt: (e, x, y, size) => fs.readFileSync(path.join(P, /\.svg$/.test(e) ? e : `assets/emoji/${e}.svg`), "utf8")
    .replace(/<svg /, `<svg x="${x}" y="${y}" width="${size}" height="${size}" `),
};
const GR = GRAPHICS.map((g, i) => GFX.render(g, i, H));

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #000; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: Montserrat, sans-serif; }
      #cam { position: absolute; inset: 0; transform-origin: 50% ${ORIGIN_Y}; }
      #reel { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .vignette { position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(180deg, rgba(5,14,36,0.42) 0%, rgba(5,14,36,0) 24%, rgba(5,14,36,0) 76%, rgba(5,14,36,0.38) 100%); }
      #flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }

      /* B-roll */
      .br { position: absolute; opacity: 0; overflow: hidden; }
      .br.full, .br.frame { inset: 0; }
      .br.full .br-in { position: absolute; inset: 0; }
      .br.pip { left: 110px; top: 1330px; width: 860px; height: 500px; border-radius: 34px; border: 6px solid #2F7BFF;
        box-shadow: 0 18px 50px rgba(0,0,0,0.5); overflow: hidden; }
      .br.pip .br-in { position: absolute; inset: 0; }
      .br-card { position: absolute; border-radius: 34px; overflow: hidden; border: 6px solid #2F7BFF; box-shadow: 0 24px 60px rgba(0,0,0,0.55); }
      .br-kb { position: absolute; inset: 0; }
      .br-kb video, .br-kb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .br-tag { position: absolute; left: 60px; top: 170px; background: #1E6BFF; color: #fff; font-weight: 900; font-size: 40px;
        padding: 10px 24px; border-radius: 16px; text-transform: uppercase; }
      .br-tag.pip-tag { left: 24px; top: 24px; font-size: 32px; }
${GFX.CSS}
      /* Hook: two big uppercase lines, first ~2 s */
      #hook { position: absolute; left: 0; right: 0; top: ${HOOK.top ?? 120}px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .hk { font-family: "League Gothic", sans-serif; font-size: 156px; line-height: 0.95; letter-spacing: 1px; color: #fff;
        padding: 6px 34px 0; border-radius: 18px; display: block; }
${HOOK.theme === "red"
  ? `      /* red hook: errors, warnings, "you're doing it wrong" topics */
      #hk1 { background: #1c0306; box-shadow: 0 14px 40px rgba(0,0,0,0.45); border: 5px solid #E8243C; }
      #hk2 { background: #E8243C; box-shadow: 0 14px 50px rgba(232,36,60,0.6); }`
  : `      #hk1 { background: #0A1A3F; box-shadow: 0 14px 40px rgba(0,0,0,0.35); }
      #hk2 { background: #1E6BFF; box-shadow: 0 14px 40px rgba(30,107,255,0.45); }`}

      /* Concept stickers beside the head */
      .st { position: absolute; top: 560px; width: 230px; display: flex; flex-direction: column; align-items: center; opacity: 0; }
      .st.L { left: 30px; } .st.R { left: 820px; }
      .st-disc { width: 230px; height: 230px; border-radius: 50%; background: #fff; border: 7px solid #1E6BFF;
        box-shadow: 0 18px 40px rgba(3,10,30,0.4); display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .st-disc svg { width: 180px; height: 180px; }
      .st-emoji .emo { width: 140px; height: 140px; }
      .st-img { width: 170px; height: 170px; object-fit: contain; }
      .st-lab { position: relative; z-index: 2; margin-top: -18px; background: #0A1A3F; color: #fff; font-weight: 700; font-size: 28px;
        padding: 8px 18px; border-radius: 14px; border: 3px solid #4FB3FF; white-space: nowrap; }

      /* Captions: big bold letters, no box, centered on the chest */
      #caps { position: absolute; left: 0; right: 0; top: ${CAP_TOP}px; height: 150px; }
      .cg { position: absolute; left: 50%; top: 0; display: flex; align-items: baseline; gap: 24px; white-space: nowrap; opacity: 0; }
      .cw { font-weight: 900; font-size: 78px; line-height: 1.05; color: #fff; text-transform: uppercase; letter-spacing: -1px;
        display: inline-block; transform-origin: 50% 60%;
        text-shadow: 0 0 1px #061230, 6px 0 0 #061230, -6px 0 0 #061230, 0 6px 0 #061230, 0 -6px 0 #061230,
          4px 4px 0 #061230, -4px 4px 0 #061230, 4px -4px 0 #061230, -4px -4px 0 #061230, 0 10px 24px rgba(0,0,0,0.6); }
      .cw.k { color: #4FB3FF; font-size: 86px; }

      /* Word-driven effects */
      #fx { position: absolute; inset: 0; pointer-events: none; }
      .ring { position: absolute; width: 240px; height: 240px; left: 420px; top: ${CAP_TOP - 45}px; border-radius: 50%;
        border: 12px solid #4FB3FF; box-shadow: 0 0 40px rgba(79,179,255,0.8); opacity: 0; }
      #redflash { position: absolute; inset: 0; opacity: 0; pointer-events: none;
        background: radial-gradient(ellipse at 50% 45%, rgba(255,40,40,0) 45%, rgba(220,20,40,0.75) 100%); }
      .stamp { position: absolute; left: 0; right: 0; top: ${CAP_TOP - 320}px; display: flex; justify-content: center; opacity: 0; }
      .irow { position: absolute; left: 0; right: 0; display: flex; justify-content: center; gap: ${IRW.gap}px; opacity: 0; }
      .ir-it { width: ${IRW.it}px; display: flex; flex-direction: column; align-items: center; }
      .ir-disc { position: relative; width: ${IRW.disc}px; height: ${IRW.disc}px; border-radius: 50%; background: #fff; border: ${IRW.bd}px solid #1E6BFF;
        box-shadow: 0 16px 36px rgba(3,10,30,0.45); display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .ir-emo { width: ${IRW.emo}px; height: ${IRW.emo}px; }
      .ir-q { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: ${IRW.q}px;
        color: #0A1A3F; opacity: 0; }
      .ir-lab { margin-top: ${IRW.mt}px; font-weight: 900; font-size: ${IRW.lab}px; color: #fff; text-transform: uppercase; white-space: nowrap; opacity: 0;
        text-shadow: 4px 0 0 #061230, -4px 0 0 #061230, 0 4px 0 #061230, 0 -4px 0 #061230, 0 10px 24px rgba(0,0,0,0.6); }
      .co { position: absolute; left: 0; right: 0; display: flex; justify-content: center; align-items: center; gap: 26px; opacity: 0; }
      .co-ic { flex: 0 0 auto; width: 132px; height: 132px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        border: 6px solid #fff; box-shadow: 0 0 50px rgba(232,36,60,0.7), 0 14px 30px rgba(0,0,0,0.5); opacity: 0; }
      .co-ic svg { width: 78px; height: 78px; }
      .co-tx { font-weight: 900; font-size: 92px; line-height: 1; color: #fff; text-transform: uppercase; letter-spacing: -2px; white-space: nowrap; opacity: 0;
        text-shadow: 0 0 1px #061230, 6px 0 0 #061230, -6px 0 0 #061230, 0 6px 0 #061230, 0 -6px 0 #061230,
          4px 4px 0 #061230, -4px 4px 0 #061230, 4px -4px 0 #061230, -4px -4px 0 #061230, 0 14px 34px rgba(0,0,0,0.6); }
      .stamp span { font-weight: 900; font-size: 190px; line-height: 1; color: #4FB3FF; letter-spacing: -4px;
        text-shadow: 6px 0 0 #061230, -6px 0 0 #061230, 0 6px 0 #061230, 0 -6px 0 #061230, 5px 5px 0 #061230, -5px 5px 0 #061230,
          5px -5px 0 #061230, -5px -5px 0 #061230, 0 18px 40px rgba(0,0,0,0.6); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="1080" data-height="1920">
      <div id="cam">
        <video id="reel" class="clip" src="${plan.video || "assets/reel.mp4"}" playsinline data-has-audio="true" data-start="0" data-duration="${DUR}" data-track-index="0" data-volume="${plan.volume ?? 0.9}"${plan.grade ? ` data-color-grading='${JSON.stringify(plan.grade)}'` : ""}></video>
      </div>
${BR.map((b) => b.html).join("\n")}
${GR.map((g) => g.html).join("\n")}
      <div class="vignette"></div>
      <div id="flash"></div>

      <div id="hook" class="clip" data-start="0" data-duration="${HOOK.t1}" data-track-index="3">
        <span class="hk" id="hk1">${esc(HOOK.l1)}</span>
        <span class="hk" id="hk2">${esc(HOOK.l2)}</span>
      </div>

${S.map(([t0, t1, art, side, lab], i) => `      <div class="st ${side}" id="st${i}" data-layout-allow-overflow>${stickerHtml(art)}<div class="st-lab">${esc(lab)}</div></div>`).join("\n")}

      <div id="redflash"></div>
${IROW_SHOWS.map((s, i) => `      <div class="irow" id="ir${i}" style="top:${IROW.top || 1060}px">${IROW.items.map((it, k) =>
  `<div class="ir-it" id="iri${i}_${k}"><div class="ir-disc" id="ird${i}_${k}"><div class="ir-emo" id="ire${i}_${k}">${EMO(/\.svg$/.test(it.emoji) ? it.emoji : `assets/emoji/${it.emoji}.svg`)}</div><div class="ir-q" id="irq${i}_${k}">?</div></div><div class="ir-lab" id="irl${i}_${k}">${esc(it.label)}</div></div>`).join("")}</div>`).join("\n")}
${CALLOUTS.map((c, i) => {
  const ic = { cross: ["#E8243C", '<path d="M18 18l28 28M46 18L18 46" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>'],
    check: ["#1E6BFF", '<path d="M14 34l12 12 24-28" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'],
    warning: ["#F5A524", '<path d="M32 14v24" stroke="#fff" stroke-width="10" stroke-linecap="round"/><circle cx="32" cy="50" r="5" fill="#fff"/>'] }[c.icon || "cross"];
  const len = String(c.text).length, fs_ = Math.min(92, Math.floor(860 / (len * 0.66)));
  return `      <div class="co" id="co${i}" style="top:${c.top || 1120}px"><div class="co-ic" id="coi${i}" style="background:${ic[0]}"><svg viewBox="0 0 64 64">${ic[1]}</svg></div><div class="co-tx" id="cot${i}" style="font-size:${fs_}px">${esc(c.text)}</div></div>`;
}).join("\n")}
      <div id="fx">
${RINGS.map((t, i) => `        <div class="ring" id="ring${i}"></div>`).join("\n")}
${STAMPS.map(([t, txt], i) => `        <div class="stamp" id="stamp${i}" style="top:${CAP_TOP - 320 + (190 - stampSize(txt))}px"><span style="font-size:${stampSize(txt)}px">${esc(txt)}</span></div>`).join("\n")}
      </div>

      <div id="caps">
${G.map((g, i) => `        <div class="cg" id="cg${i}">${g.words.map(([w, , k], j) => `<span class="cw${k ? " k" : ""}" id="cw${i}_${j}">${esc(w)}</span>`).join("")}</div>`).join("\n")}
      </div>

${plan.bgm ? `      <audio id="bgm" src="${plan.bgm.src}" data-start="0" data-duration="${DUR}" data-volume="${plan.bgm.volume ?? 0.12}" data-track-index="9"></audio>
` : ""}${FX.map(([id, f, s, d, v, ms, tr]) => `      <audio id="${id}" src="assets/sfx/${f}.mp3" data-start="${s}" data-duration="${d}"${ms ? ` data-media-start="${ms}"` : ""} data-volume="${v}" data-track-index="${tr}"></audio>`).join("\n")}
    </div>
    <script>
      const DUR = ${DUR};
      const S = ${JSON.stringify(S.map(([a, b, , side]) => [a, b, side]))};
      const G = ${JSON.stringify(G)};
      const CAM = ${JSON.stringify(CAM)};
      const SHAKE = ${JSON.stringify(SHAKE)};
      const FLASH = ${JSON.stringify(FLASH)};
      const RINGS = ${JSON.stringify(RINGS)};
      const REDS = ${JSON.stringify(REDS)};
      const STAMPS = ${JSON.stringify(STAMPS)};
      const CAPSHAKE = ${JSON.stringify(CAPSHAKE)};
      const tl = gsap.timeline({ paused: true });

      // camera: [time, scale, rampDuration, ease] — ramp ends at time; rampDuration 0 = hard set (use on hard cuts)
      tl.set("#cam", { scale: CAM[0][1] }, 0);
      for (let i = 1; i < CAM.length; i++) {
        const [t, sc, d, ease] = CAM[i];
        if (d === 0) tl.set("#cam", { scale: sc }, t);
        else tl.to("#cam", { scale: sc, duration: d, ease }, t - d);
      }
      const pat = [[1, -0.6], [-0.8, 0.9], [0.7, -0.4], [-0.5, 0.6], [0.3, -0.2], [0, 0]];
      SHAKE.forEach(([t, k]) => pat.forEach(([x, y], i) => tl.to("#cam", { x: x * k, y: y * k, rotation: x * 0.4, duration: 0.045, ease: "none" }, t + i * 0.045)));
      FLASH.forEach(([t, o]) => tl.fromTo("#flash", { opacity: o }, { opacity: 0, duration: 0.22, ease: "power2.out", immediateRender: t === 0 }, t));

      // hook
      tl.fromTo("#hk1", { y: -60, scale: 1.35, opacity: 0, rotation: -3 }, { y: 0, scale: 1, opacity: 1, rotation: -2, duration: 0.32, ease: "back.out(2.2)" }, 0.02);
      tl.fromTo("#hk2", { y: 60, scale: 1.35, opacity: 0, rotation: 3 }, { y: 0, scale: 1, opacity: 1, rotation: 1.5, duration: 0.32, ease: "back.out(2.2)" }, 0.24);
      tl.to("#hk2", { scale: 1.06, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.7);
      tl.to("#hook", { opacity: 0, y: -40, duration: 0.18, ease: "power2.in" }, ${HOOK.t1} - 0.18);

      // B-roll cutaways and self-made graphics
${BR.map((b) => b.js).join("")}${GR.map((g) => g.js).join("")}
      // stickers
      S.forEach(([t0, t1, side], i) => {
        const el = "#st" + i, rot = side === "L" ? -6 : 6;
        tl.fromTo(el, { opacity: 0, scale: 0.2, rotation: rot * -4 }, { opacity: 1, scale: 1, rotation: rot, duration: 0.42, ease: "back.out(2.2)", immediateRender: false }, t0);
        const hold = t1 - t0 - 0.62;
        if (hold > 0.3) tl.fromTo(el, { y: 0 }, { y: -12, duration: hold / 2, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t0 + 0.42);
        tl.to(el, { opacity: 0, scale: 0.6, duration: 0.2, ease: "power2.in" }, t1 - 0.2);
      });

      // captions: groups pop in, each word bounces as spoken, key words hit harder
      G.forEach((g, i) => {
        const el = "#cg" + i;
        const inDur = Math.min(0.2, (g.e - g.s) * 0.5);
        tl.set(el, { xPercent: -50 }, 0);
        tl.fromTo(el, { opacity: 0, y: 34, scale: 0.6 * g.fit }, { opacity: 1, y: 0, scale: g.fit, duration: inDur, ease: "back.out(2.6)", immediateRender: false }, g.s);
        g.words.forEach(([w, t, key], k) => {
          const we = "#cw" + i + "_" + k;
          const up = key ? { scale: 1.16, y: -10, rotation: k % 2 ? 3 : -3 } : { scale: 1.07, y: -6, rotation: 0 };
          tl.fromTo(we, { scale: 1, y: 0, rotation: 0 }, { ...up, duration: 0.09, ease: "power3.out", immediateRender: false }, t);
          tl.to(we, { scale: 1, y: 0, rotation: 0, duration: Math.max(0.05, Math.min(0.22, g.e - t - 0.1)), ease: "back.out(3)" }, t + 0.09);
        });
        tl.to(el, { opacity: 0, scale: 0.92 * g.fit, duration: 0.07 }, Math.max(g.s + inDur, g.e - 0.07));
        tl.set(el, { opacity: 0 }, g.e);
      });
      ${JSON.stringify(CAPMOVES)}.forEach(([a, b, top]) => { tl.set("#caps", { y: top - ${CAP_TOP} }, a); tl.set("#caps", { y: 0 }, b); });
      CAPSHAKE.forEach((t) => pat.forEach(([x, y], i) => tl.to("#caps", { x: x * 12, y: y * 6, duration: 0.045, ease: "none" }, t + i * 0.045)));

      // word-driven effects (immediateRender:false so nothing shows before its time)
      RINGS.forEach((t, i) => tl.fromTo("#ring" + i, { scale: 0.3, opacity: 0.95 }, { scale: 2.6, opacity: 0, duration: 0.55, ease: "power2.out", immediateRender: false }, t));
      REDS.forEach((t) => tl.fromTo("#redflash", { opacity: 0.9 }, { opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, t));
      // icon row: blurred "?" discs; each show uncovers one more (blur → sharp, label, highlight)
      ${JSON.stringify(IROW_SHOWS.map((s) => [+s.t0, +s.t1, +s.reveal]))}.forEach(([a, b, rv], i) => {
        const n = ${IROW ? IROW.items.length : 0};
        tl.fromTo("#ir" + i, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25, ease: "power3.out", immediateRender: false }, a);
        for (let k = 0; k < n; k++) {
          const done = k < rv - 1, now = k === rv - 1;
          tl.set("#ire" + i + "_" + k, { filter: done ? "blur(0px)" : "blur(16px)" }, a);
          tl.set("#irq" + i + "_" + k, { opacity: done ? 0 : 0.85 }, a);
          tl.set("#irl" + i + "_" + k, { opacity: done ? 1 : 0 }, a);
          tl.set("#ird" + i + "_" + k, { borderColor: done ? "#1E6BFF" : "#8aa0c6" }, a);
          tl.fromTo("#iri" + i + "_" + k, { scale: 0.6 }, { scale: 1, duration: 0.35, ease: "back.out(2.2)", immediateRender: false }, a + k * 0.07);
          if (now) {
            const r = a + 0.3;
            tl.to("#ire" + i + "_" + k, { filter: "blur(0px)", duration: 0.45, ease: "power2.out" }, r);
            tl.to("#irq" + i + "_" + k, { opacity: 0, duration: 0.2 }, r);
            tl.to("#ird" + i + "_" + k, { borderColor: "#4FB3FF", boxShadow: "0 0 50px rgba(79,179,255,0.9)", duration: 0.3 }, r);
            tl.to("#iri" + i + "_" + k, { scale: 1.16, duration: 0.3, ease: "back.out(2.5)" }, r + 0.35);
            tl.fromTo("#irl" + i + "_" + k, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25, immediateRender: false }, r + 0.2);
          }
        }
        tl.to("#ir" + i, { opacity: 0, duration: 0.18, ease: "power2.in" }, b - 0.18);
      });
      ${JSON.stringify(CALLOUTS.map((c) => [+c.t0, +c.t1, c.textAt != null ? +c.textAt : +c.t0 + 0.15]))}.forEach(([a, b, ta], i) => {
        tl.fromTo("#co" + i, { opacity: 0 }, { opacity: 1, duration: 0.05, immediateRender: false }, a);
        tl.fromTo("#coi" + i, { scale: 2.6, rotation: -30, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.22, ease: "power4.in", immediateRender: false }, a);
        tl.fromTo("#cot" + i, { scale: 1.8, opacity: 0, y: -20 }, { scale: 1, opacity: 1, y: 0, duration: 0.22, ease: "power4.in", immediateRender: false }, ta);
        pat.forEach(([x, y], k) => tl.to("#co" + i, { x: x * 10, y: y * 6, duration: 0.045, ease: "none" }, ta + 0.22 + k * 0.045));
        tl.to("#coi" + i, { scale: 1.08, duration: Math.max(0.2, (b - ta - 0.6) / 2), yoyo: true, repeat: 1, ease: "sine.inOut" }, ta + 0.5);
        tl.to("#co" + i, { opacity: 0, scale: 0.9, duration: 0.15, ease: "power2.in" }, b - 0.15);
      });
      STAMPS.forEach(([t, , d], i) => {
        tl.fromTo("#stamp" + i, { opacity: 0, scale: 2.6, rotation: -14 }, { opacity: 1, scale: 1, rotation: -6, duration: 0.22, ease: "power4.in", immediateRender: false }, t);
        tl.to("#stamp" + i, { scale: 1.06, duration: d / 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, t + 0.22);
        tl.to("#stamp" + i, { opacity: 0, scale: 0.7, duration: 0.18, ease: "power2.in" }, t + 0.22 + d);
      });

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(P, "index.html"), html);
console.log(`index.html: ${DUR}s, ${BR.length} b-roll, ${GR.length} graphics, ${S.length} stickers, ${G.length} caption groups, ${FX.length} sfx, ${RINGS.length} rings, ${STAMPS.length} stamps`);
