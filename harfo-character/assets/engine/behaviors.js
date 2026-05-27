/* ======================================================
   حرفو v6 — Behavior & Tease Engine
   100+ behaviors, tease from far, flee when close,
   autonomous site tour, zone-based personality
   ====================================================== */
(function (root) {
  'use strict';

  var P, S, M, Speech, Toast, Helpers, Anim;

  /* ── Behavior slots ─────────────────────────────────
     Each entry: { id, w (base weight), cd (cooldown ms),
                   zone (which zone triggers it), fn }
  ─────────────────────────────────────────────────── */
  var BLIST = [];

  /* Register helper */
  function reg(id, w, cd, zone, fn) {
    BLIST.push({ id:id, w:w, cd:cd, zone:zone, fn:fn, lastAt:0 });
  }

  /* ── Zone: FAR (mouse far away) ── */
  // Tease the user from a safe distance
  reg('tease_wink',        12, 6000,  'far', function () {
    Anim.face('wink', 900);
    Anim.cls('hv-wiggle', 900);
  });
  reg('tease_tongue',      10, 8000,  'far', function () {
    Anim.face('tease', 1500);
    Anim.cls('hv-tease', 1500);
    Helpers.emitText('😝', null, 40);
  });
  reg('tease_dance',        9, 12000, 'far', function () {
    Anim.face('happy', 1800);
    Anim.cls('hv-dance', 1800);
    Helpers.emitSparks(5);
  });
  reg('tease_blow_kiss',    8, 10000, 'far', function () {
    Anim.face('love', 1600);
    Helpers.emitHearts(4);
    Anim.cls('hv-bounce', 700);
  });
  reg('tease_spin',         7, 9000,  'far', function () {
    Anim.face('happy', 1000);
    Anim.cls('hv-spin', 1000);
    Helpers.emitSparks(6);
  });
  reg('tease_peek_screen',  9, 8000,  'far', function () {
    if (!M) return;
    M.to('peek', 450);
    setTimeout(function () { M.to('stand', 450); }, 1800);
  });
  reg('tease_float',        7, 14000, 'far', function () {
    Anim.cls('hv-float', 2000);
    Helpers.emitSparks(4);
  });
  reg('tease_tiny_big',     6, 18000, 'far', function () {
    Anim.cls('hv-tiny', 900);
    setTimeout(function () { Anim.cls('hv-huge', 900); }, 950);
  });
  reg('tease_ghost',        5, 20000, 'far', function () {
    Anim.face('dizzy', 1400);
    Anim.cls('hv-ghost', 1400);
  });
  reg('tease_text_hey',     8, 12000, 'far', function () {
    Helpers.emitText('هی!', null, 35);
    Anim.cls('hv-bounce', 700);
  });
  reg('tease_text_boo',     7, 15000, 'far', function () {
    Helpers.emitText('بو!', null, 35);
    Anim.cls('hv-shake', 650);
  });
  reg('tease_approach',    11, 8000,  'far', function () {
    /* Creep toward mouse then run back */
    if (!S || S.mx < 0) return;
    var origTx = S.tx, origTy = S.ty;
    var mid = {
      x: S.x + (S.mx - S.x) * 0.35,
      y: S.y + (S.my - S.y) * 0.35
    };
    Anim.face('tease', 2000);
    Anim.cls('hv-tease', 2000);
    P.moveTo(mid.x - 60, mid.y - 80, function () {
      Anim.face('wow', 600);
      P.moveTo(origTx, origTy);
    });
  });
  reg('tease_orbit_safe',   6, 20000, 'far', function () {
    P.orbit(240);
    Anim.face('happy', 3000);
    Anim.cls('hv-tease', 3000);
    setTimeout(function () { P.stopOrbit(); P.parkHome(); }, 3200);
  });
  reg('tease_exclaim',      9, 7000,  'far', function () {
    Anim.exclaim();
    Anim.cls('hv-bounce', 800);
  });
  reg('tease_star_burst',   7, 16000, 'far', function () {
    for (var i = 0; i < 8; i++) {
      (function (idx) {
        setTimeout(function () {
          var pc = document.getElementById('h-particles');
          if (!pc) return;
          var el = document.createElement('div');
          el.className = 'h-particle star';
          el.style.cssText = 'left:' + (20 + Math.random() * 60) + '%;top:' + (15 + Math.random() * 55) + '%;' +
            '--sx:' + (Math.random() * 60 - 30) + 'px;--sy:' + (-(10 + Math.random() * 40)) + 'px;';
          el.innerHTML = '<svg width="12" height="12"><use href="#hs-spark"/></svg>';
          pc.appendChild(el);
          setTimeout(function () { el.remove(); }, 700);
        }, idx * 50);
      })(i);
    }
    Anim.face('happy', 1200);
  });

  /* ── Zone: ALERT (mouse medium distance) ── */
  reg('alert_sweat',       12, 5000,  'alert', function () {
    Anim.face('scared', 1200);
    Anim.cls('hv-wiggle', 800);
  });
  reg('alert_crouch',      10, 6000,  'alert', function () {
    if (!M) return;
    M.to('crouch', 350);
    setTimeout(function () { M.to('stand', 400); }, 1800);
    Anim.face('scared', 1500);
  });
  reg('alert_backup',       9, 4000,  'alert', function () {
    Anim.face('scared', 1000);
    Anim.cls('hv-shake', 600);
  });
  reg('alert_text_nooo',   11, 8000,  'alert', function () {
    Helpers.emitText('نه!', null, 40);
    Anim.face('scared', 1200);
  });

  /* ── Zone: FLEE (close) ── */
  reg('flee_panic_text',   15, 5000,  'flee', function () {
    var texts = ['آخ!', 'نزن!', 'آی!', 'برو!', 'کمک!', 'رفتم!'];
    Helpers.emitText(texts[Math.floor(Math.random() * texts.length)], null, 35);
    Anim.face('scared', 1500);
    Anim.cls('hv-panic', 1500);
  });
  reg('flee_speed_lines',  13, 4000,  'flee', function () {
    var w = document.getElementById('harfo-w');
    if (!w) return;
    w.classList.add('hv-flee');
    setTimeout(function () { w.classList.remove('hv-flee'); }, 1200);
  });

  /* ── Zone: PANIC ── */
  reg('panic_dizzy',       20, 3000,  'panic', function () {
    Anim.face('dizzy', 2000);
    Anim.cls('hv-panic', 2000);
    Helpers.emitText('😱', null, 35);
  });
  reg('panic_exclaim',     18, 3500,  'panic', function () {
    Anim.exclaim();
    Anim.face('scared', 1500);
  });

  /* ── Zone: ANY — ambient idle behaviors ── */
  reg('idle_breathe',      18, 5000,  'any', function () {
    /* Just default idle animation running — no extra action */
  });
  reg('idle_blink',        20, 3000,  'any', function () {
    Anim.face('blink', 130);
  });
  reg('idle_wink',          9, 8000,  'any', function () {
    Anim.face('wink', 950);
    Anim.cls('hv-nod', 800);
  });
  reg('idle_bounce',        8, 9000,  'any', function () {
    Anim.cls('hv-bounce', 850);
  });
  reg('idle_wiggle',        7, 7000,  'any', function () {
    Anim.cls('hv-wiggle', 900);
  });
  reg('idle_spin',          5, 15000, 'any', function () {
    Anim.cls('hv-spin', 1000);
    Helpers.emitSparks(4);
  });
  reg('idle_nod',           9, 6000,  'any', function () {
    Anim.cls('hv-nod', 800);
  });
  reg('idle_peek',          7, 10000, 'any', function () {
    if (!M) return;
    M.to('peek', 450);
    setTimeout(function () { M.to('stand', 400); }, 1600);
  });
  reg('idle_tiny',          5, 18000, 'any', function () {
    Anim.cls('hv-tiny', 900);
    setTimeout(function () { Anim.cls('hv-bounce', 700); }, 1000);
  });

  /* ── Anchor / DOM exploration behaviors ── */
  reg('explore_element',   14, 12000, 'far', function () {
    var anchors = root.HarfoAnchors ? root.HarfoAnchors.scan() : [];
    if (!anchors.length || !P) return;
    var pick = anchors[Math.floor(Math.random() * Math.min(4, anchors.length))];
    var rect = pick.el.getBoundingClientRect();
    if (rect.top < -80 || rect.top > window.innerHeight + 160) return;
    var spot = root.HarfoAnchors.spotOn(pick);
    var pose = root.HarfoAnchors.poseFor(pick);
    Anim.face('read', 2000);
    P.moveTo(spot.x, spot.y, function () {
      if (M) M.to(pose, 450);
      pick.el.classList.add('harfo-hl');
      setTimeout(function () { pick.el.classList.remove('harfo-hl'); M && M.to('stand', 400); }, 3000);
    });
  });

  reg('nap_on_element',     8, 30000, 'far', function () {
    var anchors = root.HarfoAnchors ? root.HarfoAnchors.scan() : [];
    if (!anchors.length || !P) return;
    var wide = anchors.filter(function (a) { return a.kind === 'header' || a.kind === 'nav' || a.rect.width > 280; });
    var pick = wide.length ? wide[0] : anchors[0];
    var spot = root.HarfoAnchors.spotOn(pick);
    P.moveTo(spot.x, spot.y, function () {
      if (M) M.to(root.HarfoAnchors.poseFor(pick), 500);
      setTimeout(function () {
        if (M) M.to('puddle', 700);
        Anim.face('sleep', 0);
        var w = document.getElementById('harfo-w');
        if (w) w.classList.add('hs-sleep');
        root._harfoNapping = true;
      }, 800);
    });
  });

  reg('return_home',        4, 25000, 'any', function () {
    if (P) P.parkHome();
    if (M) M.to('stand', 500);
  });

  /* ── Content-aware ── */
  reg('content_read_glow', 10, 14000, 'any', function () {
    Anim.face('read', 2500);
    Helpers.emitSparks(3);
  });
  reg('content_point_h2',   7, 16000, 'any', function () {
    var hs = root.HarfoPageAI ? root.HarfoPageAI.d.headings || [] : [];
    if (!hs.length || !P) return;
    var h = hs[Math.floor(Math.random() * hs.length)];
    var r = h.el.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight + 200) return;
    P.moveTo(r.left - 70, r.top - 140, function () {
      h.el.classList.add('harfo-hl');
      Anim.face('read', 2000);
      setTimeout(function () { h.el.classList.remove('harfo-hl'); }, 2500);
    });
  });

  /* ── Seasonal / Random extras ── */
  reg('extra_confetti',     4, 25000, 'any', function () {
    Helpers.emitSparks(14);
    Helpers.emitHearts(4);
    Anim.face('happy', 2000);
    Anim.cls('hv-dance', 1800);
  });
  reg('extra_love_cursor',  5, 20000, 'any', function () {
    Helpers.emitHearts(6);
    Anim.face('love', 2000);
  });

  /* ══════════════════════════════════════════════════
     TEASE ZONE ZONE-CHANGE REACTIONS
  ══════════════════════════════════════════════════ */
  function onZoneChange(prev, cur) {
    if (cur === 'tease' && prev === 'far') {
      /* Mouse just entered tease zone: get attention */
      if (Math.random() < 0.6) {
        Anim.face('wink', 800);
        Anim.cls('hv-bounce', 700);
      }
    }
    if (cur === 'alert' && prev === 'tease') {
      Anim.face('scared', 1000);
      Anim.cls('hv-wiggle', 700);
    }
    if (cur === 'flee') {
      Anim.face('scared', 0);
      Anim.cls('hv-panic', 1200);
      if (document.getElementById('harfo-w')) document.getElementById('harfo-w').classList.add('hv-flee');
      setTimeout(function () {
        var w = document.getElementById('harfo-w');
        if (w) w.classList.remove('hv-flee');
      }, 1500);
    }
    if (cur === 'far' && (prev === 'flee' || prev === 'panic' || prev === 'alert')) {
      /* Mouse retreated — character celebrates! */
      setTimeout(function () {
        Anim.face('happy', 1500);
        Anim.cls('hv-bounce', 800);
        Helpers.emitText('نجات پیدا کردم!', null, 40);
        Helpers.emitSparks(5);
      }, 500);
    }
    if (cur === 'panic') {
      Anim.face('dizzy', 0);
      Anim.cls('hv-panic', 600);
    }
  }

  /* ══════════════════════════════════════════════════
     SITE TOUR ENGINE
  ══════════════════════════════════════════════════ */
  var Tour = {
    running: false,
    steps:   [],
    i:       0,
    plan: function () {
      var steps = [];
      var ai = root.HarfoPageAI ? root.HarfoPageAI.d : {};

      var add = function (sel, msg, pose, after) {
        var el = document.querySelector(sel);
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.width < 10 || r.height < 5) return;
        steps.push({ el:el, rect:r, msg:msg, pose:pose||'sit', after:after });
      };

      add('.site-logo, .custom-logo, header .logo',
          'سلام! این لوگوی سایت — خونه ماست.',                'peek');
      add('.main-navigation, header nav, #site-navigation',
          'اینجا منوی اصلیه — هر کجا خواستی بریم.',            'drape');
      add('h1', ai.productTitle
          ? 'این محصول: ' + ai.productTitle
          : (ai.isArticle ? 'شروع مقاله از اینجاست.' : 'عنوان اصلی صفحه'),
          'peek');

      if (ai.isProduct) {
        add('.price, .amount',           'قیمت اینجاست.',                      'sit');
        add('.single_add_to_cart_button','با این دکمه به سبد اضافه می‌کنی.',   'sit');
      } else if (ai.isArticle && ai.headings && ai.headings.length >= 2) {
        add('article h2, .entry-content h2',
            'این مقاله ' + (ai.readMin||1) + ' دقیقه‌ست — برات فهرستش رو می‌آرم.',
            'peek', function () { setTimeout(function () { Helpers && Helpers.buildTOC(); }, 800); });
      } else if (ai.isHome) {
        add('.elementor-button, .wp-block-button__link, a.button, .cta-button',
            'دکمه اقدام اصلی اینجاست.', 'sit');
      } else if (ai.isCart) {
        add('.checkout-button, a[href*="checkout"]',
            'وقتی حاضر شدی از اینجا پرداخت می‌کنی.', 'sit');
      }

      add('footer, .site-footer', 'و پایین صفحه هم لینک‌های مفید داره.', 'drape');

      return steps.filter(Boolean);
    },

    start: function () {
      if (this.running) return;
      this.steps = this.plan();
      if (!this.steps.length) { Tour._done(); return; }
      this.i = 0;
      this.running = true;
      root.HarfoMemory && root.HarfoMemory.markToured(location.pathname);
      Tour._step();
    },

    _step: function () {
      if (!Tour.running || Tour.i >= Tour.steps.length) { Tour._done(); return; }
      var s = Tour.steps[Tour.i++];
      var rect = s.el.getBoundingClientRect();
      if (rect.top < -80 || rect.top > window.innerHeight + 200) {
        window.scrollTo({ top: window.scrollY + rect.top - 140, behavior: 'smooth' });
      }
      setTimeout(function () {
        rect = s.el.getBoundingClientRect();
        var spot = root.HarfoAnchors.spotOn({ el:s.el, rect:rect, kind:'other' });
        if (M) M.to(s.pose || 'sit', 450);
        s.el.classList.add('harfo-hl');
        if (P) P.moveTo(spot.x, spot.y, function () {
          Speech.say(s.msg, { force:true, dur:3400 });
          if (s.after) s.after();
          setTimeout(function () {
            s.el.classList.remove('harfo-hl');
            Tour._step();
          }, 4000);
        });
      }, 360);
    },

    _done: function () {
      Tour.running = false;
      if (P) P.parkHome();
      if (M) M.to('stand', 500);
      Speech.say('گردش تموم شد! هر وقت کمک خواستی روم کلیک کن.', { force:true });
    },

    stop: function () {
      Tour.running = false;
      document.querySelectorAll('.harfo-hl').forEach(function(el){ el.classList.remove('harfo-hl'); });
    }
  };

  /* ══════════════════════════════════════════════════
     BEHAVIOR SCHEDULER
  ══════════════════════════════════════════════════ */
  var Scheduler = {
    _to: null,
    start: function () {
      var loop = function () {
        Scheduler.run();
        Scheduler._to = setTimeout(loop, 2800 + Math.random() * 3400);
      };
      setTimeout(loop, 5000);
    },

    run: function () {
      if (!S) return;
      if (root._harfoNapping) {
        /* Wake up check handled elsewhere */
        return;
      }
      if (Tour.running) return;

      var zone = S.zone || 'far';

      /* Collect eligible behaviors */
      var now  = Date.now();
      var pool = BLIST.filter(function (b) {
        if (now - b.lastAt < b.cd) return false;
        return b.zone === 'any' || b.zone === zone;
      });

      if (!pool.length) return;

      /* Weighted pick */
      var total = pool.reduce(function (sum, b) { return sum + b.w; }, 0);
      var r = Math.random() * total;
      var pick = pool[0];
      for (var i = 0; i < pool.length; i++) {
        r -= pool[i].w;
        if (r <= 0) { pick = pool[i]; break; }
      }

      pick.lastAt = now;
      try { pick.fn(); } catch(e) {}
    },

    stop: function () { clearTimeout(this._to); }
  };

  /* ══════════════════════════════════════════════════
     IDLE MONITOR
  ══════════════════════════════════════════════════ */
  var Idle = {
    _last: Date.now(),
    NAP_AFTER: 40000,

    init: function () {
      ['mousemove','scroll','keydown','click','touchstart'].forEach(function (e) {
        window.addEventListener(e, function () {
          Idle._last = Date.now();
          if (root._harfoNapping) {
            root._harfoNapping = false;
            var w = document.getElementById('harfo-w');
            if (w) w.classList.remove('hs-sleep');
            if (M) M.to('stand', 400);
            Anim.face('wow', 700);
            if (P) P.parkHome();
          }
        }, { passive: true });
      });
      setInterval(Idle._check, 4000);
    },

    _check: function () {
      if (root._harfoNapping) return;
      var idle = Date.now() - Idle._last;
      if (idle > Idle.NAP_AFTER && !Tour.running) {
        /* Go find something to nap on */
        Scheduler.run(); /* forcibly trigger a nap behavior */
      }
    }
  };

  /* ══════════════════════════════════════════════════
     FX — zone reactions exposed to physics
  ══════════════════════════════════════════════════ */
  root.HarfoFX = {
    onZoneChange: onZoneChange,
    wakeup: function () {
      root._harfoNapping = false;
      var w = document.getElementById('harfo-w');
      if (w) w.classList.remove('hs-sleep');
      if (M) M.to('stand', 400);
      Anim.face('wow', 700);
    }
  };

  root.HarfoTour      = Tour;
  root.HarfoScheduler = Scheduler;
  root.HarfoIdle      = Idle;

  /* ── Lazy init (called by harfo-main.js after DOM ready) ── */
  root.HarfoBehav = {
    init: function (phys, state, morph, speech, toast, helpers, anim) {
      P = phys; S = state; M = morph;
      Speech = speech; Toast = toast; Helpers = helpers; Anim = anim;
    }
  };

}(window));
