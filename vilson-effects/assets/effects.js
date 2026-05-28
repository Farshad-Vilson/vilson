/* ════════════════════════════════════════════════════════
   Vilson Effects v2.0 — Murmuration + Mycelium
   ════════════════════════════════════════════════════════
   220 particles live on the page.
   They flock like starlings — separation, alignment, cohesion.
   Page headings / images / CTAs act as gravity wells.
   Between close particles: mycelium threads form.
   White background optimised: deep purple on white.
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var isMobile   = window.innerWidth < 768;
  var COUNT      = isMobile ? 130 : 220;
  var CELL       = 85;          /* spatial-grid cell size px        */

  /* ── Flocking radii & weights ── */
  var SEP_R = 30,  SEP_W = 0.055;   /* separation  */
  var ALI_R = 65,  ALI_W = 0.032;   /* alignment   */
  var COH_R = 95,  COH_W = 0.00035; /* cohesion    */
  var ANC_R = 210, ANC_W = 0.0038;  /* anchor pull */
  var CUR_R = 115, CUR_W = 0.055;   /* cursor push */
  var MAX_V = 1.9, MIN_V = 0.35;

  /* ── Mycelium ── */
  var MYC_DIST   = 70;    /* px — thread appears below this distance  */
  var MYC_ALPHA  = 0.072; /* base thread opacity                       */

  /* ── Colours (deep purple/indigo on white) ── */
  var COLORS = [
    { r:55,  g:15,  b:130, a:0.28 },   /* 55% — deep purple     */
    { r:28,  g:50,  b:135, a:0.20 },   /* 25% — deep blue       */
    { r:124, g:58,  b:237, a:0.32 },   /* 12% — bright violet   */
    { r:17,  g:94,  b:89,  a:0.18 },   /*  8% — teal accent     */
  ];
  var COLOR_WEIGHTS = [0.55, 0.25, 0.12, 0.08];

  /* ── Anchor selectors ── */
  var ANCHOR_SEL = [
    'h1','h2','h3',
    '.elementor-heading-title',
    '.elementor-widget-image img',
    '.elementor-button',
    '.elementor-icon-box-title',
    '.elementor-widget-counter .elementor-counter-number',
    '.elementor-widget-image-box img',
    '.woocommerce-loop-product__title',
    '.wp-post-image',
  ].join(',');

  /* ═══════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════ */
  var canvas, ctx;
  var W = window.innerWidth, H = window.innerHeight;
  var boids  = [];
  var anchors = [];
  var mx = -2000, my = -2000;

  /* Spatial grid — pre-allocated, cleared each frame */
  var gridW, gridH, grid;

  function buildGrid() {
    gridW = Math.ceil(W / CELL) + 2;
    gridH = Math.ceil(H / CELL) + 2;
    grid  = new Array(gridW * gridH);
    for (var i = 0; i < grid.length; i++) grid[i] = [];
  }

  function fillGrid() {
    for (var i = 0; i < grid.length; i++) grid[i].length = 0;
    for (var i = 0; i < boids.length; i++) {
      var b  = boids[i];
      var gx = (b.x / CELL) | 0;
      var gy = (b.y / CELL) | 0;
      if (gx >= 0 && gy >= 0 && gx < gridW && gy < gridH)
        grid[gy * gridW + gx].push(i);
    }
  }

  function cell(gx, gy) {
    if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridH) return null;
    return grid[gy * gridW + gx];
  }

  /* ═══════════════════════════════════════════════════════
     BOIDS
     ═══════════════════════════════════════════════════════ */
  function pickColor() {
    var r = Math.random(), acc = 0;
    for (var i = 0; i < COLOR_WEIGHTS.length; i++) {
      acc += COLOR_WEIGHTS[i];
      if (r < acc) return COLORS[i];
    }
    return COLORS[0];
  }

  function initBoids() {
    boids = [];
    for (var i = 0; i < COUNT; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = MIN_V + Math.random() * (MAX_V - MIN_V);
      var c   = pickColor();
      boids.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: c.r, g: c.g, b: c.b,
        a: c.a * (0.7 + Math.random() * 0.6),
        sz: 1.3 + Math.random() * 1.3,
        born: i,   /* staggered reveal */
      });
    }
  }

  function stepBoid(idx) {
    var b  = boids[idx];
    var gx = (b.x / CELL) | 0;
    var gy = (b.y / CELL) | 0;

    var sepX = 0, sepY = 0, sepN = 0;
    var aliX = 0, aliY = 0, aliN = 0;
    var cohX = 0, cohY = 0, cohN = 0;

    var span = Math.ceil(COH_R / CELL);

    for (var dy = -span; dy <= span; dy++) {
      for (var dx = -span; dx <= span; dx++) {
        var c = cell(gx + dx, gy + dy);
        if (!c) continue;
        for (var k = 0; k < c.length; k++) {
          var j = c[k];
          if (j === idx) continue;
          var o  = boids[j];
          var ex = b.x - o.x, ey = b.y - o.y;
          var d2 = ex * ex + ey * ey;

          if (d2 < SEP_R * SEP_R && d2 > 0.01) {
            var d = Math.sqrt(d2), f = 1 - d / SEP_R;
            sepX += ex / d * f; sepY += ey / d * f; sepN++;
          }
          if (d2 < ALI_R * ALI_R) { aliX += o.vx; aliY += o.vy; aliN++; }
          if (d2 < COH_R * COH_R) { cohX += o.x;  cohY += o.y;  cohN++; }
        }
      }
    }

    var ax = 0, ay = 0;

    if (sepN) { ax += sepX / sepN * SEP_W; ay += sepY / sepN * SEP_W; }
    if (aliN) { ax += (aliX / aliN - b.vx) * ALI_W; ay += (aliY / aliN - b.vy) * ALI_W; }
    if (cohN) { ax += (cohX / cohN - b.x)  * COH_W; ay += (cohY / cohN - b.y)  * COH_W; }

    /* Anchor gravity wells */
    for (var ai = 0; ai < anchors.length; ai++) {
      var a  = anchors[ai];
      var ex = a.x - b.x, ey = a.y - b.y;
      var d2 = ex * ex + ey * ey;
      if (d2 < ANC_R * ANC_R && d2 > 0.01) {
        var d = Math.sqrt(d2);
        var f = ANC_W * (1 - d / ANC_R);
        ax += ex / d * f; ay += ey / d * f;
      }
    }

    /* Cursor repulsion */
    var cx = b.x - mx, cy = b.y - my;
    var cd = cx * cx + cy * cy;
    if (cd < CUR_R * CUR_R && cd > 0.01) {
      var d = Math.sqrt(cd);
      var f = CUR_W * (1 - d / CUR_R);
      ax += cx / d * f; ay += cy / d * f;
    }

    b.vx += ax; b.vy += ay;

    var spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (spd > MAX_V) { b.vx = b.vx / spd * MAX_V; b.vy = b.vy / spd * MAX_V; }
    if (spd < MIN_V && spd > 0.01) { b.vx = b.vx / spd * MIN_V; b.vy = b.vy / spd * MIN_V; }

    b.x += b.vx; b.y += b.vy;

    /* Soft wrap — reappear on opposite edge */
    var M = 40;
    if (b.x < -M)  b.x += W + M * 2;
    if (b.x > W+M) b.x -= W + M * 2;
    if (b.y < -M)  b.y += H + M * 2;
    if (b.y > H+M) b.y -= H + M * 2;
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  var startTime = Date.now();

  function render() {
    ctx.clearRect(0, 0, W, H);

    /* Staggered reveal over first 4 seconds */
    var elapsed    = (Date.now() - startTime) / 4000;
    var maxVisible = Math.min(boids.length, Math.ceil(elapsed * boids.length * 1.1));

    /* ── MYCELIUM THREADS ── */
    /* Single path, uniform colour — fast */
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(91,33,182,' + MYC_ALPHA + ')';
    ctx.lineWidth   = 0.38;

    for (var i = 0; i < maxVisible; i++) {
      var b  = boids[i];
      var gx = (b.x / CELL) | 0;
      var gy = (b.y / CELL) | 0;

      /* Only check ±1 cell — MYC_DIST ≤ CELL so this is sufficient */
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          var c = cell(gx + dx, gy + dy);
          if (!c) continue;
          for (var k = 0; k < c.length; k++) {
            var j = c[k];
            if (j <= i || j >= maxVisible) continue;
            var o  = boids[j];
            var ex = b.x - o.x, ey = b.y - o.y;
            if (ex * ex + ey * ey < MYC_DIST * MYC_DIST) {
              ctx.moveTo(b.x, b.y);
              ctx.lineTo(o.x, o.y);
            }
          }
        }
      }
    }
    ctx.stroke();

    /* ── PARTICLES ── */
    for (var i = 0; i < maxVisible; i++) {
      var b = boids[i];
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.sz, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + b.r + ',' + b.g + ',' + b.b + ',' + b.a + ')';
      ctx.fill();
    }
  }

  /* ═══════════════════════════════════════════════════════
     ANCHORS — viewport-relative, updated on scroll/resize
     ═══════════════════════════════════════════════════════ */
  function updateAnchors() {
    anchors = [];
    try {
      document.querySelectorAll(ANCHOR_SEL).forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 10) return;
        if (r.bottom < -200 || r.top > H + 200) return;
        anchors.push({ x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 });
      });
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════
     MAIN LOOP
     ═══════════════════════════════════════════════════════ */
  var frame = 0;

  function tick() {
    fillGrid();
    for (var i = 0; i < boids.length; i++) stepBoid(i);
    render();
    /* Refresh anchors every ~52 frames (~0.87s) */
    if (++frame % 52 === 0) updateAnchors();
    requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════ */
  function boot() {
    canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:2147483630;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    buildGrid();
    initBoids();
    updateAnchors();

    /* Events */
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (e.touches.length) { mx = e.touches[0].clientX; my = e.touches[0].clientY; }
    }, { passive: true });

    /* On touch: no cursor — push particles away from first touch */
    window.addEventListener('touchstart', function (e) {
      if (e.touches.length) { mx = e.touches[0].clientX; my = e.touches[0].clientY; }
      setTimeout(function () { mx = -2000; my = -2000; }, 800);
    }, { passive: true });

    window.addEventListener('scroll', function () {
      updateAnchors();
    }, { passive: true });

    window.addEventListener('resize', function () {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      buildGrid();
      updateAnchors();
    });

    /* Elementor late render */
    document.addEventListener('elementor/frontend/init', function () {
      setTimeout(updateAnchors, 700);
    });

    /* Reduced motion — skip animation entirely */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
