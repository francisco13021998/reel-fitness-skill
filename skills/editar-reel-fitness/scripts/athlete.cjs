// Cartoon athlete with a face (glasses, hair, black tee — Paco's look) doing gym actions.
//   { kind: "athlete", action: "curl-swing" | "press-grind", label?, badge?: "cross" | "check" }
//   curl-swing  = side view, dumbbell curl cheating with the whole body (lean back + hip thrust), strained face on each swing
//   press-grind = front view, standing barbell press: one slow rep, then a grinding rep that stalls and barely locks out
// The pose is computed from one linear "u" tween (seconds since t0) → deterministic and seek-safe.
const r2 = (n) => Math.round(n * 1000) / 1000;
const SKIN = "#F2C08F", SKIN_D = "#D99A66", HAIR = "#1B1410", SHIRT = "#171A22", PANTS = "#C9CED8", PANTS_D = "#A9AFBC", SHOE = "#F4F6FB", INK = "#2A1208";
const OUTLINE = "filter: drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 18px 30px rgba(0,0,0,0.45));";
const CHECK = '<path d="M14 34l12 12 24-28" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
const CROSS = '<path d="M18 18l28 28M46 18L18 46" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>';
const L = (x1, y1, x2, y2, w, c, id = "") => `<line ${id ? `id="${id}" ` : ""}x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;

// shared helpers embedded in the composition
const HELPERS = `const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
        const lerp = (a, b, x) => a + (b - a) * x;`;

function curlSwing(id, d) {
  const q = (s) => `${id}${s}`;
  let svg = "";
  // legs (static, side view facing right)
  svg += L(278, 430, 285, 565, 50, PANTS_D) + L(285, 565, 272, 688, 46, PANTS_D) + `<ellipse cx="290" cy="700" rx="40" ry="15" fill="${SHOE}"/>`;
  svg += `<g id="${q("legs")}">` + L(292, 430, 305, 565, 50, PANTS) + L(305, 565, 295, 688, 46, PANTS) + `<ellipse cx="318" cy="702" rx="42" ry="16" fill="${SHOE}"/></g>`;
  // body (rotates around the hips)
  svg += `<g id="${q("B")}">`;
  svg += `<g id="${q("arcs")}" opacity="0" fill="none" stroke="#4FB3FF" stroke-width="10" stroke-linecap="round"><path d="M215 200 Q185 260 205 330"/><path d="M180 230 Q160 280 175 340"/></g>`;
  svg += `<path d="M250 232 Q250 205 280 205 L306 205 Q336 205 338 236 L346 440 Q346 456 330 456 L256 456 Q240 456 240 440 Z" fill="${SHIRT}"/>`;
  svg += `<rect x="281" y="176" width="30" height="40" rx="8" fill="${SKIN}"/>`;
  svg += `<g id="${q("H")}">`;
  svg += `<circle cx="300" cy="135" r="62" fill="${SKIN}"/><path d="M240 138 Q234 70 300 66 Q356 66 362 112 Q330 94 300 100 Q272 104 266 146 Z" fill="${HAIR}"/>`;
  svg += `<circle cx="282" cy="142" r="13" fill="${SKIN_D}"/><path d="M359 124 Q378 148 358 156" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="4"/>`;
  svg += `<circle cx="337" cy="132" r="17" fill="rgba(255,255,255,0.18)" stroke="#0d0d0d" stroke-width="5"/>${L(320, 130, 288, 135, 5, "#0d0d0d")}`;
  svg += `<g id="${q("fN")}"><circle cx="340" cy="133" r="5" fill="${INK}"/>${L(325, 109, 351, 111, 6, HAIR)}<path d="M334 171 Q347 180 358 168" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></g>`;
  svg += `<g id="${q("fS")}" opacity="0"><path d="M331 127 L347 133 L331 139" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${L(324, 104, 352, 116, 7, HAIR)}<rect x="333" y="163" width="26" height="15" rx="5" fill="#fff" stroke="${INK}" stroke-width="4"/>${L(346, 164, 346, 177, 3, INK)}<circle cx="322" cy="160" r="11" fill="#ff4d4d" opacity="0.55"/></g>`;
  svg += `</g>`;
  // arm: shoulder (292,248) → elbow (292,360) → hand (292,478), dumbbell seen end-on
  svg += `<g id="${q("UA")}">${L(292, 255, 292, 360, 34, SKIN)}<circle cx="292" cy="252" r="31" fill="${SHIRT}"/>`;
  svg += `<g id="${q("FA")}">${L(292, 360, 292, 470, 30, SKIN)}<circle cx="292" cy="482" r="40" fill="#2C3A5A" stroke="#8FB8FF" stroke-width="7"/><circle cx="292" cy="482" r="13" fill="#8FB8FF"/><circle cx="292" cy="474" r="19" fill="${SKIN}"/></g></g>`;
  svg += `</g>`;
  // motion trail of the swing (around the elbow, not rotated with the body)
  svg += `<path id="${q("trail")}" d="M300 488 A128 128 0 0 0 410 300" fill="none" stroke="#fff" stroke-width="8" stroke-dasharray="4 22" stroke-linecap="round" opacity="0"/>`;

  const js = `{ ${HELPERS}
        const $ = (s) => document.getElementById("${id}" + s);
        const B = $("B"), H = $("H"), UA = $("UA"), FA = $("FA"), fN = $("fN"), fS = $("fS"), arcs = $("arcs"), trail = $("trail");
        const P = 0.95, S0 = 0.15;
        const pose = (u) => {
          let lean = 0, up = 0, fo = 0, st = 0;
          if (u > S0) {
            const p = (u - S0) % P;
            if (p < 0.22) { lean = 9 * sm(p / 0.22); }
            else if (p < 0.5) { const x = sm((p - 0.22) / 0.28); lean = lerp(9, -24, x); up = -30 * x; fo = -150 * x; st = x; }
            else if (p < 0.62) { lean = -24; up = -30; fo = -150; st = 1; }
            else { const x = sm((p - 0.62) / 0.33); lean = -24 * (1 - x); up = -30 * (1 - x); fo = -150 * (1 - x); st = 1 - x; }
          }
          const tx = -lean * 0.7;
          B.setAttribute("transform", "translate(" + tx + " 0) rotate(" + lean + " 290 440)");
          H.setAttribute("transform", "rotate(" + (lean * 0.35) + " 296 196)");
          UA.setAttribute("transform", "rotate(" + up + " 292 252)");
          FA.setAttribute("transform", "rotate(" + fo + " 292 360)");
          fS.setAttribute("opacity", st > 0.35 ? 1 : 0); fN.setAttribute("opacity", st > 0.35 ? 0 : 1);
          arcs.setAttribute("opacity", Math.max(0, (-lean - 12) / 12));
          trail.setAttribute("opacity", Math.max(0, (st - 0.3)) * 0.9);
        };
        pose(0);
        const o = { u: 0 };
        tl.fromTo(o, { u: 0 }, { u: ${r2(d)}, duration: ${r2(d)}, ease: "none", immediateRender: false, onUpdate: () => pose(o.u) }, T0); }`;
  return { svg, js };
}

function pressGrind(id, d) {
  const q = (s) => `${id}${s}`;
  let svg = "";
  svg += L(268, 440, 256, 688, 52, PANTS) + L(332, 440, 344, 688, 52, PANTS) + `<ellipse cx="246" cy="700" rx="44" ry="17" fill="${SHOE}"/><ellipse cx="354" cy="700" rx="44" ry="17" fill="${SHOE}"/>`;
  svg += `<g id="${q("BB")}">`;
  svg += `<path d="M205 252 Q205 214 245 212 L355 212 Q395 214 395 252 L372 456 Q370 467 356 467 L244 467 Q230 467 228 456 Z" fill="${SHIRT}"/>`;
  svg += `<rect x="282" y="182" width="36" height="36" rx="9" fill="${SKIN}"/>`;
  svg += `<g id="${q("HD")}">`;
  svg += `<circle cx="233" cy="142" r="14" fill="${SKIN_D}"/><circle cx="367" cy="142" r="14" fill="${SKIN_D}"/><circle cx="300" cy="135" r="66" fill="${SKIN}"/>`;
  svg += `<circle id="${q("red")}" cx="300" cy="135" r="66" fill="#ff3b3b" opacity="0"/>`;
  svg += `<path d="M234 130 Q230 60 300 58 Q370 60 366 130 Q352 94 300 92 Q248 94 234 130 Z" fill="${HAIR}"/>`;
  svg += `<path id="${q("vein")}" d="M318 82 l-6 10 l7 8 l-6 10" fill="none" stroke="#c43c3c" stroke-width="4" stroke-linecap="round" opacity="0"/>`;
  svg += L(255, 106, 292, 121, 7, HAIR) + L(345, 106, 308, 121, 7, HAIR);
  svg += `<path d="M265 134 L283 140 L265 146" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M335 134 L317 140 L335 146" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  svg += `<circle cx="274" cy="139" r="20" fill="rgba(255,255,255,0.18)" stroke="#0d0d0d" stroke-width="5"/><circle cx="326" cy="139" r="20" fill="rgba(255,255,255,0.18)" stroke="#0d0d0d" stroke-width="5"/>${L(294, 137, 306, 137, 5, "#0d0d0d")}${L(254, 136, 236, 132, 5, "#0d0d0d")}${L(346, 136, 364, 132, 5, "#0d0d0d")}`;
  svg += `<g id="${q("mouth")}"><rect x="274" y="168" width="52" height="22" rx="7" fill="#fff" stroke="${INK}" stroke-width="4"/>${L(276, 179, 324, 179, 3, INK)}${L(287, 170, 287, 188, 3, INK)}${L(300, 170, 300, 188, 3, INK)}${L(313, 170, 313, 188, 3, INK)}</g>`;
  svg += `<circle cx="256" cy="164" r="14" fill="#ff4d4d" opacity="0.55"/><circle cx="344" cy="164" r="14" fill="#ff4d4d" opacity="0.55"/>`;
  svg += `<path id="${q("sw1")}" d="M226 92 q-9 14 0 20 q9 -6 0 -20z" fill="#9fd6ff"/><path id="${q("sw2")}" d="M376 98 q-9 14 0 20 q9 -6 0 -20z" fill="#9fd6ff"/>`;
  svg += `</g>`;
  // bar (behind the hands) and plates
  svg += `<path id="${q("bar")}" d="" fill="none" stroke="#CFD8E8" stroke-width="14" stroke-linecap="round"/>`;
  svg += `<g id="${q("plL")}"><rect x="-22" y="-78" width="44" height="156" rx="10" fill="#1E6BFF" stroke="#0a2a66" stroke-width="5"/><rect x="-36" y="-50" width="20" height="100" rx="6" fill="#4FB3FF"/></g>`;
  svg += `<g id="${q("plR")}"><rect x="-22" y="-78" width="44" height="156" rx="10" fill="#1E6BFF" stroke="#0a2a66" stroke-width="5"/><rect x="16" y="-50" width="20" height="100" rx="6" fill="#4FB3FF"/></g>`;
  // arms
  ["L", "R"].forEach((s) => {
    svg += `<line id="${q("u" + s)}" stroke="${SKIN}" stroke-width="36" stroke-linecap="round"/><line id="${q("f" + s)}" stroke="${SKIN}" stroke-width="32" stroke-linecap="round"/>`;
    svg += `<circle id="${q("s" + s)}" r="32" fill="${SHIRT}"/><circle id="${q("h" + s)}" r="21" fill="${SKIN}"/>`;
  });
  svg += `</g>`;
  svg += `<g id="${q("fx")}" fill="none" stroke="#4FB3FF" stroke-width="9" stroke-linecap="round" opacity="0"><path d="M120 40 l-30 -20"/><path d="M110 80 l-40 0"/><path d="M480 40 l30 -20"/><path d="M490 80 l40 0"/></g>`;

  const js = `{ ${HELPERS}
        const $ = (s) => document.getElementById("${id}" + s);
        const set = (el, a) => { for (const k in a) el.setAttribute(k, a[k]); };
        const RACK = 222, TOP = 50, A = 118, Bl = 112;
        // key heights of the bar (seconds since t0): slow rep, lower, grinding rep that stalls and barely locks out
        const K = [[0, RACK], [0.3, RACK], [1.3, TOP + 6], [1.5, TOP + 6], [1.9, RACK], [2.05, RACK], [2.6, 104], [3.25, 92], [${r2(Math.max(3.6, d - 0.25))}, TOP + 12]];
        const AMP = [[0, 1.5], [0.3, 3], [1.3, 2], [1.9, 1.5], [2.5, 4], [2.7, 8], [3.25, 8], [${r2(Math.max(3.6, d - 0.25))}, 4]];
        const track = (KS, u) => { for (let i = 1; i < KS.length; i++) if (u <= KS[i][0]) { const x = sm((u - KS[i - 1][0]) / (KS[i][0] - KS[i - 1][0] || 1)); return lerp(KS[i - 1][1], KS[i][1], x); } return KS[KS.length - 1][1]; };
        const arm = (s, sx, sy, hx, hy, out) => {
          let dx = hx - sx, dy = hy - sy, dd = Math.min(Math.hypot(dx, dy), A + Bl - 1);
          const base = Math.atan2(dy, dx), off = Math.acos((A * A + dd * dd - Bl * Bl) / (2 * A * dd)) * out;
          const ex = sx + Math.cos(base + off) * A, ey = sy + Math.sin(base + off) * A;
          set($("u" + s), { x1: sx, y1: sy, x2: ex, y2: ey }); set($("f" + s), { x1: ex, y1: ey, x2: hx, y2: hy });
          set($("s" + s), { cx: sx, cy: sy + 4 }); set($("h" + s), { cx: hx, cy: hy });
        };
        const pose = (u) => {
          const amp = track(AMP, u), sh = amp * Math.sin(u * 57) + amp * 0.5 * Math.sin(u * 101);
          const y = track(K, u) + sh, sag = 10 + amp * 1.2, tilt = sh * 0.25;
          const lx = 158, rx = 442, ly = y + tilt, ry = y - tilt;
          set($("bar"), { d: "M40 " + (ly + sag) + " Q300 " + (y - sag * 0.6) + " 560 " + (ry + sag) });
          $("plL").setAttribute("transform", "translate(48 " + (ly + sag) + ") rotate(" + (-sag * 0.5) + ")");
          $("plR").setAttribute("transform", "translate(552 " + (ry + sag) + ") rotate(" + (sag * 0.5) + ")");
          arm("L", 220, 252, lx, ly, -1); arm("R", 380, 252, rx, ry, 1);
          $("BB").setAttribute("transform", "translate(" + (sh * 0.35) + " 0)");
          const strain = Math.min(1, 0.25 + u / 3.2);
          $("red").setAttribute("opacity", 0.32 * strain); $("vein").setAttribute("opacity", strain > 0.75 ? 1 : 0);
          $("fx").setAttribute("opacity", amp > 5 ? 1 : 0);
          [["sw1", 0], ["sw2", 0.45]].forEach(([s, ph]) => { const f = ((u * 1.1 + ph) % 1); $(s).setAttribute("transform", "translate(0 " + (f * 70) + ")"); $(s).setAttribute("opacity", 1 - f); });
        };
        pose(0);
        const o = { u: 0 };
        tl.fromTo(o, { u: 0 }, { u: ${r2(d)}, duration: ${r2(d)}, ease: "none", immediateRender: false, onUpdate: () => pose(o.u) }, T0); }`;
  return { svg, js };
}

function athlete(g, id, t0, d) {
  const a = g.action === "press-grind" ? pressGrind(id, d) : curlSwing(id, d);
  let html = `<svg class="stk" viewBox="0 0 600 760" style="overflow:visible; transform: scale(1.2); transform-origin: 50% 0; ${OUTLINE}">${a.svg}</svg>`;
  let js = a.js.replace(/T0\)/g, `${r2(t0)})`) + "\n";
  if (g.badge) {
    const bad = g.badge === "cross";
    html += `<div class="vs-mark" id="${id}bd" style="left:770px; top:20px; right:auto; background:${bad ? "#e8243c" : "#1E6BFF"}"><svg viewBox="0 0 64 64">${bad ? CROSS : CHECK}</svg></div>`;
    js += `tl.fromTo("#${id}bd", { scale: 2.4, opacity: 0, rotation: -15 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.22, ease: "power4.in", immediateRender: false }, ${r2(t0 + Math.min(0.75, d * 0.35))});\n`;
  }
  if (g.label) html += `<div class="glab gout" style="top:900px">${String(g.label).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div>`;
  return { html, js };
}

module.exports = { athlete };
