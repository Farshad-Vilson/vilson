/* ════════════════════════════════════════════════════════
   Vilson Effects v1.0
   Ghost Cursor + Wormhole Portal
   Zero external dependencies.
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var GHOST_DELAY      = 1600;   /* ms ghost lags behind cursor */
  var TRAIL_COUNT      = 5;      /* dots trailing behind the ghost */
  var TRAIL_SPREAD     = 280;    /* ms between trail samples */
  var DISCOVERY_HOLD   = 900;    /* ms stationary to trigger ring */
  var DISCOVERY_RADIUS = 44;     /* px — how close ghost must be to element */
  var WORM_DELAY       = 28000;  /* ms before wormhole appears */
  var WORM_AUTO_CLOSE  = 22000;  /* ms of no-hover before it closes */
  var HISTORY_SIZE     = 600;    /* cursor position history entries */

  /* ── DOM ── */
  var orb, ring, trailEl, worm, wormDest, wormClose;

  /* ── Cursor history ring buffer ── */
  var hist = new Array(HISTORY_SIZE);
  var histHead = 0, histLen = 0;

  function histPush(x, y, t) {
    hist[histHead] = { x: x, y: y, t: t };
    histHead = (histHead + 1) % HISTORY_SIZE;
    if (histLen < HISTORY_SIZE) histLen++;
  }

  /* Binary-search for entry closest to targetTime */
  function histAt(targetTime) {
    if (histLen === 0) return null;
    var start = (histHead - histLen + HISTORY_SIZE) % HISTORY_SIZE;
    var lo = 0, hi = histLen - 1;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      var idx = (start + mid) % HISTORY_SIZE;
      if (hist[idx].t < targetTime) lo = mid + 1;
      else hi = mid;
    }
    return hist[(start + lo) % HISTORY_SIZE];
  }

  /* ════════════════════════════════════════════════════════
     GHOST CURSOR
     ════════════════════════════════════════════════════════ */
  var Ghost = (function () {
    var dots = [];
    var gx = -300, gy = -300;
    var prevGx = -300, prevGy = -300;
    var stationaryMs = 0;
    var discovered = false;
    var isVisible = false;
    var cursorInWindow = false;

    /* Important element selectors for discovery detection */
    var DISCOVERY_SELS = 'h1,h2,h3,img,.elementor-button,.elementor-widget-image,.elementor-heading-title,.woocommerce-loop-product__title,.wp-post-image';

    function init() {
      orb   = document.getElementById('vfx-ghost-orb');
      ring  = document.getElementById('vfx-ghost-ring');
      trailEl = document.getElementById('vfx-ghost-trail');
      if (!orb || !ring || !trailEl) return;

      /* Build trail dots */
      for (var i = 0; i < TRAIL_COUNT; i++) {
        var d = document.createElement('div');
        d.className = 'vfx-tdot';
        d.style.cssText = 'position:fixed;left:0;top:0;width:5px;height:5px;margin-left:-2.5px;margin-top:-2.5px;opacity:0;border-radius:50%;';
        trailEl.appendChild(d);
        dots.push(d);
      }
    }

    function show() {
      if (!orb || isVisible) return;
      isVisible = true;
      orb.classList.add('vfx-visible');
    }

    function hide() {
      if (!orb || !isVisible) return;
      isVisible = false;
      orb.classList.remove('vfx-visible');
      dots.forEach(function (d) { d.style.opacity = 0; });
    }

    function triggerDiscovery(x, y) {
      if (discovered || !ring) return;
      discovered = true;

      /* Check if ghost is near something meaningful */
      var els = document.querySelectorAll(DISCOVERY_SELS);
      var near = false;
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        if (r.width < 30 || r.height < 10) continue;
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = x - cx, dy = y - cy;
        if (Math.sqrt(dx * dx + dy * dy) < r.width * 0.55 + DISCOVERY_RADIUS) {
          near = true;
          break;
        }
      }
      if (!near) return;

      ring.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      ring.classList.remove('vfx-ring-pop');
      /* Force reflow */
      void ring.offsetWidth;
      ring.classList.add('vfx-ring-pop');
      setTimeout(function () {
        ring.classList.remove('vfx-ring-pop');
        discovered = false;
      }, 900);
    }

    function update() {
      if (!orb) return;
      var now = Date.now();
      var ghostPos = histAt(now - GHOST_DELAY);
      if (!ghostPos) return;

      gx = ghostPos.x;
      gy = ghostPos.y;

      orb.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';

      /* Trail dots — sampled between ghost time and ghost+TRAIL_SPREAD*count */
      for (var i = 0; i < TRAIL_COUNT; i++) {
        var sampleTime = now - GHOST_DELAY - (i + 1) * TRAIL_SPREAD;
        var pos = histAt(sampleTime);
        if (!pos) { dots[i].style.opacity = 0; continue; }
        var fraction = (i + 1) / TRAIL_COUNT;       /* 0 = near ghost, 1 = oldest */
        var sz = Math.max(1.5, 5 - fraction * 3.2);
        var op = Math.max(0, 0.28 - fraction * 0.26);
        dots[i].style.width  = sz + 'px';
        dots[i].style.height = sz + 'px';
        dots[i].style.marginLeft = (-sz / 2) + 'px';
        dots[i].style.marginTop  = (-sz / 2) + 'px';
        dots[i].style.opacity = op;
        dots[i].style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      }

      /* Stationary detection */
      var moved = Math.sqrt(Math.pow(gx - prevGx, 2) + Math.pow(gy - prevGy, 2));
      if (moved < 6) {
        stationaryMs += 16;
        if (stationaryMs > DISCOVERY_HOLD) triggerDiscovery(gx, gy);
      } else {
        stationaryMs = 0;
        discovered = false;
      }
      prevGx = gx; prevGy = gy;
    }

    return { init: init, show: show, hide: hide, update: update };
  })();

  /* ════════════════════════════════════════════════════════
     WORMHOLE PORTAL
     ════════════════════════════════════════════════════════ */
  var Wormhole = (function () {
    var shown = false;
    var dismissed = false;
    var lastHover = 0;
    var destination = null;
    var autoCloseTimer = null;

    function findDestination() {
      /* 1. Use PHP-passed nav links */
      var vfx = (typeof VFX !== 'undefined') ? VFX : {};
      if (vfx.navLinks && vfx.navLinks.length) {
        var filtered = vfx.navLinks.filter(function (l) {
          return l.url && l.title && l.title.length > 0;
        });
        if (filtered.length) {
          return filtered[Math.floor(Math.random() * Math.min(filtered.length, 5))];
        }
      }

      /* 2. Fallback: scan page links */
      var origin = window.location.origin;
      var current = window.location.href;
      var candidates = [];
      var seen = new Set();

      document.querySelectorAll('a[href]').forEach(function (el) {
        var href = el.href;
        if (!href || seen.has(href)) return;
        if (!href.startsWith(origin)) return;
        if (href === current || href.indexOf('#') !== -1) return;
        var title = (el.textContent || el.title || '').trim().replace(/\s+/g, ' ');
        if (title.length < 2 || title.length > 40) return;
        /* Prefer nav/menu links */
        var priority = el.closest('nav, [class*="menu"], [class*="nav"]') ? 2 : 1;
        seen.add(href);
        candidates.push({ url: href, title: title, priority: priority });
      });

      candidates.sort(function (a, b) { return b.priority - a.priority; });
      if (!candidates.length) return null;
      return candidates[Math.floor(Math.random() * Math.min(candidates.length, 6))];
    }

    function init() {
      worm     = document.getElementById('vfx-worm');
      wormDest = document.getElementById('vfx-worm-dest');
      wormClose = document.getElementById('vfx-worm-close');
      if (!worm) return;

      destination = findDestination();
      if (!destination) return; /* No internal links — don't show */

      if (wormDest) wormDest.textContent = destination.title;

      /* Show after delay */
      setTimeout(show, WORM_DELAY);

      /* Click — navigate */
      worm.addEventListener('click', function (e) {
        if (e.target === wormClose) return;
        if (!destination) return;
        /* Spin-out then navigate */
        worm.style.transition = 'transform .5s cubic-bezier(.4,0,.6,1), opacity .5s ease';
        worm.style.transform = 'scale(2) rotate(360deg)';
        worm.style.opacity = '0';
        setTimeout(function () {
          window.location.href = destination.url;
        }, 480);
      });

      /* Hover tracking for auto-close */
      worm.addEventListener('mouseenter', function () {
        lastHover = Date.now();
        clearTimeout(autoCloseTimer);
      });
      worm.addEventListener('mouseleave', function () {
        lastHover = Date.now();
        startAutoClose();
      });

      /* Close button */
      if (wormClose) {
        wormClose.addEventListener('click', function (e) {
          e.stopPropagation();
          dismiss();
        });
      }
    }

    function show() {
      if (!worm || shown || dismissed) return;
      shown = true;
      worm.classList.add('vfx-worm-show');
      lastHover = Date.now();
      startAutoClose();
    }

    function startAutoClose() {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = setTimeout(function () {
        if (Date.now() - lastHover > WORM_AUTO_CLOSE - 1000) {
          dismiss();
        }
      }, WORM_AUTO_CLOSE);
    }

    function dismiss() {
      if (!worm || dismissed) return;
      dismissed = true;
      worm.style.transition = 'opacity .8s ease, transform .8s ease';
      worm.style.opacity = '0';
      worm.style.transform = 'scale(0) rotate(-120deg)';
      setTimeout(function () { if (worm) worm.style.display = 'none'; }, 850);
    }

    return { init: init };
  })();

  /* ════════════════════════════════════════════════════════
     MOUSE EVENTS
     ════════════════════════════════════════════════════════ */
  var mouseInWindow = false;
  var firstMove = false;

  document.addEventListener('mousemove', function (e) {
    histPush(e.clientX, e.clientY, Date.now());
    mouseInWindow = true;
    if (!firstMove) {
      firstMove = true;
      setTimeout(function () { Ghost.show(); }, 200);
    }
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    mouseInWindow = false;
    setTimeout(function () {
      if (!mouseInWindow) Ghost.hide();
    }, GHOST_DELAY + 100);
  });

  /* ════════════════════════════════════════════════════════
     RAF LOOP
     ════════════════════════════════════════════════════════ */
  function loop() {
    try { Ghost.update(); } catch (e) {}
    requestAnimationFrame(loop);
  }

  /* ════════════════════════════════════════════════════════
     BOOT — skip on touch-only devices
     ════════════════════════════════════════════════════════ */
  function boot() {
    /* Don't init ghost on pure touch devices — no cursor */
    var hasPointer = window.matchMedia('(pointer: fine)').matches;

    if (hasPointer) {
      Ghost.init();
      requestAnimationFrame(loop);
    }

    /* Wormhole shows on all devices (tappable on mobile) */
    Wormhole.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
