/* ======================================================
   حرفو v6 — Main Coordinator
   Bootstrap, Anim helpers, Bindings, Greet, Public API
   ====================================================== */
(function (root) {
  'use strict';

  if (root.HarfoLoaded) return;
  root.HarfoLoaded = true;

  /* ─── Shorthand DOM ─── */
  function $(id) { return document.getElementById(id); }

  /* ─── Element refs ─── */
  var wrap, jelly, bodyEl, finL, finR, shineEl, faceEl;
  var eyes;

  /* ══════════════════════════════════════════════════
     ANIM — helpers to add/remove CSS state classes
  ══════════════════════════════════════════════════ */
  var Anim = {
    cls: function (c, dur) {
      if (!wrap) return;
      wrap.classList.add(c);
      if (dur) setTimeout(function () { wrap.classList.remove(c); }, dur);
    },
    face: function (state, dur) {
      if (!wrap) return;
      var c = 'hs-' + state;
      /* Remove all hs-* states first */
      var toRemove = [];
      wrap.classList.forEach(function (cl) { if (/^hs-/.test(cl)) toRemove.push(cl); });
      toRemove.forEach(function (cl) { wrap.classList.remove(cl); });
      if (state) {
        wrap.classList.add(c);
        if (dur) setTimeout(function () { wrap.classList.remove(c); }, dur);
      }
    },
    exclaim: function () {
      Anim.cls('hv-exclaim', 900);
    },
    eyesFollow: function () {
      var S = root.HarfoS;
      if (!S || S.mx < 0 || !eyes) return;
      var cx = S.x + 60, cy = S.y + 50;
      var dx = Math.max(-3.5, Math.min(3.5, (S.mx - cx) * 0.018));
      var dy = Math.max(-2.5, Math.min(2.5, (S.my - cy) * 0.018));
      eyes.setAttribute('transform', 'translate(' + dx.toFixed(2) + ',' + dy.toFixed(2) + ')');
    }
  };

  /* Expose globally so behaviors can use it */
  root.Anim = Anim;

  /* ══════════════════════════════════════════════════
     BLINK — random eye blink
  ══════════════════════════════════════════════════ */
  var Blink = {
    _min: 3200, _max: 8600,
    start: function () {
      var loop = function () {
        var S = root.HarfoS;
        if (!S || !wrap) return;
        if (!wrap.classList.contains('hs-sleep')) Anim.face('blink', 130);
        setTimeout(loop, Blink._min + Math.random() * (Blink._max - Blink._min));
      };
      setTimeout(loop, 2500);
    }
  };

  /* ══════════════════════════════════════════════════
     GREETER — smart, context-aware first message
  ══════════════════════════════════════════════════ */
  var Greeter = {
    go: function () {
      var ai  = root.HarfoPageAI  ? root.HarfoPageAI.d  : {};
      var mem = root.HarfoMemory  ? root.HarfoMemory.d   : {};
      var Sp  = root.HarfoSpeech;
      var Hl  = root.HarfoHelpers;

      if (!Sp) return;

      setTimeout(function () {
        /* ── First ever visit ── */
        if (mem.visits === 1) {
          Anim.face('happy', 0);
          Anim.cls('hv-bounce', 800);
          Sp.say('سلام! من حرفو هستم — دستیار هوشمند حرف اول 👋\nمی‌خوای سایت رو باهم بگردیم؟', {
            force: true, sticky: true,
            actions: [
              { label: 'آره بگرد', fn: function () { root.HarfoTour && root.HarfoTour.start(); } },
              { label: 'بعداً',   alt: true, fn: function () { Anim.face('wink', 900); } }
            ]
          });
          return;
        }

        /* ── 404 ── */
        if (ai.is404) {
          Anim.face('wow', 2000);
          Anim.cls('hv-shake', 700);
          var navLinks = (ai.navLinks || []).slice(0, 5).map(function (l) {
            return { label: l.t.slice(0, 20), fn: function () { location.href = l.href; } };
          });
          Sp.say('اوه! این صفحه پیدا نشد. بریم جای دیگه؟', { force: true, sticky: true, actions: navLinks });
          return;
        }

        /* ── Cart ── */
        if (ai.isCart) {
          Sp.say('سبدت آماده‌ست. حاضری برای پرداخت؟', { force: true,
            actions: [{ label: 'برو پرداخت', fn: function () {
              var a = document.querySelector('.checkout-button, a[href*="checkout"]');
              if (a) location.href = a.href;
            }}]
          });
          return;
        }

        /* ── Checkout ── */
        if (ai.isCheckout) {
          Sp.say('اطلاعات رو با دقت وارد کن. اگه مشکلی بود بگو.');
          return;
        }

        /* ── Product ── */
        if (ai.isProduct && ai.productTitle) {
          Sp.say('این محصول: «' + ai.productTitle + '»' + (ai.productPrice ? '\nقیمت: ' + ai.productPrice : ''));
          return;
        }

        /* ── Long article ── */
        if (ai.isArticle && ai.readMin >= 3) {
          Sp.say('این مقاله حدود ' + ai.readMin + ' دقیقه‌ست.\nفهرستش رو بیارم؟', {
            force: true, sticky: true,
            actions: [
              { label: 'آره', fn: function () { Hl && Hl.buildTOC(); } },
              { label: 'نه',  alt: true, fn: function () {} }
            ]
          });
          return;
        }

        /* ── Form errors detected at load ── */
        if (ai.errorFields && ai.errorFields.length) {
          Anim.face('wow', 1500);
          Hl && Hl.pointToError();
          return;
        }

        /* ── Returning visitor — quiet greeting ── */
        if (mem.visits > 5) {
          Anim.face('wink', 1000);
          return;
        }

        /* ── Default ── */
        Sp.say('خوش اومدی! روم کلیک کن تا کمکت کنم.');
      }, 1400);
    }
  };

  /* ══════════════════════════════════════════════════
     CLICK CONTEXT MENU
  ══════════════════════════════════════════════════ */
  function contextMenu() {
    var ai = root.HarfoPageAI ? root.HarfoPageAI.d : {};
    var Sp = root.HarfoSpeech;
    var Hl = root.HarfoHelpers;
    var actions = [];

    if (ai.isArticle) {
      actions.push({ label: 'خلاصه مقاله', fn: function () { Hl.summary(); } });
      if (ai.headings && ai.headings.length >= 2)
        actions.push({ label: 'فهرست مطالب', fn: function () { Hl.toggleTOC(); } });
    }
    if (window.scrollY > 300) actions.push({ label: 'برو بالا', fn: function () { window.scrollTo({ top:0, behavior:'smooth' }); } });
    actions.push({ label: 'گردش سایت', fn: function () { root.HarfoTour && root.HarfoTour.start(); } });
    actions.push({ label: 'جستجو Ctrl+K', fn: function () { root.HarfoPalette && root.HarfoPalette.open(); } });
    actions.push({ label: '+ بزرگ‌تر',   fn: function () { Hl.fontUp(); } });
    actions.push({ label: '− کوچک‌تر',   alt: true, fn: function () { Hl.fontDown(); } });
    actions.push({ label: 'شب/روز',       alt: true, fn: function () { Hl.toggleDark(); } });

    Sp.say('چیکار کنم؟', { force: true, sticky: true, actions: actions });
  }

  /* ══════════════════════════════════════════════════
     DRAG
  ══════════════════════════════════════════════════ */
  var Drag = {
    active: false, moved: false,
    sx: 0, sy: 0, ox: 0, oy: 0,

    down: function (e) {
      if (e.target === $('h-close') || e.button !== 0) return;
      var S = root.HarfoS;
      if (!S) return;
      Drag.active = true;
      Drag.moved  = false;
      Drag.sx = e.clientX; Drag.sy = e.clientY;
      Drag.ox = S.x;       Drag.oy = S.y;
      S.dragging = true;
      e.preventDefault();
      if (root._harfoNapping) {
        root._harfoNapping = false;
        if (wrap) wrap.classList.remove('hs-sleep');
        if (root.HarfoMorph) root.HarfoMorph.to('stand', 300);
        Anim.face('wow', 700);
      }
    },
    move: function (e) {
      if (!Drag.active) return;
      var S = root.HarfoS;
      if (!S) return;
      var dx = e.clientX - Drag.sx, dy = e.clientY - Drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 5) Drag.moved = true;
      S.x = Drag.ox + dx; S.y = Drag.oy + dy;
      S.tx = S.x; S.ty = S.y;
    },
    up: function () {
      if (!Drag.active) return;
      var S = root.HarfoS;
      if (S) S.dragging = false;
      if (Drag.moved) Anim.cls('hv-squish', 500);
      Drag.active = false;
      Drag._didDrag = Drag.moved;
      setTimeout(function () { Drag._didDrag = false; }, 80);
    }
  };

  /* ══════════════════════════════════════════════════
     SCROLL WATCHER
  ══════════════════════════════════════════════════ */
  var Scroll = {
    _offered: false,
    init: function () {
      window.addEventListener('scroll', Scroll.onScroll, { passive: true });
    },
    onScroll: function () {
      var max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      var pct = Math.min(100, Math.round((window.scrollY / max) * 100));
      if (root.HarfoMemory) root.HarfoMemory.markScroll(pct);

      /* Offer next page at 90% */
      if (pct >= 90 && !Scroll._offered) {
        Scroll._offered = true;
        var ai = root.HarfoPageAI ? root.HarfoPageAI.d : {};
        if (ai.isArticle) {
          var next = document.querySelector('.nav-next a, a[rel=next], .next a');
          if (next) {
            root.HarfoSpeech && root.HarfoSpeech.say('تموم شد! مقاله بعدی رو بخونی؟', {
              force: true,
              actions: [
                { label: 'مقاله بعدی', fn: function () { location.href = next.href; } },
                { label: 'برو بالا',   fn: function () { window.scrollTo({ top:0, behavior:'smooth' }); } }
              ]
            });
          }
        }
      }
    }
  };

  /* ══════════════════════════════════════════════════
     AUTO ACTIONS (silent, no asking)
  ══════════════════════════════════════════════════ */
  var Auto = {
    run: function () {
      var ai = root.HarfoPageAI ? root.HarfoPageAI.d : {};
      var Hl = root.HarfoHelpers;
      var Tk = root.HarfoToast;

      /* Long pages → progress badge */
      if (document.body.scrollHeight > window.innerHeight * 1.8) Hl.showProgress();

      /* Long article → reading time toast */
      if (ai.isArticle && ai.readMin >= 2) {
        setTimeout(function () {
          Tk && Tk.show('زمان مطالعه: حدود ' + ai.readMin + ' دقیقه');
        }, 2000);
      }

      /* Article with headings → offer TOC toast */
      if (ai.isArticle && ai.headings && ai.headings.length >= 4) {
        setTimeout(function () {
          Tk && Tk.show('فهرست مطالب آماده‌ست — H + T یا کلیک روی حرفو');
        }, 8000);
      }

      /* Restore prefs */
      Hl.restorePrefs();

      /* Watch for form errors dynamically */
      try {
        var mo = new MutationObserver(function () {
          if (!ai.hasForm) return;
          var err = document.querySelector('input.error, input[aria-invalid=true], .woocommerce-error, .has-error');
          if (err) Hl.pointToError();
        });
        mo.observe(document.body, { childList: true, subtree: true, attributeFilter: ['class','aria-invalid'] });
      } catch(e) {}
    }
  };

  /* ══════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════ */
  function init() {
    wrap    = $('harfo-w');
    jelly   = $('h-char');
    bodyEl  = $('h-body');
    finL    = $('h-fin-l');
    finR    = $('h-fin-r');
    shineEl = $('h-shine');
    faceEl  = $('h-face');
    eyes    = $('h-eyes');

    if (!wrap || !bodyEl) return;

    /* ── Memory + Page analysis ── */
    root.HarfoMemory && root.HarfoMemory.load();
    root.HarfoPageAI && root.HarfoPageAI.run();

    /* ── Morph init ── */
    root.HarfoMorph && root.HarfoMorph.init(bodyEl, finL, finR, shineEl, faceEl);
    root.HarfoMorph && root.HarfoMorph.instant('stand');

    /* ── Physics init ── */
    root.HarfoPhys && root.HarfoPhys.init(wrap);

    /* ── Intelligence wiring ── */
    root.HarfoSpeech  && root.HarfoSpeech.init(wrap, $('h-msg'), $('h-acts'), $('h-typing'));
    root.HarfoToast   && root.HarfoToast.init($('h-toast'));
    root.HarfoPalette && root.HarfoPalette.init();
    root.HarfoSelect  && root.HarfoSelect.init();

    /* ── Behaviors wiring ── */
    root.HarfoBehav && root.HarfoBehav.init(
      root.HarfoPhys, root.HarfoS, root.HarfoMorph,
      root.HarfoSpeech, root.HarfoToast, root.HarfoHelpers, Anim
    );

    /* ── Eye-follow loop ── */
    setInterval(Anim.eyesFollow, 75);

    /* ── Blink ── */
    Blink.start();

    /* ── Drag bindings ── */
    wrap.addEventListener('mousedown', Drag.down);
    window.addEventListener('mousemove', Drag.move);
    window.addEventListener('mouseup',   Drag.up);

    /* ── Click on character ── */
    wrap.addEventListener('click', function (e) {
      if (e.target === $('h-close')) return;
      if (Drag._didDrag) return;
      Anim.cls('hv-bounce', 700);
      contextMenu();
    });

    /* ── Close button ── */
    $('h-close') && $('h-close').addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.style.display = 'none';
      var r = $('h-restore'); if (r) r.classList.add('show');
      root.HarfoMemory && root.HarfoMemory.d && root.HarfoMemory.d.dismiss++;
      root.HarfoMemory && root.HarfoMemory.save();
    });

    /* ── Restore button ── */
    var restoreEl = $('h-restore');
    if (restoreEl) {
      restoreEl.addEventListener('click', function () {
        wrap.style.display = '';
        restoreEl.classList.remove('show');
        Anim.face('happy', 1200);
        Anim.cls('hv-bounce', 800);
        root.HarfoHelpers && root.HarfoHelpers.emitSparks(5);
      });
    }

    /* ── Keyboard shortcuts ── */
    var pressed = {};
    window.addEventListener('keydown', function (e) {
      pressed[e.key.toLowerCase()] = true;
      if (pressed['h'] && pressed['t']) { root.HarfoHelpers && root.HarfoHelpers.toggleTOC(); pressed = {}; }
      if (pressed['h'] && pressed['s']) { root.HarfoHelpers && root.HarfoHelpers.summary(); pressed = {}; }
      if (pressed['h'] && pressed['g']) { root.HarfoTour && root.HarfoTour.start(); pressed = {}; }
      if (e.key === 'Escape') {
        root.HarfoTour && root.HarfoTour.stop();
        root.HarfoSpeech && root.HarfoSpeech.hide();
        root.HarfoPalette && root.HarfoPalette.close();
      }
    });
    window.addEventListener('keyup', function (e) { delete pressed[e.key.toLowerCase()]; });

    /* ── Scroll + auto actions ── */
    Scroll.init();
    Auto.run();

    /* ── Scheduler & idle ── */
    root.HarfoScheduler && root.HarfoScheduler.start();
    root.HarfoIdle      && root.HarfoIdle.init();

    /* ── Show character ── */
    setTimeout(function () { wrap.classList.add('hv-ready', 'hv-idle'); }, 80);

    /* ── Greet ── */
    Greeter.go();
  }

  /* ══════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════ */
  root.HarfoAI = {
    say:       function (t)    { root.HarfoSpeech  && root.HarfoSpeech.say(t, { force: true }); },
    tour:      function ()     { root.HarfoTour    && root.HarfoTour.start(); },
    search:    function ()     { root.HarfoPalette && root.HarfoPalette.open(); },
    toc:       function ()     { root.HarfoHelpers && root.HarfoHelpers.toggleTOC(); },
    summary:   function ()     { root.HarfoHelpers && root.HarfoHelpers.summary(); },
    dark:      function ()     { root.HarfoHelpers && root.HarfoHelpers.toggleDark(); },
    fontUp:    function ()     { root.HarfoHelpers && root.HarfoHelpers.fontUp(); },
    fontDown:  function ()     { root.HarfoHelpers && root.HarfoHelpers.fontDown(); },
    sparks:    function (n)    { root.HarfoHelpers && root.HarfoHelpers.emitSparks(n || 8); },
    hearts:    function (n)    { root.HarfoHelpers && root.HarfoHelpers.emitHearts(n || 5); },
    pose:      function (p)    { root.HarfoMorph   && root.HarfoMorph.to(p, 500); },
    face:      function (f, d) { Anim.face(f, d || 1500); },
    walk:      function (x, y) { root.HarfoPhys    && root.HarfoPhys.moveTo(x, y); },
    park:      function ()     { root.HarfoPhys    && root.HarfoPhys.parkHome(); },
    page:      function ()     { return root.HarfoPageAI  ? root.HarfoPageAI.d  : {}; },
    mem:       function ()     { return root.HarfoMemory  ? root.HarfoMemory.d  : {}; }
  };

  /* Boot */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window));
