/* ================================================================
   حرفو v8 — H1 Mascot Intelligence Engine
   Self-contained, no external dependencies.
   ================================================================ */
(function () {
  'use strict';

  /* ── Config ── */
  var CFG = {
    W: 90, H: 107,
    SPRING_K:  0.065,
    SPRING_D:  0.78,
    MAX_SPEED: 22,
    ZONE_TEASE: 460,
    ZONE_ALERT: 250,
    ZONE_FLEE:  155,
    ZONE_PANIC: 85,
    FLEE_F:  5.2,
    PANIC_F: 9.5,
    SPEECH_CD: 7000,
    NAP_AFTER: 50000
  };

  /* ── State ── */
  var S = {
    x: -300, y: 600,
    vx: 0, vy: 0,
    tx: 0,  ty: 0,
    mx: -9999, my: -9999,
    zone: 'far',
    lastZone: 'far',
    walking: false,
    dragging: false,
    facing: 1,
    napping: false,
    idleSince: Date.now(),
    lastSpeech: 0,
    onArrive: null,
    menuOpen: false,
    fleeCount: 0
  };

  /* ── DOM ── */
  var wrap, bubble, menu, toast, selPop;

  /* ── Phrases (Persian) ── */
  var P = {
    greet:    ['سلام! منم حرفو 👋', 'خوش اومدید!', 'بفرمایید، چطور می‌تونم کمک کنم؟'],
    greetBack:['خوش برگشتی! 😊', 'دوباره سلام!', 'دیدنت خوشحالم 😄'],
    tease:    ['نزدیک‌تر... 😏', 'بیا بازی کنیم!', 'فکر کردی می‌تونی منو بگیری؟', 'هوی! داری نگام می‌کنی؟'],
    alert:    ['آروم باش...', 'داری نزدیک میشی ها!', 'هی هی...'],
    flee:     ['آآآه فرار! 😱', 'دنبالم نکن!', 'برو اونور لطفاً!', 'کمک کمک!'],
    panic:    ['خیلی نزدیکی!!! 😨', 'آآآ!!!', 'بیا عقب!'],
    escaped:  ['جستم! 😅', 'فرار کردم ینجا امنه!', 'هوف... رفتی دنبالم!', 'نفس نفس... '],
    idle6:    ['یه چیز جالب بخونی؟', 'می‌خوای کمکت کنم؟', 'هنوز اینجام! 👀'],
    idle15:   ['می‌خوای خلاصه صفحه رو بگم؟', 'سوال داری بپرس!'],
    summary:  ['بذار خلاصه‌ات کنم...', 'در حال خواندن صفحه...'],
    noContent:['این صفحه محتوای خاصی نداشت.', 'چیز زیادی پیدا نکردم!']
  };

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ═══════════════════════════════════════
     SPEECH
     ═══════════════════════════════════════ */
  function say(text, ms, force) {
    if (!bubble) return;
    var now = Date.now();
    if (!force && now - S.lastSpeech < CFG.SPEECH_CD) return;
    S.lastSpeech = now;
    bubble.innerHTML = text;
    bubble.classList.add('hb-visible');
    clearTimeout(bubble._t);
    bubble._t = setTimeout(function () {
      bubble.classList.remove('hb-visible');
    }, ms || 4500);
  }

  function sayForce(text, ms) { say(text, ms, true); }

  function hideSay() {
    if (bubble) bubble.classList.remove('hb-visible');
  }

  function showToast(text, ms) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('ht-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('ht-show'); }, ms || 3000);
  }

  /* ═══════════════════════════════════════
     PHYSICS HELPERS
     ═══════════════════════════════════════ */
  function center() {
    return { x: S.x + CFG.W / 2, y: S.y + CFG.H / 2 };
  }

  function distMouse() {
    if (S.mx < 0) return Infinity;
    var c = center();
    return Math.hypot(S.mx - c.x, S.my - c.y);
  }

  function zone(d) {
    if (d < CFG.ZONE_PANIC) return 'panic';
    if (d < CFG.ZONE_FLEE)  return 'flee';
    if (d < CFG.ZONE_ALERT) return 'alert';
    if (d < CFG.ZONE_TEASE) return 'tease';
    return 'far';
  }

  function repulse() {
    var c = center();
    var dx = c.x - S.mx, dy = c.y - S.my;
    var d = Math.hypot(dx, dy);
    if (d < 1) return;
    if (d < CFG.ZONE_PANIC) {
      var t = Math.pow((CFG.ZONE_PANIC - d) / CFG.ZONE_PANIC, 1.2);
      S.vx += (dx / d) * t * CFG.PANIC_F;
      S.vy += (dy / d) * t * CFG.PANIC_F * 0.6;
    } else {
      var t2 = Math.pow((CFG.ZONE_FLEE - d) / CFG.ZONE_FLEE, 1.5);
      S.vx += (dx / d) * t2 * CFG.FLEE_F;
      S.vy += (dy / d) * t2 * CFG.FLEE_F * 0.5;
    }
  }

  /* ═══════════════════════════════════════
     MOVEMENT
     ═══════════════════════════════════════ */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function moveTo(x, y, cb) {
    S.tx = clamp(x, 4, window.innerWidth  - CFG.W - 4);
    S.ty = clamp(y, 4, window.innerHeight - CFG.H - 4);
    S.onArrive = cb || null;
    S.walking = true;
    setClass('hv-walking', true);
    setClass('hv-idle', false);
  }

  function parkHome(cb) {
    moveTo(window.innerWidth - CFG.W - 32, window.innerHeight - CFG.H - 32, cb);
  }

  function setClass(cls, on) {
    if (!wrap) return;
    if (on) wrap.classList.add(cls); else wrap.classList.remove(cls);
  }

  /* ═══════════════════════════════════════
     ZONE REACTIONS
     ═══════════════════════════════════════ */
  function onZoneChange(prev, cur) {
    /* entering danger */
    if (cur === 'flee' || cur === 'panic') {
      setClass('hv-idle', false);
      setClass('hv-tease', false);
      setClass('hv-flee', cur === 'flee');
      setClass('hv-panic', cur === 'panic');
      setClass('hv-walking', true);
      if (prev !== 'flee' && prev !== 'panic') {
        sayForce(rand(cur === 'panic' ? P.panic : P.flee), 3000);
        S.fleeCount++;
      }
    }
    /* escaped */
    else if (prev === 'flee' || prev === 'panic') {
      setClass('hv-flee', false);
      setClass('hv-panic', false);
      setTimeout(function () {
        if (S.zone !== 'flee' && S.zone !== 'panic') {
          setClass('hv-idle', true);
          setClass('hv-walking', false);
        }
      }, 400);
      sayForce(rand(P.escaped), 4000);
    }
    /* tease */
    else if (cur === 'tease' && prev === 'far') {
      setClass('hv-tease', true);
      if (Math.random() < 0.4) say(rand(P.tease));
    }
    else if (cur === 'far' && prev === 'tease') {
      setClass('hv-tease', false);
    }
    /* alert */
    else if (cur === 'alert') {
      if (Math.random() < 0.25) say(rand(P.alert));
    }
  }

  /* ═══════════════════════════════════════
     MAIN TICK (RAF)
     ═══════════════════════════════════════ */
  function tick() {
    if (!S.dragging) {
      var d = distMouse();
      var z = zone(d);

      if (z !== S.zone) {
        onZoneChange(S.zone, z);
        S.zone = z;
      }

      /* repulsion */
      if (z === 'flee' || z === 'panic') repulse();

      /* tease creep toward mouse */
      if (z === 'far' && S.mx > 0 && !S.napping && Math.random() < 0.018) {
        var c  = center();
        var dx = S.mx - c.x, dy = S.my - c.y;
        var td = Math.hypot(dx, dy);
        if (td < CFG.ZONE_TEASE + 180) {
          S.vx += (dx / td) * 0.042;
          S.vy += (dy / td) * 0.026;
        }
      }

      /* alert: backing away slowly */
      if (z === 'alert') {
        var ca = center();
        var adx = ca.x - S.mx, ady = ca.y - S.my;
        var ad = Math.hypot(adx, ady) || 1;
        S.vx += (adx / ad) * 0.5;
        S.vy += (ady / ad) * 0.3;
      }

      /* spring */
      S.vx = S.vx * CFG.SPRING_D + (S.tx - S.x) * CFG.SPRING_K;
      S.vy = S.vy * CFG.SPRING_D + (S.ty - S.y) * CFG.SPRING_K;

      /* speed cap */
      var sp = Math.hypot(S.vx, S.vy);
      if (sp > CFG.MAX_SPEED) {
        S.vx = (S.vx / sp) * CFG.MAX_SPEED;
        S.vy = (S.vy / sp) * CFG.MAX_SPEED;
      }

      S.x += S.vx;
      S.y += S.vy;

      S.x = clamp(S.x, 4, window.innerWidth  - CFG.W - 4);
      S.y = clamp(S.y, 4, window.innerHeight - CFG.H - 4);

      /* facing */
      if (Math.abs(S.vx) > 0.5) {
        var f = S.vx > 0 ? 1 : -1;
        if (f !== S.facing) {
          S.facing = f;
          setClass('hv-flip', f === -1);
        }
      }

      /* walking → idle transition */
      var speed = Math.hypot(S.vx, S.vy);
      var dist  = Math.hypot(S.tx - S.x, S.ty - S.y);
      if (S.walking && speed > 0.8) {
        if (!wrap.classList.contains('hv-walking')) {
          setClass('hv-walking', true);
          setClass('hv-idle', false);
        }
      } else if (speed < 0.5 && dist < 5 &&
                 z !== 'flee' && z !== 'panic') {
        if (S.walking || wrap.classList.contains('hv-walking')) {
          S.walking = false;
          setClass('hv-walking', false);
          setClass('hv-idle', true);
          if (S.onArrive) { var fn = S.onArrive; S.onArrive = null; fn(); }
        }
      }
    }

    /* apply transform */
    if (wrap) {
      wrap.style.transform =
        'translate(' + Math.round(S.x) + 'px,' + Math.round(S.y) + 'px)';
    }

    requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════
     DRAG
     ═══════════════════════════════════════ */
  function initDrag() {
    var sx, sy, smx, smy;

    function dragStart(mx, my) {
      S.dragging = true;
      sx = S.x; sy = S.y;
      smx = mx; smy = my;
      setClass('hv-dragging', true);
      hideSay();
      closeMenu();
    }
    function dragMove(mx, my) {
      if (!S.dragging) return;
      S.x = clamp(sx + (mx - smx), 4, window.innerWidth  - CFG.W - 4);
      S.y = clamp(sy + (my - smy), 4, window.innerHeight - CFG.H - 4);
      S.tx = S.x; S.ty = S.y;
      S.vx = 0; S.vy = 0;
    }
    function dragEnd() {
      if (!S.dragging) return;
      S.dragging = false;
      setClass('hv-dragging', false);
      setClass('hv-idle', true);
    }

    wrap.addEventListener('mousedown', function (e) {
      if (e.target.closest('button')) return;
      e.preventDefault();
      dragStart(e.clientX, e.clientY);
    });
    wrap.addEventListener('touchstart', function (e) {
      if (e.target.closest('button')) return;
      e.preventDefault();
      var t = e.touches[0];
      dragStart(t.clientX, t.clientY);
    }, { passive: false });

    document.addEventListener('mousemove', function (e) { dragMove(e.clientX, e.clientY); });
    document.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      dragMove(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('mouseup',  dragEnd);
    document.addEventListener('touchend', dragEnd);
  }

  /* ═══════════════════════════════════════
     CONTEXT MENU
     ═══════════════════════════════════════ */
  function openMenu() {
    S.menuOpen = true;
    setClass('hm-visible', false); /* reset */
    menu.classList.add('hm-visible');
  }
  function closeMenu() {
    S.menuOpen = false;
    if (menu) menu.classList.remove('hm-visible');
  }

  function buildMenu() {
    var items = [
      { i: '📝', t: 'خلاصه صفحه', fn: doSummary },
      { i: '🔍', t: 'جستجو',       fn: doSearch  },
      { i: '🌙', t: 'حالت تاریک',  fn: toggleDark },
      { i: '🔡', t: 'فونت بزرگ‌تر', fn: fontUp    },
      { i: '🏠', t: 'برگرد خونه',  fn: parkHome  }
    ];
    menu.innerHTML = '';
    items.forEach(function (item, i) {
      if (i === 3) { /* separator before font */
        var sep = document.createElement('div');
        sep.className = 'hm-sep';
        menu.appendChild(sep);
      }
      var btn = document.createElement('button');
      btn.className = 'hm-btn';
      btn.innerHTML = '<span style="font-size:16px">' + item.i + '</span>' + item.t;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeMenu();
        item.fn();
      });
      menu.appendChild(btn);
    });
  }

  wrap.addEventListener('click', function (e) {
    if (S.dragging) return;
    if (S.menuOpen) { closeMenu(); return; }
    openMenu();
    sayForce(rand(P.tease), 3000);
  });

  document.addEventListener('click', function (e) {
    if (S.menuOpen && !wrap.contains(e.target)) closeMenu();
  });

  /* ═══════════════════════════════════════
     PAGE INTELLIGENCE
     ═══════════════════════════════════════ */
  function doSummary() {
    sayForce(rand(P.summary), 2000);
    setTimeout(function () {
      var content = '';
      var selectors = [
        'article .entry-content p',
        '.post-content p',
        'main p',
        '.content p',
        'p'
      ];
      var paras = [];
      for (var si = 0; si < selectors.length; si++) {
        paras = Array.from(document.querySelectorAll(selectors[si]));
        if (paras.length > 2) break;
      }
      var sentences = paras
        .map(function (p) { return p.textContent.trim(); })
        .filter(function (t) { return t.length > 50; })
        .slice(0, 2);

      if (sentences.length) {
        content = sentences.map(function (s) {
          return s.length > 90 ? s.substring(0, 88) + '…' : s;
        }).join('<br>');
      }

      sayForce(content || rand(P.noContent), 7000);
    }, 2200);
  }

  function doSearch() {
    closeMenu();
    var q = window.prompt('دنبال چی می‌گردی؟');
    if (q && q.trim()) {
      window.location.href = '?s=' + encodeURIComponent(q.trim());
    }
  }

  function toggleDark() {
    var html = document.documentElement;
    var isDark = html.classList.toggle('dark-mode');
    /* also try common dark-mode class names used by WP themes */
    document.body.classList.toggle('dark-mode');
    document.body.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
    showToast(isDark ? 'حالت تاریک فعال شد 🌙' : 'حالت روشن فعال شد ☀️');
  }

  function fontUp() {
    var curr = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    document.documentElement.style.fontSize = (curr + 1.5) + 'px';
    showToast('اندازه فونت بزرگ‌تر شد 🔡');
  }

  /* ═══════════════════════════════════════
     TEXT SELECTION POPUP
     ═══════════════════════════════════════ */
  function initSelectionPop() {
    selPop = document.getElementById('harfo-sel-pop');
    if (!selPop) return;

    document.addEventListener('mouseup', function (e) {
      if (wrap.contains(e.target)) return;
      setTimeout(function () {
        var sel = window.getSelection();
        var txt = sel && sel.toString().trim();
        if (txt && txt.length > 5) {
          var r = sel.getRangeAt(0).getBoundingClientRect();
          selPop.style.left = (r.left + r.width / 2 - 80) + 'px';
          selPop.style.top  = (r.top  + window.scrollY - 44) + 'px';
          selPop.style.display = 'flex';
        } else {
          selPop.style.display = 'none';
        }
      }, 10);
    });

    document.addEventListener('mousedown', function (e) {
      if (selPop && !selPop.contains(e.target)) selPop.style.display = 'none';
    });

    selPop.querySelector('[data-act="copy"]') &&
      selPop.querySelector('[data-act="copy"]').addEventListener('click', function () {
        var txt = window.getSelection().toString();
        navigator.clipboard && navigator.clipboard.writeText(txt);
        showToast('کپی شد ✓');
        selPop.style.display = 'none';
      });

    selPop.querySelector('[data-act="read"]') &&
      selPop.querySelector('[data-act="read"]').addEventListener('click', function () {
        var txt = window.getSelection().toString().trim();
        if (txt) {
          var u = new SpeechSynthesisUtterance(txt);
          u.lang = 'fa-IR';
          window.speechSynthesis.speak(u);
        }
        selPop.style.display = 'none';
      });
  }

  /* ═══════════════════════════════════════
     IDLE MONITORING
     ═══════════════════════════════════════ */
  setInterval(function () {
    if (S.dragging || S.menuOpen) return;
    var idle = Date.now() - S.idleSince;

    if (idle > 15000 && idle < 16000) {
      say(rand(P.idle6));
    } else if (idle > 35000 && idle < 36000) {
      say(rand(P.idle15));
    } else if (idle > CFG.NAP_AFTER && !S.napping) {
      S.napping = true;
      setClass('hv-idle', true);
    }
  }, 1000);

  /* ═══════════════════════════════════════
     PAGE VISIT BEHAVIOR
     ═══════════════════════════════════════ */
  function detectPageContext() {
    var url  = window.location.href;
    var body = document.body;

    /* WooCommerce product page */
    if (body.classList.contains('single-product')) {
      setTimeout(function () {
        say('این محصول رو می‌خوای؟ نگاهی به قیمتش بنداز 😉', 5000);
      }, 3500);
      return;
    }
    /* Search results */
    if (body.classList.contains('search-results')) {
      setTimeout(function () {
        say('دنبال چیزی می‌گردی؟ کمک کنم؟ 🔍', 4000);
      }, 2000);
      return;
    }
    /* 404 */
    if (body.classList.contains('error404')) {
      setTimeout(function () {
        sayForce('اوه! این صفحه وجود نداره 😅 برگردیم؟', 6000);
      }, 1000);
      return;
    }
    /* Blog post / article */
    if (body.classList.contains('single-post')) {
      setTimeout(function () {
        say('مقاله جالبیه! می‌خوای خلاصه‌اش کنم؟ 📖', 5000);
      }, 4000);
    }
  }

  /* ═══════════════════════════════════════
     MOUSE / TOUCH EVENTS
     ═══════════════════════════════════════ */
  window.addEventListener('mousemove', function (e) {
    S.mx = e.clientX;
    S.my = e.clientY;
    S.idleSince = Date.now();
    if (S.napping) {
      S.napping = false;
      sayForce('بیدار شدم! 😴', 3000);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', function () {
    S.mx = -9999; S.my = -9999;
  });

  window.addEventListener('touchmove', function (e) {
    S.mx = e.touches[0].clientX;
    S.my = e.touches[0].clientY;
    S.idleSince = Date.now();
  }, { passive: true });

  window.addEventListener('resize', function () {
    S.tx = clamp(S.tx, 4, window.innerWidth  - CFG.W - 4);
    S.ty = clamp(S.ty, 4, window.innerHeight - CFG.H - 4);
  });

  /* keyboard shortcut: Alt+H → park home */
  document.addEventListener('keydown', function (e) {
    if (e.altKey && e.key === 'h') parkHome();
  });

  /* ═══════════════════════════════════════
     BOOT
     ═══════════════════════════════════════ */
  function boot() {
    wrap   = document.getElementById('harfo-w');
    bubble = document.getElementById('harfo-bubble');
    menu   = document.getElementById('harfo-menu');

    /* create toast */
    toast = document.createElement('div');
    toast.id = 'harfo-toast';
    document.body.appendChild(toast);

    /* create selection popover */
    selPop = document.createElement('div');
    selPop.id = 'harfo-sel-pop';
    selPop.style.display = 'none';
    selPop.innerHTML =
      '<button data-act="copy">📋 کپی</button>' +
      '<button data-act="read">🔊 بخون</button>';
    document.body.appendChild(selPop);

    if (!wrap) return; /* safety */

    /* initial position: bottom-right */
    S.x = window.innerWidth  - CFG.W - 32;
    S.y = window.innerHeight - CFG.H - 32;
    S.tx = S.x; S.ty = S.y;
    wrap.style.transform =
      'translate(' + S.x + 'px,' + S.y + 'px)';
    setClass('hv-idle', true);

    initDrag();
    buildMenu();
    initSelectionPop();
    detectPageContext();

    /* greeting */
    var visits = parseInt(localStorage.getItem('harfo_v') || '0', 10) + 1;
    localStorage.setItem('harfo_v', visits);
    setTimeout(function () {
      sayForce(rand(visits > 1 ? P.greetBack : P.greet), 5000);
    }, 1400);

    /* walk in from the right edge */
    setTimeout(function () {
      if (S.zone !== 'flee' && S.zone !== 'panic') {
        moveTo(
          window.innerWidth  - CFG.W - 40,
          window.innerHeight - CFG.H - 40
        );
      }
    }, 300);

    requestAnimationFrame(tick);
  }

  /* ── expose minimal public API ── */
  window.HarfoAI = {
    say:     sayForce,
    toast:   showToast,
    park:    parkHome,
    moveTo:  moveTo,
    summary: doSummary,
    search:  doSearch
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
