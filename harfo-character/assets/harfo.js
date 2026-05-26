/* ============================================================
   حرفو v4 — ژله هوشمند کشسان
   موتور: فیزیک نرم + خواندن محتوا + خلاصه‌سازی + کمک کاربر
   ============================================================ */
(function () {
  'use strict';

  if (window.HarfoLoaded) return; window.HarfoLoaded = true;

  // ─── Config ────────────────────────────────────────────────
  var K = {
    SPRING_K: 0.06, SPRING_D: 0.78,
    W: 110, H: 176,
    RIGHT: 28, BOTTOM: 24,
    FLEE_R: 160, FLEE_F: 5.0,
    SPEECH_CD: 8000,
    TYPING_MS: 600,
    IDLE_BORED: 18000,
    IDLE_SLEEP: 45000,
    BLINK_MIN: 3500, BLINK_MAX: 9000,
    BEHAVIOR_MIN: 6000, BEHAVIOR_MAX: 14000
  };

  var STORE = 'harfo_v4_mem';

  // ─── DOM ───────────────────────────────────────────────────
  var root, wrap, hud, msg, dots, acts, jelly, body, restore, closeBtn;
  function $(id) { return document.getElementById(id); }

  function init() {
    root     = $('harfo-root');
    wrap     = $('harfo-w');
    hud      = $('h-hud');
    msg      = $('h-msg');
    dots     = $('h-dots');
    acts     = $('h-acts');
    jelly    = $('h-jelly');
    body     = $('h-body');
    restore  = $('h-restore');
    closeBtn = $('h-close');
    if (!wrap) return;

    Mem.load();
    Phys.init();
    StyleAI.run();
    setTimeout(function () { PageAI.run(); }, 300);
    Eyes.init();
    Bind.init();

    setTimeout(function () { wrap.classList.remove('hs-loading'); wrap.classList.add('hs-ready'); }, 50);
    setTimeout(function () { Greeter.welcome(); }, 1200);

    // Loops
    requestAnimationFrame(Phys.tick);
    Scheduler.start();
    Idle.start();
  }

  // ─── Memory ───────────────────────────────────────────────
  var Mem = {
    data: { visits: 0, lastSeen: 0, dismissed: 0, helps: 0, mood: 'happy', read: {} },
    load: function () {
      try {
        var raw = localStorage.getItem(STORE);
        if (raw) this.data = Object.assign(this.data, JSON.parse(raw));
      } catch (e) {}
      this.data.visits++; this.data.lastSeen = Date.now();
      this.save();
    },
    save: function () { try { localStorage.setItem(STORE, JSON.stringify(this.data)); } catch (e) {} },
    pageKey: function () { return location.pathname; },
    markRead: function (pct) {
      var k = this.pageKey();
      this.data.read[k] = Math.max(this.data.read[k] || 0, pct);
      this.save();
    }
  };

  // ─── Physics (spring + flee) ──────────────────────────────
  var S = {
    x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
    mx: -9999, my: -9999,
    flee: true, dragging: false,
    lastSpeechAt: 0
  };

  var Phys = {
    init: function () {
      var rect = wrap.getBoundingClientRect();
      S.x = rect.left; S.y = rect.top;
      S.tx = window.innerWidth - K.W - K.RIGHT;
      S.ty = window.innerHeight - K.H - K.BOTTOM;
    },
    tick: function () {
      if (!S.dragging) {
        if (S.flee && Math.hypot(S.mx - (S.x + K.W/2), S.my - (S.y + K.H/2)) < K.FLEE_R) {
          var dx = (S.x + K.W/2) - S.mx;
          var dy = (S.y + K.H/2) - S.my;
          var d = Math.hypot(dx, dy) || 1;
          var t = Math.pow((K.FLEE_R - d) / K.FLEE_R, 1.6);
          S.vx += (dx / d) * t * K.FLEE_F;
          S.vy += (dy / d) * t * K.FLEE_F * 0.7;
          if (!wrap.classList.contains('hs-wow') && Math.random() < 0.05) Anim.face('wow', 600);
        }
        S.vx = S.vx * K.SPRING_D + (S.tx - S.x) * K.SPRING_K;
        S.vy = S.vy * K.SPRING_D + (S.ty - S.y) * K.SPRING_K;
        S.x += S.vx; S.y += S.vy;

        // Clamp on-screen
        S.x = Math.max(8, Math.min(window.innerWidth - K.W - 8, S.x));
        S.y = Math.max(8, Math.min(window.innerHeight - K.H - 8, S.y));

        // Auto-stretch on fast movement
        var sp = Math.hypot(S.vx, S.vy);
        if (sp > 5 && !wrap.classList.contains('ha-stretch')) Anim.cls('ha-stretch', 900);
      }
      wrap.style.transform = 'translate(' + Math.round(S.x - (window.innerWidth - K.W - K.RIGHT)) + 'px,' + Math.round(S.y - (window.innerHeight - K.H - K.BOTTOM)) + 'px)';
      requestAnimationFrame(Phys.tick);
    },
    moveTo: function (x, y) { S.tx = x; S.ty = y; }
  };

  // ─── Animation helpers ────────────────────────────────────
  var Anim = {
    cls: function (name, dur) {
      wrap.classList.add(name);
      setTimeout(function () { wrap.classList.remove(name); }, dur || 800);
    },
    face: function (state, dur) {
      var c = 'hs-' + state;
      wrap.classList.add(c);
      if (dur) setTimeout(function () { wrap.classList.remove(c); }, dur);
    }
  };

  // ─── Eyes (blink + look at mouse) ─────────────────────────
  var Eyes = {
    init: function () {
      // Random blink
      var blink = function () {
        if (!wrap.classList.contains('hs-sleep')) {
          wrap.classList.add('hs-blink');
          setTimeout(function () { wrap.classList.remove('hs-blink'); }, 140);
        }
        setTimeout(blink, K.BLINK_MIN + Math.random() * (K.BLINK_MAX - K.BLINK_MIN));
      };
      setTimeout(blink, 2000);

      // Eyes follow mouse
      setInterval(Eyes.look, 80);
    },
    look: function () {
      if (S.mx < 0) return;
      var cx = S.x + K.W/2, cy = S.y + K.H * 0.3;
      var dx = Math.max(-3, Math.min(3, (S.mx - cx) * 0.02));
      var dy = Math.max(-2, Math.min(2, (S.my - cy) * 0.02));
      var eyes = $('h-eyes'); if (eyes) eyes.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
    }
  };

  // ─── Speech / HUD ─────────────────────────────────────────
  var Say = {
    say: function (text, opts) {
      opts = opts || {};
      var now = Date.now();
      if (!opts.force && now - S.lastSpeechAt < K.SPEECH_CD) return;
      S.lastSpeechAt = now;

      wrap.classList.add('hs-talk', 'hs-typing');
      acts.classList.remove('show'); acts.innerHTML = '';

      setTimeout(function () {
        wrap.classList.remove('hs-typing');
        msg.textContent = text;
        if (opts.actions && opts.actions.length) {
          opts.actions.forEach(function (a) {
            var b = document.createElement('button');
            b.textContent = a.label;
            if (a.alt) b.className = 'alt';
            b.onclick = function () { Mem.data.helps++; Mem.save(); a.fn(); Say.hide(); };
            acts.appendChild(b);
          });
          acts.classList.add('show');
        }
        var dur = opts.dur || (3500 + text.length * 55);
        if (!opts.sticky) setTimeout(Say.hide, dur);
      }, K.TYPING_MS);
    },
    hide: function () { wrap.classList.remove('hs-talk', 'hs-typing'); acts.classList.remove('show'); }
  };

  // ─── Site Style AI ────────────────────────────────────────
  var StyleAI = {
    data: {},
    run: function () {
      try {
        var b = document.body;
        var bgRGB = (getComputedStyle(b).backgroundColor.match(/\d+/g) || [255, 255, 255]).map(Number);
        var lum = (0.299 * bgRGB[0] + 0.587 * bgRGB[1] + 0.114 * bgRGB[2]) / 255;
        this.data.dark = lum < 0.5;
        var btn = document.querySelector('button, .btn, a.button, input[type=submit]');
        this.data.accent = btn ? getComputedStyle(btn).backgroundColor : '#5BE8DA';
        this.data.fontSize = getComputedStyle(b).fontSize;
        this.data.rtl = (getComputedStyle(b).direction === 'rtl');
      } catch (e) {}
    }
  };

  // ─── Page / Content AI ────────────────────────────────────
  var PageAI = {
    data: {},
    run: function () {
      var d = this.data;
      d.title = document.title || '';
      d.url = location.href;
      d.isWoo = !!document.querySelector('.woocommerce, .single-product, .cart, .checkout');
      d.isProduct = !!document.querySelector('.single-product, .product .price');
      d.isCart = /cart/i.test(location.pathname) || !!document.querySelector('.woocommerce-cart-form');
      d.isCheckout = /checkout/i.test(location.pathname);
      d.isArticle = !!document.querySelector('article, .single, .post, .entry-content');
      d.isHome = (location.pathname === '/' || /home/i.test(location.pathname));

      // Extract readable text
      var nodes = document.querySelectorAll('article p, .entry-content p, main p, .post-content p, [itemprop=articleBody] p');
      if (!nodes.length) nodes = document.querySelectorAll('p');
      var paras = [];
      for (var i = 0; i < nodes.length && i < 80; i++) {
        var t = (nodes[i].innerText || '').trim();
        if (t.length > 40) paras.push(t);
      }
      d.paragraphs = paras;
      d.text = paras.join(' ');
      d.words = d.text.split(/\s+/).filter(Boolean).length;
      d.readMin = Math.max(1, Math.round(d.words / 220));
      d.hasForm = !!document.querySelector('form input:not([type=hidden])');
      d.hasVideo = !!document.querySelector('video, iframe[src*="youtu"], iframe[src*="aparat"]');
      d.headings = Array.from(document.querySelectorAll('article h2, .entry-content h2, main h2')).map(function (h) {
        return { t: h.innerText.trim(), el: h };
      }).filter(function (x) { return x.t.length > 2 && x.t.length < 120; });
    },

    // Simple extractive summary (no dependencies)
    summarize: function (max) {
      max = max || 3;
      var text = this.data.text || '';
      if (!text) return '';
      var sents = text.replace(/\n+/g, ' ').split(/(?<=[\.\?\!؟])\s+/).filter(function (s) { return s.length > 30 && s.length < 320; });
      if (sents.length <= max) return sents.join(' ');

      // word frequency
      var stop = ' و در از به که این آن یک با را برای های می شد است بود تا یا اما همچنین نیز هم گفت کرد '.split(' ');
      var freq = {};
      sents.forEach(function (s) {
        s.toLowerCase().split(/\s+/).forEach(function (w) {
          w = w.replace(/[^؀-ۿa-z0-9]/g, '');
          if (w && stop.indexOf(w) === -1 && w.length > 2) freq[w] = (freq[w] || 0) + 1;
        });
      });
      var scored = sents.map(function (s, i) {
        var sc = 0; s.toLowerCase().split(/\s+/).forEach(function (w) {
          w = w.replace(/[^؀-ۿa-z0-9]/g, ''); if (freq[w]) sc += freq[w];
        });
        return { s: s, sc: sc / Math.sqrt(s.length), i: i };
      });
      scored.sort(function (a, b) { return b.sc - a.sc; });
      var top = scored.slice(0, max).sort(function (a, b) { return a.i - b.i; });
      return top.map(function (x) { return x.s; }).join(' ');
    }
  };

  // ─── Greeter (context-aware first hello) ──────────────────
  var Greeter = {
    welcome: function () {
      var p = PageAI.data;
      var actions = [];

      if (p.isProduct) {
        Say.say('این محصول جالبه! کمک می‌خوای؟', {
          actions: [
            { label: 'افزودن به سبد', fn: function () { var b = document.querySelector('.single_add_to_cart_button, .add_to_cart_button'); if (b) b.click(); } },
            { label: 'نه ممنون', alt: true, fn: function () {} }
          ]
        });
        return;
      }
      if (p.isCart) {
        Say.say('سبدت آماده‌ست. می‌خوای بریم پرداخت؟', {
          actions: [{ label: 'برو به پرداخت', fn: function () { var a = document.querySelector('.checkout-button, a[href*="checkout"]'); if (a) location.href = a.href || '/checkout'; } }]
        });
        return;
      }
      if (p.isCheckout) {
        Say.say('در حال نهایی کردن سفارش؟ اگر کمک خواستی صدام کن.');
        return;
      }
      if (p.isArticle && p.readMin >= 2) {
        Say.say('این مقاله حدود ' + p.readMin + ' دقیقه می‌بره. می‌خوای خلاصه‌ش کنم؟', {
          sticky: true,
          actions: [
            { label: 'خلاصه کن', fn: Helper.summary },
            { label: 'فهرست مطالب', fn: Helper.toc },
            { label: 'بعداً', alt: true, fn: function () {} }
          ]
        });
        Anim.face('read', 2500);
        return;
      }
      if (p.hasForm) {
        Say.say('فرم پیدا کردم — اگر گیر کردی بگو کمکت کنم.');
        return;
      }
      if (Mem.data.visits === 1) {
        Say.say('سلام! من حرفو هستم 👋  دستیار باهوش حرف اول.', { actions: [{ label: 'دمت گرم', fn: function () {} }] });
      } else if (Mem.data.visits < 5) {
        Say.say('دوباره سلام! خوش اومدی.');
      } else {
        Anim.face('wink', 1200);
      }
    }
  };

  // ─── Helpers (real user-facing actions) ───────────────────
  var Helper = {
    summary: function () {
      var s = PageAI.summarize(3);
      if (!s) { Say.say('متأسفم، متن کافی پیدا نکردم.', { force: true }); return; }
      Anim.face('read', 4000);
      Say.say(s, { force: true, sticky: true, actions: [{ label: 'باشه', fn: function () {} }] });
    },
    toc: function () {
      var h = PageAI.data.headings || [];
      if (!h.length) { Say.say('این صفحه فهرست نداره.', { force: true }); return; }
      Say.say('کجا بریم؟', {
        force: true, sticky: true,
        actions: h.slice(0, 5).map(function (x) {
          return { label: x.t.slice(0, 28), fn: function () { x.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
        }).concat([{ label: 'بستن', alt: true, fn: function () {} }])
      });
    },
    top: function () { window.scrollTo({ top: 0, behavior: 'smooth' }); },
    defineSelection: function (text) {
      var q = encodeURIComponent(text);
      window.open('https://www.google.com/search?q=' + q, '_blank', 'noopener');
    }
  };

  // ─── Idle / mood ──────────────────────────────────────────
  var Idle = {
    last: Date.now(),
    start: function () {
      ['mousemove', 'scroll', 'keydown', 'click', 'touchstart'].forEach(function (e) {
        window.addEventListener(e, function () {
          Idle.last = Date.now();
          if (wrap.classList.contains('hs-sleep')) { wrap.classList.remove('hs-sleep'); Anim.face('wow', 900); }
        }, { passive: true });
      });
      setInterval(Idle.check, 3000);
    },
    check: function () {
      var idle = Date.now() - Idle.last;
      if (idle > K.IDLE_SLEEP && !wrap.classList.contains('hs-sleep')) {
        wrap.classList.add('hs-sleep');
      } else if (idle > K.IDLE_BORED && Math.random() < 0.3) {
        Behaviors.pickIdle();
      }
    }
  };

  // ─── Scroll AI (reading progress + offer help) ────────────
  var Scroll = {
    last: 0, offered: false,
    init: function () {
      window.addEventListener('scroll', function () {
        var pct = Math.min(1, (window.scrollY + window.innerHeight) / document.body.scrollHeight);
        wrap.style.setProperty('--hp', Math.round(pct * 100) + '%');
        if (pct > 0.05) wrap.classList.add('hs-progress'); else wrap.classList.remove('hs-progress');
        Mem.markRead(Math.round(pct * 100));

        if (pct > 0.9 && !Scroll.offered && PageAI.data.isArticle) {
          Scroll.offered = true;
          Say.say('تموم شد! بریم بالا یا مقاله بعدی؟', {
            actions: [
              { label: 'برو بالا', fn: Helper.top },
              { label: 'بعدی', alt: true, fn: function () { var n = document.querySelector('.nav-next a, a[rel=next]'); if (n) location.href = n.href; } }
            ]
          });
        }
      }, { passive: true });
    }
  };

  // ─── Text selection helper ────────────────────────────────
  var Selection = {
    pop: null,
    init: function () {
      document.addEventListener('mouseup', function () {
        setTimeout(Selection.check, 30);
      });
      document.addEventListener('mousedown', Selection.hide);
    },
    check: function () {
      var sel = window.getSelection();
      var text = sel ? sel.toString().trim() : '';
      if (!text || text.length < 4 || text.length > 600) { Selection.hide(); return; }
      var range = sel.getRangeAt(0);
      var r = range.getBoundingClientRect();
      Selection.show(text, r);
      Anim.face('read', 1800);
    },
    show: function (text, r) {
      Selection.hide();
      var p = document.createElement('div');
      p.className = 'h-sel-pop';
      p.style.top = (window.scrollY + r.top - 44) + 'px';
      p.style.left = (window.scrollX + r.left) + 'px';

      var add = function (label, fn) {
        var b = document.createElement('button');
        b.textContent = label; b.onclick = function (e) { e.preventDefault(); fn(); Selection.hide(); };
        p.appendChild(b);
      };
      add('کپی', function () { try { navigator.clipboard.writeText(text); Say.say('کپی شد ✓', { force: true, dur: 1500 }); } catch (e) {} });
      add('جستجو', function () { Helper.defineSelection(text); });
      if (text.length > 60) add('خلاصه', function () {
        var sents = text.split(/(?<=[\.\?\!؟])\s+/);
        Say.say(sents.slice(0, 2).join(' '), { force: true, sticky: true, actions: [{ label: 'باشه', fn: function () {} }] });
      });
      document.body.appendChild(p);
      Selection.pop = p;
    },
    hide: function () { if (Selection.pop) { Selection.pop.remove(); Selection.pop = null; } }
  };

  // ─── Behaviors (passive, occasional) ──────────────────────
  var Behaviors = {
    pickIdle: function () {
      var arr = ['wiggle', 'bounce', 'spin', 'wink', 'happy'];
      var b = arr[Math.floor(Math.random() * arr.length)];
      if (b === 'wink') Anim.face('wink', 900);
      else if (b === 'happy') Anim.face('happy', 1500);
      else Anim.cls('ha-' + b, b === 'spin' ? 1100 : 900);
    },
    react: function (kind) {
      if (kind === 'click') { Anim.cls('ha-bounce', 700); Anim.face('happy', 800); }
      if (kind === 'scroll') { Anim.cls('ha-wiggle', 700); }
    }
  };

  // ─── Scheduler ────────────────────────────────────────────
  var Scheduler = {
    start: function () {
      var loop = function () {
        Behaviors.pickIdle();
        setTimeout(loop, K.BEHAVIOR_MIN + Math.random() * (K.BEHAVIOR_MAX - K.BEHAVIOR_MIN));
      };
      setTimeout(loop, 8000);
    }
  };

  // ─── Bindings ─────────────────────────────────────────────
  var Bind = {
    init: function () {
      window.addEventListener('mousemove', function (e) { S.mx = e.clientX; S.my = e.clientY; }, { passive: true });
      window.addEventListener('mouseleave', function () { S.mx = -9999; S.my = -9999; });
      window.addEventListener('resize', function () {
        S.tx = window.innerWidth - K.W - K.RIGHT;
        S.ty = window.innerHeight - K.H - K.BOTTOM;
      });

      // Click on jelly → context help
      wrap.addEventListener('click', function (e) {
        if (e.target === closeBtn) return;
        if (S.dragging) return;
        Anim.cls('ha-bounce', 700);
        Bind.contextHelp();
      });

      // Drag
      var sx, sy, ox, oy;
      wrap.addEventListener('mousedown', function (e) {
        if (e.target === closeBtn) return;
        S.dragging = true; sx = e.clientX; sy = e.clientY; ox = S.x; oy = S.y;
        e.preventDefault();
      });
      window.addEventListener('mousemove', function (e) {
        if (!S.dragging) return;
        S.x = ox + (e.clientX - sx); S.y = oy + (e.clientY - sy);
        S.tx = S.x; S.ty = S.y;
      });
      window.addEventListener('mouseup', function () {
        if (S.dragging) { S.dragging = false; Anim.cls('ha-squash', 550); }
      });

      // Close & restore
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        wrap.style.display = 'none';
        restore.classList.add('show');
        Mem.data.dismissed++; Mem.save();
      });
      restore.addEventListener('click', function () {
        wrap.style.display = '';
        restore.classList.remove('show');
        Anim.cls('ha-bounce', 800); Anim.face('happy', 1200);
      });

      // Scroll & selection
      Scroll.init();
      Selection.init();

      window.addEventListener('click', function () { Behaviors.react('click'); }, { passive: true });
      window.addEventListener('scroll', function () { Behaviors.react('scroll'); }, { passive: true });
    },

    contextHelp: function () {
      var p = PageAI.data;
      var a = [];
      if (p.isArticle) a.push({ label: 'خلاصه مقاله', fn: Helper.summary });
      if (p.headings && p.headings.length) a.push({ label: 'فهرست', fn: Helper.toc });
      if (window.scrollY > 400) a.push({ label: 'برو بالا', fn: Helper.top });
      if (p.isProduct) a.push({ label: 'افزودن به سبد', fn: function () { var b = document.querySelector('.single_add_to_cart_button'); if (b) b.click(); } });
      a.push({ label: 'بستن', alt: true, fn: function () {} });
      Say.say('چه کاری از دستم برمیاد؟', { force: true, sticky: true, actions: a });
    }
  };

  // ─── Public API ───────────────────────────────────────────
  window.HarfoAI = {
    say: function (t) { Say.say(t, { force: true }); },
    summary: Helper.summary,
    toc: Helper.toc,
    page: function () { return PageAI.data; },
    style: function () { return StyleAI.data; },
    mem: function () { return Mem.data; },
    anim: function (name, dur) { Anim.cls('ha-' + name, dur || 800); },
    face: function (state, dur) { Anim.face(state, dur || 1500); }
  };

  // ─── Boot ─────────────────────────────────────────────────
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
