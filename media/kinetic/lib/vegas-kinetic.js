/* vegas-kinetic.js — Las Vegas kinetic elements for PaddockIntel (F1), canvas 2D.
 *
 * Contract (media/kinetic):
 *   - Pure canvas 2D, single file, no dependencies, no DOM/SVG/CSS at runtime.
 *   - Deterministic: every frame is a pure function of t (seconds). No Date,
 *     performance.now(), requestAnimationFrame, timers or unseeded randomness.
 *   - Colors only arrive through options (ink / paper / accent).
 *
 *   VegasKinetic.draw(ctx, 'slotreel', { x, y, size, t, value: '1,4B', ink, paper, accent });
 *
 * Common options: x, y, size (px per 220 units), t, enter (0..1), alpha, ink,
 * paper, accent, lineWidth (1.6), speed (1), animate (true), glow (units, 5),
 * grain (0..1, 0.12), font (canvas font family), seed (int).
 * Element data options are documented in README.md.
 */
(function (root) {
  'use strict';

  // ------------------------------------------------------------------ utils
  const TAU = Math.PI * 2;
  const cache = new Map();
  function P(d) {
    let p = cache.get(d);
    if (!p) { if (cache.size > 6000) cache.clear(); p = new Path2D(d); cache.set(d, p); }
    return p;
  }
  const I = () => new DOMMatrix();
  const f3 = n => Math.round(n * 1000) / 1000;
  const clamp = (x, a, b) => x < (a == null ? 0 : a) ? (a == null ? 0 : a) : x > (b == null ? 1 : b) ? (b == null ? 1 : b) : x;
  const lerp = (a, b, s) => a + (b - a) * s;
  const smooth = x => x * x * (3 - 2 * x);
  const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
  const easeOutQuart = x => 1 - Math.pow(1 - x, 4);
  const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function easeOutBack(x, s) { const c1 = s == null ? 1.70158 : s, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function cyc(t, p, d) { let u = ((t + (d || 0)) / p) % 1; return u < 0 ? u + 1 : u; }
  const wave01 = (t, p, d) => (1 - Math.cos(TAU * cyc(t, p, d))) / 2;
  const mod = (a, n) => ((a % n) + n) % n;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hash3(a, b, c) {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul((b | 0) + 0x9E37, 668265263) ^ Math.imul((c | 0) + 0x85EB, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  // path strings
  const ell = (cx, cy, rx, ry) => `M${f3(cx - rx)} ${f3(cy)} A${f3(rx)} ${f3(ry)} 0 1 0 ${f3(cx + rx)} ${f3(cy)} A${f3(rx)} ${f3(ry)} 0 1 0 ${f3(cx - rx)} ${f3(cy)} Z`;
  const circ = (cx, cy, r) => ell(cx, cy, r, r);
  const R = (x, y, w, h) => `M${f3(x)} ${f3(y)} H${f3(x + w)} V${f3(y + h)} H${f3(x)} Z`;
  function RR(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return `M${f3(x + r)} ${f3(y)} H${f3(x + w - r)} A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + w)} ${f3(y + r)} V${f3(y + h - r)} A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + w - r)} ${f3(y + h)} H${f3(x + r)} A${f3(r)} ${f3(r)} 0 0 1 ${f3(x)} ${f3(y + h - r)} V${f3(y + r)} A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + r)} ${f3(y)} Z`;
  }
  function starPath(n, r1, r2) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r2 : r1;
      d += (i ? 'L' : 'M') + f3(r * Math.cos(a)) + ' ' + f3(r * Math.sin(a)) + ' ';
    }
    return d + 'Z';
  }

  // ------------------------------------------------------------ drawing core
  const NO = {};
  const col = (c, k) => k === 'k' ? c.ink : k === 'p' ? c.paper : k === 'a' ? c.accent : k;
  function effScale(ctx) { const m = ctx.getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)); }
  // Glow, one pass. 'flat' (default): a wide translucent stroke of the same ink, like an
  // offset second print pass; cheap. 'blur': real canvas shadowBlur; prettier, costlier.
  const HALO_A = 0.24;
  function setGlow(c, key, amt) {
    if (c.glow <= 0 || !amt) return;
    c.ctx.shadowColor = col(c, key);
    c.ctx.shadowBlur = c.glow * amt * effScale(c.ctx);
  }
  function halo(c, path, key, amt, baseLw, rule) {
    if (c.glow <= 0 || !amt) return;
    const ctx = c.ctx, lw0 = ctx.lineWidth, g0 = ctx.globalAlpha;
    ctx.globalAlpha = g0 * HALO_A;
    ctx.strokeStyle = col(c, key);
    ctx.lineWidth = (baseLw || 0) + c.glow * 1.3 * amt;
    ctx.stroke(path);
    ctx.lineWidth = lw0; ctx.globalAlpha = g0;
    void rule;
  }
  // Grain: specks precomputed once inside each static shape (no runtime clipping).
  const gcache = new Map();
  function specks(c, key, base, box, rule) {
    let p = gcache.get(key);
    if (p) return p;
    p = new Path2D();
    const ctx = c.ctx, r = mulberry32(hashStr('grain' + key));
    const n = Math.round(box[2] * box[3] / 150);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < n; i++) {
      const x = box[0] + r() * box[2], y = box[1] + r() * box[3];
      if (ctx.isPointInPath(base, x, y, rule || 'nonzero')) p.rect(f3(x), f3(y), 1.2, 1.2);
    }
    ctx.restore();
    if (gcache.size > 400) gcache.clear();
    gcache.set(key, p);
    return p;
  }
  function grainIn(c, base, m, opt) {
    if (c.grain <= 0 || !opt.gbox) return;
    const key = (opt.gkey || (typeof opt.gsrc === 'string' ? opt.gsrc : '')) + '|' + opt.gbox.join(',') + (opt.evenodd ? 'e' : '');
    const sp = specks(c, key, base, opt.gbox, opt.evenodd ? 'evenodd' : 'nonzero');
    const ctx = c.ctx, g0 = ctx.globalAlpha;
    let T0 = null;
    if (m && !m.isIdentity) { T0 = ctx.getTransform(); ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f); }
    ctx.globalAlpha = g0 * c.grain;
    ctx.fillStyle = c.ink;
    ctx.fill(sp);
    ctx.globalAlpha = g0;
    if (T0) ctx.setTransform(T0);
  }
  // Draw one shape. fill: 'k' ink · 'p' paper · 'a' accent · null.
  // m transforms geometry only, so stroke width never scales internally.
  function sh(c, d, fill, m, opt) {
    const ctx = c.ctx;
    opt = opt || NO;
    const base = typeof d === 'string' ? P(d) : d;
    let path = base;
    let T0 = null;
    if (m && !m.isIdentity) {
      if (Math.abs(m.a * m.a + m.b * m.b - 1) < 1e-9 && Math.abs(m.c + m.b) < 1e-9 && Math.abs(m.d - m.a) < 1e-9) {
        // rigid motion (translate/rotate): stroke width is unaffected, so move the context and reuse the cached path
        T0 = ctx.getTransform(); ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f); m = null;
      } else { const q = new Path2D(); q.addPath(base, m); path = q; }
    }
    const blur = c.glowMode === 'blur';
    const g0 = ctx.globalAlpha;
    if (opt.alpha != null) ctx.globalAlpha = g0 * opt.alpha;
    if (fill) {
      if (opt.glowFill && !blur) halo(c, path, fill, opt.glowFill, 0);
      ctx.fillStyle = col(c, fill);
      if (opt.glowFill && blur) setGlow(c, fill, opt.glowFill);
      ctx.fill(path, opt.evenodd ? 'evenodd' : 'nonzero');
      ctx.shadowBlur = 0;
      if (opt.grain) grainIn(c, base, m, Object.assign({ gsrc: d }, opt));
    }
    if (!opt.noStroke) {
      const lw0 = ctx.lineWidth;
      if (opt.lw) ctx.lineWidth = opt.lw * c.lwk;
      if (opt.dash) { ctx.setLineDash(opt.dash); ctx.lineDashOffset = opt.dashOffset || 0; }
      if (opt.glow && !blur) halo(c, path, opt.color || 'k', opt.glow, ctx.lineWidth);
      ctx.strokeStyle = col(c, opt.color || 'k');
      if (opt.glow && blur) setGlow(c, opt.color || 'k', opt.glow);
      ctx.stroke(path);
      ctx.shadowBlur = 0;
      if (opt.dash) ctx.setLineDash([]);
      ctx.lineWidth = lw0;
    }
    ctx.globalAlpha = g0;
    if (T0) ctx.setTransform(T0);
    return path;
  }
  // Bulbs: all lit ones in ONE glow pass, unlit ones in one flat pass.
  function bulbs(c, pts, r, isLit, litAlpha, glowAmt) {
    const lit = new Path2D(), dim = new Path2D();
    for (let i = 0; i < pts.length; i++) {
      const p = isLit(i) ? lit : dim;
      p.moveTo(pts[i][0] + r, pts[i][1]); p.arc(pts[i][0], pts[i][1], r, 0, TAU);
    }
    sh(c, dim, 'a', null, { noStroke: true, alpha: 0.22 });
    sh(c, lit, 'a', null, { noStroke: true, alpha: litAlpha == null ? 1 : litAlpha, glowFill: glowAmt == null ? 1 : glowAmt });
  }
  // Text in unit space. o: { px, weight, family, align, baseline, color, alpha, glow, maxW, ls, m }
  function text(c, str, x, y, o) {
    const ctx = c.ctx;
    ctx.save();
    if (o.m) ctx.transform(o.m.a, o.m.b, o.m.c, o.m.d, o.m.e, o.m.f);
    let px = o.px;
    const fam = o.family || c.font, wt = o.weight || 700;
    ctx.font = `${wt} ${px}px ${fam}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px';
    if (o.maxW) {
      const w = ctx.measureText(str).width;
      if (w > o.maxW) { px = px * o.maxW / w; ctx.font = `${wt} ${px}px ${fam}`; if ('letterSpacing' in ctx) ctx.letterSpacing = ((o.ls || 0) * o.maxW / w) + 'px'; }
    }
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.baseline || 'middle';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.glow && c.glow > 0) {
      if (c.glowMode === 'blur') setGlow(c, o.color || 'k', o.glow);
      else {
        const g0 = ctx.globalAlpha;
        ctx.globalAlpha = g0 * HALO_A;
        ctx.strokeStyle = col(c, o.color || 'k');
        ctx.lineWidth = c.glow * 1.1 * o.glow;
        ctx.lineJoin = 'round';
        ctx.strokeText(str, x, y);
        ctx.globalAlpha = g0;
      }
    }
    ctx.fillStyle = col(c, o.color || 'k');
    ctx.fillText(str, x, y);
    ctx.restore();
    return px;
  }
  function measure(c, str, px, wt, fam) {
    const ctx = c.ctx;
    ctx.save();
    ctx.font = `${wt || 700} ${px}px ${fam || c.font}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  }

  // ============================================================== ELEMENTS
  const EL = {};
  const DUR = {};
  const BOX = {};

  // ---------------------------------------------------------------- slotreel
  // value: string, e.g. '1,4B' or '$347M'. Digits spin; other characters are fixed plates.
  // delay (0.15), spin (0.9), stagger (0.32): timing in seconds.
  function slotLayout(str) {
    const chars = [...str];
    const DW = 80, GAP = 8, WH = 140, PAD = 18;
    // digits spin; punctuation gets a narrow plate; letters/symbols a medium one
    const ws = chars.map(ch => /[0-9]/.test(ch) ? DW : /[,.:'·\s]/.test(ch) ? 40 : /[MW%€$]/.test(ch) ? 82 : 70);
    const inner = ws.reduce((a, b) => a + b, 0) + GAP * (chars.length - 1);
    const W = inner + PAD * 2, H = WH + PAD * 2;
    let x = -inner / 2, j = 0;
    const reels = chars.map((ch, i) => {
      const r = { ch, x, w: ws[i], digit: /[0-9]/.test(ch), order: /[0-9]/.test(ch) ? j++ : -1 };
      x += ws[i] + GAP;
      return r;
    });
    return { reels, W, H, WH, digits: j };
  }
  EL.slotreel = function (c, o) {
    const str = String(o.value == null ? '777' : o.value);
    const L = slotLayout(str);
    const { W, H, WH } = L;
    const start = o.delay == null ? 0.15 : o.delay, spin = o.spin == null ? 0.9 : o.spin, stag = o.stagger == null ? 0.32 : o.stagger;
    const lastStop = start + spin + Math.max(0, L.digits - 1) * stag;
    const done = c.still || c.t >= lastStop + 0.3;
    const cell = WH * 0.92;

    // cabinet
    sh(c, RR(-W / 2 - 8, -H / 2 - 8, W + 16, H + 16, 20), 'p', null, { grain: true, glow: 0.7, gbox: [-W / 2 - 8, -H / 2 - 8, W + 16, H + 16] });
    sh(c, RR(-W / 2, -H / 2, W, H, 13), null, null, { color: 'a' });

    // header bulbs
    const nb = Math.max(4, Math.floor((W + 16) / 18));
    const hb = [];
    for (let i = 0; i < nb; i++) hb.push([-W / 2 - 8 + (i + 0.5) * (W + 16) / nb, -H / 2 - 22]);
    const step = Math.floor(c.t * (done ? 6 : 14));
    bulbs(c, hb, 4, i => c.still || mod(i - step, 3) === 0);

    for (const r of L.reels) {
      const win = RR(r.x, -WH / 2, r.w, WH, 9);
      sh(c, win, 'p', null, { noStroke: true });
      const ctx = c.ctx;
      ctx.save();
      ctx.clip(P(win));
      const cx = r.x + r.w / 2;
      if (r.digit) {
        const target = +r.ch;
        const ts = start + spin + r.order * stag;
        let p, v = 0, tau = c.t - ts;
        if (c.still || tau >= 0) {
          p = target + (c.still ? 0 : -0.16 * Math.exp(-6 * tau) * Math.sin(20 * tau));
        } else {
          const u = clamp((c.t - start) / (ts - start));
          const seedStart = Math.floor(hash3(r.order, c.seed, 3) * 10);
          const D = (3 + r.order) * 10 + mod(target - seedStart, 10);
          p = seedStart + D * easeOutCubic(u);
          v = c.t < start ? 0 : D * 3 * Math.pow(1 - u, 2) / (ts - start);
        }
        const flash = !c.still && tau >= 0 && tau < 0.35;
        const blur = v > 7;
        const base = Math.floor(p);
        for (let j = base - 1; j <= base + 2; j++) {
          const y = (p - j) * cell;
          if (Math.abs(y) > cell * 1.2) continue;
          const dv = String(mod(j, 10));
          const landed = !blur && (c.still || tau >= 0);
          const tOpt = { px: 108, weight: 700, color: flash ? 'a' : 'k', glow: landed ? (flash ? 1.6 : 0.8) : 0, alpha: blur ? 0.55 : 1 };
          text(c, dv, cx, y + 4, tOpt);
          if (blur) {
            text(c, dv, cx, y + 4 - cell * 0.14, { px: 108, weight: 700, color: 'k', alpha: 0.22 });
            text(c, dv, cx, y + 4 + cell * 0.14, { px: 108, weight: 700, color: 'k', alpha: 0.22 });
          }
        }
      } else {
        text(c, r.ch, cx, 4, { px: 84, weight: 700, color: 'a', glow: 0.6, maxW: r.w - 10 });
      }
      // flat curvature bands (screen-print shading, no gradients)
      sh(c, R(r.x, -WH / 2, r.w, WH * 0.2), 'p', null, { noStroke: true, alpha: 0.6 });
      sh(c, R(r.x, WH / 2 - WH * 0.2, r.w, WH * 0.2), 'p', null, { noStroke: true, alpha: 0.6 });
      sh(c, R(r.x, -WH / 2, r.w, WH * 0.08), 'p', null, { noStroke: true, alpha: 0.6 });
      sh(c, R(r.x, WH / 2 - WH * 0.08, r.w, WH * 0.08), 'p', null, { noStroke: true, alpha: 0.6 });
      ctx.restore();
      sh(c, win, null, null, { color: 'a' });
    }
    // payline
    sh(c, `M${f3(-W / 2 - 4)} 0 H${f3(W / 2 + 4)}`, null, null, { color: 'a', alpha: 0.45 });
    sh(c, `M${f3(-W / 2 - 16)} -8 L${f3(-W / 2 - 4)} 0 L${f3(-W / 2 - 16)} 8 Z`, 'a', null, { noStroke: true, glowFill: done ? 0.8 : 0 });
    sh(c, `M${f3(W / 2 + 16)} -8 L${f3(W / 2 + 4)} 0 L${f3(W / 2 + 16)} 8 Z`, 'a', null, { noStroke: true, glowFill: done ? 0.8 : 0 });
  };
  DUR.slotreel = o => { const L = slotLayout(String(o.value == null ? '777' : o.value)); return (o.delay == null ? 0.15 : o.delay) + (o.spin == null ? 0.9 : o.spin) + Math.max(0, L.digits - 1) * (o.stagger == null ? 0.32 : o.stagger) + 0.4; };
  BOX.slotreel = o => { const L = slotLayout(String(o.value == null ? '777' : o.value)); return { w: L.W + 48, h: L.H + 56 }; };

  // ---------------------------------------------------------------- cardflip
  // text ('A'), corner (first char of text), angle (rest angle deg, -6), flipAt (0.35), flipDur (0.6)
  const CW = 140, CH = 196;
  const CARD = RR(-CW / 2, -CH / 2, CW, CH, 12);
  const CARD_IN = RR(-CW / 2 + 10, -CH / 2 + 10, CW - 20, CH - 20, 7);
  const LATTICE = (() => {
    let d = '';
    for (let k = -260; k <= 260; k += 16) { d += `M${k - 120} -120 L${k + 120} 120 `; d += `M${k + 120} -120 L${k - 120} 120 `; }
    return d;
  })();
  const MEDAL_STAR = starPath(8, 22, 11);
  const PIP = 'M0 -8 L6 0 L0 8 L-6 0 Z';
  EL.cardflip = function (c, o) {
    const txt = String(o.text == null ? 'A' : o.text);
    const corner = o.corner == null ? txt.slice(0, 1) : String(o.corner);
    const fa = o.flipAt == null ? 0.35 : o.flipAt, fd = o.flipDur == null ? 0.6 : o.flipDur;
    const u = c.still ? 1 : clamp((c.t - fa) / fd);
    const th = Math.PI * easeInOut(u);
    const sx = Math.cos(th);
    const lift = 1 + 0.08 * Math.sin(Math.PI * u);
    const rest = o.angle == null ? -6 : o.angle;
    const idle = !c.still && u >= 1;
    const bob = idle ? -3 * wave01(c.t - fa - fd, 3.2) : 0;
    const sway = idle ? 1.2 * Math.sin(TAU * (c.t - fa - fd) / 4.4) : 0;
    const m = I().translate(0, bob).rotate(rest * easeOutCubic(u) + sway).scale(Math.max(Math.abs(sx), 0.002) * lift, lift);
    const ctx = c.ctx;
    if (sx > 0) {
      const card = sh(c, CARD, 'p', m, { grain: true, glow: 0.7, gbox: [-CW / 2, -CH / 2, CW, CH] });
      sh(c, CARD_IN, null, m, { color: 'a' });
      ctx.save();
      ctx.clip(sh(c, CARD_IN, null, m, { noStroke: true }));
      sh(c, LATTICE, null, m, { color: 'a', alpha: 0.5 });
      ctx.restore();
      sh(c, circ(0, 0, 34), 'p', m, { color: 'a' });
      sh(c, circ(0, 0, 28), null, m, { color: 'k', glow: 0.6 });
      sh(c, MEDAL_STAR, 'a', m, { noStroke: true, glowFill: 0.6 });
      sh(c, circ(0, 0, 5), 'p', m, { noStroke: true });
      void card;
    } else {
      sh(c, CARD, 'p', m, { grain: true, glow: 0.7, gbox: [-CW / 2, -CH / 2, CW, CH] });
      sh(c, CARD_IN, null, m, { color: 'k', alpha: 0.45 });
      text(c, corner, -CW / 2 + 22, -CH / 2 + 26, { px: 20, weight: 800, color: 'k', m });
      sh(c, PIP, 'a', m.translate(-CW / 2 + 22, -CH / 2 + 46), { noStroke: true });
      const m180 = m.rotate(180);
      text(c, corner, -CW / 2 + 22, -CH / 2 + 26, { px: 20, weight: 800, color: 'k', m: m180 });
      sh(c, PIP, 'a', m180.translate(-CW / 2 + 22, -CH / 2 + 46), { noStroke: true });
      text(c, txt, 0, 4, { px: 64, weight: 800, color: 'k', glow: 1, maxW: CW - 34, m });
    }
    if (Math.abs(sx) < 0.06 && !c.still) sh(c, `M0 ${-CH / 2} V${CH / 2}`, null, I().translate(0, bob).rotate(rest * easeOutCubic(u)).scale(1, lift), { color: 'k', glow: 0.6 });
  };
  DUR.cardflip = o => (o.flipAt == null ? 0.35 : o.flipAt) + (o.flipDur == null ? 0.6 : o.flipDur);
  BOX.cardflip = () => ({ w: 170, h: 220 });

  // ---------------------------------------------------------------- chipstack
  // value (10) or values [..]; labels [..] under each stack; showValue (true);
  // rate (chips/s, 14); delay (0.15); max (chip count that fills the height).
  const RX = 34, RY = 11;
  const chipSide = h => `M${-RX} 0 V${f3(h)} A${RX} ${RY} 0 0 0 ${RX} ${f3(h)} V0 A${RX} ${RY} 0 0 1 ${-RX} 0 Z`;
  const chipMarks = h => [0.28, 0.5, 0.72].map(a => { const x = f3(RX * Math.cos(a * Math.PI)), y = f3(RY * Math.sin(a * Math.PI)); return `M${x} ${y} V${f3(y + h)}`; }).join(' ');
  EL.chipstack = function (c, o) {
    const vals = (o.values || [o.value == null ? 10 : o.value]).map(v => Math.max(0, Math.round(+v || 0)));
    const labels = o.labels || [];
    const maxN = Math.max(1, o.max || Math.max.apply(null, vals));
    const h = Math.min(10, 150 / maxN);
    const rate = o.rate == null ? 14 : o.rate, start = o.delay == null ? 0.15 : o.delay;
    const SP = 100, n = vals.length, base = 74;
    vals.forEach((N, s) => {
      const x = (s - (n - 1) / 2) * SP;
      const st = start + s * 0.25;
      const stripe = s % 2 ? 'k' : 'a';
      // chips that have fully landed are one cached path (their outlines coincide exactly);
      // only the chip still dropping is drawn on its own
      const appeared = c.still ? N : Math.max(0, Math.min(N, Math.floor((c.t - st) * rate) + 1));
      const landedN = c.still ? N : Math.max(0, Math.min(appeared, Math.floor((c.t - st - 0.14) * rate) + 1));
      if (landedN > 0) {
        const sk = 'cs' + f3(h) + ':' + landedN;
        let pk = cache.get(sk);
        if (!pk) {
          const side = new Path2D(), marks = new Path2D();
          for (let i = 0; i < landedN; i++) { const mm = I().translate(0, -(i + 1) * h); side.addPath(P(chipSide(h)), mm); marks.addPath(P(chipMarks(h)), mm); }
          pk = [side, marks]; cache.set(sk, pk);
        }
        const m = I().translate(x, base);
        sh(c, pk[0], 'p', m);
        sh(c, pk[1], null, m, { color: stripe, lw: 3 });
      }
      for (let i = landedN; i < appeared; i++) {
        const k = clamp((c.t - (st + i / rate)) / 0.14);
        const m = I().translate(x, base - (i + 1) * h - 40 * (1 - easeOutCubic(k)));
        const a = Math.min(1, k * 2);
        sh(c, chipSide(h), 'p', m, { alpha: a });
        sh(c, chipMarks(h), null, m, { color: stripe, alpha: a, lw: 3 });
      }
      const shown = appeared;
      if (shown > 0) {
        const m = I().translate(x, base - shown * h);
        sh(c, ell(0, 0, RX, RY), 'p', m);
        sh(c, ell(0, 0, RX * 0.84, RY * 0.84), null, m, { color: stripe, dash: [4, 5] });
        sh(c, ell(0, 0, RX * 0.55, RY * 0.55), null, m, { color: stripe, glow: 0.6 });
      }
      const complete = c.still || shown === N;
      if (o.showValue !== false && complete && N > 0) {
        const tc = c.still ? 1 : clamp((c.t - (st + (N - 1) / rate) - 0.1) / 0.25);
        text(c, String(N), x, base - N * h - RY - 18 - 6 * (1 - tc), { px: 24, weight: 800, color: 'k', glow: 0.8, alpha: tc });
      }
      if (labels[s] != null) text(c, String(labels[s]), x, base + RY + 22, { px: 14, weight: 600, color: 'a', ls: 1.5, maxW: SP - 12, alpha: c.still ? 1 : clamp((c.t - st) / 0.3) });
    });
  };
  DUR.chipstack = o => { const v = o.values || [o.value == null ? 10 : o.value]; return (o.delay == null ? 0.15 : o.delay) + (v.length - 1) * 0.25 + Math.max.apply(null, v) / (o.rate == null ? 14 : o.rate) + 0.35; };
  BOX.chipstack = o => { const n = (o.values || [0]).length; return { w: n * 100 + 20, h: 240 }; };

  // ---------------------------------------------------------------- roulette
  // labels [..] (sectors), index (winning sector), turns (4), duration (3.4), delay (0.2)
  const RS = 84, RO = 98;
  function sectorPath(N, i) {
    const s = TAU / N, a0 = i * s - Math.PI / 2, a1 = (i + 1) * s - Math.PI / 2;
    return `M0 0 L${f3(RS * Math.cos(a0))} ${f3(RS * Math.sin(a0))} A${RS} ${RS} 0 ${s > Math.PI ? 1 : 0} 1 ${f3(RS * Math.cos(a1))} ${f3(RS * Math.sin(a1))} Z`;
  }
  EL.roulette = function (c, o) {
    const labels = (o.labels && o.labels.length ? o.labels : ['1', '2', '3', '4', '5', '6', '7', '8']).map(String);
    const N = labels.length, s = TAU / N;
    const index = mod(o.index | 0, N);
    const turns = o.turns == null ? 4 : o.turns, dur = o.duration == null ? 3.4 : o.duration, start = o.delay == null ? 0.2 : o.delay;
    const Rf = turns * TAU - (index + 0.5) * s;
    const u = c.still ? 1 : clamp((c.t - start) / dur);
    const rot = Rf * easeOutQuart(u);
    const landed = c.still || u >= 1;
    const W = I().rotate(rot * 180 / Math.PI);

    sh(c, circ(0, 0, RO), 'p', null, { grain: true, glow: 0.8, gbox: [-RO, -RO, 2 * RO, 2 * RO] });
    sh(c, circ(0, 0, RS + 4), null, null, { color: 'a' });
    for (let i = 0; i < N; i++) {
      const dark = (i % 2 === 1) && !(N % 2 === 1 && i === N - 1);
      const fill = (N % 2 === 1 && i === N - 1) ? 'a' : dark ? 'k' : 'p';
      sh(c, sectorPath(N, i), fill, W, { color: 'k' });
      const mt = W.rotate(((i + 0.5) * s - Math.PI / 2) * 180 / Math.PI);
      const px = Math.min(17, s * RS * 0.6 * 0.42);
      text(c, labels[i], RS * 0.6, 1, { px, weight: 700, color: fill === 'p' ? 'k' : 'p', maxW: RS * 0.62, m: mt });
    }
    if (landed) {
      const pulse = c.still ? 1 : 0.6 + 0.4 * wave01(c.t - start - dur, 1.2);
      sh(c, sectorPath(N, index), null, W, { color: 'a', lw: 3, glow: 1.2 * pulse });
    }
    // rim bulbs (fixed frame, chase)
    const rb = [];
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; rb.push([(RO - 7) * Math.cos(a), (RO - 7) * Math.sin(a)]); }
    const rstep = Math.floor(c.t * (landed ? 6 : 12));
    bulbs(c, rb, 3, i => c.still || mod(i - rstep, 4) === 0);
    sh(c, circ(0, 0, 16), 'p', null, { color: 'a' });
    sh(c, circ(0, 0, 6), 'a', null, { noStroke: true });
    // pointer with tick kick when a sector boundary passes
    let kick = 0;
    if (!landed && c.t > start) {
      const fr = mod(rot / s, 1);
      kick = Math.max(0, 1 - fr / 0.3) * Math.pow(1 - u, 2) * 22;
    }
    const pm = I().translate(0, -RO - 10).rotate(-kick).translate(0, RO + 10);
    sh(c, `M0 ${-RO + 14} L-10 ${-RO - 12} L10 ${-RO - 12} Z`, 'a', pm, { color: 'k', glow: 1 });
  };
  DUR.roulette = o => (o.delay == null ? 0.2 : o.delay) + (o.duration == null ? 3.4 : o.duration);
  BOX.roulette = () => ({ w: 210, h: 230 });

  // ---------------------------------------------------------------- marquee
  // w (360), h (200), band (22), spacing (bulb spacing, 18), rate (chase steps/s, 10)
  function marqueeBulbs(w, h, band, spacing) {
    const key = 'mq' + [w, h, band, spacing].join(',');
    let b = cache.get(key);
    if (!b) {
      const cw = w - band, chh = h - band, Lp = 2 * (cw + chh);
      const n = Math.max(8, Math.round(Lp / spacing));
      b = [];
      for (let i = 0; i < n; i++) {
        let s = i * Lp / n, x, y;
        if (s < cw) { x = -cw / 2 + s; y = -chh / 2; }
        else if ((s -= cw) < chh) { x = cw / 2; y = -chh / 2 + s; }
        else if ((s -= chh) < cw) { x = cw / 2 - s; y = chh / 2; }
        else { s -= cw; x = -cw / 2; y = chh / 2 - s; }
        b.push([f3(x), f3(y)]);
      }
      cache.set(key, b);
    }
    return b;
  }
  EL.marquee = function (c, o) {
    const w = o.w || 360, h = o.h || 200, band = o.band || 22, r = 16;
    const bl = marqueeBulbs(w, h, band, o.spacing || 18);
    const outer = RR(-w / 2, -h / 2, w, h, r), inner = RR(-w / 2 + band, -h / 2 + band, w - 2 * band, h - 2 * band, Math.max(4, r - band / 2));
    sh(c, outer + ' ' + inner, 'p', null, { evenodd: true, grain: true, noStroke: true, gbox: [-w / 2, -h / 2, w, h] });
    sh(c, outer, null, null, { glow: 0.8 });
    sh(c, inner, null, null, { glow: 0.8 });
    sh(c, RR(-w / 2 + band + 5, -h / 2 + band + 5, w - 2 * band - 10, h - 2 * band - 10, Math.max(3, r - band / 2 - 3)), null, null, { color: 'a', alpha: 0.5 });
    const n = bl.length, startDur = 0.8, rate = o.rate || 10;
    if (c.still) { bulbs(c, bl, 4.2, () => true, 1, 1.2); return; }
    if (c.t < startDur) { bulbs(c, bl, 4.2, i => i / n <= c.t / startDur, 1, 1.2); return; }
    // chase: one strong bulb in three, the others half-lit (two flat passes + one glow pass)
    const st = Math.floor((c.t - startDur) * rate);
    const half = new Path2D();
    for (let i = 0; i < n; i++) if (mod(i - st, 3) === 1) { half.moveTo(bl[i][0] + 4.2, bl[i][1]); half.arc(bl[i][0], bl[i][1], 4.2, 0, TAU); }
    bulbs(c, bl, 4.2, i => mod(i - st, 3) === 0, 1, 1.2);
    sh(c, half, 'a', null, { noStroke: true, alpha: 0.6 });
  };
  DUR.marquee = () => 0.8;
  BOX.marquee = o => ({ w: (o.w || 360) + 20, h: (o.h || 200) + 20 });

  // ---------------------------------------------------------------- neonsign
  // text ('VEGAS'), px (64), weight (500), maxW (380), underline (true), delay (0.1), seed
  EL.neonsign = function (c, o) {
    const txt = String(o.text == null ? 'VEGAS' : o.text);
    const chars = [...txt];
    let px = o.px || 64;
    const wt = o.weight || 500, fam = o.font || c.font;
    let ls = px * 0.08;
    const ws = chars.map(ch => measure(c, ch, px, wt, fam));
    let tw = ws.reduce((a, b) => a + b, 0) + ls * (chars.length - 1);
    const maxW = o.maxW || 380;
    if (tw > maxW) { const k = maxW / tw; px *= k; ls *= k; for (let i = 0; i < ws.length; i++) ws[i] *= k; tw = maxW; }
    const start = o.delay == null ? 0.1 : o.delay;
    const T = c.t - start;
    const rnd = mulberry32(hashStr(txt) ^ ((o.seed | 0) * 7919));
    const j = () => (rnd() - 0.5) * 0.06;
    const ev = [[0 + j(), 0.05], [0.17 + j(), 0.06], [0.35 + j(), 0.04]];
    const steady = 0.56 + j();
    const lag = Math.floor(rnd() * chars.length);
    const lagEv = [[0.64, 0.04], [0.8, 0.03]];
    const lagSteady = 0.98;
    const inEv = (list, tt) => list.some(e => tt >= e[0] && tt < e[0] + e[1]);
    let x = -tw / 2;
    chars.forEach((ch, i) => {
      const cx = x + ws[i] / 2;
      x += ws[i] + ls;
      if (ch === ' ') return;
      let on;
      if (c.still) on = 1;
      else if (i === lag) on = (T >= lagSteady || inEv(ev, T) || inEv(lagEv, T)) ? 1 : 0;
      else on = (T >= steady || inEv(ev, T)) ? 1 : (T > 0.25 && T < 0.3 ? 0.35 : 0);
      text(c, ch, cx, 0, { px, weight: wt, family: fam, color: 'k', alpha: 0.16 });
      if (on > 0) text(c, ch, cx, 0, { px, weight: wt, family: fam, color: 'k', alpha: on, glow: 1.4 * on });
    });
    if (o.underline !== false) {
      const y = px * 0.62;
      const d = `M${f3(-tw / 2 + 6)} ${f3(y)} H${f3(tw / 2 - 18)} C${f3(tw / 2 - 4)} ${f3(y)} ${f3(tw / 2 + 2)} ${f3(y - 10)} ${f3(tw / 2 - 6)} ${f3(y - 14)}`;
      const uOn = c.still || T >= 0.72 || (T >= 0.6 && T < 0.63);
      sh(c, d, null, null, { color: 'a', lw: 2.4, alpha: 0.18 });
      if (uOn) sh(c, d, null, null, { color: 'a', lw: 2.4, glow: 1.3 });
      sh(c, circ(f3(-tw / 2 - 8), f3(y), 2.5), 'a', null, { noStroke: true, alpha: 0.6 });
    }
  };
  DUR.neonsign = o => (o.delay == null ? 0.1 : o.delay) + 1.0;
  BOX.neonsign = o => ({ w: (o.maxW || 380) + 30, h: (o.px || 64) * 1.8 });

  // ---------------------------------------------------------------- skyline
  // width (1200 units), seed. Baseline at y = +100. Wide background band.
  function skyLayout(width, seed) {
    const key = 'sky' + width + ':' + seed;
    let L = cache.get(key);
    if (L) return L;
    const rnd = mulberry32(hashStr(key));
    const base = 100, x0 = -width / 2, x1 = width / 2;
    const wheelX = x0 + width * 0.17, sphereX = x0 + width * 0.6, needleX = x0 + width * 0.86;
    const zones = [[wheelX - 72, wheelX + 72], [sphereX - 64, sphereX + 64], [needleX - 16, needleX + 16]];
    const mass = new Path2D(), far = new Path2D(), dim = new Path2D();
    const wins = [];
    // far layer
    for (let x = x0; x < x1;) { const bw = 30 + rnd() * 60, bh = 30 + rnd() * 90; far.rect(f3(x), f3(base - bh), f3(bw), f3(bh)); x += bw + 2; }
    // near layer
    let b = 0;
    for (let x = x0 + 4; x < x1 - 10;) {
      const bw = 34 + rnd() * 48;
      const z = zones.find(zz => x + bw > zz[0] && x < zz[1]);
      if (z) { x = z[1] + 6; continue; }
      const bh = 50 + rnd() * 120, type = rnd();
      mass.rect(f3(x), f3(base - bh), f3(bw), f3(bh));
      if (type < 0.3) { const h2 = 18 + rnd() * 30; mass.rect(f3(x + bw * 0.2), f3(base - bh - h2), f3(bw * 0.6), f3(h2)); }
      else if (type < 0.48) { mass.moveTo(f3(x), f3(base - bh)); mass.ellipse(f3(x + bw / 2), f3(base - bh), f3(bw / 2), f3(bw * 0.32), 0, Math.PI, TAU); mass.closePath(); }
      else if (type < 0.6) { mass.moveTo(f3(x + bw * 0.45), f3(base - bh)); mass.lineTo(f3(x + bw * 0.5), f3(base - bh - 34)); mass.lineTo(f3(x + bw * 0.55), f3(base - bh)); mass.closePath(); }
      const cols = Math.floor((bw - 10) / 8), rows = Math.floor((bh - 14) / 10);
      for (let cx = 0; cx < cols; cx++) {
        const wx = f3(x + 6 + cx * 8 + ((bw - 10) - cols * 8) / 2), top = f3(base - bh + 8);
        if (rows > 0) { dim.moveTo(f3(wx + 1.5), top); dim.lineTo(f3(wx + 1.5), f3(top + rows * 10)); }
        for (let ry = 0; ry < rows; ry++) wins.push(wx, f3(top + ry * 10));
      }
      x += bw + 4 + rnd() * 8;
      b++;
    }
    // sphere
    const sr = 56, sy = base - 62;
    mass.rect(f3(sphereX - 14), f3(sy + sr - 4), 28, f3(base - (sy + sr - 4)));
    const sdots = [];
    for (let yy = -sr + 7; yy <= sr - 7; yy += 7) { const ch = Math.sqrt(sr * sr - yy * yy) - 5; for (let xx = -Math.floor(ch / 7) * 7; xx <= ch; xx += 7) sdots.push(xx, yy); }
    const sdim = new Path2D(); for (let i = 0; i < sdots.length; i += 2) sdim.rect(f3(sphereX + sdots[i] - 1.2), f3(sy + sdots[i + 1] - 1.2), 2.4, 2.4);
    // wheel
    const wr = 62, wy = base - 80;
    const wheelStatic = `M${f3(wheelX - 34)} ${base} L${f3(wheelX)} ${f3(wy)} L${f3(wheelX + 34)} ${base} ` + circ(wheelX, wy, wr) + ' ' + circ(wheelX, wy, 6);
    // needle
    const needle = R(needleX - 5, base - 212, 10, 212) + ' ' + R(needleX - 24, base - 200, 48, 12) + ' ' + R(needleX - 18, base - 212, 36, 12) + ` M${f3(needleX)} ${base - 212} V${base - 252}`;
    const outline = new Path2D(); outline.addPath(mass);
    // stars
    const stars = []; for (let i = 0; i < 46; i++) stars.push(f3(x0 + rnd() * width), f3(base - 130 - rnd() * 140), rnd());
    L = { base, mass, far, dim, wins, sphereX, sy, sr, sdots, sdim, wheelX, wy, wr, wheelStatic, needleX, needle, stars, key };
    cache.set(key, L);
    return L;
  }
  const SPOKES = (() => { let d = ''; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; d += `M0 0 L${f3(62 * Math.cos(a))} ${f3(62 * Math.sin(a))} `; } return d; })();
  EL.skyline = function (c, o) {
    const width = o.width || 1200;
    const L = skyLayout(width, o.seed | 0);
    const ctx = c.ctx, t = c.still ? 0 : c.t;
    // stars
    const sp = new Path2D();
    for (let i = 0; i < L.stars.length; i += 3) {
      const on = c.still ? L.stars[i + 2] > 0.4 : hash3(i, Math.floor(t * 1.5 + L.stars[i + 2] * 5), 9) > 0.35;
      if (on) sp.rect(L.stars[i] - 1, L.stars[i + 1] - 1, 2, 2);
    }
    sh(c, sp, 'a', null, { noStroke: true, alpha: 0.7 });
    sh(c, L.far, 'k', null, { noStroke: true, alpha: 0.14 });
    // wheel (behind the near layer)
    sh(c, SPOKES, null, I().translate(L.wheelX, L.wy).rotate(t * 10), { alpha: 0.7 });
    sh(c, L.wheelStatic, null, null, { glow: 0.6 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + t * 10 * Math.PI / 180;
      sh(c, circ(0, 0, 4.5), 'a', I().translate(L.wheelX + L.wr * Math.cos(a), L.wy + L.wr * Math.sin(a) + 3), { noStroke: true });
    }
    // near masses
    sh(c, L.mass, 'p', null, { grain: true, gkey: L.key, gbox: [-width / 2, L.base - 260, width, 260], glow: 0.5 });
    { // unlit windows: one dashed stroke per column (3x4 every 10 units), far fewer primitives than rects
      const ctx2 = c.ctx, lc = ctx2.lineCap, lw0 = ctx2.lineWidth, g0 = ctx2.globalAlpha;
      ctx2.lineCap = 'butt'; ctx2.lineWidth = 3; ctx2.setLineDash([4, 6]); ctx2.lineDashOffset = 0;
      ctx2.globalAlpha = g0 * 0.28; ctx2.strokeStyle = c.ink; ctx2.stroke(L.dim);
      ctx2.setLineDash([]); ctx2.lineCap = lc; ctx2.lineWidth = lw0; ctx2.globalAlpha = g0;
    }
    // windows flip only on quarter-second ticks, so each tick's lit set is cached
    const q = c.still ? -1 : Math.floor(t * 4);
    const lk = L.key + '|lit|' + c.seed + '|' + q;
    let lit = cache.get(lk);
    if (!lit) {
      lit = new Path2D();
      const W = L.wins;
      for (let i = 0; i < W.length; i += 2) {
        const ph = Math.floor(hash3(i, 1, c.seed) * 8);
        const on = c.still ? hash3(i, 0, c.seed) > 0.62 : hash3(i, Math.floor((q + ph) / 8), c.seed) > 0.62;
        if (on) lit.rect(W[i], W[i + 1], 3, 4);
      }
      if (L.litKeys) { L.litKeys.push(lk); if (L.litKeys.length > 3) cache.delete(L.litKeys.shift()); } else L.litKeys = [lk];
      cache.set(lk, lit);
    }
    sh(c, lit, 'a', null, { noStroke: true });
    // sphere with sweeping dot band
    sh(c, circ(L.sphereX, L.sy, L.sr), 'p', null, { glow: 0.9 });
    sh(c, L.sdim, 'k', null, { noStroke: true, alpha: 0.35 });
    const bx = c.still ? 0 : lerp(-L.sr - 12, L.sr + 12, cyc(t, 3.2));
    const band = new Path2D();
    for (let i = 0; i < L.sdots.length; i += 2) if (Math.abs(L.sdots[i] - bx) < 11 || (c.still && Math.abs(L.sdots[i + 1]) < 5)) band.rect(L.sphereX + L.sdots[i] - 1.6, L.sy + L.sdots[i + 1] - 1.6, 3.2, 3.2);
    sh(c, band, 'a', null, { noStroke: true, glowFill: 0.8 });
    // needle tower
    sh(c, L.needle, 'p', null, { glow: 0.6 });
    const blinkOn = c.still || cyc(t, 1.2) < 0.5;
    sh(c, circ(L.needleX, L.base - 254, 3.2), 'a', null, { noStroke: true, glowFill: blinkOn ? 1.4 : 0, alpha: blinkOn ? 1 : 0.25 });
    // ground + road
    sh(c, `M${-width / 2} ${L.base} H${width / 2}`, null, null, { glow: 0.5 });
    sh(c, `M${-width / 2} ${L.base + 14} H${width / 2}`, null, null, { color: 'a', dash: [10, 12], dashOffset: -t * 40, alpha: 0.8 });
    void ctx;
  };
  DUR.skyline = () => 0;
  BOX.skyline = o => ({ w: o.width || 1200, h: 380 });

  // ---------------------------------------------------------------- dice
  // values [a, b] (1..6), delay (0.1)
  const E = 46;
  const DV = { B0: [0, 0], F: [0, -E], L: [-0.866 * E, -0.5 * E], LT: [-0.866 * E, -1.5 * E], R: [0.866 * E, -0.5 * E], RT: [0.866 * E, -1.5 * E], K: [0, -2 * E] };
  const poly = pts => 'M' + pts.map(p => f3(DV[p][0]) + ' ' + f3(DV[p][1])).join(' L') + ' Z';
  const D_TOP = poly(['F', 'RT', 'K', 'LT']), D_LEFT = poly(['B0', 'F', 'LT', 'L']), D_RIGHT = poly(['B0', 'R', 'RT', 'F']);
  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  const ADJ = { 1: [2, 3], 2: [3, 1], 3: [1, 2], 4: [2, 6], 5: [3, 1], 6: [2, 4] };
  const FACES = {
    top: { C: [0, -1.5 * E], U: [0.433 * E, -0.25 * E], V: [-0.433 * E, -0.25 * E] },
    left: { C: [-0.433 * E, -0.75 * E], U: [-0.433 * E, -0.25 * E], V: [0, -0.5 * E] },
    right: { C: [0.433 * E, -0.75 * E], U: [0.433 * E, -0.25 * E], V: [0, -0.5 * E] }
  };
  const PIP_C = circ(0, 0, 0.2);
  function pips(c, m, face, n, fill, glow) {
    const F = FACES[face];
    for (const p of PIPS[n]) {
      const px = F.C[0] + p[0] * 0.52 * F.U[0] + p[1] * 0.52 * F.V[0], py = F.C[1] + p[0] * 0.52 * F.U[1] + p[1] * 0.52 * F.V[1];
      sh(c, PIP_C, fill, m.multiply(new DOMMatrix([F.U[0], F.U[1], F.V[0], F.V[1], px, py])), { noStroke: true, glowFill: glow });
    }
  }
  EL.dice = function (c, o) {
    const vals = (o.values || [6, 3]).slice(0, 2).map(v => clamp(Math.round(+v || 1), 1, 6));
    const start = o.delay == null ? 0.1 : o.delay;
    vals.forEach((v, d) => {
      const xf = (d - (vals.length - 1) / 2) * 104, yb = 64;
      const u = c.still ? 1 : clamp((c.t - start - d * 0.12) / 1.1);
      const e = easeOutCubic(u);
      const x = lerp(-300 + d * 40, xf, e);
      const hop = Math.abs(Math.sin(Math.PI * 3 * u)) * 64 * Math.pow(1 - u, 1.5);
      const rot = (1 - e) * 540 * (d % 2 ? -1 : 1);
      const settled = u >= 1;
      const m = I().translate(x, yb - hop).translate(0, -E).rotate(rot).translate(0, E);
      sh(c, ell(0, 0, E * 0.95, E * 0.36), 'k', I().translate(x, yb + 2).scale(1 - hop / 160), { noStroke: true, alpha: 0.1 });
      let top = v, lr = ADJ[v];
      if (!settled) {
        const step = Math.floor(u * 9);
        top = 1 + Math.floor(hash3(d, step, c.seed) * 6);
        lr = ADJ[top];
      }
      sh(c, D_TOP, 'p', m, { glow: 0.6 });
      sh(c, D_LEFT, 'p', m, { glow: 0.6 });
      sh(c, D_RIGHT, 'k', m);
      const tg = settled && !c.still ? Math.max(0.6, 1.6 - (c.t - start - d * 0.12 - 1.1) * 2) : 0.6;
      pips(c, m, 'top', top, 'a', tg);
      pips(c, m, 'left', lr[0], 'k', 0);
      pips(c, m, 'right', lr[1], 'p', 0);
    });
  };
  DUR.dice = o => (o.delay == null ? 0.1 : o.delay) + 0.12 + 1.1;
  BOX.dice = () => ({ w: 230, h: 200 });

  // ---------------------------------------------------------------- ticket
  // text ('LAS VEGAS GP'), text2 ('STRIP CIRCUIT'), header ('ADMIT ONE'), serial ('Nº 000777'),
  // angle (rest deg, -3), delay (0.1), stamp (true)
  const TICKET = 'M-140 -65 H70 A10 10 0 0 0 90 -65 H140 A10 10 0 0 1 150 -55 V55 A10 10 0 0 1 140 65 H90 A10 10 0 0 0 70 65 H-140 A10 10 0 0 1 -150 55 V-55 A10 10 0 0 1 -140 -65 Z';
  const PERF = (() => { let d = ''; for (let y = -50; y <= 50; y += 8) d += circ(80, y, 1.6) + ' '; return d; })();
  const STAMP_STAR = starPath(5, 9, 4);
  EL.ticket = function (c, o) {
    const start = o.delay == null ? 0.1 : o.delay;
    const u = c.still ? 1 : clamp((c.t - start) / 0.7);
    const rest = o.angle == null ? -3 : o.angle;
    const idle = !c.still && u >= 1;
    const sway = idle ? 0.6 * Math.sin(TAU * (c.t - start - 0.7) / 4) : 0;
    const slide = -150 * (1 - easeOutBack(u, 1.1));
    const m = I().translate(slide, 0).rotate(lerp(-10, rest, easeOutCubic(u)) + sway);
    const a = c.still ? 1 : clamp(u / 0.15);
    const g0 = c.ctx.globalAlpha; c.ctx.globalAlpha = g0 * a;
    sh(c, TICKET, 'p', m, { grain: true, glow: 0.7, gbox: [-150, -65, 300, 130] });
    sh(c, RR(-140, -55, 210, 110, 6), null, m, { color: 'a', alpha: 0.6 });
    sh(c, PERF, 'k', m, { noStroke: true });
    text(c, String(o.header == null ? 'ADMIT ONE' : o.header), -35, -32, { px: 13, weight: 700, color: 'a', ls: 4, maxW: 170, m });
    sh(c, STAMP_STAR, 'a', m.translate(-122, -32).scale(0.5), { noStroke: true });
    sh(c, STAMP_STAR, 'a', m.translate(52, -32).scale(0.5), { noStroke: true });
    text(c, String(o.text == null ? 'LAS VEGAS GP' : o.text), -35, 2, { px: 30, weight: 800, color: 'k', glow: 0.9, maxW: 190, m });
    text(c, String(o.text2 == null ? 'STRIP CIRCUIT' : o.text2), -35, 32, { px: 14, weight: 600, color: 'k', alpha: 0.85, ls: 1.5, maxW: 190, m });
    text(c, String(o.serial == null ? 'Nº 000777' : o.serial), 0, 0, { px: 11, weight: 700, color: 'a', ls: 2, maxW: 100, m: m.translate(134, 0).rotate(90) });
    if (o.stamp !== false) {
      const sT = c.still ? 1 : clamp((c.t - start - 0.85) / 0.18);
      if (sT > 0) {
        const sc = lerp(1.7, 1, easeOutCubic(sT));
        const sm = m.translate(112, -10).rotate(-16).scale(sc);
        const sa = 0.9 * sT;
        sh(c, circ(0, 0, 19), null, sm, { color: 'a', alpha: sa, lw: 2 });
        sh(c, circ(0, 0, 14), null, sm, { color: 'a', alpha: sa });
        sh(c, STAMP_STAR, 'a', sm, { noStroke: true, alpha: sa, glowFill: 0.6 });
      }
    }
    c.ctx.globalAlpha = g0;
  };
  DUR.ticket = o => (o.delay == null ? 0.1 : o.delay) + 1.05;
  BOX.ticket = () => ({ w: 320, h: 170 });

  // ---------------------------------------------------------------- jackpot
  // delay (0), count (26 particles), seed. ~1.3 s one-shot accent. animate:false = peak frame.
  const RAY = 'M0 -1 L1 0 L0 1 Z';
  const UNIT_C = circ(0, 0, 1);
  const P_STAR = starPath(5, 1, 0.45);
  const P_CHIP = ell(0, 0, 1, 0.42);
  EL.jackpot = function (c, o) {
    const start = o.delay == null ? 0 : o.delay;
    const T = c.still ? 0.32 : c.t - start;
    if (T < 0 || T > 1.4) return;
    const rnd = mulberry32(9001 + (c.seed | 0) * 31);
    if (T < 0.28) {
      const r = 30 + 120 * easeOutCubic(T / 0.28);
      sh(c, UNIT_C, 'a', I().scale(r), { noStroke: true, alpha: 0.32 * (1 - T / 0.28) });
    }
    const e = easeOutCubic(clamp(T / 0.45));
    const ra = 1 - clamp((T - 0.25) / 0.4);
    const raysA = new Path2D(), raysK = new Path2D();
    for (let i = 0; i < 16; i++) {
      const ang = i / 16 * 360 + (rnd() - 0.5) * 10;
      const r0 = 22 + 70 * e, r1 = 70 + 120 * e * (0.8 + rnd() * 0.4);
      (i % 2 ? raysK : raysA).addPath(P(RAY), I().rotate(ang).translate(r0, 0).scale(r1 - r0, 2.6 + 2 * (1 - e)));
    }
    if (ra > 0) { sh(c, raysA, 'a', null, { noStroke: true, alpha: ra, glowFill: 0.8 }); sh(c, raysK, 'k', null, { noStroke: true, alpha: ra, glowFill: 0.8 }); }
    const ru = clamp(T / 0.6);
    if (ru < 1) sh(c, UNIT_C, null, I().scale(20 + 160 * easeOutCubic(ru)), { color: 'k', alpha: 1 - ru, lw: 2.4, glow: 0.8 });
    const n = o.count || 26;
    const tau = Math.max(0, T - 0.04);
    const fade = 1 - clamp((T - 0.85) / 0.5);
    const starsA = new Path2D(), starsK = new Path2D(), chipsA = new Path2D(), chipsK = new Path2D();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.6, v = 170 + rnd() * 190, sz = 5 + rnd() * 4, spin = (rnd() - 0.5) * 720, isStar = rnd() < 0.5;
      const px = Math.cos(a) * v * tau, py = Math.sin(a) * v * tau + 0.5 * 560 * tau * tau;
      const pop = Math.min(1, tau / 0.08);
      const m = I().translate(px, py).rotate(spin * tau).scale(Math.max(0.001, sz * pop));
      if (isStar) (i % 3 ? starsA : starsK).addPath(P(P_STAR), m);
      else (i % 2 ? chipsA : chipsK).addPath(P(P_CHIP), m);
    }
    if (fade > 0) {
      sh(c, chipsA, 'p', null, { color: 'a', alpha: fade });
      sh(c, chipsK, 'p', null, { color: 'k', alpha: fade });
      sh(c, starsA, 'a', null, { noStroke: true, alpha: fade, glowFill: 0.6 });
      sh(c, starsK, 'k', null, { noStroke: true, alpha: fade, glowFill: 0.6 });
    }
  };
  DUR.jackpot = o => (o.delay == null ? 0 : o.delay) + 1.3;
  BOX.jackpot = () => ({ w: 380, h: 380 });

  // ============================================================== public API
  const LABELS = {
    slotreel: ['Rodillos de cifra', 'Slot reel number'],
    cardflip: ['Carta que se voltea', 'Card flip'],
    chipstack: ['Pila de fichas', 'Chip stack'],
    roulette: ['Ruleta de datos', 'Data roulette'],
    marquee: ['Marquesina', 'Marquee frame'],
    neonsign: ['Letrero de neón', 'Neon sign'],
    skyline: ['Skyline del Strip', 'Strip skyline'],
    dice: ['Dados', 'Dice'],
    ticket: ['Ticket de entrada', 'Ticket stub'],
    jackpot: ['Jackpot', 'Jackpot burst']
  };

  function draw(ctx, name, o) {
    o = o || {};
    const fn = EL[name];
    if (!fn) throw new Error('VegasKinetic: unknown element "' + name + '". Use one of: ' + Object.keys(EL).join(', '));
    const enter = o.enter == null ? 1 : clamp(o.enter);
    if (enter <= 0) return;
    const k = (o.size == null ? 220 : o.size) / 220;
    const e = enter >= 1 ? 1 : easeOutBack(enter);
    const s = k * (0.6 + 0.4 * e);
    ctx.save();
    ctx.translate(o.x || 0, o.y || 0);
    ctx.scale(s, s);
    ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha) * Math.min(1, enter * 1.6);
    const lw = o.lineWidth || 1.6;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    // Neutral monochrome fallbacks only; the palette must come through options.
    const ink = o.ink || '#FFFFFF';
    const c = {
      ctx, t: (o.t || 0) * (o.speed == null ? 1 : o.speed), still: o.animate === false,
      ink, paper: o.paper || '#000000', accent: o.accent || ink,
      lwk: lw / 1.6, glow: o.glow == null ? 5 : o.glow, glowMode: o.glowMode === 'blur' ? 'blur' : 'flat', grain: o.grain == null ? 0.12 : o.grain,
      font: o.font || '"Space Grotesk", Inter, "Helvetica Neue", Arial, sans-serif', seed: o.seed | 0
    };
    ctx.strokeStyle = ink;
    fn(c, o);
    ctx.restore();
  }

  // Seconds (local t, speed 1) until the element reaches its rest pose. 0 = pure loop.
  function duration(name, o) { const f = DUR[name]; return f ? f(o || {}) : 0; }
  // Nominal box in units (multiply by size/220 for px).
  function box(name, o) { const f = BOX[name]; return f ? f(o || {}) : { w: 220, h: 220 }; }
  // Inner drawable area of the marquee in units, relative to its center.
  function marqueeInner(o) { o = o || {}; const w = o.w || 360, h = o.h || 200, band = o.band || 22; return { x: -w / 2 + band + 8, y: -h / 2 + band + 8, w: w - 2 * band - 16, h: h - 2 * band - 16 }; }

  root.VegasKinetic = { draw, duration, box, marqueeInner, names: Object.keys(EL), labels: LABELS, version: '1.0.0' };
})(typeof window !== 'undefined' ? window : globalThis);
