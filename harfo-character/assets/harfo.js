/* ════════════════════════════════════════════════════════
   حرفو v10.1 — Galaxy Mascot JS (self-contained, no external deps)
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Constants ── */
  var C = {
    SK: 0.052, SD: 0.82, MSP: 18,          /* spring */
    SQK: 0.18, SQD: 0.66, SQA: 0.30,       /* squish */
    WI_MIN: 3200, WI_MAX: 7500,             /* wander interval ms */
    WD_MIN: 0.18, WD_MAX: 0.76,            /* wander distance fraction */
    NOTICE: 400, TEASE: 260, ALERT: 165,
    FLEE: 110, PANIC: 62,
    IDLE_SLEEP: 22000,
    RAIN_DROPS: 14, RAIN_SPD_MIN: 280, RAIN_SPD_MAX: 520,
    RAIN_HOURS: [6, 7, 8, 17, 18, 19, 20, 21],
    FLOAT_AMP: 3.2, FLOAT_FREQ: 0.0008,
  };

  /* ── State ── */
  var S = {
    x: 0, y: 0, vx: 0, vy: 0,
    tx: 0, ty: 0,
    sqx: 1, sqy: 1, sqvx: 0, sqvy: 0,
    mx: -999, my: -999,
    idle: 0, lastMove: 0,
    sleeping: false,
    nextWander: 0,
    dragging: false, dragOx: 0, dragOy: 0,
    mood: 'normal',
    shape: 'ball',
    perchEl: null, perchRect: null,
    raining: false,
    umbDrag: false, umbX: 0, umbY: 0,
    umbVx: 0, umbVy: 0,
    sheltered: false,
    lastTick: 0,
    booted: false,
    pupLx: 4, pupLy: 4, pupRx: 4, pupRy: 4,
    ptId: 0,
  };

  /* ── DOM refs ── */
  var ROOT, W, BALL, GLOW, FACE, EL, ER, PL, PR, MO,
      ARM, STARS, NEB, ICON, FX, RAIN, UMB, ARMW;

  function grab() {
    ROOT  = document.getElementById('harfo-root');
    W     = document.getElementById('harfo-w');
    BALL  = document.getElementById('harfo-ball');
    GLOW  = document.getElementById('harfo-glow');
    FACE  = document.getElementById('harfo-face');
    EL    = document.getElementById('harfo-el');
    ER    = document.getElementById('harfo-er');
    PL    = document.getElementById('harfo-pl');
    PR    = document.getElementById('harfo-pr');
    MO    = document.getElementById('harfo-mo');
    ARM   = document.getElementById('harfo-arm');
    STARS = document.getElementById('harfo-stars');
    NEB   = document.getElementById('harfo-neb');
    ICON  = document.getElementById('harfo-icon');
    FX    = document.getElementById('harfo-fx');
    RAIN  = document.getElementById('harfo-rain');
    UMB   = document.getElementById('harfo-umb');
    ARMW  = document.getElementById('harfo-armw');
    return !!(W && BALL && FX);
  }

  /* ══════════════════════════════════════════════════════
     MODULE 1 — ThemeSense: reads site colors & Elementor kit
     ══════════════════════════════════════════════════════ */
  var ThemeSense = (function () {
    function hexToRgb(h) {
      h = h.replace('#','');
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      var n = parseInt(h, 16);
      return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 };
    }
    function luminance(r,g,b) { return 0.2126*r + 0.7152*g + 0.0722*b; }

    function sampleDOM() {
      var candidates = [];
      var els = document.querySelectorAll(
        '.elementor-widget-container,[class*="bg-"],[style*="background"],' +
        'header,nav,.site-header,.elementor-section'
      );
      for (var i = 0; i < Math.min(els.length, 40); i++) {
        var cs = window.getComputedStyle(els[i]);
        var bg = cs.backgroundColor;
        var m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          var r = +m[1], g = +m[2], b = +m[3];
          if (r+g+b > 30 && !(r>230&&g>230&&b>230)) candidates.push({r:r,g:g,b:b});
        }
      }
      return candidates;
    }

    function apply() {
      var colors = [];
      /* 1. Elementor kit colors from PHP (passed via HC) */
      if (typeof HC !== 'undefined' && HC.elementor && HC.elementor.kit && HC.elementor.kit.length) {
        for (var i = 0; i < HC.elementor.kit.length; i++) {
          colors.push(hexToRgb(HC.elementor.kit[i]));
        }
      }
      /* 2. DOM sample fallback */
      if (colors.length < 2) {
        colors = colors.concat(sampleDOM());
      }
      if (!colors.length) return;

      /* Pick darkest vibrant candidate as primary accent */
      colors.sort(function(a,b){ return luminance(a.r,a.g,a.b) - luminance(b.r,b.g,b.b); });
      var p = colors[0];
      if (luminance(p.r,p.g,p.b) < 5) p = {r:124,g:58,b:237};

      var hcA = 'rgb('+p.r+','+p.g+','+p.b+')';
      var hcB = 'rgb('+Math.round(p.r*.45)+','+Math.round(p.g*.35)+','+Math.round(p.b*.55)+')';
      var hcC = 'rgb('+Math.round(p.r*.1)+','+Math.round(p.g*.08)+','+Math.round(p.b*.16)+')';
      var hcG = 'rgba('+p.r+','+p.g+','+p.b+',.58)';

      ROOT.style.setProperty('--hc-a', hcA);
      ROOT.style.setProperty('--hc-b', hcB);
      ROOT.style.setProperty('--hc-c', hcC);
      ROOT.style.setProperty('--hc-glow', hcG);
    }

    return { apply: apply };
  })();

  /* ══════════════════════════════════════════════════════
     MODULE 2 — PageAI: understands page type and Elementor content
     ══════════════════════════════════════════════════════ */
  var PageAI = (function () {
    var info = {
      type: 'generic', widgets: [], headings: [], images: [],
      buttons: [], hasHero: false, hasProducts: false,
      elementorTemplate: '', wordCount: 0,
    };

    function analyze() {
      var hc = (typeof HC !== 'undefined') ? HC : {};

      if (hc.is404)           info.type = '404';
      else if (hc.isSearch)   info.type = 'search';
      else if (hc.isProduct)  info.type = 'product';
      else if (hc.isShop)     info.type = 'shop';
      else if (hc.isSingle)   info.type = 'article';
      else if (hc.isHome)     info.type = 'home';
      else info.type = (hc.postType) || 'generic';

      /* Elementor widget scan */
      info.widgets = [];
      var wEls = document.querySelectorAll('[class*="elementor-widget-"]');
      for (var i = 0; i < wEls.length; i++) {
        var m = wEls[i].className.match(/elementor-widget-([\w-]+)/);
        if (m) info.widgets.push(m[1]);
      }

      /* Headings */
      info.headings = [];
      var hEls = document.querySelectorAll(
        '.elementor-heading-title,.elementor-widget-heading h1,.elementor-widget-heading h2,h1,h2'
      );
      for (var j = 0; j < hEls.length; j++) {
        var t = (hEls[j].textContent || '').trim();
        if (t) info.headings.push(t.substring(0,80));
      }

      /* Images */
      info.images = [];
      var iEls = document.querySelectorAll(
        '.elementor-widget-image img,.elementor-image img,article img,.wp-post-image'
      );
      for (var k = 0; k < iEls.length; k++) {
        if (iEls[k].src) info.images.push(iEls[k].src);
      }

      /* Buttons */
      info.buttons = [];
      var bEls = document.querySelectorAll(
        '.elementor-button,.elementor-widget-button a,.wp-block-button__link,button'
      );
      for (var l = 0; l < bEls.length; l++) {
        var bt = (bEls[l].textContent || '').trim();
        if (bt) info.buttons.push(bt.substring(0,40));
      }

      /* Hero detection */
      info.hasHero = !!(
        document.querySelector('.elementor-section.elementor-section-height-full') ||
        document.querySelector('.e-con[class*="hero"]') ||
        document.querySelector('[class*="hero-section"]')
      );

      /* Products */
      info.hasProducts = !!(
        document.querySelector('.products') ||
        document.querySelector('.elementor-widget-woocommerce-products') ||
        document.querySelector('.woocommerce-loop-product__title')
      );

      /* Word count */
      var texts = document.querySelectorAll(
        '.elementor-widget-text-editor p,.elementor-widget-text-editor div,article p'
      );
      var wc = 0;
      for (var n = 0; n < texts.length; n++) {
        wc += (texts[n].textContent || '').split(/\s+/).length;
      }
      info.wordCount = wc;
      info.elementorTemplate = (hc.elementor) ? (hc.elementor.template || '') : '';

      return info;
    }

    function get() { return info; }

    function reactToPage() {
      var i = info;
      if (i.type === '404')                     setMood('sad');
      else if (i.type === 'product' || i.hasProducts) setMood('curious');
      else if (i.type === 'home' && i.hasHero)  setMood('happy');
      else if (i.wordCount > 800)               setMood('reading');
      else                                       setMood('normal');
    }

    return { analyze: analyze, get: get, reactToPage: reactToPage };
  })();

  /* ══════════════════════════════════════════════════════
     MODULE 3 — ShapeMorph: icon SVG paths
     ══════════════════════════════════════════════════════ */
  var ShapeMorph = (function () {
    var ICONS = {
      magnify: '<circle cx="26" cy="26" r="16" stroke="white" stroke-width="5" fill="none"/><line x1="37" y1="37" x2="54" y2="54" stroke="white" stroke-width="5" stroke-linecap="round"/>',
      cart:    '<path d="M8 12h48l-6 24H20L8 12z" stroke="white" stroke-width="4" fill="none"/><circle cx="24" cy="44" r="4" fill="white"/><circle cx="42" cy="44" r="4" fill="white"/>',
      heart:   '<path d="M32 50 C18 40 8 32 8 22 C8 14 14 10 20 10 C25 10 30 14 32 18 C34 14 39 10 44 10 C50 10 56 14 56 22 C56 32 46 40 32 50Z" fill="rgba(244,114,182,.9)"/>',
      bulb:    '<circle cx="32" cy="28" r="14" stroke="#FBBF24" stroke-width="4" fill="none"/><path d="M26 44h12M28 50h8" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>',
      arrow:   '<path d="M16 32h32M36 20l12 12-12 12" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    };
    var current = 'ball';

    function to(shape) {
      if (current === shape) return;
      current = shape;
      BALL.dataset.shape = (shape === 'ball') ? '' : shape;
      if (ICONS[shape]) {
        ICON.innerHTML = ICONS[shape];
        ICON.style.opacity = '1';
      } else {
        ICON.style.opacity = '0';
        setTimeout(function(){ ICON.innerHTML = ''; }, 400);
      }
    }

    function get() { return current; }
    return { to: to, get: get };
  })();

  /* ══════════════════════════════════════════════════════
     MODULE 4 — AnchorTracker: perch beside interesting DOM elements
     ══════════════════════════════════════════════════════ */
  var AnchorTracker = (function () {
    var SELECTORS = [
      '.elementor-heading-title',
      '.elementor-widget-image img',
      '.elementor-button',
      '.elementor-widget-text-editor p',
      '.woocommerce-loop-product__title',
      '.wp-post-image',
      'h1','h2','h3',
      'article p',
      'figure img',
    ];

    var perchTimer = 0;
    var perchActive = false;

    function scoreEl(el) {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight, vw = window.innerWidth;
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return 0;
      if (!r.height || !r.width) return 0;
      var visH = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / r.height;
      var visW = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) / r.width;
      var vis = visH * visW;
      var cx = vw/2, cy = vh/2;
      var ecx = r.left + r.width/2, ecy = r.top + r.height/2;
      var dist = Math.sqrt((ecx-cx)*(ecx-cx)+(ecy-cy)*(ecy-cy));
      var distFactor = 1 - Math.min(dist / (vw * 0.8), 1);
      return vis * 0.6 + distFactor * 0.4;
    }

    function pick() {
      var best = null, bestScore = 0.25;
      for (var s = 0; s < SELECTORS.length; s++) {
        var els = document.querySelectorAll(SELECTORS[s]);
        for (var i = 0; i < els.length; i++) {
          var sc = scoreEl(els[i]);
          if (sc > bestScore) { bestScore = sc; best = els[i]; }
        }
      }
      return best;
    }

    function perchFor(el) {
      if (!el) return;
      var r = el.getBoundingClientRect();
      var tw = (W && W.offsetWidth) ? W.offsetWidth : 100;
      var tx = r.right + 12;
      if (tx + tw > window.innerWidth - 20) tx = r.left - tw - 12;
      var ty = r.top + r.height/2 - tw/2;
      ty = Math.max(10, Math.min(ty, window.innerHeight - tw - 10));
      S.tx = tx; S.ty = ty;
      perchActive = true;
    }

    function update(force) {
      if (S.dragging) return;
      var now = Date.now();
      if (!force && now - perchTimer < 4000) return;
      perchTimer = now;
      var el = pick();
      if (el) perchFor(el);
      else perchActive = false;
    }

    function isActive() { return perchActive; }
    function release() { perchActive = false; }

    return { update: update, isActive: isActive, release: release };
  })();

  /* ══════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════ */
  function setMood(m) {
    if (S.mood === m) return;
    S.mood = m;
    BALL.dataset.mood = m;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function rn(a, b) { return a + Math.random() * (b - a); }

  function getHour() { return new Date().getHours(); }

  function setTimeOfDay() {
    var h = getHour();
    var t = (h >= 5 && h < 12) ? 'morning' : (h >= 18 || h < 5) ? 'night' : 'day';
    BALL.dataset.time = t;
  }

  /* ── Stars ── */
  function buildStars() {
    if (!STARS) return;
    STARS.innerHTML = '';
    for (var i = 0; i < 18; i++) {
      var s = document.createElement('div');
      s.className = 'harfo-star';
      var sz = rn(1.2, 2.8);
      s.style.cssText = [
        'width:'+sz+'px','height:'+sz+'px',
        'top:'+rn(8,88)+'%','left:'+rn(8,88)+'%',
        'animation-delay:'+rn(0,2.2)+'s',
        'animation-duration:'+rn(1.6,3.2)+'s',
      ].join(';');
      STARS.appendChild(s);
    }
  }

  /* ── Particles ── */
  function spawnParticle(type) {
    if (!FX) return;
    var id = 'hpt'+(++S.ptId);
    var el = document.createElement('div');
    el.className = 'harfo-pt harfo-pt-'+(type||'sp');
    el.id = id;
    var glyphs = {sp:'✦', hrt:'♥', zzz:'z'};
    el.textContent = glyphs[type] || glyphs.sp;
    var wx = S.x + 50, wy = S.y + 50;
    el.style.cssText = 'position:absolute;left:'+wx+'px;top:'+wy+'px;';
    FX.appendChild(el);
    var t0 = null;
    var vx = rn(-40,40), vy = rn(-80,-20);
    (function animPt(ts) {
      if (!t0) t0 = ts;
      var dt = (ts - t0) / 1000;
      var op = Math.max(0, 1 - dt * 1.4);
      el.style.left = (wx + vx * dt) + 'px';
      el.style.top  = (wy + vy * dt + 60 * dt * dt) + 'px';
      el.style.opacity = op;
      if (op > 0) requestAnimationFrame(animPt);
      else if (el.parentNode) el.parentNode.removeChild(el);
    })(performance.now());
  }

  /* ── ZZZ emitter ── */
  var zzzInterval = null;
  function startZzz() {
    if (zzzInterval) return;
    zzzInterval = setInterval(function() {
      if (S.sleeping) spawnParticle('zzz');
      else stopZzz();
    }, 1100);
  }
  function stopZzz() {
    clearInterval(zzzInterval);
    zzzInterval = null;
  }

  /* ══════════════════════════════════════════════════════
     RAIN SYSTEM
     ══════════════════════════════════════════════════════ */
  var rainDrops = [];
  var rainActive = false;

  function shouldRain() {
    var h = getHour();
    return C.RAIN_HOURS.indexOf(h) !== -1 || (Math.random() < 0.12);
  }

  function startRain() {
    if (rainActive || !RAIN || !UMB) return;
    rainActive = true;
    S.raining = true;
    RAIN.innerHTML = '';
    rainDrops = [];
    for (var i = 0; i < C.RAIN_DROPS; i++) {
      var d = document.createElement('div');
      d.className = 'harfo-rdrop';
      var h = rn(8, 18);
      d.style.cssText = [
        'height:'+h+'px',
        'left:'+rn(4,56)+'%',
        'top:'+(-h)+'px',
      ].join(';');
      RAIN.appendChild(d);
      rainDrops.push({ el:d, y:-h, spd:rn(C.RAIN_SPD_MIN, C.RAIN_SPD_MAX), h:h });
    }
    UMB.style.display = 'block';
    setTimeout(function() {
      UMB.classList.add('harfo-umb-show');
      S.umbX = clamp(S.x + rn(80,160), 0, window.innerWidth - 80);
      S.umbY = clamp(S.y + rn(20,60), 20, window.innerHeight - 80);
      UMB.style.left = S.umbX + 'px';
      UMB.style.top  = S.umbY + 'px';
    }, 200);
  }

  function stopRain() {
    if (!rainActive || !RAIN || !UMB) return;
    rainActive = false;
    S.raining = false;
    RAIN.innerHTML = '';
    rainDrops = [];
    UMB.classList.remove('harfo-umb-show','harfo-umb-cover');
    setTimeout(function() { if (UMB) UMB.style.display = 'none'; }, 450);
    if (S.sheltered) {
      S.sheltered = false;
      BALL.dataset.mood = S.mood;
    }
  }

  function tickRain(dt) {
    if (!rainActive || !RAIN || !UMB) return;
    for (var i = 0; i < rainDrops.length; i++) {
      var d = rainDrops[i];
      d.y += d.spd * dt;
      if (d.y > 64 + d.h) d.y = -d.h;
      d.el.style.top = d.y + 'px';
    }
    var ur = UMB.getBoundingClientRect();
    var br = W.getBoundingClientRect();
    var covered = (
      br.top > ur.top &&
      br.bottom < ur.bottom + 20 &&
      br.left > ur.left - 10 &&
      br.right < ur.right + 10
    );
    if (covered !== S.sheltered) {
      S.sheltered = covered;
      if (covered) {
        BALL.dataset.mood = 'sheltered';
        UMB.classList.add('harfo-umb-cover');
        spawnParticle('hrt');
      } else {
        BALL.dataset.mood = S.mood;
        UMB.classList.remove('harfo-umb-cover');
      }
    }
  }

  function initUmbDrag() {
    if (!UMB) return;
    function onDown(e) {
      e.preventDefault();
      S.umbDrag = true;
      var pt = e.touches ? e.touches[0] : e;
      var r = UMB.getBoundingClientRect();
      S.umbOx = pt.clientX - r.left;
      S.umbOy = pt.clientY - r.top;
    }
    function onMove(e) {
      if (!S.umbDrag) return;
      e.preventDefault();
      var pt = e.touches ? e.touches[0] : e;
      S.umbX = pt.clientX - S.umbOx;
      S.umbY = pt.clientY - S.umbOy;
      UMB.style.left = S.umbX + 'px';
      UMB.style.top  = S.umbY + 'px';
    }
    function onUp() { S.umbDrag = false; }
    UMB.addEventListener('mousedown', onDown);
    UMB.addEventListener('touchstart', onDown, {passive:false});
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  /* ══════════════════════════════════════════════════════
     WANDER
     ══════════════════════════════════════════════════════ */
  function wander() {
    if (S.dragging) return;
    AnchorTracker.release();
    var margin = 60;
    var vw = window.innerWidth, vh = window.innerHeight;
    S.tx = rn(margin, vw - margin - 100);
    S.ty = rn(margin, vh - margin - 100);
    S.nextWander = Date.now() + rn(C.WI_MIN, C.WI_MAX);
  }

  /* ══════════════════════════════════════════════════════
     EXIT INTENT
     ══════════════════════════════════════════════════════ */
  var exitFired = false;
  document.addEventListener('mouseleave', function(e) {
    if (e.clientY < 5 && !exitFired && ARMW) {
      exitFired = true;
      ARMW.classList.add('harfo-wave');
      setTimeout(function() {
        if (ARMW) ARMW.classList.remove('harfo-wave');
        exitFired = false;
      }, 2200);
    }
  });

  /* ══════════════════════════════════════════════════════
     DRAG (character)
     ══════════════════════════════════════════════════════ */
  function initDrag() {
    if (!W) return;
    function onDown(e) {
      if (UMB && (e.target === UMB || UMB.contains(e.target))) return;
      e.preventDefault();
      S.dragging = true;
      AnchorTracker.release();
      var pt = e.touches ? e.touches[0] : e;
      S.dragOx = pt.clientX - S.x;
      S.dragOy = pt.clientY - S.y;
      spawnParticle('sp');
    }
    function onMove(e) {
      if (!S.dragging) return;
      var pt = e.touches ? e.touches[0] : e;
      S.tx = pt.clientX - S.dragOx;
      S.ty = pt.clientY - S.dragOy;
    }
    function onUp() {
      if (!S.dragging) return;
      S.dragging = false;
      spawnParticle('hrt');
    }
    W.addEventListener('mousedown', onDown);
    W.addEventListener('touchstart', onDown, {passive:false});
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  /* ══════════════════════════════════════════════════════
     PUPIL TRACKING
     ══════════════════════════════════════════════════════ */
  function updatePupils() {
    if (!PL || !PR) return;
    var cx = S.x + 50, cy = S.y + 50;
    var dx = S.mx - cx, dy = S.my - cy;
    var dist = Math.sqrt(dx*dx+dy*dy) || 1;
    var maxR = 4;
    var tx = (dx/dist)*Math.min(dist*.18, maxR);
    var ty = (dy/dist)*Math.min(dist*.18, maxR);
    S.pupLx = lerp(S.pupLx, 4+tx, 0.14);
    S.pupLy = lerp(S.pupLy, 4+ty, 0.14);
    S.pupRx = lerp(S.pupRx, 4+tx, 0.14);
    S.pupRy = lerp(S.pupRy, 4+ty, 0.14);
    PL.style.transform = 'translate('+(S.pupLx-4)+'px,'+(S.pupLy-4)+'px)';
    PR.style.transform = 'translate('+(S.pupRx-4)+'px,'+(S.pupRy-4)+'px)';
  }

  /* ══════════════════════════════════════════════════════
     ZONE REACTIONS
     ══════════════════════════════════════════════════════ */
  function reactToMouse() {
    if (S.sleeping || S.dragging) return;
    var cx = S.x + 50, cy = S.y + 50;
    var dx = S.mx - cx, dy = S.my - cy;
    var dist = Math.sqrt(dx*dx+dy*dy);

    if (dist < C.PANIC) {
      var ang = Math.atan2(dy, dx);
      S.tx = clamp(S.x - Math.cos(ang)*180, 20, window.innerWidth-120);
      S.ty = clamp(S.y - Math.sin(ang)*180, 20, window.innerHeight-120);
      setMood('scared');
      AnchorTracker.release();
    } else if (dist < C.FLEE) {
      var ang2 = Math.atan2(dy, dx);
      S.tx = clamp(S.x - Math.cos(ang2)*90, 20, window.innerWidth-120);
      S.ty = clamp(S.y - Math.sin(ang2)*90, 20, window.innerHeight-120);
      setMood('scared');
    } else if (dist < C.ALERT) {
      setMood('curious');
    } else if (dist < C.NOTICE) {
      if (S.mood === 'scared') setMood('normal');
    } else {
      if (S.mood === 'scared' || S.mood === 'curious') setMood('normal');
    }
  }

  /* ══════════════════════════════════════════════════════
     MAIN PHYSICS TICK
     ══════════════════════════════════════════════════════ */
  function applyDOM() {
    var floatY = S.sleeping ? 0 : Math.sin(Date.now() * C.FLOAT_FREQ) * C.FLOAT_AMP;
    W.style.transform = 'translate('+(S.x|0)+'px,'+((S.y + floatY)|0)+'px)';
    BALL.style.transform = 'scale('+S.sqx.toFixed(3)+','+S.sqy.toFixed(3)+')';
  }

  var lastScrollY = window.scrollY || 0;
  var scrollMoodTime = 0;

  function tick(ts) {
    try {
      var dt = Math.min((ts - (S.lastTick||ts)) / 1000, 0.05);
      S.lastTick = ts;
      var now = Date.now();

      /* Wander */
      if (!S.dragging && !AnchorTracker.isActive() && now > S.nextWander) {
        wander();
      }

      /* Perch update */
      AnchorTracker.update(false);

      /* Zone reaction */
      reactToMouse();

      /* Spring physics */
      var ax = (S.tx - S.x) * C.SK;
      var ay = (S.ty - S.y) * C.SK;
      S.vx = (S.vx + ax) * C.SD;
      S.vy = (S.vy + ay) * C.SD;
      S.vx = clamp(S.vx, -C.MSP, C.MSP);
      S.vy = clamp(S.vy, -C.MSP, C.MSP);
      S.x += S.vx;
      S.y += S.vy;

      /* Boundary */
      var maxX = window.innerWidth  - ((W && W.offsetWidth)  || 100);
      var maxY = window.innerHeight - ((W && W.offsetHeight) || 100);
      if (S.x < 0)    { S.x = 0;    S.vx *= -0.4; }
      if (S.y < 0)    { S.y = 0;    S.vy *= -0.4; }
      if (S.x > maxX) { S.x = maxX; S.vx *= -0.4; }
      if (S.y > maxY) { S.y = maxY; S.vy *= -0.4; }

      /* Squish */
      var speed = Math.sqrt(S.vx*S.vx+S.vy*S.vy);
      var sqTx = 1 + speed * C.SQA * 0.025;
      var sqTy = 1 - speed * C.SQA * 0.018;
      S.sqvx = (S.sqvx + (sqTx - S.sqx) * C.SQK) * C.SQD;
      S.sqvy = (S.sqvy + (sqTy - S.sqy) * C.SQK) * C.SQD;
      S.sqx += S.sqvx;
      S.sqy += S.sqvy;
      S.sqx = clamp(S.sqx, 0.7, 1.45);
      S.sqy = clamp(S.sqy, 0.7, 1.45);

      /* Pupils */
      updatePupils();

      /* Idle / sleep */
      if (speed > 0.8 || S.dragging) S.idle = now;
      if (!S.sleeping && (now - S.idle) > C.IDLE_SLEEP) {
        S.sleeping = true;
        setMood('sleeping');
        startZzz();
      }
      if (S.sleeping && (speed > 1.5 || S.dragging)) {
        S.sleeping = false;
        stopZzz();
        PageAI.reactToPage();
      }

      /* Shape morph on scroll */
      var scrollY = window.scrollY || 0;
      if (Math.abs(scrollY - lastScrollY) > 60) {
        var pi = PageAI.get();
        if (pi.type === 'article' || pi.wordCount > 400) ShapeMorph.to('reader');
        else if (pi.hasProducts) ShapeMorph.to('cart');
        else ShapeMorph.to('ball');
        scrollMoodTime = now;
      }
      if (now - scrollMoodTime > 3000 && ShapeMorph.get() !== 'ball' && !S.dragging) {
        ShapeMorph.to('ball');
      }
      lastScrollY = scrollY;

      /* Rain */
      tickRain(dt);

      /* Apply to DOM */
      applyDOM();

    } catch(e) { /* keep loop alive on error */ }

    requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════════════════════
     EVENTS
     ══════════════════════════════════════════════════════ */
  var scrollThrottle = 0;
  window.addEventListener('scroll', function() {
    var now = Date.now();
    if (now - scrollThrottle > 600) {
      scrollThrottle = now;
      AnchorTracker.update(true);
    }
  }, {passive:true});

  document.addEventListener('mousemove', function(e) {
    S.mx = e.clientX;
    S.my = e.clientY;
    S.lastMove = Date.now();
    if (S.sleeping) { S.idle = Date.now(); }
  }, {passive:true});

  document.addEventListener('touchmove', function(e) {
    if (e.touches.length) {
      S.mx = e.touches[0].clientX;
      S.my = e.touches[0].clientY;
    }
  }, {passive:true});

  /* ══════════════════════════════════════════════════════
     RAIN SCHEDULE
     ══════════════════════════════════════════════════════ */
  function checkRainSchedule() {
    if (!rainActive && shouldRain()) {
      startRain();
      setTimeout(stopRain, rn(25000, 55000));
    }
    setTimeout(checkRainSchedule, rn(90000, 180000));
  }

  /* ══════════════════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════════════════ */
  function boot() {
    if (!grab()) {
      setTimeout(boot, 80);
      return;
    }

    /* CSS-first boot: read position from rendered CSS (bottom:28px, right:28px) */
    var rect = W.getBoundingClientRect();
    S.x  = rect.left;
    S.y  = rect.top;
    S.tx = S.x;
    S.ty = S.y;
    S.idle = Date.now();
    S.nextWander = Date.now() + rn(C.WI_MIN, C.WI_MAX);

    /* Switch wrapper to transform-driven physics */
    W.classList.add('harfo-phys');
    W.style.transform = 'translate('+S.x+'px,'+S.y+'px)';

    buildStars();
    setTimeOfDay();

    /* Click sparkle */
    W.addEventListener('click', function() {
      spawnParticle('sp');
      spawnParticle('hrt');
    });

    /* Intelligence */
    PageAI.analyze();
    PageAI.reactToPage();
    ThemeSense.apply();
    AnchorTracker.update(true);

    /* Drag & umbrella */
    initDrag();
    initUmbDrag();

    /* Rain — after page settles */
    setTimeout(function() {
      if (shouldRain()) {
        startRain();
        setTimeout(stopRain, rn(25000, 55000));
      }
      setTimeout(checkRainSchedule, rn(90000, 180000));
    }, 4000);

    /* RAF loop */
    requestAnimationFrame(tick);
  }

  /* Boot: wait for DOM, then also retry after Elementor renders */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(boot, 50); });
  } else {
    setTimeout(boot, 50);
  }

  /* Re-sense theme after Elementor frontend init */
  document.addEventListener('elementor/frontend/init', function() {
    setTimeout(function() {
      ThemeSense.apply();
      PageAI.analyze();
      PageAI.reactToPage();
    }, 600);
  });

})();
