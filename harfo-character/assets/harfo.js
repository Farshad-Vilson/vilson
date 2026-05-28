/* ════════════════════════════════════════════════════════════════
   حرفو v10 — Intelligent Galaxy Mascot
   Modules: PageAI · ThemeSense · AnchorTracker · ShapeMorph
            · Physics · Squish · PupilTrack · Rain · Umbrella · FX
   Zero external dependencies.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════
     CONFIG & STATE
     ════════════════════════════════════════════════════════════ */
  var C = {
    WRAP: 100, BALL: 64, BOFF: 18,
    SK: 0.052, SD: 0.82, MSP: 18,
    SQK: 0.18, SQD: 0.66, SQA: 0.30,
    /* zones */
    ZN: 400, ZT: 260, ZA: 165, ZF: 110, ZP: 62,
    /* forces */
    FF: 5.5, PF: 10,
    /* timing */
    SLP: 60000,
    /* anchor follow */
    ANCHOR_OFFSET: 26,
  };

  var S = {
    x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
    sx: 1, sy: 1, sxv: 0, syv: 0,
    mx: -9999, my: -9999,
    plx: 0, ply: 0, prx: 0, pry: 0,
    zone: 'far', mood: 'normal', shape: 'ball',
    drag: false, dox: 0, doy: 0,
    rain: false, shelter: false, sleeping: false,
    idleAt: Date.now(),
    lastZzz: 0,
    /* anchor following */
    anchorEl: null,
    anchorSide: 'right',
    anchorSticky: false,
    /* umbrella */
    ux: 0, uy: 0, udrag: false, udox: 0, udoy: 0,
  };

  var W, BALL, PL, PR, RAIN, UMB, FX, ARM_W, STARS, ICON, GLOW, ROOT;
  var pageInfo = null;
  var hiBox = null;

  /* ── Utils ── */
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lr(a, b, t) { return a + (b - a) * t; }
  function rn(a, b)    { return a + Math.random() * (b - a); }
  function maxX() { return window.innerWidth  - C.WRAP - 6; }
  function maxY() { return window.innerHeight - C.WRAP - 6; }
  function bC()   { return { x: S.x + C.WRAP / 2, y: S.y + C.WRAP / 2 }; }

  /* ════════════════════════════════════════════════════════════
     MODULE: ThemeSense — sample site colors, apply to mascot
     ════════════════════════════════════════════════════════════ */
  var ThemeSense = (function () {
    function rgbStr(str) {
      var m = str && str.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      var p = m[1].split(',').map(parseFloat);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    function lum(c) { return 0.299*c.r + 0.587*c.g + 0.114*c.b; }
    function isVivid(c) {
      var mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
      return mx - mn > 50 && mx > 80 && mx < 240;
    }
    function rgbToHex(c) {
      var h = function (n) { return ('0' + (n | 0).toString(16)).slice(-2); };
      return '#' + h(c.r) + h(c.g) + h(c.b);
    }
    function darken(c, f) {
      return { r: c.r * f, g: c.g * f, b: c.b * f };
    }

    function sample() {
      var candidates = [];
      var selectors = [
        'header', '.site-header', '#masthead', '.main-navigation',
        '.elementor-button', '.button', '.btn-primary',
        '.wp-block-button__link', 'a.button',
        '[class*="primary"]', '[class*="brand"]'
      ];
      for (var i = 0; i < selectors.length; i++) {
        var els = document.querySelectorAll(selectors[i]);
        for (var j = 0; j < Math.min(els.length, 3); j++) {
          var cs = getComputedStyle(els[j]);
          [cs.backgroundColor, cs.borderColor, cs.color].forEach(function (s) {
            var c = rgbStr(s);
            if (c && c.a > 0.3 && isVivid(c)) candidates.push(c);
          });
        }
      }
      if (!candidates.length) return null;
      /* Pick the most vivid */
      candidates.sort(function (a, b) {
        var ar = Math.max(a.r, a.g, a.b) - Math.min(a.r, a.g, a.b);
        var br = Math.max(b.r, b.g, b.b) - Math.min(b.r, b.g, b.b);
        return br - ar;
      });
      return candidates[0];
    }

    function apply() {
      var c = sample();
      if (!c || !ROOT) return null;
      var ca = c;
      var cb = darken(c, 0.42);
      var cc = darken(c, 0.15);
      ROOT.style.setProperty('--hcol-a', rgbToHex(ca));
      ROOT.style.setProperty('--hcol-b', rgbToHex(cb));
      ROOT.style.setProperty('--hcol-c', rgbToHex(cc));
      ROOT.style.setProperty('--hcol-glow',
        'rgba(' + (ca.r|0) + ',' + (ca.g|0) + ',' + (ca.b|0) + ',0.55)');
      return ca;
    }

    return { apply: apply };
  })();

  /* ════════════════════════════════════════════════════════════
     MODULE: PageAI — understand what the page contains
     ════════════════════════════════════════════════════════════ */
  var PageAI = (function () {
    function analyze() {
      var info = {
        type: 'generic',
        article: null,
        productImage: null,
        headings: [],
        ctas: [],
        paragraphs: [],
        images: []
      };

      var body = document.body;
      if (!body) return info;

      /* Article detection */
      var art =
        document.querySelector('article .entry-content') ||
        document.querySelector('article .post-content') ||
        document.querySelector('article') ||
        document.querySelector('.entry-content') ||
        document.querySelector('main');
      if (art) {
        info.article = art;
        info.type = 'article';
      }

      /* WooCommerce product */
      var pimg = document.querySelector(
        '.woocommerce-product-gallery__image img, ' +
        '.product .images img, ' +
        '.product img.wp-post-image'
      );
      if (pimg) { info.productImage = pimg; info.type = 'product'; }

      /* Headings inside article preferred */
      var hScope = info.article || body;
      info.headings = Array.prototype.slice.call(
        hScope.querySelectorAll('h1, h2, h3')
      ).filter(function (h) { return h.offsetHeight > 0; });

      /* Paragraphs in article */
      if (info.article) {
        info.paragraphs = Array.prototype.slice.call(
          info.article.querySelectorAll('p')
        ).filter(function (p) {
          return p.offsetHeight > 0 && p.textContent.trim().length > 40;
        });
      }

      /* CTAs */
      info.ctas = Array.prototype.slice.call(
        document.querySelectorAll(
          'button, .button, .btn, a.wp-block-button__link, ' +
          'input[type="submit"], .single_add_to_cart_button'
        )
      ).filter(function (b) {
        return b.offsetHeight > 0 && b.offsetWidth > 30;
      }).slice(0, 8);

      /* Big images */
      info.images = Array.prototype.slice.call(
        document.querySelectorAll('img')
      ).filter(function (img) {
        return img.offsetWidth > 200 && img.offsetHeight > 150;
      }).slice(0, 10);

      return info;
    }

    return { analyze: analyze };
  })();

  /* ════════════════════════════════════════════════════════════
     MODULE: ShapeMorph — transform the ball
     ════════════════════════════════════════════════════════════ */
  var ShapeMorph = (function () {
    var ICONS = {
      magnify:
        '<circle cx="32" cy="32" r="14" fill="none" stroke="white" stroke-width="4"/>' +
        '<line x1="44" y1="44" x2="58" y2="58" stroke="white" stroke-width="5" stroke-linecap="round"/>',
      arrow:
        '<path d="M40 14 L40 60 M40 60 L26 46 M40 60 L54 46" stroke="white" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      heart:
        '<path d="M40 60 C 20 46 16 32 24 22 C 32 14 40 22 40 28 C 40 22 48 14 56 22 C 64 32 60 46 40 60 Z" fill="#F472B6"/>',
      cart:
        '<path d="M16 22 L22 22 L30 50 L58 50 M30 50 L26 30 L60 30 L55 46 L30 46" stroke="white" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="32" cy="58" r="4" fill="white"/>' +
        '<circle cx="52" cy="58" r="4" fill="white"/>',
      bulb:
        '<path d="M40 18 C 28 18 22 28 22 36 C 22 42 26 46 28 50 L 52 50 C 54 46 58 42 58 36 C 58 28 52 18 40 18 Z" fill="#FBBF24" stroke="white" stroke-width="2"/>' +
        '<rect x="30" y="52" width="20" height="5" rx="2" fill="white"/>' +
        '<rect x="32" y="59" width="16" height="3" rx="1.5" fill="white" opacity=".8"/>',
    };

    function to(shape) {
      if (S.shape === shape || !BALL) return;
      S.shape = shape;
      BALL.setAttribute('data-shape', shape);
      if (ICON) {
        ICON.innerHTML = ICONS[shape] || '';
      }
      /* squish accent on transform */
      S.sxv = -0.5; S.syv = 0.5;
    }

    return { to: to };
  })();

  /* ════════════════════════════════════════════════════════════
     MODULE: AnchorTracker — find best content to perch beside
     ════════════════════════════════════════════════════════════ */
  var AnchorTracker = (function () {
    var lastScan = 0;
    var current = null;

    function visible(el) {
      if (!el) return null;
      var r = el.getBoundingClientRect();
      if (r.height < 10 || r.width < 10) return null;
      var vh = window.innerHeight;
      var inView = r.bottom > 60 && r.top < vh - 60;
      if (!inView) return null;
      return r;
    }

    /* Pick the most visible element from a list (prefer ones near
       vertical center of viewport) */
    function best(list) {
      if (!list || !list.length) return null;
      var vh = window.innerHeight;
      var mid = vh * 0.42;
      var best = null, bestScore = -1;
      for (var i = 0; i < list.length; i++) {
        var r = visible(list[i]);
        if (!r) continue;
        var elMid = r.top + r.height / 2;
        var dist  = Math.abs(elMid - mid);
        var visibleAmt = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        var score = visibleAmt - dist * 0.5;
        if (score > bestScore) { bestScore = score; best = { el: list[i], rect: r }; }
      }
      return best;
    }

    /* Compute perch position (wrapper top-left) next to element */
    function perchFor(elInfo) {
      if (!elInfo) return null;
      var r  = elInfo.rect;
      var vw = window.innerWidth;
      var vh = window.innerHeight;

      /* Prefer right side; switch to left if not enough room */
      var rightSpace = vw - r.right;
      var leftSpace  = r.left;
      var side, x;

      if (rightSpace > C.WRAP + 24) {
        side = 'right';
        x = r.right + C.ANCHOR_OFFSET;
      } else if (leftSpace > C.WRAP + 24) {
        side = 'left';
        x = r.left - C.WRAP - C.ANCHOR_OFFSET;
      } else {
        /* No side space → drop to corner */
        side = 'corner';
        x = vw - C.WRAP - 24;
      }

      /* Vertical: align mascot's center to element's center */
      var y = r.top + r.height / 2 - C.WRAP / 2;
      y = cl(y, 8, vh - C.WRAP - 8);
      x = cl(x, 8, vw - C.WRAP - 8);

      return { x: x, y: y, side: side, el: elInfo.el, rect: r };
    }

    function pick() {
      if (!pageInfo) return null;

      /* On product page → perch next to product image */
      if (pageInfo.productImage) {
        var pr = visible(pageInfo.productImage);
        if (pr) return perchFor({ el: pageInfo.productImage, rect: pr });
      }

      /* On article → follow visible paragraph */
      if (pageInfo.paragraphs && pageInfo.paragraphs.length) {
        var p = best(pageInfo.paragraphs);
        if (p) return perchFor(p);
      }

      /* Otherwise follow visible heading */
      if (pageInfo.headings && pageInfo.headings.length) {
        var h = best(pageInfo.headings);
        if (h) return perchFor(h);
      }

      /* Otherwise hover near a visible image */
      if (pageInfo.images && pageInfo.images.length) {
        var im = best(pageInfo.images);
        if (im) return perchFor(im);
      }

      return null;
    }

    function update(force) {
      var now = Date.now();
      if (!force && now - lastScan < 250) return;
      lastScan = now;

      if (S.drag || S.zone === 'flee' || S.zone === 'panic') return;

      var p = pick();
      if (p) {
        current = p;
        S.tx = p.x; S.ty = p.y;
        S.anchorEl = p.el; S.anchorSide = p.side;

        /* Shape based on context */
        if (p.el.tagName === 'IMG') {
          ShapeMorph.to('magnify');
        } else if (p.el.tagName === 'P') {
          ShapeMorph.to('reader');
          mood('reading');
        } else if (/^H[1-3]$/.test(p.el.tagName)) {
          ShapeMorph.to('ball');
          mood('curious');
        } else if (p.el === pageInfo.productImage) {
          ShapeMorph.to('cart');
        }
      }
    }

    return { update: update, get: function () { return current; } };
  })();

  /* ════════════════════════════════════════════════════════════
     CORE: Mood / shape helpers
     ════════════════════════════════════════════════════════════ */
  function mood(m) {
    if (!BALL || S.mood === m) return;
    S.mood = m;
    BALL.setAttribute('data-mood', m);
  }

  function applyTime() {
    if (!BALL) return;
    var h = new Date().getHours();
    var t = h >= 6 && h < 12 ? 'morning' :
            h >= 12 && h < 18 ? 'afternoon' :
            h >= 18 && h < 22 ? 'evening' : 'night';
    BALL.setAttribute('data-time', t);
    C.MSP = t === 'night' ? 11 : t === 'morning' ? 22 : 18;
  }

  /* ════════════════════════════════════════════════════════════
     PHYSICS
     ════════════════════════════════════════════════════════════ */
  function dMouse() {
    if (S.mx < 0) return 1e9;
    var c = bC();
    return Math.hypot(S.mx - c.x, S.my - c.y);
  }
  function toZone(d) {
    if (d < C.ZP) return 'panic';
    if (d < C.ZF) return 'flee';
    if (d < C.ZA) return 'alert';
    if (d < C.ZT) return 'tease';
    if (d < C.ZN) return 'notice';
    return 'far';
  }
  function repulse() {
    var c  = bC();
    var dx = c.x - S.mx, dy = c.y - S.my;
    var d  = Math.hypot(dx, dy) || 1;
    var nx = dx / d, ny = dy / d;
    if (d < C.ZP) {
      var t = Math.pow((C.ZP - d) / C.ZP, 1.2);
      S.vx += nx * t * C.PF; S.vy += ny * t * C.PF * 0.6;
    } else {
      var t2 = Math.pow((C.ZF - d) / C.ZF, 1.5);
      S.vx += nx * t2 * C.FF; S.vy += ny * t2 * C.FF * 0.55;
    }
    S.sxv += ny * 0.5; S.syv += nx * 0.5;
  }
  function tickSquish(sp) {
    var ux = sp > 0.2 ? S.vx / sp : 0;
    var uy = sp > 0.2 ? S.vy / sp : 0;
    var k  = cl(sp * 0.024, 0, C.SQA);
    var tx = 1 + (ux * ux - uy * uy * 0.5) * k;
    var ty = 1 + (uy * uy - ux * ux * 0.5) * k;
    S.sxv = S.sxv * C.SQD + (tx - S.sx) * C.SQK;
    S.syv = S.syv * C.SQD + (ty - S.sy) * C.SQK;
    S.sx = cl(S.sx + S.sxv, 0.6, 1.5);
    S.sy = cl(S.sy + S.syv, 0.6, 1.5);
  }
  function tickPupils() {
    var tx = 0, ty = 0;
    if (S.mx > 0 && S.mood !== 'sleeping') {
      var c = bC();
      var dx = S.mx - c.x, dy = S.my - c.y;
      var d  = Math.hypot(dx, dy) || 1;
      var r  = cl(d / 90, 0, 1) * 4;
      tx = (dx / d) * r; ty = (dy / d) * r;
    }
    S.plx = lr(S.plx, tx, 0.14); S.ply = lr(S.ply, ty, 0.14);
    S.prx = lr(S.prx, tx, 0.14); S.pry = lr(S.pry, ty, 0.14);
  }

  function onZone(prev, cur) {
    if (cur === 'panic' || cur === 'flee') {
      mood('scared');
      if (cur === 'panic') { S.sxv = -1.1; S.syv = 1.1; }
    } else if (cur === 'tease' || cur === 'notice') {
      if (S.mood === 'normal' || S.mood === 'curious') mood('curious');
    } else if (cur === 'far' && (prev === 'flee' || prev === 'panic')) {
      mood('happy');
      spark(6); hearts(2);
      setTimeout(function () { mood('normal'); }, 1800);
    }
  }

  /* ════════════════════════════════════════════════════════════
     PARTICLES
     ════════════════════════════════════════════════════════════ */
  var pts = [];
  function mkPt(ch, cls, x, y) {
    if (!FX) return;
    var e = document.createElement('div');
    e.className = 'h-pt ' + cls;
    e.textContent = ch;
    e.style.left = x + 'px';
    e.style.top  = y + 'px';
    e._vx = rn(-2.5, 2.5);
    e._vy = rn(-3.5, -1.2);
    e._life = rn(600, 1100);
    e._born = Date.now();
    FX.appendChild(e);
    pts.push(e);
  }
  function spark(n) {
    var b = bC();
    for (var i = 0; i < n; i++)
      mkPt(['✦','✧','⋆','·'][0|rn(0,4)], 'h-pt-sp', b.x - 7, b.y - 7);
  }
  function hearts(n) {
    var b = bC();
    for (var i = 0; i < n; i++) mkPt('♥', 'h-pt-hrt', b.x - 6, b.y - 6);
  }
  function zzz() {
    var b = bC();
    mkPt(['z','Z','ᶻ'][0|rn(0,3)], 'h-pt-zzz', b.x + rn(-10,10), b.y - 35);
  }
  function tickPts() {
    var now = Date.now();
    pts = pts.filter(function (p) {
      var age = now - p._born;
      if (age > p._life) { p.remove(); return false; }
      p._vy += 0.065;
      p.style.left = (parseFloat(p.style.left) + p._vx) + 'px';
      p.style.top  = (parseFloat(p.style.top)  + p._vy) + 'px';
      var t = age / p._life;
      p.style.opacity   = (1 - t * t).toFixed(2);
      p.style.transform = 'scale(' + (1 - t * 0.45).toFixed(2) + ')';
      return true;
    });
  }

  /* ════════════════════════════════════════════════════════════
     RAIN + UMBRELLA
     ════════════════════════════════════════════════════════════ */
  var rdrops = [], rInt = null;
  function startRain() {
    if (S.rain) return;
    S.rain = true; mood('sad');
    rInt = setInterval(mkRDrop, 55);
    setTimeout(showUmb, 2200);
    setTimeout(stopRain, 20000);
  }
  function stopRain() {
    if (!S.rain) return;
    S.rain = false;
    clearInterval(rInt); rInt = null;
    rdrops.forEach(function (d) { try { d.remove(); } catch (e) {} });
    rdrops = [];
    hideUmb();
    if (S.mood === 'sad' || S.mood === 'sheltered') {
      mood('happy'); spark(5);
      setTimeout(function () { mood('normal'); }, 1500);
    }
  }
  function mkRDrop() {
    if (!RAIN || S.shelter) return;
    var d = document.createElement('div');
    d.className = 'h-rdrop';
    d.style.height = rn(8, 16) + 'px';
    d.style.left   = rn(2, 58) + 'px';
    d.style.top    = '-5px';
    d._vy = rn(4, 7);
    RAIN.appendChild(d);
    rdrops.push(d);
  }
  function tickRain() {
    rdrops = rdrops.filter(function (d) {
      var y = parseFloat(d.style.top) + d._vy;
      if (y > 66) { try { d.remove(); } catch (e) {} return false; }
      d.style.top = y + 'px';
      return true;
    });
  }
  function showUmb() {
    if (!UMB) return;
    var c = bC();
    S.ux = cl(c.x + 110, 10, window.innerWidth  - 70);
    S.uy = cl(c.y - 30,  10, window.innerHeight - 56);
    UMB.style.left    = S.ux + 'px';
    UMB.style.top     = S.uy + 'px';
    UMB.style.display = 'block';
    setTimeout(function () { UMB.classList.add('h-umb-show'); }, 30);
  }
  function hideUmb() {
    if (!UMB) return;
    UMB.classList.remove('h-umb-show', 'h-umb-cover');
    setTimeout(function () { if (!S.rain) UMB.style.display = 'none'; }, 420);
    S.shelter = false;
  }
  function chkShelter() {
    if (!S.rain || !UMB || UMB.style.display === 'none') return;
    var c = bC();
    var d = Math.hypot((S.ux + 31) - c.x, (S.uy + 24) - (c.y - 14));
    if (d < 48) {
      if (!S.shelter) {
        S.shelter = true;
        UMB.classList.add('h-umb-cover');
        mood('sheltered');
        hearts(4);
        rdrops.forEach(function (d) { try { d.remove(); } catch (e) {} });
        rdrops = [];
      }
    } else if (S.shelter) {
      S.shelter = false;
      UMB.classList.remove('h-umb-cover');
      if (S.rain) mood('sad');
    }
  }
  function schedRain() {
    setTimeout(function () { startRain(); schedRain(); }, rn(5*60000, 14*60000));
  }

  /* ════════════════════════════════════════════════════════════
     DOM update each frame
     ════════════════════════════════════════════════════════════ */
  function applyDOM() {
    if (!W) return;
    var sp2 = Math.hypot(S.vx, S.vy);
    var fy = (!S.drag && sp2 < 0.5) ? Math.sin(Date.now() / 1320) * 3 : 0;
    W.style.transform =
      'translate(' + (S.x | 0) + 'px,' + ((S.y | 0) + fy).toFixed(1) + 'px)';
    if (BALL)
      BALL.style.transform =
        'scaleX(' + S.sx.toFixed(3) + ') scaleY(' + S.sy.toFixed(3) + ')';
    if (PL) PL.style.transform = 'translate(' + S.plx.toFixed(1) + 'px,' + S.ply.toFixed(1) + 'px)';
    if (PR) PR.style.transform = 'translate(' + S.prx.toFixed(1) + 'px,' + S.pry.toFixed(1) + 'px)';
  }

  /* ════════════════════════════════════════════════════════════
     MAIN TICK
     ════════════════════════════════════════════════════════════ */
  function tick() {
    try {
      if (!S.drag) {
        var d = dMouse();
        var z = toZone(d);
        if (z !== S.zone) { onZone(S.zone, z); S.zone = z; }

        if (z === 'flee' || z === 'panic') {
          repulse();
        } else if (z === 'alert') {
          var c = bC();
          var ax = c.x - S.mx, ay = c.y - S.my;
          var ad = Math.hypot(ax, ay) || 1;
          S.vx += (ax/ad) * 0.55; S.vy += (ay/ad) * 0.4;
        }

        /* spring */
        S.vx = S.vx * C.SD + (S.tx - S.x) * C.SK;
        S.vy = S.vy * C.SD + (S.ty - S.y) * C.SK;

        var sp = Math.hypot(S.vx, S.vy);
        if (sp > C.MSP) { S.vx = (S.vx/sp)*C.MSP; S.vy = (S.vy/sp)*C.MSP; }

        var nx = S.x + S.vx, ny = S.y + S.vy;
        var mxv = maxX(), myv = maxY();
        if (nx < 4)   { S.vx *= -0.5; nx = 4;   S.sxv = -0.7; }
        if (nx > mxv) { S.vx *= -0.5; nx = mxv; S.sxv = -0.7; }
        if (ny < 4)   { S.vy *= -0.5; ny = 4;   S.syv = -0.7; }
        if (ny > myv) { S.vy *= -0.5; ny = myv; S.syv = -0.7; }
        S.x = nx; S.y = ny;

        tickSquish(sp);
      }

      if (S.sleeping && Date.now() - S.lastZzz > 2400) {
        S.lastZzz = Date.now(); zzz();
      }

      applyDOM();
      tickPupils();
      tickPts();
      if (S.rain) tickRain();
      chkShelter();
    } catch (e) {}
    requestAnimationFrame(tick);
  }

  /* ════════════════════════════════════════════════════════════
     INTERACTIONS
     ════════════════════════════════════════════════════════════ */
  function initDrag() {
    function ds(mx, my) {
      S.drag = true; S.dox = mx - S.x; S.doy = my - S.y;
      W.style.cursor = 'grabbing';
      S.sxv = -0.7; S.syv = 0.7;
    }
    function dm(mx, my) {
      if (!S.drag) return;
      S.x = cl(mx - S.dox, 4, maxX());
      S.y = cl(my - S.doy, 4, maxY());
      S.tx = S.x; S.ty = S.y;
      S.vx = 0; S.vy = 0;
    }
    function de() {
      if (!S.drag) return;
      S.drag = false;
      W.style.cursor = 'pointer';
      S.vy -= 2; S.sxv = 0.5; S.syv = -0.5;
      /* after release, snap back to anchor */
      setTimeout(function () { AnchorTracker.update(true); }, 800);
    }
    W.addEventListener('mousedown',  function (e) { if (!e.target.closest('button,a')) { e.preventDefault(); ds(e.clientX, e.clientY); }});
    W.addEventListener('touchstart', function (e) { e.preventDefault(); ds(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    document.addEventListener('mousemove', function (e) { dm(e.clientX, e.clientY); });
    document.addEventListener('touchmove', function (e) { if (S.drag) dm(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    document.addEventListener('mouseup',  de);
    document.addEventListener('touchend', de);
  }

  function initUmbDrag() {
    if (!UMB) return;
    UMB.addEventListener('mousedown', function (e) {
      e.preventDefault(); e.stopPropagation();
      S.udrag = true; S.udox = e.clientX - S.ux; S.udoy = e.clientY - S.uy;
    });
    document.addEventListener('mousemove', function (e) {
      if (!S.udrag) return;
      S.ux = e.clientX - S.udox; S.uy = e.clientY - S.udoy;
      UMB.style.left = S.ux + 'px'; UMB.style.top = S.uy + 'px';
    });
    document.addEventListener('mouseup', function () { S.udrag = false; });
    UMB.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      S.udrag = true;
      S.udox = e.touches[0].clientX - S.ux;
      S.udoy = e.touches[0].clientY - S.uy;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!S.udrag) return;
      S.ux = e.touches[0].clientX - S.udox;
      S.uy = e.touches[0].clientY - S.udoy;
      UMB.style.left = S.ux + 'px'; UMB.style.top = S.uy + 'px';
    }, { passive: true });
    document.addEventListener('touchend', function () { S.udrag = false; });
  }

  function buildStars() {
    if (!STARS) return;
    for (var i = 0; i < 22; i++) {
      var s = document.createElement('div');
      s.className = 'h-star';
      var sz = rn(0.8, 2.3);
      s.style.cssText =
        'width:'+sz+'px;height:'+sz+'px;' +
        'left:'+rn(5,92)+'%;top:'+rn(5,92)+'%;' +
        'animation-delay:'+rn(0,4)+'s;' +
        'animation-duration:'+rn(1.4,3.8)+'s;';
      STARS.appendChild(s);
    }
  }

  function initEvents() {
    /* Mouse */
    window.addEventListener('mousemove', function (e) {
      S.mx = e.clientX; S.my = e.clientY;
      S.idleAt = Date.now();
      if (S.sleeping) {
        S.sleeping = false; mood('curious'); spark(3);
        AnchorTracker.update(true);
      }
    }, { passive: true });
    window.addEventListener('mouseleave', function () { S.mx = -9999; S.my = -9999; });
    window.addEventListener('touchmove', function (e) {
      S.mx = e.touches[0].clientX; S.my = e.touches[0].clientY;
      S.idleAt = Date.now();
    }, { passive: true });

    /* Exit intent */
    document.addEventListener('mouseleave', function (e) {
      if (e.clientY < 15 && ARM_W) {
        mood('sad'); hearts(4);
        ARM_W.classList.remove('h-wave');
        void ARM_W.offsetWidth;
        ARM_W.classList.add('h-wave');
        setTimeout(function () {
          ARM_W.classList.remove('h-wave');
          mood('normal');
        }, 2000);
      }
    });

    /* Click ball */
    W.addEventListener('click', function (e) {
      if (S.drag) return;
      e.stopPropagation();
      spark(7); hearts(2);
      S.sxv = -1.0; S.syv = 1.0;
      mood('happy');
      /* Cycle through fun shapes */
      var fun = ['ball','heart','bulb','arrow','magnify','cart'];
      var i = fun.indexOf(S.shape);
      ShapeMorph.to(fun[(i + 1) % fun.length]);
      setTimeout(function () { mood('normal'); }, 1400);
    });

    /* Scroll = re-anchor smartly */
    var scrollT = null;
    window.addEventListener('scroll', function () {
      if (scrollT) return;
      scrollT = setTimeout(function () {
        scrollT = null;
        AnchorTracker.update();
      }, 120);
    }, { passive: true });

    /* Resize */
    window.addEventListener('resize', function () {
      S.tx = cl(S.tx, 4, maxX()); S.ty = cl(S.ty, 4, maxY());
      AnchorTracker.update(true);
    });

    /* Sleep check */
    setInterval(function () {
      if (S.drag || S.rain || S.udrag) return;
      if (Date.now() - S.idleAt > C.SLP && !S.sleeping) {
        S.sleeping = true;
        mood('sleeping');
      }
    }, 5000);

    /* Periodic re-scan of page (for dynamic content) */
    setInterval(function () {
      pageInfo = PageAI.analyze();
      AnchorTracker.update(true);
    }, 8000);

    /* Hourly time refresh */
    setInterval(applyTime, 3600000);

    /* Page-specific moods (key moments only) */
    if (window.HC && window.HC.page) {
      var pg = window.HC.page;
      if (pg.is404) {
        setTimeout(function () { mood('sad'); S.sxv = -0.8; S.syv = 0.8; }, 1500);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════
     BOOT
     ════════════════════════════════════════════════════════════ */
  function boot() {
    ROOT  = document.getElementById('h-root');
    W     = document.getElementById('h-w');
    BALL  = document.getElementById('h-ball');
    PL    = document.getElementById('h-pl');
    PR    = document.getElementById('h-pr');
    RAIN  = document.getElementById('h-rain');
    UMB   = document.getElementById('h-umb');
    FX    = document.getElementById('h-fx');
    ARM_W = document.getElementById('h-arm-w');
    STARS = document.getElementById('h-stars');
    ICON  = document.getElementById('h-icon');
    GLOW  = document.getElementById('h-glow');

    if (!W || !BALL) return;

    /* Intelligence sweep */
    ThemeSense.apply();
    pageInfo = PageAI.analyze();

    /* Initial position: bottom-right */
    S.x = window.innerWidth  - C.WRAP - 24;
    S.y = window.innerHeight - C.WRAP - 24;
    S.tx = S.x; S.ty = S.y;
    W.style.transform = 'translate(' + S.x + 'px,' + S.y + 'px)';
    W.classList.add('h-ready');

    buildStars();
    applyTime();
    initDrag();
    initUmbDrag();
    initEvents();
    schedRain();

    /* First anchor pick after a beat */
    setTimeout(function () { AnchorTracker.update(true); }, 900);

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Public API */
  window.HarfoAI = {
    rain:    startRain,
    rescan:  function () { pageInfo = PageAI.analyze(); AnchorTracker.update(true); },
    shape:   function (s) { ShapeMorph.to(s); },
    mood:    mood,
    happy:   function () { spark(9); mood('happy'); }
  };

})();
