// Self-made motion graphics for reels (deterministic GSAP, 1080x1920).
// Each graphic: { t0, t1, kind, mode: "full" | "panel", ...props }  → render(g, i, helpers) returns { html, js }.
//   full  = full-screen cutaway on a navy background (content box 960x860 at y=230, captions stay below at ~1140)
//   panel = rounded card over the lower part of the frame (y≈1330), content scaled to 60 %
//
// kinds and props:
//   bars     { title, items: [{ label, value, suffix?, prefix?, dec?, bad? }], max? }     comparison bars that grow + count up
//   counter  { value, from?, prefix?, suffix?, dec?, label }                              big number counting up
//   versus   { title?, left: { label, art?|emoji?, bad? }, right: { label, art?|emoji?, bad? } }  A vs B, ✗ on the bad side, ✓ on the good
//   stick    { action: lift|run|tired|drink|celebrate|think, label? }                    animated stick figure doing the action
//   sign     { type: warning|stop|check|cross|up|down, text? }                           big sign that pops and wobbles
//   list     { title?, items: [string] }                                                  checklist, items tick in one by one
//   line     { title?, points: [n...], labels?: [left, right], bad? }                     line chart that draws itself (up = blue, bad = red)
//   rethink  { from: { label, question? }, to: { title, items: [{ emoji, label }] }, swap? }  "feel-o-meter" maxes out, gets struck and falls; the real criteria pop in with ✓
//   athlete  { action: curl-swing|press-grind, label?, badge?: cross|check }             cartoon person with a face doing a gym lift (athlete.cjs)
const { athlete } = require("./athlete.cjs");
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
const r2 = (n) => Math.round(n * 1000) / 1000;

