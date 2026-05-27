/**
 * حرفو v7 — engine/particles.js
 * Lightweight DOM-based particle system.
 *
 * Particles are <div class="h-particle h-p-{type}"> elements injected
 * into the container.  They are driven entirely by CSS animations;
 * JavaScript only creates them and removes them after the animation ends.
 *
 * CSS custom properties used per particle:
 *   --tx   final X translation (px)
 *   --ty   final Y translation (px)
 *   --hx   mid-arc X offset (px)  — used for parabolic feel
 *   --hy   mid-arc Y offset (px)
 *   --rot  rotation amount (deg)
 *   --sc   random end scale
 *   --dur  animation duration override (ms)  — optional
 *
 * SVG symbols referenced (must exist in the page sprite):
 *   #hs-spark  #hs-heart  #hs-star  #hs-note
 */
;(function (win) {
  'use strict';

  /* ─── internal ─── */
  var _container = null;   // DOM element that particles live inside

  /* ─────────────────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────────────────── */
  function rnd(lo, hi) { return lo + Math.random() * (hi - lo); }
  function rndInt(lo, hi) { return Math.floor(rnd(lo, hi + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /** Set a CSS custom property on an element */
  function cv(el, name, value) { el.style.setProperty(name, value); }

  /** Build an SVG <use> referencing one of the sprite symbols */
  function svgUse(symbolId) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + symbolId);
    use.setAttribute('href', '#' + symbolId);
    svg.appendChild(use);
    return svg;
  }

  /**
   * createParticle(type, opts)
   * type: 'spark'|'heart'|'star'|'note'|'text'
   * opts: { x, y, tx, ty, hx, hy, rot, sc, dur, text }
   *   x/y = starting position relative to container
   */
  function createParticle(type, opts) {
    if (!_container) { return null; }
    opts = opts || {};

    var el = document.createElement('div');
    el.className = 'h-particle h-p-' + type;

    /* Position */
    el.style.left = (opts.x || 0) + 'px';
    el.style.top  = (opts.y || 0) + 'px';

    /* Custom properties for CSS animation */
    cv(el, '--tx',  (opts.tx  != null ? opts.tx  : rnd(-60, 60))   + 'px');
    cv(el, '--ty',  (opts.ty  != null ? opts.ty  : rnd(-80, -20))  + 'px');
    cv(el, '--hx',  (opts.hx  != null ? opts.hx  : rnd(-30, 30))   + 'px');
    cv(el, '--hy',  (opts.hy  != null ? opts.hy  : rnd(-100, -40)) + 'px');
    cv(el, '--rot', (opts.rot != null ? opts.rot : rnd(-180, 180))  + 'deg');
    cv(el, '--sc',  (opts.sc  != null ? opts.sc  : rnd(0.4, 1.2)));

    if (opts.dur) { cv(el, '--dur', opts.dur + 'ms'); }

    /* Inner icon or text */
    if (type === 'text') {
      el.textContent = opts.text || '';
    } else {
      var symbolMap = {
        spark: 'hs-spark',
        heart: 'hs-heart',
        star:  'hs-star',
        note:  'hs-note',
      };
      var sym = symbolMap[type];
      if (sym) {
        el.appendChild(svgUse(sym));
      }
    }

    _container.appendChild(el);

    /* Self-remove after animation */
    var dur = opts.dur || 900;
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, dur + 100);

    return el;
  }

  /* ─────────────────────────────────────────────────────────────
     Container-relative position of the character centre.
     Used when callers don't supply explicit x/y.
  ───────────────────────────────────────────────────────────── */
  function charCentre() {
    if (!_container) { return { x: 60, y: 60 }; }
    /* If HarfoState is available, use actual character position */
    if (win.HarfoState && win.HarfoState.position) {
      var pos = win.HarfoState.position;
      var cfg = win.HarfoState.config;
      /* Convert viewport coords to container-relative */
      var cr = _container.getBoundingClientRect();
      return {
        x: pos.x + cfg.W * 0.5 - cr.left,
        y: pos.y + cfg.H * 0.5 - cr.top,
      };
    }
    var cw = _container.offsetWidth  || 120;
    var ch = _container.offsetHeight || 160;
    return { x: cw * 0.5, y: ch * 0.5 };
  }

  /* ─────────────────────────────────────────────────────────────
     Public API
  ───────────────────────────────────────────────────────────── */
  var HarfoParticles = {

    /* ── init(containerEl) ── */
    init: function (containerEl) {
      _container = containerEl;
    },

    /* ── emit(type, count, opts) ── */
    emit: function (type, count, opts) {
      if (!_container) { return; }
      count = count || 1;
      opts  = opts  || {};

      var centre = charCentre();
      var baseX  = (opts.x != null) ? opts.x : centre.x;
      var baseY  = (opts.y != null) ? opts.y : centre.y;

      for (var i = 0; i < count; i++) {
        var pOpts = {
          x:   baseX + rnd(-12, 12),
          y:   baseY + rnd(-12, 12),
          tx:  opts.tx  != null ? opts.tx  : rnd(-70, 70),
          ty:  opts.ty  != null ? opts.ty  : rnd(-90, -20),
          hx:  rnd(-40, 40),
          hy:  rnd(-110, -50),
          rot: rnd(-200, 200),
          sc:  rnd(0.5, 1.3),
          dur: opts.dur || rnd(700, 1100),
        };
        if (type === 'text') { pOpts.text = opts.text || ''; }
        createParticle(type, pOpts);
      }
    },

    /* ── sparks(count) ── */
    sparks: function (count) {
      this.emit('spark', count || 5, { ty: rnd(-60, -20) });
    },

    /* ── hearts(count) ── */
    hearts: function (count) {
      this.emit('heart', count || 3, { ty: rnd(-80, -40) });
    },

    /* ── stars(count) ── */
    stars: function (count) {
      this.emit('star', count || 4, { ty: rnd(-70, -30) });
    },

    /* ── notes(count) ── */
    notes: function (count) {
      this.emit('note', count || 3, { ty: rnd(-90, -50) });
    },

    /* ── text(str, x, y)
       Emit a floating text snippet at absolute viewport position. ── */
    text: function (str, x, y) {
      if (!_container) { return; }
      var cr  = _container.getBoundingClientRect();
      var lx  = (x != null) ? x - cr.left : charCentre().x;
      var ly  = (y != null) ? y - cr.top  : charCentre().y - 20;

      createParticle('text', {
        x:    lx,
        y:    ly,
        tx:   rnd(-30, 30),
        ty:   rnd(-70, -40),
        hx:   0,
        hy:   rnd(-80, -50),
        rot:  rnd(-10, 10),
        sc:   1,
        dur:  1400,
        text: str,
      });
    },

    /* ── burst(x, y, count)
       Large explosion of mixed particles at an absolute viewport pos. ── */
    burst: function (x, y, count) {
      if (!_container) { return; }
      count = count || 12;
      var cr = _container.getBoundingClientRect();
      var lx = x - cr.left;
      var ly = y - cr.top;

      var types = ['spark', 'spark', 'spark', 'heart', 'star'];
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2;
        var speed = rnd(50, 130);
        createParticle(pick(types), {
          x:   lx,
          y:   ly,
          tx:  Math.cos(angle) * speed,
          ty:  Math.sin(angle) * speed - 30,
          hx:  Math.cos(angle) * speed * 0.5,
          hy:  Math.sin(angle) * speed * 0.5 - 50,
          rot: rnd(-270, 270),
          sc:  rnd(0.7, 1.6),
          dur: rnd(650, 1050),
        });
      }
    },

    /* ── confetti()
       Big celebration burst with many mixed particles. ── */
    confetti: function () {
      if (!_container) { return; }
      var vw  = win.innerWidth  || 800;
      var vh  = win.innerHeight || 600;
      var cr  = _container.getBoundingClientRect();

      /* Fire from a few points across the top of the viewport */
      var origins = [
        { x: vw * 0.25, y: vh * 0.1 },
        { x: vw * 0.5,  y: vh * 0.05 },
        { x: vw * 0.75, y: vh * 0.1 },
      ];

      var allTypes = ['spark', 'heart', 'star', 'note'];
      for (var oi = 0; oi < origins.length; oi++) {
        var ox = origins[oi].x - cr.left;
        var oy = origins[oi].y - cr.top;
        for (var i = 0; i < 14; i++) {
          createParticle(pick(allTypes), {
            x:   ox + rnd(-20, 20),
            y:   oy,
            tx:  rnd(-100, 100),
            ty:  rnd(80, 220),
            hx:  rnd(-60, 60),
            hy:  rnd(-40, 20),
            rot: rnd(-360, 360),
            sc:  rnd(0.8, 1.8),
            dur: rnd(900, 1500),
          });
        }
      }
    },

    /* ── trail()
       Leave a small sparkle at the character's current position.
       Intended to be called once per frame during fast movement. ── */
    trail: function () {
      if (!_container) { return; }
      var centre = charCentre();
      createParticle('spark', {
        x:   centre.x + rnd(-10, 10),
        y:   centre.y + rnd(-8,  8),
        tx:  rnd(-18, 18),
        ty:  rnd(-30, -10),
        hx:  rnd(-10, 10),
        hy:  rnd(-35, -15),
        rot: rnd(-90, 90),
        sc:  rnd(0.3, 0.8),
        dur: rnd(380, 580),
      });
    },

  };

  win.HarfoParticles = HarfoParticles;

}(window));
