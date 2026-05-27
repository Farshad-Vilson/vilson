/* ======================================================
   حرفو v6 — Intelligence Engine
   Page AI, Content Analysis, Speech, Helpers
   ====================================================== */
(function (root) {
  'use strict';

  /* ─── Helpers ─── */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ══════════════════════════════════════════════════
     PAGE AI — reads and understands current page
  ══════════════════════════════════════════════════ */
  var PageAI = {
    d: {},

    run: function () {
      var d = this.d;
      d.url   = location.href;
      d.path  = location.pathname;
      d.title = document.title || '';
      d.lang  = document.documentElement.lang || 'fa';
      d.rtl   = document.documentElement.dir === 'rtl' || getComputedStyle(document.body).direction === 'rtl';

      /* WooCommerce context */
      d.isWoo      = !!$('.woocommerce, .woocommerce-page');
      d.isProduct  = !!$('.single-product, .woocommerce-product-gallery, .product .price');
      d.isCart     = /cart/i.test(d.path) || !!$('.woocommerce-cart-form');
      d.isCheckout = /checkout/i.test(d.path) || !!$('.woocommerce-checkout');
      d.isShop     = /shop|store|products/i.test(d.path) || !!$('.woocommerce-products-header');
      d.isAccount  = /account|login|register/i.test(d.path) || !!$('.woocommerce-account');

      /* Blog / content context */
      d.isArticle  = !!$('article, .single, .post, [itemprop=articleBody], .entry-content');
      d.isHome     = d.path === '/' || /^\/?(home|index)/i.test(d.path);
      d.is404      = /404/i.test(d.title) || !!$('body.error404, .error-404');
      d.isSearch   = /search/i.test(d.path) || !!$('.search-results');
      d.isContact  = /contact|تماس/i.test(d.title + d.path);
      d.isAbout    = /about|درباره/i.test(d.title + d.path);

      /* Style inspection */
      try {
        var bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255,255,255];
        var lum = (0.299*+bg[0] + 0.587*+bg[1] + 0.114*+bg[2]) / 255;
        d.dark = lum < 0.5;
        var btn = $('button, .btn, a.button, input[type=submit]');
        d.accent = btn ? getComputedStyle(btn).backgroundColor : '#5BE8DA';
      } catch(e) { d.dark = false; }

      /* Content extraction */
      var pSel = 'article p, .entry-content p, [itemprop=articleBody] p, main p, .post-content p';
      var pNodes = $$(pSel);
      if (!pNodes.length) pNodes = $$('p');
      var paras = [];
      for (var i = 0; i < pNodes.length && i < 100; i++) {
        var t = (pNodes[i].innerText || '').trim();
        if (t.length > 40) paras.push(t);
      }
      d.paragraphs = paras;
      d.text       = paras.join(' ');
      d.words      = d.text.split(/\s+/).filter(Boolean).length;
      d.readMin    = Math.max(1, Math.round(d.words / 220));
      d.charCount  = d.text.length;

      /* Headings */
      d.headings = $$('article h2, article h3, .entry-content h2, .entry-content h3, main h2, main h3, .post h2')
        .filter(function(h){ var t=(h.innerText||'').trim(); return t.length>2 && t.length<140; })
        .map(function(h){ return { t:h.innerText.trim(), el:h, level: +h.tagName[1] }; });

      /* Forms & interactive */
      d.hasForm      = !!$('form input:not([type=hidden])');
      d.errorFields  = $$('.woocommerce-error li, .woocommerce-invalid, .has-error, input.error, input[aria-invalid=true]');
      d.hasVideo     = !!$('video, iframe[src*="youtu"], iframe[src*="aparat"], iframe[src*="vimeo"]');
      d.hasGallery   = !!$('.gallery, .slick-slider, .swiper, [class*=carousel], .woocommerce-product-gallery__image');
      d.hasPrice     = !!$('.price, [itemprop=price], .amount');
      d.productTitle = d.isProduct ? (($('h1.product_title') || $('h1'))?.innerText || '').trim().slice(0, 60) : '';
      d.productPrice = d.isProduct ? (($('.price') || {}).innerText || '').trim().slice(0, 20) : '';

      /* Related links */
      d.navLinks = $$('header nav a, .main-navigation a, #nav a').slice(0, 18)
        .map(function(a){ return { t:(a.innerText||'').trim(), href:a.href }; })
        .filter(function(x){ return x.t.length > 1 && x.t.length < 40 && /^http/.test(x.href); });

      d.allLinks = $$('a[href]').filter(function(a){
        var t=(a.innerText||'').trim();
        return t.length>2 && t.length<80 && /^http/.test(a.href);
      }).slice(0, 250).map(function(a){ return { t:(a.innerText||'').trim(), href:a.href }; });
    },

    /* Extractive summarizer — pure JS, no deps */
    summarize: function (n) {
      n = n || 3;
      var text = this.d.text || '';
      if (!text) return '';

      var sents = text.replace(/\n+/g, ' ')
        .split(/(?<=[\.\?\!؟])\s+(?=[^\s])/g)
        .filter(function(s){ return s.length > 25 && s.length < 380; });

      if (sents.length <= n) return sents.join(' ');

      var stopFa = 'و در از به که این آن یک با را برای های می شد است بود تا یا اما نیز هم گفت کرد شده ای ما من شما او ها هم شد ست کرده بوده شد اگر یعنی چون زیرا بنابراین همچنین'.split(' ');
      var stopEn = 'the a an is was are were be been have has had do does did will would can could should may might the and or but not for from'.split(' ');
      var stop   = stopFa.concat(stopEn);

      var freq = {};
      sents.forEach(function(s){
        s.toLowerCase().replace(/[^؀-ۿa-z0-9\s]/g, '').split(/\s+/).forEach(function(w){
          if (w.length > 2 && stop.indexOf(w) === -1) freq[w] = (freq[w] || 0) + 1;
        });
      });

      var scored = sents.map(function(s, i){
        var sc = 0;
        s.toLowerCase().replace(/[^؀-ۿa-z0-9\s]/g, '').split(/\s+/).forEach(function(w){
          if (freq[w]) sc += freq[w];
        });
        /* Position boost: first and last sentences matter */
        if (i === 0) sc *= 1.6;
        if (i === sents.length - 1) sc *= 1.1;
        return { s: s, sc: sc / Math.sqrt(s.length + 1), i: i };
      });

      scored.sort(function(a, b){ return b.sc - a.sc; });
      return scored.slice(0, n).sort(function(a, b){ return a.i - b.i; }).map(function(x){ return x.s; }).join(' ');
    },

    /* Extract keywords for smarter speech */
    keywords: function (n) {
      n = n || 8;
      var text = this.d.text || '';
      if (!text) return [];
      var freq = {};
      var stop = 'و در از به که این آن یک با را برای های می شد است بود تا یا اما نیز هم'.split(' ');
      text.replace(/[^؀-ۿa-z0-9\s]/g, '').toLowerCase().split(/\s+/).forEach(function(w){
        if (w.length > 2 && stop.indexOf(w) === -1) freq[w] = (freq[w] || 0) + 1;
      });
      return Object.keys(freq).sort(function(a,b){ return freq[b]-freq[a]; }).slice(0, n);
    }
  };

  /* ══════════════════════════════════════════════════
     MEMORY — localStorage persistence
  ══════════════════════════════════════════════════ */
  var STORE = 'harfo_v6';
  var Memory = {
    d: {
      visits:  0,
      lastAt:  0,
      dismiss: 0,
      helps:   0,
      toured:  {},
      prefs:   { font: '', dark: false, toc: false },
      scroll:  {}
    },
    load: function () {
      try {
        var raw = localStorage.getItem(STORE);
        if (raw) this.d = Object.assign({}, this.d, JSON.parse(raw));
      } catch(e) {}
      this.d.visits = (this.d.visits || 0) + 1;
      this.d.lastAt = Date.now();
      this.save();
    },
    save: function () { try { localStorage.setItem(STORE, JSON.stringify(this.d)); } catch(e) {} },
    hasToured: function (path) { return !!this.d.toured[path]; },
    markToured: function (path) { this.d.toured[path] = Date.now(); this.save(); },
    pref: function (k, v) {
      if (arguments.length === 2) { this.d.prefs[k] = v; this.save(); }
      return this.d.prefs[k];
    },
    markScroll: function (pct) {
      var k = location.pathname;
      this.d.scroll[k] = Math.max(this.d.scroll[k] || 0, pct);
      this.save();
    }
  };

  /* ══════════════════════════════════════════════════
     SPEECH ENGINE
  ══════════════════════════════════════════════════ */
  var Speech = {
    _wrap: null, _msg: null, _acts: null, _typing: null,
    _lastAt: 0,
    COOLDOWN: 5000,
    _hideTO: null,

    init: function (wrap, msg, acts, typing) {
      this._wrap   = wrap;
      this._msg    = msg;
      this._acts   = acts;
      this._typing = typing;
    },

    say: function (text, opts) {
      opts = opts || {};
      if (!opts.force && Date.now() - this._lastAt < this.COOLDOWN) return;
      this._lastAt = Date.now();

      clearTimeout(this._hideTO);
      this._acts.innerHTML = '';
      this._acts.classList.remove('show');

      /* Show typing dots first */
      this._typing.classList.add('show');
      this._wrap.classList.add('hv-talk');
      this._msg.textContent = '';

      var self = this;
      setTimeout(function () {
        self._typing.classList.remove('show');
        self._msg.textContent = text;

        if (opts.actions && opts.actions.length) {
          opts.actions.forEach(function (a) {
            var b = document.createElement('button');
            b.textContent = a.label;
            if (a.alt) b.className = 'alt';
            b.onclick = function (e) {
              e.stopPropagation();
              Memory.d.helps++;
              Memory.save();
              Speech.hide();
              if (a.fn) a.fn();
            };
            self._acts.appendChild(b);
          });
          self._acts.classList.add('show');
        }

        var dur = opts.dur || (3200 + text.length * 45);
        if (!opts.sticky) {
          self._hideTO = setTimeout(function () { self.hide(); }, dur);
        }
      }, 620);
    },

    hide: function () {
      if (this._wrap) {
        this._wrap.classList.remove('hv-talk');
        this._typing.classList.remove('show');
      }
    }
  };

  /* ══════════════════════════════════════════════════
     HELPERS — real user-facing actions
  ══════════════════════════════════════════════════ */
  var Helpers = {
    tocEl: null, progEl: null,

    /* ── Floating TOC ── */
    buildTOC: function () {
      var hs = PageAI.d.headings || [];
      if (hs.length < 2) { Toast.show('این صفحه فهرست‌بندی نداره'); return; }

      var toc = document.getElementById('h-toc');
      toc.innerHTML = '';

      var header = document.createElement('div');
      header.id = 'h-toc-header';
      header.innerHTML = '<span>فهرست مطالب</span><button id="h-toc-close" aria-label="بستن">×</button>';
      toc.appendChild(header);

      header.querySelector('#h-toc-close').onclick = function () { toc.classList.remove('show'); };

      hs.slice(0, 20).forEach(function (h) {
        var a = document.createElement('a');
        a.href = '#';
        a.textContent = h.t;
        if (h.level === 3) a.className = 'h3';
        a.onclick = function (e) {
          e.preventDefault();
          h.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(function () { toc.classList.remove('show'); }, 600);
        };
        toc.appendChild(a);
      });

      Helpers.tocEl = toc;
      setTimeout(function () { toc.classList.add('show'); }, 50);

      /* Update active on scroll */
      var updateActive = function () {
        var sy = window.scrollY + 100;
        var best = 0;
        hs.forEach(function (h, i) { if (h.el.offsetTop <= sy) best = i; });
        toc.querySelectorAll('a').forEach(function (a, i) { a.classList.toggle('active', i === best); });
      };
      window.addEventListener('scroll', updateActive, { passive: true });
      updateActive();
      Memory.pref('toc', true);
    },

    toggleTOC: function () {
      var toc = document.getElementById('h-toc');
      if (!Helpers.tocEl || !toc.children.length) { Helpers.buildTOC(); return; }
      toc.classList.toggle('show');
    },

    /* ── Reading progress badge ── */
    showProgress: function () {
      if (Helpers.progEl) return;
      var el = document.createElement('div');
      el.id = 'h-prog';
      el.title = 'کلیک برای برگشت بالا';
      el.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
      document.body.appendChild(el);
      Helpers.progEl = el;

      var update = function () {
        var max = Math.max(1, document.body.scrollHeight - window.innerHeight);
        var p   = Math.min(100, Math.round((window.scrollY / max) * 100));
        el.style.setProperty('--pp', p + '%');
        el.dataset.p = p;
        el.classList.toggle('show', window.scrollY > 220);
        Memory.markScroll(p);
        if (p >= 92 && !el._offered) {
          el._offered = true;
          Speech.say('تموم صفحه رو خوندی! آفرین 🎉', { force: true });
          Helpers.emitSparks(10);
        }
      };
      window.addEventListener('scroll', update, { passive: true });
      update();
    },

    /* ── Summary ── */
    summary: function () {
      var s = PageAI.summarize(3);
      if (!s) { Toast.show('متن کافی پیدا نشد'); return; }
      Anim.face('read', 4500);
      Speech.say(s, { force: true, sticky: true, dur: 14000,
        actions: [{ label: 'ممنون', fn: function () {} }] });
    },

    /* ── Font controls ── */
    fontUp: function () {
      var html = document.documentElement;
      var cur  = parseFloat(html.style.fontSize || getComputedStyle(html).fontSize);
      html.style.fontSize = Math.min(24, cur + 1.5) + 'px';
      Memory.pref('font', html.style.fontSize);
      Toast.show('متن بزرگ‌تر شد');
    },
    fontDown: function () {
      var html = document.documentElement;
      var cur  = parseFloat(html.style.fontSize || getComputedStyle(html).fontSize);
      html.style.fontSize = Math.max(11, cur - 1.5) + 'px';
      Memory.pref('font', html.style.fontSize);
      Toast.show('متن کوچک‌تر شد');
    },
    fontReset: function () {
      document.documentElement.style.fontSize = '';
      Memory.pref('font', '');
      Toast.show('اندازه متن بازنشانی شد');
    },

    /* ── Dark mode toggle ── */
    toggleDark: function () {
      var html = document.documentElement;
      var isDark = html.classList.toggle('harfo-night');
      if (!document.getElementById('harfo-night-css')) {
        var s = document.createElement('style');
        s.id = 'harfo-night-css';
        s.textContent = [
          'html.harfo-night{filter:invert(0.92) hue-rotate(180deg)}',
          'html.harfo-night img,html.harfo-night video,html.harfo-night canvas,',
          'html.harfo-night iframe,html.harfo-night .harfo-hl,html.harfo-night #harfo-root{filter:invert(0.92) hue-rotate(180deg)}'
        ].join('');
        document.head.appendChild(s);
      }
      Memory.pref('dark', isDark);
      Toast.show(isDark ? 'حالت شب روشن شد 🌙' : 'حالت روز روشن شد ☀️');
    },

    /* ── Sparks / particles (exported for use by behaviors too) ── */
    emitSparks: function (count) {
      var pc = document.getElementById('h-particles');
      if (!pc) return;
      for (var i = 0; i < count; i++) {
        (function (idx) {
          setTimeout(function () {
            var el = document.createElement('div');
            el.className = 'h-particle spark';
            el.style.cssText = 'left:' + (30 + Math.random() * 40) + '%;top:' + (20 + Math.random() * 50) + '%;' +
              '--tx:' + (Math.random() * 60 - 30) + 'px;--ty:' + (-(20 + Math.random() * 50)) + 'px;';
            el.innerHTML = '<svg width="10" height="10"><use href="#hs-spark"/></svg>';
            pc.appendChild(el);
            setTimeout(function () { el.remove(); }, 800);
          }, idx * 60);
        })(i);
      }
    },

    emitHearts: function (count) {
      var pc = document.getElementById('h-particles');
      if (!pc) return;
      for (var i = 0; i < count; i++) {
        (function (idx) {
          setTimeout(function () {
            var el = document.createElement('div');
            el.className = 'h-particle heart';
            el.style.cssText = 'left:' + (25 + Math.random() * 50) + '%;top:20%;' +
              '--hx:' + (Math.random() * 40 - 20) + 'px;';
            el.innerHTML = '<svg width="18" height="18"><use href="#hs-heart"/></svg>';
            pc.appendChild(el);
            setTimeout(function () { el.remove(); }, 1000);
          }, idx * 80);
        })(i);
      }
    },

    emitText: function (text, x, y) {
      var el = document.createElement('div');
      el.className = 'h-particle text';
      el.style.cssText = 'position:fixed;left:' + (x||50) + '%;top:' + (y||60) + '%;transform:translateX(-50%);pointer-events:none;z-index:2147483641;';
      el.textContent = text;
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 1200);
    },

    /* ── Point to form error ── */
    pointToError: function () {
      var err = $('.woocommerce-error li, input.error, input[aria-invalid=true], .has-error input, .woocommerce-invalid input');
      if (!err) { Toast.show('خطایی پیدا نشد'); return; }
      var r = err.getBoundingClientRect();
      if (r.top < 60 || r.top > window.innerHeight - 80)
        window.scrollTo({ top: window.scrollY + r.top - 120, behavior: 'smooth' });
      setTimeout(function () {
        r = err.getBoundingClientRect();
        err.classList.add('harfo-hl');
        if (root.HarfoPhys) root.HarfoPhys.moveTo(r.left + r.width/2 - 60, r.top - 150, function () {
          Speech.say('اینجا یه مشکل داره — لطفاً بررسی کن.', { force: true });
          setTimeout(function () { err.classList.remove('harfo-hl'); }, 5000);
        });
      }, 500);
    },

    /* ── Restore prefs ── */
    restorePrefs: function () {
      var f = Memory.pref('font');
      if (f) document.documentElement.style.fontSize = f;
      if (Memory.pref('dark')) {
        document.documentElement.classList.add('harfo-night');
        if (!document.getElementById('harfo-night-css')) Helpers.toggleDark(), Helpers.toggleDark(); // toggle twice = on
      }
    }
  };

  /* ══════════════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════════════ */
  var Toast = {
    _el: null, _to: null,
    init: function (el) { this._el = el; },
    show: function (msg, dur) {
      if (!this._el) return;
      this._el.textContent = msg;
      this._el.classList.add('show');
      clearTimeout(this._to);
      this._to = setTimeout(function () { Toast._el.classList.remove('show'); }, dur || 2400);
    }
  };

  /* ══════════════════════════════════════════════════
     SEARCH PALETTE
  ══════════════════════════════════════════════════ */
  var Palette = {
    _el: null, _inp: null, _list: null,
    _items: [],
    _idx: 0,

    init: function () {
      this._el   = document.getElementById('h-palette');
      this._inp  = document.getElementById('h-pal-inp');
      this._list = document.getElementById('h-pal-list');
      if (!this._el) return;

      var self = this;
      this._inp.addEventListener('input', function () { self.render(self._inp.value); });
      this._inp.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { self.close(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); self.move(1); return; }
        if (e.key === 'ArrowUp')   { e.preventDefault(); self.move(-1); return; }
        if (e.key === 'Enter') { e.preventDefault(); self.go(); return; }
      });
      this._el.addEventListener('click', function (e) { if (e.target === self._el) self.close(); });

      // Global shortcut
      window.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault(); self.open();
        }
      });
    },

    buildItems: function () {
      var seen = {};
      var items = [];
      var add = function (arr, icon) {
        arr.forEach(function (l) {
          if (!seen[l.t]) {
            seen[l.t] = 1;
            items.push({ t: l.t, href: l.href, icon: icon || '🔗' });
          }
        });
      };
      add(PageAI.d.navLinks || [],  '🧭');
      add(PageAI.d.allLinks || [],  '🔗');
      /* Headings as in-page anchors */
      (PageAI.d.headings || []).forEach(function (h) {
        if (!seen[h.t]) {
          seen[h.t] = 1;
          items.push({ t: h.t, href: null, scroll: h.el, icon: '📌' });
        }
      });
      this._items = items;
    },

    open: function () {
      if (!this._el) return;
      this.buildItems();
      this.render('');
      this._el.classList.add('show');
      setTimeout(function () { Palette._inp && Palette._inp.focus(); }, 60);
    },

    close: function () {
      if (this._el) this._el.classList.remove('show');
    },

    render: function (q) {
      q = (q || '').trim().toLowerCase();
      var matches = q
        ? this._items.filter(function (i) { return i.t.toLowerCase().indexOf(q) >= 0; }).slice(0, 22)
        : this._items.slice(0, 14);

      this._list.innerHTML = '';
      this._idx = 0;
      if (!matches.length) {
        this._list.innerHTML = '<div class="no-r">نتیجه‌ای پیدا نشد</div>';
        return;
      }
      matches.forEach(function (m, i) {
        var a = document.createElement('a');
        a.href = m.href || '#';
        a.className = i === 0 ? 'sel' : '';
        a.innerHTML = '<span class="h-pal-icon">' + (m.icon || '🔗') + '</span>' + m.t;
        a.onclick = function (e) {
          if (m.scroll) { e.preventDefault(); m.scroll.scrollIntoView({ behavior: 'smooth', block: 'start' }); Palette.close(); }
          else { Palette.close(); }
        };
        Palette._list.appendChild(a);
      });
    },

    move: function (dir) {
      var links = Array.prototype.slice.call(this._list.querySelectorAll('a'));
      if (!links.length) return;
      links[this._idx] && links[this._idx].classList.remove('sel');
      this._idx = (this._idx + dir + links.length) % links.length;
      links[this._idx] && links[this._idx].classList.add('sel');
      links[this._idx] && links[this._idx].scrollIntoView({ block: 'nearest' });
    },

    go: function () {
      var sel = this._list.querySelector('.sel');
      if (sel) sel.click();
    }
  };

  /* ══════════════════════════════════════════════════
     TEXT SELECTION HELPER
  ══════════════════════════════════════════════════ */
  var SelectHelper = {
    _pop: null,
    init: function () {
      document.addEventListener('mouseup',   function () { setTimeout(SelectHelper.check, 30); });
      document.addEventListener('mousedown', function (e) {
        if (SelectHelper._pop && !SelectHelper._pop.contains(e.target)) SelectHelper.hide();
      });
    },
    check: function () {
      var sel  = window.getSelection();
      var text = sel ? sel.toString().trim() : '';
      if (!text || text.length < 4 || text.length > 800) { SelectHelper.hide(); return; }
      try {
        var r = sel.getRangeAt(0).getBoundingClientRect();
        if (r.width < 1 && r.height < 1) return;
        SelectHelper.show(text, r);
      } catch(e) {}
    },
    show: function (text, rect) {
      SelectHelper.hide();
      var p = document.createElement('div');
      p.className = 'h-sel-pop';
      p.style.cssText = 'top:' + (window.scrollY + rect.top - 44) + 'px;left:' + (window.scrollX + rect.left) + 'px;';

      function btn(label, fn) {
        var b = document.createElement('button');
        b.textContent = label;
        b.onclick = function (e) { e.preventDefault(); fn(); SelectHelper.hide(); };
        p.appendChild(b);
      }

      btn('کپی',    function () { try { navigator.clipboard.writeText(text); Toast.show('کپی شد ✓'); } catch(e){} });
      btn('برجسته', function () {
        try {
          var sp = document.createElement('mark');
          sp.style.cssText = 'background:rgba(91,232,218,0.35);padding:0 2px;border-radius:3px';
          var rng = window.getSelection().getRangeAt(0);
          rng.surroundContents(sp);
        } catch(e) {}
      });
      btn('بخوان',  function () {
        try {
          var u = new SpeechSynthesisUtterance(text);
          u.lang = 'fa-IR';
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
          Toast.show('در حال خواندن...');
        } catch(e) {}
      });
      if (text.length > 80) {
        btn('خلاصه', function () {
          var s = text.split(/(?<=[\.\?\!؟])\s+/).slice(0, 2).join(' ');
          Speech.say(s, { force: true, sticky: true, actions: [{ label: 'باشه', fn: function(){} }] });
        });
      }

      document.body.appendChild(p);
      SelectHelper._pop = p;
    },
    hide: function () { if (SelectHelper._pop) { SelectHelper._pop.remove(); SelectHelper._pop = null; } }
  };

  /* ══════════════════════════════════════════════════
     ANCHOR SCANNER — find DOM elements to visit
  ══════════════════════════════════════════════════ */
  var Anchors = {
    scan: function () {
      var sels = [
        { s: 'header, .site-header, #masthead', k: 'header' },
        { s: '.main-navigation, nav.primary, #site-navigation, header nav', k: 'nav' },
        { s: '.site-logo, .custom-logo, header .logo, .logo-wrapper', k: 'logo' },
        { s: 'h1', k: 'h1' },
        { s: 'article h2, .entry-content h2, main h2', k: 'heading' },
        { s: '.single_add_to_cart_button, .add_to_cart_button', k: 'add-cart' },
        { s: '.checkout-button, a[href*="checkout"]', k: 'checkout' },
        { s: '.elementor-button, .wp-block-button__link, a.button, .cta-button', k: 'cta' },
        { s: '.price, .amount', k: 'price' },
        { s: 'footer, .site-footer', k: 'footer' }
      ];
      var found = [], seen = new WeakSet ? new WeakSet() : { has: function(){return false;}, add: function(){} };
      sels.forEach(function (s) {
        try {
          var els = document.querySelectorAll(s.s);
          for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (seen.has && seen.has(el)) continue;
            if (seen.has) seen.add(el);
            var r = el.getBoundingClientRect();
            if (r.width < 20 || r.height < 10) continue;
            found.push({ el: el, rect: r, kind: s.k });
          }
        } catch(e) {}
      });
      return found;
    },

    spotOn: function (anchor) {
      var r  = anchor.rect;
      var cx = r.left + r.width  / 2 - 60;
      var cy;
      if (anchor.kind === 'header' || anchor.kind === 'nav' || r.width > 300) {
        cy = r.top - 110;   /* drape over */
      } else if (anchor.kind === 'footer') {
        cy = r.top - 130;
      } else {
        cy = r.top - 140;
      }
      return {
        x: Math.max(6, Math.min(window.innerWidth - 126, cx)),
        y: Math.max(6, Math.min(window.innerHeight - 162, cy))
      };
    },

    poseFor: function (anchor) {
      if (anchor.kind === 'header' || anchor.kind === 'nav' || (anchor.rect && anchor.rect.width > 300)) return 'drape';
      if (anchor.kind === 'logo' || anchor.kind === 'price') return 'peek';
      if (anchor.kind === 'cta' || anchor.kind === 'add-cart' || anchor.kind === 'checkout') return 'sit';
      if (anchor.kind === 'heading') return 'peek';
      return 'sit';
    }
  };

  /* ── Expose ── */
  root.HarfoPageAI   = PageAI;
  root.HarfoMemory   = Memory;
  root.HarfoSpeech   = Speech;
  root.HarfoHelpers  = Helpers;
  root.HarfoToast    = Toast;
  root.HarfoPalette  = Palette;
  root.HarfoSelect   = SelectHelper;
  root.HarfoAnchors  = Anchors;

  /* Anim stub (overridden by main) */
  root.Anim = root.Anim || { face: function(){}, cls: function(){} };

}(window));