const CSS = `
      .gfx { position: absolute; opacity: 0; }
      .gfx.full { inset: 0; }
      .gfx.panel { left: 60px; top: 1330px; width: 960px; height: 516px; border-radius: 36px; overflow: hidden;
        border: 5px solid #2F7BFF; box-shadow: 0 18px 50px rgba(0,0,0,0.5); }
      .gfx-bg { position: absolute; inset: 0;
        background: repeating-linear-gradient(0deg, rgba(79,179,255,0.07) 0 2px, transparent 2px 80px),
          repeating-linear-gradient(90deg, rgba(79,179,255,0.07) 0 2px, transparent 2px 80px),
          radial-gradient(ellipse at 50% 35%, #163a82 0%, #071635 62%, #040b1f 100%); }
      .gfx-box { position: absolute; left: 60px; top: 230px; width: 960px; height: 860px; }
      .gfx.panel .gfx-box { left: 0; top: 0; transform: scale(0.6); transform-origin: 50% 0; }
      .gt { position: absolute; left: 0; right: 0; top: 0; text-align: center; font-weight: 900; font-size: 60px; line-height: 1.05;
        color: #fff; text-transform: uppercase; letter-spacing: -1px; }
      .glab { position: absolute; left: 0; right: 0; text-align: center; font-weight: 900; font-size: 58px; color: #fff; text-transform: uppercase; }
      .gblue { color: #4FB3FF; }
      .gout { text-shadow: 0 0 1px #061230, 5px 0 0 #061230, -5px 0 0 #061230, 0 5px 0 #061230, 0 -5px 0 #061230, 0 12px 30px rgba(0,0,0,0.6); }
      .bar-row { position: absolute; left: 0; width: 960px; height: 150px; }
      .bar-l { position: absolute; left: 0; top: 0; font-weight: 700; font-size: 44px; color: #fff; }
      .bar-t { position: absolute; left: 0; top: 64px; width: 960px; height: 70px; border-radius: 35px; background: rgba(255,255,255,0.12); overflow: hidden; }
      .bar-f { position: absolute; left: 0; top: 0; height: 100%; width: 100%; border-radius: 35px; transform-origin: 0 50%;
        background: linear-gradient(90deg, #1E6BFF, #4FB3FF); }
      .bar-f.bad { background: linear-gradient(90deg, #b3122b, #ff5a5a); }
      .bar-v { position: absolute; right: 0; top: 0; font-weight: 900; font-size: 48px; color: #4FB3FF; }
      .bar-v.bad { color: #ff6b6b; }
      .cnt { position: absolute; left: 0; right: 0; top: 180px; text-align: center; font-weight: 900; font-size: 250px; line-height: 1; color: #4FB3FF; letter-spacing: -6px; }
      .cnt-ring { position: absolute; left: 230px; top: 70px; width: 500px; height: 500px; border-radius: 50%; border: 14px solid rgba(79,179,255,0.35); }
      .vs-card { position: absolute; top: 120px; width: 420px; height: 600px; border-radius: 40px; background: rgba(255,255,255,0.08);
        border: 5px solid rgba(255,255,255,0.25); }
      .vs-art { position: absolute; left: 70px; top: 70px; width: 280px; height: 280px; }
      .vs-art svg { width: 100%; height: 100%; }
      .vs-lab { position: absolute; left: 10px; right: 10px; top: 400px; text-align: center; font-weight: 900; font-size: 52px; line-height: 1.05; color: #fff; text-transform: uppercase; }
      .vs-mid { position: absolute; left: 400px; top: 340px; width: 160px; height: 160px; border-radius: 50%; background: #1E6BFF;
        display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 64px; color: #fff; box-shadow: 0 0 40px rgba(30,107,255,0.7); }
      .vs-mark { position: absolute; right: -36px; top: -36px; width: 150px; height: 150px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      .vs-mark svg { width: 92px; height: 92px; }
      .stk { position: absolute; left: 180px; top: 0; width: 600px; height: 760px; }
      .sgn { position: absolute; left: 220px; top: 40px; width: 520px; height: 520px; }
      .li-row { position: absolute; left: 40px; width: 900px; height: 110px; display: flex; align-items: center; gap: 30px; }
      .li-chk { flex: 0 0 auto; width: 84px; height: 84px; border-radius: 50%; background: #1E6BFF; display: flex; align-items: center; justify-content: center; }
      .li-chk svg { width: 54px; height: 54px; }
      .li-txt { font-weight: 900; font-size: 52px; color: #fff; text-transform: uppercase; white-space: nowrap; }
      .ln { position: absolute; left: 30px; top: 150px; width: 900px; height: 600px; }
      .mln { position: absolute; left: 0; top: 110px; width: 960px; height: 640px; }
      .mln-leg { position: absolute; left: 0; right: 0; top: 770px; display: flex; justify-content: center; gap: 34px; flex-wrap: wrap; }
      .mln-it { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 32px; color: #fff; opacity: 0; }
      .mln-sw { width: 46px; height: 10px; border-radius: 5px; }
      .rt-card { position: absolute; left: 150px; top: 100px; width: 660px; height: 640px; border-radius: 44px; background: rgba(255,255,255,0.08); border: 5px solid rgba(255,255,255,0.25); }
      .rt-q { position: absolute; left: 0; right: 0; top: 36px; text-align: center; font-weight: 900; font-size: 44px; color: rgba(255,255,255,0.85); text-transform: uppercase; }
      .rt-gauge { position: absolute; left: 30px; top: 110px; width: 600px; height: 340px; }
      .rt-lab { position: absolute; left: 0; right: 0; top: 470px; text-align: center; font-weight: 900; font-size: 92px; color: #fff; text-transform: uppercase; letter-spacing: -2px; }
      .rt-x { position: absolute; left: 150px; top: 100px; width: 660px; height: 640px; overflow: visible; }
      .rt-title { position: absolute; left: 0; right: 0; top: 140px; display: flex; justify-content: center; opacity: 0; }
      .rt-title span { background: #1E6BFF; color: #fff; font-weight: 900; font-size: 78px; padding: 14px 40px; border-radius: 26px; text-transform: uppercase;
        letter-spacing: -1px; box-shadow: 0 0 50px rgba(30,107,255,0.7); white-space: nowrap; }
      .rt-it { position: absolute; top: 400px; width: 300px; display: flex; flex-direction: column; align-items: center; opacity: 0; }
      .rt-disc { position: relative; width: 220px; height: 220px; border-radius: 50%; background: #fff; border: 8px solid #1E6BFF; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 18px 40px rgba(3,10,30,0.45); }
      .rt-disc .emo { width: 140px; height: 140px; }
      .rt-chk { position: absolute; right: -14px; top: -14px; width: 86px; height: 86px; border-radius: 50%; background: #1E6BFF; border: 5px solid #fff; display: flex; align-items: center; justify-content: center; }
      .rt-chk svg { width: 52px; height: 52px; }
      .rt-il { margin-top: 22px; font-weight: 900; font-size: 36px; color: #fff; text-transform: uppercase; white-space: nowrap; }
      .bal { position: absolute; left: 30px; top: 70px; width: 900px; height: 720px; }
      .bal-lab { position: absolute; top: 590px; width: 400px; text-align: center; font-weight: 900; font-size: 40px; line-height: 1.1; text-transform: uppercase; }
      .bal-ok { position: absolute; left: 0; right: 0; top: -10px; display: flex; justify-content: center; opacity: 0; }
      .bal-ok span { background: #1E6BFF; color: #fff; font-weight: 900; font-size: 54px; padding: 10px 34px; border-radius: 22px;
        text-transform: uppercase; box-shadow: 0 0 40px rgba(30,107,255,0.7); }
`;

const CHECK = '<svg viewBox="0 0 64 64"><path d="M14 34l12 12 24-28" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS = '<svg viewBox="0 0 64 64"><path d="M18 18l28 28M46 18L18 46" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/></svg>';

// Spanish number format: 1.800 / 1,6
const fmtEs = (v, dec) => { const [i, f] = (+v).toFixed(dec).split("."); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (f ? "," + f : ""); };
const FMT_JS = fmtEs.toString(); // same formatter, embedded in the composition for the count-up
function countJs(id, t, from, to, dec, prefix, suffix, dur = 0.9) {
  return `{ const el = document.getElementById("${id}"); const o = { v: ${from} };
        tl.to(o, { v: ${to}, duration: ${dur}, ease: "power2.out", immediateRender: false, onUpdate: () => { el.textContent = ${JSON.stringify(prefix)} + (${FMT_JS})(o.v, ${dec}) + ${JSON.stringify(suffix)}; } }, ${t}); }`;
}

function body(g, id, H) {
  const t0 = +g.t0, d = +g.t1 - +g.t0;
  const T = (x) => r2(t0 + x);
  let html = "", js = "";
  switch (g.kind) {
    case "bars": {
      const items = g.items || [];
      const max = g.max || Math.max(...items.map((x) => +x.value)) || 1;
      html += g.title ? `<div class="gt gout">${esc(g.title)}</div>` : "";
      const top0 = g.title ? 170 : 60, step = Math.min(170, (860 - top0) / Math.max(1, items.length));
      items.forEach((it, k) => {
        const dec = it.dec || 0, pre = it.prefix || "", suf = it.suffix || "";
        html += `<div class="bar-row" style="top:${Math.round(top0 + k * step)}px"><div class="bar-l">${esc(it.label)}</div><div class="bar-v${it.bad ? " bad" : ""}" id="${id}v${k}">${esc(pre + fmtEs(0, dec) + suf)}</div><div class="bar-t"><div class="bar-f${it.bad ? " bad" : ""}" id="${id}f${k}"></div></div></div>`;
        js += `tl.fromTo("#${id}f${k}", { scaleX: 0 }, { scaleX: ${r2(Math.max(0.02, it.value / max))}, duration: 0.8, ease: "power3.out", immediateRender: false }, ${T(0.3 + k * 0.18)});\n`;
        js += countJs(`${id}v${k}`, T(0.3 + k * 0.18), 0, +it.value, dec, pre, suf, 0.8) + "\n";
      });
      break;
    }
    case "counter": {
      const dec = g.dec || 0;
      html += `<div class="cnt-ring" id="${id}r"></div><div class="cnt gout" id="${id}n">${esc((g.prefix || "") + fmtEs(+(g.from || 0), dec) + (g.suffix || ""))}</div><div class="glab gout" style="top:560px">${esc(g.label)}</div>`;
      js += countJs(`${id}n`, T(0.25), +(g.from || 0), +g.value, dec, g.prefix || "", g.suffix || "", Math.min(0.9, d * 0.4)) + "\n";
      js += `tl.fromTo("#${id}r", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)", immediateRender: false }, ${T(0.15)});\n`;
      js += `tl.to("#${id}r", { scale: 1.08, duration: ${r2(Math.max(0.3, (d - 0.8) / 2))}, yoyo: true, repeat: 1, ease: "sine.inOut" }, ${T(0.65)});\n`;
      break;
    }
    case "versus": {
      const side = (s, x, k) => {
        const art = s.emoji ? H.emoji(s.emoji) : s.art ? H.art(s.art) : "";
        const mark = s.bad ? `<div class="vs-mark" id="${id}m${k}" style="background:#e8243c">${CROSS}</div>` : `<div class="vs-mark" id="${id}m${k}" style="background:#1E6BFF">${CHECK}</div>`;
        return `<div class="vs-card" id="${id}c${k}" style="left:${x}px"><div class="vs-art">${art}</div><div class="vs-lab">${esc(s.label)}</div>${mark}</div>`;
      };
      html += g.title ? `<div class="gt gout">${esc(g.title)}</div>` : "";
      html += side(g.left, 0, 0) + side(g.right, 540, 1) + `<div class="vs-mid" id="${id}vs">VS</div>`;
      js += `tl.fromTo("#${id}c0", { x: -300, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out", immediateRender: false }, ${T(0.1)});\n`;
      js += `tl.fromTo("#${id}c1", { x: 300, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out", immediateRender: false }, ${T(0.1)});\n`;
      js += `tl.fromTo("#${id}vs", { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.35, ease: "back.out(2.5)", immediateRender: false }, ${T(0.35)});\n`;
      [g.left, g.right].forEach((s, k) => {
        const at = T(Math.min(0.75, d * 0.35));
        js += `tl.fromTo("#${id}m${k}", { scale: 2.4, opacity: 0, rotation: -15 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.22, ease: "power4.in", immediateRender: false }, ${at});\n`;
        if (s.bad) js += `tl.to("#${id}c${k}", { opacity: 0.55, scale: 0.94, duration: 0.3, ease: "power2.out" }, ${r2(at + 0.22)});\n`;
        else js += `tl.to("#${id}c${k}", { scale: 1.05, duration: 0.3, ease: "back.out(2)" }, ${r2(at + 0.22)});\n`;
      });
      js += `tl.set("#${id}m0, #${id}m1", { opacity: 0 }, ${T(0)});\n`;
      break;
    }
    case "stick": {
      const a = g.action || "lift";
      const W = 'stroke="#fff" stroke-width="24" stroke-linecap="round" fill="none"';
      let svg = `<circle cx="300" cy="140" r="62" fill="#fff"/><line x1="300" y1="205" x2="300" y2="440" ${W}/>`;
      const legL = `<line id="${id}lL" x1="300" y1="440" x2="230" y2="660" ${W}/>`, legR = `<line id="${id}lR" x1="300" y1="440" x2="370" y2="660" ${W}/>`;
      if (a === "lift") {
        svg += `<line id="${id}aL" x1="300" y1="250" x2="170" y2="400" ${W}/><line id="${id}aR" x1="300" y1="250" x2="430" y2="400" ${W}/>`;
        svg += `<g id="${id}bar"><line x1="90" y1="400" x2="510" y2="400" stroke="#8fb8ff" stroke-width="16" stroke-linecap="round"/><rect x="70" y="350" width="40" height="100" rx="10" fill="#1E6BFF"/><rect x="490" y="350" width="40" height="100" rx="10" fill="#1E6BFF"/></g>` + legL + legR;
        const reps = Math.max(1, Math.floor((d - 0.5) / 1.0));
        for (let k = 0; k < reps; k++) {
          const s = T(0.35 + k * 1.0);
          js += `tl.to("#${id}bar", { y: -330, duration: 0.45, ease: "power2.inOut" }, ${s}); tl.to(["#${id}aL", "#${id}aR"], { attr: { y2: 70 }, duration: 0.45, ease: "power2.inOut" }, ${s});\n`;
          js += `tl.to("#${id}bar", { y: 0, duration: 0.45, ease: "power2.inOut" }, ${r2(s + 0.5)}); tl.to(["#${id}aL", "#${id}aR"], { attr: { y2: 400 }, duration: 0.45, ease: "power2.inOut" }, ${r2(s + 0.5)});\n`;
        }
      } else if (a === "run") {
        svg += `<line id="${id}aL" x1="300" y1="250" x2="300" y2="420" ${W}/><line id="${id}aR" x1="300" y1="250" x2="300" y2="420" ${W}/>`;
        svg += `<line x1="300" y1="440" x2="300" y2="670" ${W} id="${id}lL"/><line x1="300" y1="440" x2="300" y2="670" ${W} id="${id}lR"/>`;
        svg += `<g stroke="#4FB3FF" stroke-width="12" stroke-linecap="round" id="${id}sp"><line x1="40" y1="300" x2="150" y2="300"/><line x1="20" y1="380" x2="120" y2="380"/><line x1="50" y1="460" x2="140" y2="460"/></g>`;
        const n = Math.max(2, Math.floor(d / 0.35));
        js += `tl.set("#${id}lL", { rotation: 35, svgOrigin: "300 440" }, ${T(0)}); tl.set("#${id}lR", { rotation: -35, svgOrigin: "300 440" }, ${T(0)}); tl.set("#${id}aL", { rotation: -40, svgOrigin: "300 250" }, ${T(0)}); tl.set("#${id}aR", { rotation: 40, svgOrigin: "300 250" }, ${T(0)});\n`;
        for (let k = 0; k < n; k++) {
          const s = T(0.1 + k * 0.35), sg = k % 2 ? 1 : -1;
          js += `tl.to("#${id}lL", { rotation: ${35 * sg}, svgOrigin: "300 440", duration: 0.33, ease: "sine.inOut" }, ${s}); tl.to("#${id}lR", { rotation: ${-35 * sg}, svgOrigin: "300 440", duration: 0.33, ease: "sine.inOut" }, ${s});`;
          js += `tl.to("#${id}aL", { rotation: ${-40 * sg}, svgOrigin: "300 250", duration: 0.33, ease: "sine.inOut" }, ${s}); tl.to("#${id}aR", { rotation: ${40 * sg}, svgOrigin: "300 250", duration: 0.33, ease: "sine.inOut" }, ${s});\n`;
        }
        js += `tl.fromTo("#${id}sp", { x: 60, opacity: 0 }, { x: -40, opacity: 1, duration: 0.35, repeat: ${n - 1}, ease: "none", immediateRender: false }, ${T(0.1)});\n`;
      } else if (a === "tired") {
        svg = `<g id="${id}body">` + svg + `<line x1="300" y1="250" x2="230" y2="460" ${W}/><line x1="300" y1="250" x2="370" y2="460" ${W}/></g>` + legL + legR;
        svg += `<g font-family="Montserrat" font-weight="900" fill="#4FB3FF"><text id="${id}z1" x="400" y="120" font-size="64">Z</text><text id="${id}z2" x="450" y="70" font-size="80">Z</text><text id="${id}z3" x="510" y="20" font-size="96">Z</text></g>`;
        js += `tl.to("#${id}body", { rotation: 14, svgOrigin: "300 440", duration: 0.8, ease: "power2.inOut" }, ${T(0.2)});\n`;
        js += `tl.to("#${id}body", { rotation: 9, svgOrigin: "300 440", duration: ${r2(Math.max(0.3, (d - 1.2) / 2))}, yoyo: true, repeat: 1, ease: "sine.inOut" }, ${T(1.0)});\n`;
        [1, 2, 3].forEach((k) => { js += `tl.fromTo("#${id}z${k}", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, ${T(0.4 + k * 0.25)});\n`; });
      } else if (a === "drink") {
        svg += `<line x1="300" y1="250" x2="200" y2="420" ${W}/><line id="${id}aR" x1="300" y1="250" x2="420" y2="420" ${W}/>`;
        svg += `<g id="${id}cup"><path d="M395 395h70v60a25 25 0 0 1-25 25h-20a25 25 0 0 1-25-25z" fill="#fff"/><rect x="398" y="398" width="64" height="14" fill="#6f3b1f"/><path d="M465 410h10a14 14 0 0 1 0 28h-10" fill="none" stroke="#fff" stroke-width="8"/></g>` + legL + legR;
        const reps = Math.max(1, Math.floor((d - 0.4) / 1.3));
        for (let k = 0; k < reps; k++) {
          const s = T(0.3 + k * 1.3);
          js += `tl.to("#${id}cup", { x: -70, y: -255, rotation: -35, svgOrigin: "430 440", duration: 0.5, ease: "power2.inOut" }, ${s}); tl.to("#${id}aR", { attr: { x2: 350, y2: 170 }, duration: 0.5, ease: "power2.inOut" }, ${s});\n`;
          js += `tl.to("#${id}cup", { x: 0, y: 0, rotation: 0, svgOrigin: "430 440", duration: 0.5, ease: "power2.inOut" }, ${r2(s + 0.75)}); tl.to("#${id}aR", { attr: { x2: 420, y2: 420 }, duration: 0.5, ease: "power2.inOut" }, ${r2(s + 0.75)});\n`;
        }
      } else if (a === "celebrate") {
        svg = `<g id="${id}body">` + svg + `<line id="${id}aL" x1="300" y1="250" x2="170" y2="80" ${W}/><line id="${id}aR" x1="300" y1="250" x2="430" y2="80" ${W}/>` + legL + legR + `</g>`;
        svg += `<g fill="#FFD43B"><path id="${id}s1" d="M90 120l14 28 30 4-22 21 6 30-28-15-28 15 6-30-22-21 30-4z"/><path id="${id}s2" d="M500 160l12 24 26 4-19 18 5 26-24-13-24 13 5-26-19-18 26-4z"/></g>`;
        const n = Math.max(1, Math.floor(d / 0.6));
        js += `tl.to("#${id}body", { y: -50, duration: 0.3, yoyo: true, repeat: ${n * 2 - 1}, ease: "power1.inOut" }, ${T(0.2)});\n`;
        js += `tl.to(["#${id}aL", "#${id}aR"], { attr: { y2: 120 }, duration: 0.3, yoyo: true, repeat: ${n * 2 - 1}, ease: "sine.inOut" }, ${T(0.2)});\n`;
        js += `tl.fromTo(["#${id}s1", "#${id}s2"], { scale: 0, transformOrigin: "50% 50%" }, { scale: 1.2, rotation: 90, duration: 0.5, ease: "back.out(3)", immediateRender: false }, ${T(0.3)});\n`;
      } else if (a === "think") {
        svg += `<line x1="300" y1="250" x2="200" y2="420" ${W}/><polyline points="300,250 400,330 330,215" ${W} stroke-linejoin="round"/>` + legL + legR;
        svg += `<g id="${id}q"><circle cx="470" cy="60" r="70" fill="#1E6BFF"/><text x="470" y="95" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="100" fill="#fff">?</text></g>`;
        js += `tl.fromTo("#${id}q", { scale: 0, svgOrigin: "470 60" }, { scale: 1, svgOrigin: "470 60", duration: 0.4, ease: "back.out(3)", immediateRender: false }, ${T(0.3)});\n`;
        js += `tl.to("#${id}q", { scale: 1.12, svgOrigin: "470 60", duration: ${r2(Math.max(0.3, (d - 1) / 4))}, yoyo: true, repeat: 3, ease: "sine.inOut" }, ${T(0.7)});\n`;
      }
      html += `<svg class="stk" viewBox="0 0 600 760">${svg}</svg>`;
      if (g.label) html += `<div class="glab gout" style="top:780px">${esc(g.label)}</div>`;
      break;
    }
    case "sign": {
      const ty = g.type || "warning";
      const shapes = {
        warning: '<path d="M260 30 L500 460 H20 Z" fill="#FFD43B" stroke="#061230" stroke-width="18" stroke-linejoin="round"/><rect x="238" y="160" width="44" height="170" rx="20" fill="#061230"/><circle cx="260" cy="390" r="26" fill="#061230"/>',
        stop: '<path d="M160 20h200l140 140v200L360 500H160L20 360V160z" fill="#e8243c" stroke="#fff" stroke-width="16"/><text x="260" y="300" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="120" fill="#fff">STOP</text>',
        check: '<circle cx="260" cy="260" r="230" fill="#1E6BFF" stroke="#fff" stroke-width="16"/><path d="M140 270l80 80 160-180" fill="none" stroke="#fff" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>',
        cross: '<circle cx="260" cy="260" r="230" fill="#e8243c" stroke="#fff" stroke-width="16"/><path d="M160 160l200 200M360 160L160 360" fill="none" stroke="#fff" stroke-width="44" stroke-linecap="round"/>',
        up: '<circle cx="260" cy="260" r="230" fill="#1E6BFF" stroke="#fff" stroke-width="16"/><path d="M260 400V130M150 240l110-110 110 110" fill="none" stroke="#fff" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>',
        down: '<circle cx="260" cy="260" r="230" fill="#e8243c" stroke="#fff" stroke-width="16"/><path d="M260 120v270M150 280l110 110 110-110" fill="none" stroke="#fff" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>',
      };
      html += `<svg class="sgn" id="${id}s" viewBox="0 0 520 520">${shapes[ty] || shapes.warning}</svg>`;
      if (g.text) html += `<div class="glab gout" style="top:640px">${esc(g.text)}</div>`;
      js += `tl.fromTo("#${id}s", { scale: 0, rotation: -25 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2.6)", immediateRender: false }, ${T(0.15)});\n`;
      const n = Math.max(1, Math.floor((d - 0.8) / 0.5));
      js += `tl.to("#${id}s", { rotation: 6, duration: 0.25, yoyo: true, repeat: ${n * 2 - 1}, ease: "sine.inOut" }, ${T(0.6)});\n`;
      break;
    }
    case "list": {
      const items = g.items || [];
      html += g.title ? `<div class="gt gout">${esc(g.title)}</div>` : "";
      const top0 = g.title ? 180 : 80, step = Math.min(140, (840 - top0) / Math.max(1, items.length));
      const gap = Math.max(0.25, (d - 0.9) / Math.max(1, items.length));
      items.forEach((txt, k) => {
        html += `<div class="li-row" id="${id}i${k}" style="top:${Math.round(top0 + k * step)}px"><div class="li-chk" id="${id}k${k}">${CHECK}</div><div class="li-txt">${esc(txt)}</div></div>`;
        js += `tl.fromTo("#${id}i${k}", { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power3.out", immediateRender: false }, ${T(0.3 + k * gap)});\n`;
        js += `tl.fromTo("#${id}k${k}", { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, ${T(0.45 + k * gap)});\n`;
      });
      break;
    }
    case "line": {
      const pts = g.points || [1, 2, 3];
      const mn = Math.min(...pts), mx = Math.max(...pts), span = mx - mn || 1;
      const xy = pts.map((v, k) => [60 + (780 * k) / Math.max(1, pts.length - 1), 520 - ((v - mn) / span) * 420]);
      let len = 0;
      for (let k = 1; k < xy.length; k++) len += Math.hypot(xy[k][0] - xy[k - 1][0], xy[k][1] - xy[k - 1][1]);
      const col = g.bad ? "#ff5a5a" : "#4FB3FF";
      const poly = xy.map((p) => p.map((n) => Math.round(n)).join(",")).join(" ");
      const area = `60,540 ${poly} ${Math.round(xy[xy.length - 1][0])},540`;
      const last = xy[xy.length - 1];
      html += g.title ? `<div class="gt gout">${esc(g.title)}</div>` : "";
      html += `<svg class="ln" viewBox="0 0 900 600"><line x1="60" y1="540" x2="860" y2="540" stroke="rgba(255,255,255,0.4)" stroke-width="6"/><line x1="60" y1="60" x2="60" y2="540" stroke="rgba(255,255,255,0.4)" stroke-width="6"/>
          <polygon id="${id}a" points="${area}" fill="${col}" opacity="0"/>
          <polyline id="${id}p" points="${poly}" fill="none" stroke="${col}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${Math.ceil(len)}" stroke-dashoffset="${Math.ceil(len)}"/>
          <circle id="${id}d" cx="${Math.round(last[0])}" cy="${Math.round(last[1])}" r="26" fill="#fff" stroke="${col}" stroke-width="10" opacity="0"/>
          ${g.labels ? `<text x="60" y="590" font-family="Montserrat" font-weight="700" font-size="34" fill="#fff">${esc(g.labels[0])}</text><text x="860" y="590" text-anchor="end" font-family="Montserrat" font-weight="700" font-size="34" fill="#fff">${esc(g.labels[1])}</text>` : ""}</svg>`;
      const draw = Math.min(1.4, d * 0.55);
      js += `tl.fromTo("#${id}p", { attr: { "stroke-dashoffset": ${Math.ceil(len)} } }, { attr: { "stroke-dashoffset": 0 }, duration: ${r2(draw)}, ease: "power2.inOut", immediateRender: false }, ${T(0.25)});\n`;
      js += `tl.fromTo("#${id}a", { opacity: 0 }, { opacity: 0.18, duration: 0.4, immediateRender: false }, ${T(0.25 + draw)});\n`;
      js += `tl.fromTo("#${id}d", { opacity: 0, scale: 0, svgOrigin: "${Math.round(last[0])} ${Math.round(last[1])}" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, ${T(0.25 + draw)});\n`;
      break;
    }
    case "lines": {
      // several series on one shared scale, each drawn at its own moment (`at`, seconds after t0)
      // series: [{ label, points, color: blue|blue2|red|red2, dash?, at, dur? }]; labels: [left, right]
      const COL = { blue: "#4FB3FF", blue2: "#9fd6ff", red: "#ff4d5e", red2: "#ff9aa3" };
      const S = g.series || [];
      const all = S.flatMap((s) => s.points);
      const mn = Math.min(0, ...all), mx = Math.max(...all), span = mx - mn || 1;
      // leftLabels: each series' name sits left of its first point (no legend) — simplest to read at a glance
      const LL = !!g.leftLabels;
      const X0 = LL ? 330 : 90, X1 = 900, Y0 = 560, Y1 = 60;
      html += g.title ? `<div class="gt gout">${esc(g.title)}</div>` : "";
      let svg = LL
        ? `<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="rgba(255,255,255,0.45)" stroke-width="6"/>${g.xLabel ? `<text x="${X1}" y="610" text-anchor="end" font-family="Montserrat" font-weight="700" font-size="34" fill="rgba(255,255,255,0.85)">${esc(g.xLabel)}</text>` : ""}`
        : `<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="rgba(255,255,255,0.45)" stroke-width="6"/><line x1="${X0}" y1="${Y1}" x2="${X0}" y2="${Y0}" stroke="rgba(255,255,255,0.45)" stroke-width="6"/>`;
      if (g.labels) svg += `<text x="${X0}" y="610" font-family="Montserrat" font-weight="700" font-size="32" fill="#fff">${esc(g.labels[0])}</text><text x="${X1}" y="610" text-anchor="end" font-family="Montserrat" font-weight="700" font-size="32" fill="#fff">${esc(g.labels[1])}</text>`;
      let leg = "";
      S.forEach((s, k) => {
        const xy = s.points.map((v, j) => [X0 + 10 + ((X1 - X0 - 30) * j) / Math.max(1, s.points.length - 1), Y0 - ((v - mn) / span) * (Y0 - Y1)]);
        let len = 0;
        for (let j = 1; j < xy.length; j++) len += Math.hypot(xy[j][0] - xy[j - 1][0], xy[j][1] - xy[j - 1][1]);
        const col = COL[s.color] || s.color || COL.blue, L = Math.ceil(len) + 2;
        const poly = xy.map((p) => p.map(Math.round).join(",")).join(" ");
        const last = xy[xy.length - 1].map(Math.round);
        // dashed series are drawn with a mask-free trick: draw solid with dashoffset, then switch to dashes when done
        svg += `<polyline id="${id}s${k}" points="${poly}" fill="none" stroke="${col}" stroke-width="${s.width || 14}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${L}" stroke-dashoffset="${L}"/>`;
        svg += `<circle id="${id}d${k}" cx="${last[0]}" cy="${last[1]}" r="18" fill="#fff" stroke="${col}" stroke-width="8" opacity="0"/>`;
        if (LL) {
          const f = xy[0].map(Math.round);
          svg += `<text id="${id}l${k}" x="${f[0] - 24}" y="${f[1] + 14}" text-anchor="end" font-family="Montserrat" font-weight="900" font-size="44" fill="${col}" opacity="0" style="paint-order:stroke" stroke="#061230" stroke-width="8">${esc(s.label)}</text>`;
        } else leg += `<div class="mln-it" id="${id}l${k}"><span class="mln-sw" style="background:${col}"></span>${esc(s.label)}</div>`;
        const at = T(s.at ?? 0.2 + k * 0.6), dur = s.dur ?? 1.0;
        js += `tl.fromTo("#${id}s${k}", { attr: { "stroke-dashoffset": ${L} } }, { attr: { "stroke-dashoffset": 0 }, duration: ${dur}, ease: "power2.inOut", immediateRender: false }, ${at});\n`;
        if (s.dash) js += `tl.set("#${id}s${k}", { attr: { "stroke-dasharray": "${s.dash}", "stroke-dashoffset": 0 } }, ${r2(at + dur)});\n`;
        js += `tl.fromTo("#${id}d${k}", { opacity: 0, scale: 0, svgOrigin: "${last[0]} ${last[1]}" }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)", immediateRender: false }, ${r2(at + dur)});\n`;
        js += LL
          ? `tl.fromTo("#${id}l${k}", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out", immediateRender: false }, ${at});\n`
          : `tl.fromTo("#${id}l${k}", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25, immediateRender: false }, ${at});\n`;
        if (s.pulse) js += `tl.to("#${id}d${k}", { scale: 1.6, svgOrigin: "${last[0]} ${last[1]}", duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, ${r2(at + dur + 0.25)});\n`;
      });
      html += `<svg class="mln" viewBox="0 0 960 640">${svg}</svg>${LL ? "" : `<div class="mln-leg">${leg}</div>`}`;
      break;
    }
    case "balance": {
      // exchange scale: left pan gets "what you pay", right pan "what you receive", then it settles level.
      // left/right: { label, emoji, color? }; times (seconds after t0): pay, receive, level; okText (badge at level)
      const P0 = g.pay ?? 0.5, R0 = g.receive ?? 1.3, LV = g.level ?? Math.max(R0 + 1, d - 1.2);
      const tok = (code, x, y, tid) => `<g id="${tid}">${H.emojiAt(code, x, y, 92)}</g>`;
      const pan = (side, ax, code, col) => {
        const p = `${id}p${side}`;
        let s = `<g id="${p}"><line x1="${ax}" y1="170" x2="${ax - 105}" y2="360" stroke="#cfe6ff" stroke-width="6"/><line x1="${ax}" y1="170" x2="${ax + 105}" y2="360" stroke="#cfe6ff" stroke-width="6"/>`;
        s += `<path d="M${ax - 130} 360 Q${ax} 430 ${ax + 130} 360 Z" fill="${col}" stroke="#fff" stroke-width="6"/>`;
        s += tok(code, ax - 100, 268, `${p}t0`) + tok(code, ax + 8, 268, `${p}t1`) + `</g>`;
        return s;
      };
      const lc = g.left.color || "#ff4d5e", rc = g.right.color || "#1E6BFF";
      let svg = `<path d="M380 690 L520 690 L490 640 L410 640 Z" fill="#cfe6ff"/><rect x="438" y="170" width="24" height="475" rx="10" fill="#cfe6ff"/>`;
      svg += `<g id="${id}beam"><rect x="120" y="158" width="660" height="24" rx="12" fill="#ffffff"/>${pan("L", 160, g.left.emoji, lc)}${pan("R", 740, g.right.emoji, rc)}</g>`;
      svg += `<circle cx="450" cy="170" r="26" fill="#1E6BFF" stroke="#fff" stroke-width="6"/>`;
      html += `<svg class="bal" viewBox="0 0 900 720">${svg}</svg>`;
      html += `<div class="bal-lab gout" style="left:-10px;color:${lc}">${esc(g.left.label)}</div><div class="bal-lab gout" style="left:570px;color:#4FB3FF">${esc(g.right.label)}</div>`;
      html += `<div class="bal-ok" id="${id}ok"><span>${esc(g.okText || "Equilibrio")}</span></div>`;
      const tilt = (deg, at, dur, ease) => {
        js += `tl.to("#${id}beam", { rotation: ${deg}, svgOrigin: "450 170", duration: ${dur}, ease: "${ease}" }, ${at});`;
        js += `tl.to("#${id}pL", { rotation: ${-deg}, svgOrigin: "160 170", duration: ${dur}, ease: "${ease}" }, ${at});`;
        js += `tl.to("#${id}pR", { rotation: ${-deg}, svgOrigin: "740 170", duration: ${dur}, ease: "${ease}" }, ${at});\n`;
      };
      ["L", "R"].forEach((side) => [0, 1].forEach((n) => { js += `tl.set("#${id}p${side}t${n}", { opacity: 0 }, ${T(0)});\n`; }));
      [0, 1].forEach((n) => { js += `tl.fromTo("#${id}pLt${n}", { y: -320, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "bounce.out", immediateRender: false }, ${T(P0 + n * 0.25)});\n`; });
      tilt(-14, T(P0 + 0.3), 0.6, "back.out(1.6)");
      [0, 1].forEach((n) => { js += `tl.fromTo("#${id}pRt${n}", { y: -320, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "bounce.out", immediateRender: false }, ${T(R0 + n * 0.25)});\n`; });
      tilt(9, T(R0 + 0.3), 0.6, "back.out(1.6)");
      tilt(-4, T(R0 + 1.0), 0.5, "sine.inOut");
      tilt(0, T(LV), 0.6, "elastic.out(1, 0.5)");
      js += `tl.fromTo("#${id}ok", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.5)", immediateRender: false }, ${T(LV + 0.1)});\n`;
      break;
    }
    case "rethink": {
      const SW = g.swap ?? Math.min(1.9, d * 0.6); // when the real criteria come in (seconds after t0)
      const items = g.to.items || [];
      html += `<div class="rt-card" id="${id}c"><div class="rt-q">${esc(g.from.question || "¿Cuánto lo sientes?")}</div>
          <svg class="rt-gauge" viewBox="0 0 600 340"><path d="M80 300 A220 220 0 0 1 190 109.5" fill="none" stroke="#4FB3FF" stroke-width="44"/><path d="M190 109.5 A220 220 0 0 1 410 109.5" fill="none" stroke="#FFD43B" stroke-width="44"/><path d="M410 109.5 A220 220 0 0 1 520 300" fill="none" stroke="#ff4d5e" stroke-width="44"/>
          <g id="${id}n"><line x1="300" y1="300" x2="300" y2="110" stroke="#fff" stroke-width="16" stroke-linecap="round"/></g><circle cx="300" cy="300" r="30" fill="#fff"/><circle cx="300" cy="300" r="12" fill="#1E6BFF"/></svg>
          <div class="rt-lab gout">${esc(g.from.label)}</div></div>`;
      html += `<svg class="rt-x" viewBox="0 0 660 640"><line id="${id}x" x1="40" y1="600" x2="620" y2="40" stroke="#e8243c" stroke-width="30" stroke-linecap="round" stroke-dasharray="820" stroke-dashoffset="820"/></svg>`;
      html += `<div class="rt-title" id="${id}t"><span>${esc(g.to.title)}</span></div>`;
      const step = 960 / Math.max(1, items.length);
      items.forEach((it, k) => {
        html += `<div class="rt-it" id="${id}i${k}" style="left:${Math.round(k * step + step / 2 - 150)}px"><div class="rt-disc"><div class="emo">${H.emoji(it.emoji)}</div><div class="rt-chk" id="${id}k${k}">${CHECK}</div></div><div class="rt-il gout">${esc(it.label)}</div></div>`;
      });
      js += `tl.set("#${id}n", { rotation: -75, svgOrigin: "300 300" }, ${T(0)});
`;
      js += `tl.to("#${id}n", { rotation: 72, svgOrigin: "300 300", duration: 0.7, ease: "power2.out" }, ${T(0.45)});
`;
      js += `tl.to("#${id}n", { rotation: 62, svgOrigin: "300 300", duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, ${T(1.15)});
`;
      js += `tl.fromTo("#${id}x", { attr: { "stroke-dashoffset": 820 } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.22, ease: "power3.in", immediateRender: false }, ${T(SW - 0.45)});
`;
      js += `tl.to(["#${id}c", "#${id}x"], { y: 700, rotation: 14, opacity: 0, duration: 0.4, ease: "power2.in" }, ${T(SW - 0.15)});
`;
      js += `tl.fromTo("#${id}t", { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power4.in", immediateRender: false }, ${T(SW)});
`;
      items.forEach((it, k) => {
        js += `tl.fromTo("#${id}i${k}", { opacity: 0, y: 80, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2.2)", immediateRender: false }, ${T(SW + 0.3 + k * 0.17)});
`;
        js += `tl.fromTo("#${id}k${k}", { scale: 0 }, { scale: 1, duration: 0.25, ease: "back.out(3)", immediateRender: false }, ${T(SW + 0.5 + k * 0.17)});
`;
      });
      break;
    }
    case "athlete": {
      const a = athlete(g, id, t0, d);
      html += a.html; js += a.js;
      break;
    }
    default:
      throw new Error(`Unknown graphic kind "${g.kind}"`);
  }
  return { html, js };
}

function render(g, i, H) {
  const id = `g${i}`;
  const t0 = r2(+g.t0), t1 = r2(+g.t1), d = r2(t1 - t0);
  const mode = g.mode === "panel" ? "panel" : "full";
  const b = body(g, id, H);
  const html = `      <div class="gfx ${mode}" id="${id}" data-layout-allow-overflow><div class="gfx-bg"></div><div class="gfx-box" id="${id}box">${b.html}</div></div>`;
  let js = `tl.fromTo("#${id}", { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, ${t0});\n`;
  js += mode === "full"
    ? `tl.fromTo("#${id}box", { scale: 0.85, y: 40 }, { scale: 1, y: 0, duration: 0.35, ease: "back.out(1.8)", immediateRender: false }, ${t0});\n`
    : `tl.fromTo("#${id}", { y: 120, rotation: -3 }, { y: 0, rotation: 0, duration: 0.35, ease: "back.out(1.8)", immediateRender: false }, ${t0});\n`;
  js += b.js;
  js += `tl.to("#${id}", { opacity: 0, duration: 0.15, ease: "power2.in" }, ${r2(t1 - 0.15)});\n`;
  return { html, js };
}

module.exports = { CSS, render };
