/* ======================================================================
   حرفو v5 — راهنمای هوشمند مستقل
   صفر وابستگی خارجی. تمام منطق درون همین فایل.
   ====================================================================== */
(function () {
  'use strict';
  if (window.HarfoLoaded) return; window.HarfoLoaded = true;

  /* ───────────── Config ───────────── */
  var CFG = {
    W: 110, H: 144,
    WALK_SPEED: 6.5,           // px per frame max
    SPRING_K: 0.07, SPRING_D: 0.78,
    FLEE_R: 130, FLEE_F: 4.6,
    SPEECH_CD: 5500,
    BLINK_MIN: 3200, BLINK_MAX: 8500,
    IDLE_LOOK: 9000,
    IDLE_NAP: 38000,
    TOUR_STEP_MS: 4200,
    AUTO_TOC_AFTER: 7500,
    STORE: 'harfo_v5_mem'
  };

  /* ───────────── Shape library ─────────────
     All shapes share identical command structure so we can interpolate.
     Format: "M x,y C x,y x,y x,y  C x,y x,y x,y  C x,y x,y x,y  C x,y x,y x,y Z"
     26 numbers each.
     viewBox = 0 0 200 260
  */
  var SHAPES = {
    stand:    "M100,16 C150,16 168,60 158,118 C148,176 130,200 130,238 C130,260 70,260 70,238 C70,200 52,176 42,118 C32,60 50,16 100,16 Z",
    sit:     "M100,40 C160,40 178,80 168,128 C158,170 150,188 150,228 C150,256 50,256 50,228 C50,188 42,170 32,128 C22,80 40,40 100,40 Z",
    puddle:  "M100,160 C170,160 192,180 182,210 C172,236 160,250 150,254 C140,258 60,258 50,254 C40,250 28,236 18,210 C8,180 30,160 100,160 Z",
    drape:   "M100,80 C188,80 196,128 188,170 C180,206 168,240 150,250 C132,258 68,258 50,250 C32,240 20,206 12,170 C4,128 12,80 100,80 Z",
    peek:    "M100,40 C158,40 175,80 168,138 C160,196 132,230 124,238 C116,246 84,246 76,238 C68,230 40,196 32,138 C25,80 42,40 100,40 Z",
    stretch: "M100,90 C195,90 198,138 192,170 C188,196 175,220 160,240 C145,256 55,256 40,240 C25,220 12,196 8,170 C2,138 5,90 100,90 Z"
  };

  // Highlight overlay shapes (always same structure)
  var HL = "M76,40 C95,32 116,34 125,48 C130,72 116,86 100,90 C84,86 70,72 76,40 Z";

  // Face position per pose (translate + scale)
  var FACE_POS = {
    stand:   { tx:0,   ty:0,    s:1.0 },
    sit:     { tx:0,   ty:18,   s:1.0 },
    puddle:  { tx:0,   ty:115,  s:0.78 },
    drape:   { tx:0,   ty:55,   s:1.05 },
    peek:    { tx:0,   ty:12,   s:0.95 },
    stretch: { tx:0,   ty:75,   s:0.9 }
  };

  /* ───────────── DOM ───────────── */
  function $(s, c) { return (c||document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c||document).querySelectorAll(s)); }

  var root, wrap, jelly, body, hl, face, hud, msg, acts, restore, closeBtn, toast;

  /* ───────────── Memory ───────────── */
  var Mem = {
    d: { visits:0, lastTour:0, dismiss:0, helps:0, prefs:{} },
    load: function () {
      try { var r = localStorage.getItem(CFG.STORE); if (r) this.d = Object.assign(this.d, JSON.parse(r)); } catch(e){}
      this.d.visits = (this.d.visits||0) + 1;
      this.save();
    },
    save: function () { try { localStorage.setItem(CFG.STORE, JSON.stringify(this.d)); } catch(e){} },
    pref: function (k, v) { if (arguments.length===2) { this.d.prefs[k]=v; this.save(); } return this.d.prefs[k]; }
  };

  /* ───────────── Physics ───────────── */
  var S = {
    x: -200, y: window.innerHeight - 200,
    vx: 0, vy: 0,
    tx: -200, ty: window.innerHeight - 200,
    mx: -9999, my: -9999,
    flee: true, dragging: false, walking: false,
    facing: 1,    // 1 right, -1 left
    pose: 'stand',
    poseAt: 0,
    morphFrom: null, morphTo: null, morphT: 0, morphDur: 0, morphStart: 0,
    faceFrom: null, faceTo: null,
    onArrive: null,
    lastSpeech: 0,
    idleSince: Date.now(),
    napping: false
  };

  var Phys = {
    init: function () {
      S.x = window.innerWidth - CFG.W - 30;
      S.y = window.innerHeight - CFG.H - 30;
      S.tx = S.x; S.ty = S.y;
      Phys.commit();
    },
    tick: function () {
      if (!S.dragging) {
        // Repulsion (skip when napping or walking purposefully)
        if (S.flee && !S.napping && !S.walking) {
          var dx = (S.x + CFG.W/2) - S.mx;
          var dy = (S.y + CFG.H/2) - S.my;
          var d = Math.hypot(dx, dy);
          if (d < CFG.FLEE_R && d > 0.1) {
            var t = Math.pow((CFG.FLEE_R - d) / CFG.FLEE_R, 1.5);
            S.vx += (dx/d) * t * CFG.FLEE_F;
            S.vy += (dy/d) * t * CFG.FLEE_F * 0.6;
            if (Math.random() < 0.04) Anim.face('wow', 500);
          }
        }
        // Spring
        S.vx = S.vx * CFG.SPRING_D + (S.tx - S.x) * CFG.SPRING_K;
        S.vy = S.vy * CFG.SPRING_D + (S.ty - S.y) * CFG.SPRING_K;
        // Cap speed
        var sp = Math.hypot(S.vx, S.vy);
        if (sp > 18) { S.vx = S.vx/sp * 18; S.vy = S.vy/sp * 18; }
        S.x += S.vx; S.y += S.vy;
        // Bounds
        S.x = Math.max(2, Math.min(window.innerWidth - CFG.W - 2, S.x));
        S.y = Math.max(2, Math.min(window.innerHeight - CFG.H - 2, S.y));

        // Facing
        if (Math.abs(S.vx) > 0.6) {
          var f = S.vx > 0 ? 1 : -1;
          if (f !== S.facing) { S.facing = f; wrap.classList.toggle('flip', f === -1); }
        }

        // Arrived?
        if (S.walking && Math.hypot(S.tx - S.x, S.ty - S.y) < 4 && sp < 0.8) {
          S.walking = false;
          wrap.classList.remove('walking');
          if (S.onArrive) { var fn = S.onArrive; S.onArrive = null; fn(); }
        }
      }
      Phys.commit();
      Morph.tick();
      requestAnimationFrame(Phys.tick);
    },
    commit: function () {
      wrap.style.transform = 'translate(' + Math.round(S.x) + 'px,' + Math.round(S.y) + 'px)';
    },
    moveTo: function (x, y, onArrive) {
      S.tx = Math.max(8, Math.min(window.innerWidth - CFG.W - 8, x));
      S.ty = Math.max(8, Math.min(window.innerHeight - CFG.H - 8, y));
      S.walking = true;
      S.onArrive = onArrive || null;
      wrap.classList.add('walking');
      wrap.classList.remove('idle');
    },
    park: function () {
      // Return home (bottom-right)
      Phys.moveTo(window.innerWidth - CFG.W - 30, window.innerHeight - CFG.H - 30, function () {
        wrap.classList.add('idle');
        Morph.to('stand', 500);
      });
    }
  };

  /* ───────────── Morph (path interpolation) ───────────── */
  function pathNums(p) { return p.match(/-?[\d.]+/g).map(Number); }
  function pathTemplate(p) { return p.split(/-?[\d.]+/); }

  var Morph = {
    cur: null, // current pose name
    apply: function (path) {
      body.setAttribute('d', path);
      // Highlight follows the head region (always same for now)
      hl.setAttribute('d', HL);
    },
    to: function (poseName, dur) {
      if (!SHAPES[poseName]) return;
      var fromPath = body.getAttribute('d') || SHAPES.stand;
      var toPath = SHAPES[poseName];
      S.morphFrom = pathNums(fromPath);
      S.morphTo = pathNums(toPath);
      if (S.morphFrom.length !== S.morphTo.length) S.morphFrom = pathNums(SHAPES.stand);
      S.morphTemplate = pathTemplate(SHAPES.stand);
      S.faceFrom = FACE_POS[Morph.cur || 'stand'] || FACE_POS.stand;
      S.faceTo = FACE_POS[poseName] || FACE_POS.stand;
      S.morphDur = dur || 450;
      S.morphStart = performance.now();
      Morph.cur = poseName;
      S.pose = poseName;
      S.poseAt = Date.now();
    },
    tick: function () {
      if (!S.morphFrom || !S.morphTo) return;
      var t = (performance.now() - S.morphStart) / S.morphDur;
      if (t >= 1) { t = 1; }
      // ease-out cubic
      var e = 1 - Math.pow(1 - t, 3);
      var nums = new Array(S.morphFrom.length);
      for (var i = 0; i < nums.length; i++) {
        nums[i] = (S.morphFrom[i] + (S.morphTo[i] - S.morphFrom[i]) * e).toFixed(2);
      }
      var tpl = S.morphTemplate;
      var out = '';
      for (var j = 0; j < tpl.length; j++) {
        out += tpl[j];
        if (j < nums.length) out += nums[j];
      }
      body.setAttribute('d', out);
      // Animate face position
      if (S.faceFrom && S.faceTo && face) {
        var tx = S.faceFrom.tx + (S.faceTo.tx - S.faceFrom.tx) * e;
        var ty = S.faceFrom.ty + (S.faceTo.ty - S.faceFrom.ty) * e;
        var sc = S.faceFrom.s  + (S.faceTo.s  - S.faceFrom.s)  * e;
        face.setAttribute('transform', 'translate(' + tx.toFixed(2) + ',' + ty.toFixed(2) + ') translate(100,80) scale(' + sc.toFixed(3) + ') translate(-100,-80)');
      }
      if (t >= 1) { S.morphFrom = null; S.morphTo = null; }
    }
  };

  /* ───────────── Anim helpers ───────────── */
  var Anim = {
    cls: function (c, dur) {
      wrap.classList.add(c);
      setTimeout(function () { wrap.classList.remove(c); }, dur || 800);
    },
    face: function (state, dur) {
      var c = 's-' + state;
      wrap.classList.add(c);
      if (dur) setTimeout(function () { wrap.classList.remove(c); }, dur);
    },
    eyesFollow: function () {
      if (S.mx < 0) return;
      var cx = S.x + CFG.W/2, cy = S.y + CFG.H * 0.32;
      var dx = Math.max(-3, Math.min(3, (S.mx - cx) * 0.018));
      var dy = Math.max(-2, Math.min(2, (S.my - cy) * 0.018));
      var eyes = $('#h-eyes');
      if (eyes) eyes.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
    }
  };

  /* ───────────── Speech (says, never asks unnecessary questions) ───────────── */
  var Say = {
    say: function (text, opts) {
      opts = opts || {};
      var now = Date.now();
      if (!opts.force && now - S.lastSpeech < CFG.SPEECH_CD) return;
      S.lastSpeech = now;

      acts.classList.remove('show'); acts.innerHTML = '';
      msg.textContent = text;
      wrap.classList.add('talk');

      if (opts.actions && opts.actions.length) {
        opts.actions.forEach(function (a) {
          var b = document.createElement('button');
          b.textContent = a.label;
          if (a.alt) b.className = 'alt';
          b.onclick = function (e) { e.stopPropagation(); Mem.d.helps++; Mem.save(); a.fn(); Say.hide(); };
          acts.appendChild(b);
        });
        acts.classList.add('show');
      }

      var dur = opts.dur || (3000 + text.length * 50);
      if (!opts.sticky) {
        clearTimeout(S._hideTO);
        S._hideTO = setTimeout(Say.hide, dur);
      }
    },
    hide: function () { wrap.classList.remove('talk'); acts.classList.remove('show'); }
  };

  function toastMsg(t, dur) {
    toast.textContent = t;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('show'); }, dur || 2200);
  }

  /* ───────────── Page intelligence ───────────── */
  var Page = {
    d: {},
    analyze: function () {
      var d = this.d;
      d.title = document.title || '';
      d.url = location.href;
      d.path = location.pathname;
      d.isWoo = !!$('.woocommerce, .single-product, .cart, .checkout');
      d.isProduct = !!$('.single-product, .product .price');
      d.isCart = /cart/i.test(d.path) || !!$('.woocommerce-cart-form');
      d.isCheckout = /checkout/i.test(d.path);
      d.isArticle = !!$('article, .single, .post, .entry-content, [itemprop=articleBody]');
      d.isHome = (d.path === '/' || /^(\/index|\/home)/.test(d.path));
      d.is404 = /404/.test(d.title) || /not.?found/i.test(d.title) || !!$('.error404, body.error404');
      d.dark = (function(){
        try { var b=getComputedStyle(document.body).backgroundColor.match(/\d+/g)||[255,255,255];
          var l=(0.299*+b[0]+0.587*+b[1]+0.114*+b[2])/255; return l<0.5; } catch(e){ return false; }
      })();

      // Content extraction
      var pn = $$('article p, .entry-content p, main p, .post-content p, [itemprop=articleBody] p');
      if (!pn.length) pn = $$('p');
      var paras = [];
      for (var i = 0; i < pn.length && i < 80; i++) {
        var t = (pn[i].innerText || '').trim();
        if (t.length > 40) paras.push(t);
      }
      d.paragraphs = paras;
      d.text = paras.join(' ');
      d.words = d.text.split(/\s+/).filter(Boolean).length;
      d.readMin = Math.max(1, Math.round(d.words / 220));
      d.headings = $$('article h2, article h3, .entry-content h2, .entry-content h3, main h2, main h3')
        .filter(function(h){var t=(h.innerText||'').trim();return t.length>2&&t.length<140;})
        .map(function(h){return{t:h.innerText.trim(),el:h};});
      d.hasForm = !!$('form input:not([type=hidden])');
      d.errorFields = $$('input.error, input[aria-invalid=true], .has-error input, .woocommerce-error');
    },
    summarize: function (n) {
      n = n || 3;
      var text = this.d.text || '';
      if (!text) return '';
      var sents = text.replace(/\n+/g,' ').split(/(?<=[\.\?\!؟])\s+/).filter(function(s){return s.length>30&&s.length<340;});
      if (sents.length <= n) return sents.join(' ');
      var stop = ' و در از به که این آن یک با را برای های می شد است بود تا یا اما نیز هم گفت کرد شده ای را ما من شما او ها هم شد ست کرده بوده '.split(' ');
      var freq = {};
      sents.forEach(function(s){ s.toLowerCase().split(/\s+/).forEach(function(w){
        w = w.replace(/[^؀-ۿa-z0-9]/g,'');
        if (w && w.length > 2 && stop.indexOf(w) === -1) freq[w] = (freq[w]||0) + 1;
      }); });
      var scored = sents.map(function(s,i){
        var sc = 0; s.toLowerCase().split(/\s+/).forEach(function(w){
          w = w.replace(/[^؀-ۿa-z0-9]/g,''); if (freq[w]) sc += freq[w];
        });
        // Boost first sentence
        if (i === 0) sc *= 1.4;
        return { s:s, sc: sc / Math.sqrt(s.length+1), i:i };
      });
      scored.sort(function(a,b){ return b.sc - a.sc; });
      return scored.slice(0,n).sort(function(a,b){return a.i-b.i;}).map(function(x){return x.s;}).join(' ');
    }
  };

  /* ───────────── Anchor scanner (find interesting elements) ───────────── */
  var Anchor = {
    scan: function () {
      var sels = ['header', '.site-header', '#masthead', '.main-navigation', 'nav', '.menu-item',
        '.elementor-button', '.wp-block-button__link', 'a.button', 'button.btn',
        '.single_add_to_cart_button', '.add_to_cart_button', '.checkout-button',
        'h1', 'article h2', '.hero', '.banner', '.cta', '.site-logo', '.custom-logo'];
      var found = [];
      var seen = new Set();
      sels.forEach(function (sel) {
        $$(sel).forEach(function (el) {
          if (seen.has(el)) return;
          seen.add(el);
          var r = el.getBoundingClientRect();
          if (r.width < 30 || r.height < 18) return;
          if (r.top < -50 || r.top > window.innerHeight + 200) return;
          if (r.bottom < 0) return;
          var k = (sel.indexOf('header')>=0||sel.indexOf('logo')>=0||sel.indexOf('masthead')>=0)?'header'
                : (sel.indexOf('button')>=0||sel.indexOf('cta')>=0||sel.indexOf('cart')>=0)?'button'
                : (sel.indexOf('nav')>=0||sel.indexOf('menu')>=0)?'nav'
                : (sel.indexOf('h1')>=0||sel.indexOf('h2')>=0||sel.indexOf('hero')>=0||sel.indexOf('banner')>=0)?'heading'
                : 'other';
          found.push({ el:el, rect:r, kind:k });
        });
      });
      return found;
    },
    // Find a comfortable spot to sit/sleep on an element
    spotOn: function (item) {
      var r = item.rect;
      // Wide horizontal element (header/nav) → sit on top centered
      var wide = r.width > 220;
      var x = r.left + r.width/2 - CFG.W/2;
      var y;
      if (item.kind === 'header' || item.kind === 'nav' || wide) {
        // Drape on top of bar
        y = r.top - CFG.H + 32;     // body droops down over the bar
      } else if (item.kind === 'button') {
        // Sit on top of button
        y = r.top - CFG.H + 24;
      } else {
        y = r.top - CFG.H + 28;
      }
      // Keep on screen
      x = Math.max(8, Math.min(window.innerWidth - CFG.W - 8, x));
      y = Math.max(8, Math.min(window.innerHeight - CFG.H - 8, y));
      return { x:x, y:y };
    },
    poseFor: function (item) {
      if (item.kind === 'header' || item.kind === 'nav' || item.rect.width > 260) return 'stretch';
      if (item.kind === 'button') return 'sit';
      if (item.kind === 'heading') return 'peek';
      return 'sit';
    }
  };

  /* ───────────── Highlight a DOM element ───────────── */
  var Highlight = {
    cur: null,
    on: function (el) {
      this.off();
      if (!el) return;
      el.classList.add('harfo-highlight');
      this.cur = el;
    },
    off: function () { if (this.cur) { this.cur.classList.remove('harfo-highlight'); this.cur = null; } }
  };

  /* ───────────── Tour Engine (autonomous walkthrough) ───────────── */
  var Tour = {
    running: false,
    steps: [],
    i: 0,
    plan: function () {
      var steps = [];
      var logo = $('.site-logo, .custom-logo, header .logo, header img');
      if (logo) steps.push({ el: logo, msg: 'این لوگوی سایته. خانه ما اینجاست.', pose:'sit' });

      var nav = $('.main-navigation, nav.primary, #site-navigation, header nav');
      if (nav) steps.push({ el: nav, msg: 'این منوی اصلیه — همه بخش‌های مهم اینجاست.', pose:'stretch' });

      var h1 = $('h1');
      if (h1 && h1.offsetHeight > 0) steps.push({ el: h1, msg: 'این عنوان صفحه: ' + (h1.innerText||'').trim().slice(0,80), pose:'peek' });

      if (Page.d.isProduct) {
        var price = $('.price');
        if (price) steps.push({ el: price, msg: 'قیمت این محصول رو ببین.', pose:'sit' });
        var atc = $('.single_add_to_cart_button');
        if (atc) steps.push({ el: atc, msg: 'با این دکمه می‌تونی به سبد اضافه کنی.', pose:'sit' });
      } else if (Page.d.isArticle) {
        if (Page.d.readMin >= 1) steps.push({ el: $('article, .entry-content, main') || document.body, msg: 'این مقاله حدود ' + Page.d.readMin + ' دقیقه می‌خونیش.', pose:'peek' });
        if (Page.d.headings && Page.d.headings.length >= 2) steps.push({ el: Page.d.headings[0].el, msg: 'فهرست مطالب رو برات باز می‌کنم.', pose:'peek', after: Helpers.showTOC });
      } else if (Page.d.isHome) {
        var cta = $('.elementor-button, .wp-block-button__link, a.button');
        if (cta) steps.push({ el: cta, msg: 'این دکمه اقدام اصلیه.', pose:'sit' });
      }

      return steps.filter(function(s){ var r=s.el.getBoundingClientRect(); return r.width>20&&r.height>10; });
    },
    start: function () {
      if (this.running) return;
      this.steps = this.plan();
      if (!this.steps.length) { Tour.finish(); return; }
      this.i = 0;
      this.running = true;
      Mem.d.lastTour = Date.now(); Mem.save();
      Tour.step();
    },
    step: function () {
      if (!this.running || this.i >= this.steps.length) { Tour.finish(); return; }
      var s = this.steps[this.i++];
      var rect = s.el.getBoundingClientRect();
      // Scroll into view smoothly
      if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
        window.scrollTo({ top: window.scrollY + rect.top - 120, behavior: 'smooth' });
      }
      setTimeout(function () {
        rect = s.el.getBoundingClientRect();
        var spot = Anchor.spotOn({ el:s.el, rect:rect, kind:'other' });
        Highlight.on(s.el);
        Anim.face('read', 1500);
        Phys.moveTo(spot.x, spot.y, function () {
          Morph.to(s.pose || 'sit', 500);
          Say.say(s.msg, { force:true, dur: CFG.TOUR_STEP_MS - 300 });
          if (s.after) setTimeout(s.after, 1200);
          setTimeout(function () { Highlight.off(); Tour.step(); }, CFG.TOUR_STEP_MS);
        });
      }, 450);
    },
    finish: function () {
      this.running = false;
      Highlight.off();
      Morph.to('stand', 500);
      Phys.park();
      Say.say('من همین گوشه‌ام. هر وقت کمک خواستی روم کلیک کن.', { force:true });
    },
    stop: function () { this.running = false; Highlight.off(); }
  };

  /* ───────────── Helpers (silent actions, no questions) ───────────── */
  var Helpers = {
    tocEl: null,
    showTOC: function () {
      if (!Page.d.headings || Page.d.headings.length < 2) { toastMsg('این صفحه فهرست نداره'); return; }
      if (Helpers.tocEl) { Helpers.tocEl.classList.toggle('show'); return; }
      var box = document.createElement('div');
      box.className = 'h-toc';
      box.innerHTML = '<button class="close" aria-label="بستن">×</button><h4>فهرست مطالب</h4>';
      Page.d.headings.slice(0, 18).forEach(function (h, i) {
        var a = document.createElement('a');
        a.textContent = h.t;
        a.href = '#'; a.dataset.idx = i;
        a.onclick = function (e) { e.preventDefault(); h.el.scrollIntoView({ behavior:'smooth', block:'start' }); };
        box.appendChild(a);
      });
      box.querySelector('.close').onclick = function () { box.classList.remove('show'); };
      document.body.appendChild(box);
      Helpers.tocEl = box;
      setTimeout(function () { box.classList.add('show'); }, 50);
      // Track active heading on scroll
      var update = function () {
        var as = $$('a', box);
        var topAt = window.scrollY + 100;
        var bestI = 0;
        Page.d.headings.forEach(function (h, i) {
          if (h.el.offsetTop <= topAt) bestI = i;
        });
        as.forEach(function (a, i) { a.classList.toggle('active', i === bestI); });
      };
      window.addEventListener('scroll', update, { passive: true });
      update();
    },
    hideTOC: function () { if (Helpers.tocEl) Helpers.tocEl.classList.remove('show'); },

    progBadge: null,
    showProgress: function () {
      if (this.progBadge) return;
      var b = document.createElement('div');
      b.className = 'h-prog-badge';
      b.title = 'برو بالا';
      b.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
      document.body.appendChild(b);
      this.progBadge = b;
      var upd = function () {
        var max = Math.max(1, document.body.scrollHeight - window.innerHeight);
        var p = Math.min(100, Math.round((window.scrollY / max) * 100));
        b.style.setProperty('--p', p + '%');
        b.dataset.pct = p;
        b.classList.toggle('show', window.scrollY > 200);
      };
      window.addEventListener('scroll', upd, { passive:true });
      upd();
    },

    summary: function () {
      var s = Page.summarize(3);
      if (!s) { toastMsg('متن کافی پیدا نکردم'); return; }
      Anim.face('read', 3000);
      Say.say(s, { force:true, sticky:true, dur: 12000,
        actions: [{ label:'ممنون', fn: function () {} }] });
    },

    copySel: function () {
      var t = (window.getSelection() || '').toString();
      if (t) { try { navigator.clipboard.writeText(t); toastMsg('کپی شد ✓'); } catch(e){} }
    },

    toTop: function () { window.scrollTo({ top:0, behavior:'smooth' }); },

    // Search palette built from page links
    palette: null,
    openPalette: function () {
      if (this.palette) { this.palette.classList.add('show'); $('input', this.palette).focus(); return; }
      var items = $$('a').filter(function(a){ var t=(a.innerText||'').trim(); return t.length>2 && t.length<80 && a.href && !/^javascript:/.test(a.href); })
        .slice(0, 200)
        .map(function(a){ return { t:(a.innerText||'').trim(), href:a.href }; });
      // De-dup
      var seen={}; items = items.filter(function(i){ if (seen[i.t]) return false; seen[i.t]=1; return true; });

      var pal = document.createElement('div');
      pal.className = 'h-pal';
      pal.innerHTML = '<div class="h-pal-box"><input type="text" placeholder="بگرد در سایت..."/><div class="h-pal-list"></div></div>';
      document.body.appendChild(pal);
      this.palette = pal;
      var inp = $('input', pal);
      var list = $('.h-pal-list', pal);

      var render = function (q) {
        q = (q || '').trim().toLowerCase();
        var matches = !q ? items.slice(0,12) : items.filter(function(i){ return i.t.toLowerCase().indexOf(q) >= 0; }).slice(0, 20);
        list.innerHTML = '';
        if (!matches.length) { list.innerHTML = '<div class="nope">چیزی پیدا نشد</div>'; return; }
        matches.forEach(function (m, idx) {
          var a = document.createElement('a');
          a.href = m.href; a.textContent = m.t;
          if (idx === 0) a.className = 'sel';
          list.appendChild(a);
        });
      };
      render('');
      inp.addEventListener('input', function () { render(inp.value); });
      pal.addEventListener('click', function (e) { if (e.target === pal) pal.classList.remove('show'); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') pal.classList.remove('show');
        if (e.key === 'Enter') { var first = $('a', list); if (first) first.click(); }
      });
      pal.classList.add('show');
      setTimeout(function () { inp.focus(); }, 50);
    },

    fontUp: function () {
      var html = document.documentElement;
      var cur = parseFloat(html.style.fontSize || getComputedStyle(html).fontSize);
      html.style.fontSize = Math.min(22, cur + 1) + 'px';
      Mem.pref('font', html.style.fontSize);
      toastMsg('بزرگ‌تر شد');
    },
    fontDown: function () {
      var html = document.documentElement;
      var cur = parseFloat(html.style.fontSize || getComputedStyle(html).fontSize);
      html.style.fontSize = Math.max(12, cur - 1) + 'px';
      Mem.pref('font', html.style.fontSize);
      toastMsg('کوچک‌تر شد');
    },
    fontReset: function () { document.documentElement.style.fontSize = ''; Mem.pref('font', ''); toastMsg('بازنشانی شد'); },

    toggleDark: function () {
      var c = !document.documentElement.classList.contains('h-dark');
      document.documentElement.classList.toggle('h-dark', c);
      if (!$('#h-dark-style')) {
        var s = document.createElement('style'); s.id = 'h-dark-style';
        s.textContent = 'html.h-dark{filter:invert(.92) hue-rotate(180deg)} html.h-dark img,html.h-dark video,html.h-dark iframe,html.h-dark svg,html.h-dark .harfo-highlight{filter:invert(.92) hue-rotate(180deg)} html.h-dark #harfo-root{filter:none}';
        document.head.appendChild(s);
      }
      Mem.pref('dark', c);
      toastMsg(c ? 'حالت شب روشن شد' : 'حالت روز روشن شد');
    },

    pointToError: function () {
      var er = $('input.error, input[aria-invalid=true], .has-error input, .woocommerce-error li');
      if (!er) { toastMsg('خطایی پیدا نشد'); return; }
      var r = er.getBoundingClientRect();
      if (r.top < 60 || r.top > window.innerHeight - 100) window.scrollTo({ top: window.scrollY + r.top - 120, behavior:'smooth' });
      setTimeout(function () {
        r = er.getBoundingClientRect();
        Highlight.on(er);
        Phys.moveTo(r.left + r.width/2 - CFG.W/2, r.top - CFG.H + 30, function () {
          Morph.to('peek', 400);
          Say.say('خطا اینجاست — لطفاً اصلاح کن.', { force:true });
          setTimeout(function () { Highlight.off(); }, 4000);
        });
      }, 400);
    }
  };

  /* ───────────── Auto-help (silent, do-not-ask) ───────────── */
  var Auto = {
    init: function () {
      // 1. Long article → auto progress badge
      if (document.body.scrollHeight > window.innerHeight * 2) Helpers.showProgress();

      // 2. Article with multiple headings → silently offer TOC button on side after delay
      if (Page.d.isArticle && Page.d.headings && Page.d.headings.length >= 3) {
        setTimeout(function () {
          // small toast, not a question
          toastMsg('فهرست مطالب آماده‌ست — H + T');
        }, CFG.AUTO_TOC_AFTER);
      }

      // 3. 404 → suggest from nav
      if (Page.d.is404) {
        setTimeout(function () {
          var navLinks = $$('header a, nav a').slice(0,5).map(function(a){return{label:(a.innerText||'').trim().slice(0,16),fn:function(){location.href=a.href;}};});
          Say.say('این صفحه پیدا نشد. بریم جای دیگه؟', { force:true, sticky:true, actions: navLinks });
        }, 800);
      }

      // 4. Restore prefs
      var f = Mem.pref('font'); if (f) document.documentElement.style.fontSize = f;
      if (Mem.pref('dark')) Helpers.toggleDark();

      // 5. Form errors observer
      var mo = new MutationObserver(function () {
        if (Page.d.hasForm && $('input.error, input[aria-invalid=true], .woocommerce-error')) {
          Helpers.pointToError();
        }
      });
      mo.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','aria-invalid'] });
    }
  };

  /* ───────────── Reading-time announce on long articles (once per article) ───────────── */
  var Reading = {
    init: function () {
      if (!Page.d.isArticle || Page.d.readMin < 2) return;
      setTimeout(function () {
        toastMsg('زمان مطالعه: ' + Page.d.readMin + ' دقیقه');
      }, 1500);
    }
  };

  /* ───────────── Text selection helper (silent — appears, no question) ─────── */
  var Selection = {
    pop: null,
    init: function () {
      document.addEventListener('mouseup', function () { setTimeout(Selection.check, 30); });
      document.addEventListener('mousedown', function (e) {
        if (Selection.pop && !Selection.pop.contains(e.target)) Selection.hide();
      });
    },
    check: function () {
      var sel = window.getSelection();
      var text = sel ? sel.toString().trim() : '';
      if (!text || text.length < 4 || text.length > 800) { Selection.hide(); return; }
      var r = sel.getRangeAt(0).getBoundingClientRect();
      if (r.width < 1 && r.height < 1) return;
      Selection.show(text, r);
    },
    show: function (text, r) {
      Selection.hide();
      var p = document.createElement('div');
      p.className = 'h-sel-pop';
      p.style.top = (window.scrollY + r.top - 42) + 'px';
      p.style.left = (window.scrollX + r.left) + 'px';
      function add(label, fn) {
        var b = document.createElement('button');
        b.textContent = label;
        b.onclick = function (e) { e.preventDefault(); fn(); Selection.hide(); };
        p.appendChild(b);
      }
      add('کپی', function () { try { navigator.clipboard.writeText(text); toastMsg('کپی شد ✓'); } catch(e){} });
      add('برجسته', function () { try { var sp=document.createElement('span'); sp.style.cssText='background:rgba(91,232,218,.35);padding:0 2px;border-radius:3px'; var rng=window.getSelection().getRangeAt(0); rng.surroundContents(sp); } catch(e){} });
      add('بخوان', function () {
        // SpeechSynthesis is native browser API — not external
        try { var u = new SpeechSynthesisUtterance(text); u.lang = document.documentElement.lang || 'fa-IR'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){}
      });
      if (text.length > 80) add('خلاصه', function () {
        var sents = text.split(/(?<=[\.\?\!؟])\s+/);
        Say.say(sents.slice(0, 2).join(' '), { force:true, sticky:true, actions:[{label:'باشه',fn:function(){}}] });
      });
      document.body.appendChild(p);
      Selection.pop = p;
    },
    hide: function () { if (Selection.pop) { Selection.pop.remove(); Selection.pop = null; } }
  };

  /* ───────────── Idle / Nap ───────────── */
  var Idle = {
    start: function () {
      ['mousemove','scroll','keydown','click','touchstart'].forEach(function(e){
        window.addEventListener(e, function(){
          S.idleSince = Date.now();
          if (S.napping) { S.napping = false; wrap.classList.remove('s-sleep'); Morph.to('stand', 350); Anim.face('wow', 600); Phys.park(); }
        }, { passive:true });
      });
      setInterval(Idle.tick, 1800);
    },
    tick: function () {
      if (Tour.running || S.dragging) return;
      var idle = Date.now() - S.idleSince;
      // Random small idle action every IDLE_LOOK
      if (!S.napping && idle > CFG.IDLE_LOOK && Math.random() < 0.5 && !wrap.classList.contains('talk')) {
        Idle.doSmallThing();
        S.idleSince = Date.now() - Math.floor(CFG.IDLE_LOOK * 0.6);
      }
      // Nap on a random nearby element
      if (!S.napping && idle > CFG.IDLE_NAP) {
        Idle.napOnElement();
      }
    },
    doSmallThing: function () {
      var actions = ['wiggle','bounce','spin','wink','blink','peek'];
      var a = actions[Math.floor(Math.random() * actions.length)];
      if (a === 'wink') Anim.face('wink', 900);
      else if (a === 'blink') Anim.face('blink', 200);
      else if (a === 'peek') { Morph.to('peek', 400); setTimeout(function(){ Morph.to('stand', 400); }, 1400); }
      else Anim.cls(a, a === 'spin' ? 1000 : 800);
    },
    napOnElement: function () {
      var anchors = Anchor.scan();
      if (!anchors.length) { Idle.justNap(); return; }
      // Prefer headers and buttons
      anchors.sort(function (a, b) {
        var w = { header:3, nav:2, button:2, heading:1, other:0 };
        return (w[b.kind]||0) - (w[a.kind]||0);
      });
      var pick = anchors[Math.floor(Math.random() * Math.min(3, anchors.length))];
      var spot = Anchor.spotOn(pick);
      var pose = Anchor.poseFor(pick);
      S.napping = true;
      wrap.classList.remove('idle');
      Phys.moveTo(spot.x, spot.y, function () {
        Morph.to(pose, 500);
        setTimeout(function () {
          Morph.to('puddle', 700);
          wrap.classList.add('s-sleep');
        }, 800);
      });
    },
    justNap: function () {
      S.napping = true;
      Morph.to('puddle', 700);
      wrap.classList.add('s-sleep');
    }
  };

  /* ───────────── Context help on click ───────────── */
  function contextHelp() {
    var a = [];
    if (Page.d.isArticle) {
      a.push({ label:'خلاصه', fn: Helpers.summary });
      if (Page.d.headings && Page.d.headings.length >= 2) a.push({ label:'فهرست', fn: Helpers.showTOC });
    }
    if (window.scrollY > 400) a.push({ label:'برو بالا', fn: Helpers.toTop });
    a.push({ label:'گردش سایت', fn: function () { Tour.start(); } });
    a.push({ label:'جستجو', fn: Helpers.openPalette });
    a.push({ label:'+ A', fn: Helpers.fontUp });
    a.push({ label:'− A', alt:true, fn: Helpers.fontDown });
    a.push({ label:'شب/روز', alt:true, fn: Helpers.toggleDark });
    Say.say('چیکار کنم؟', { force:true, sticky:true, actions:a });
  }

  /* ───────────── Bindings ───────────── */
  var Bind = {
    init: function () {
      window.addEventListener('mousemove', function (e) { S.mx = e.clientX; S.my = e.clientY; }, { passive:true });
      window.addEventListener('mouseleave', function () { S.mx = -9999; S.my = -9999; });
      window.addEventListener('resize', function () {
        if (S.x > window.innerWidth - CFG.W) S.x = window.innerWidth - CFG.W - 20;
        if (S.y > window.innerHeight - CFG.H) S.y = window.innerHeight - CFG.H - 20;
        S.tx = S.x; S.ty = S.y;
      });

      // Eye follow loop
      setInterval(Anim.eyesFollow, 70);

      // Blink loop
      (function blink () {
        if (!wrap.classList.contains('s-sleep')) Anim.face('blink', 130);
        setTimeout(blink, CFG.BLINK_MIN + Math.random() * (CFG.BLINK_MAX - CFG.BLINK_MIN));
      })();

      // Click on mascot → context help
      wrap.addEventListener('click', function (e) {
        if (e.target === closeBtn || S._didDrag) { S._didDrag = false; return; }
        Anim.cls('bounce', 700);
        contextHelp();
      });

      // Drag
      var dragInfo = null;
      wrap.addEventListener('mousedown', function (e) {
        if (e.target === closeBtn) return;
        dragInfo = { sx:e.clientX, sy:e.clientY, ox:S.x, oy:S.y, moved:false };
        S.dragging = true;
        if (S.napping) { S.napping = false; wrap.classList.remove('s-sleep'); Morph.to('stand', 300); }
        e.preventDefault();
      });
      window.addEventListener('mousemove', function (e) {
        if (!dragInfo) return;
        var dx = e.clientX - dragInfo.sx, dy = e.clientY - dragInfo.sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) dragInfo.moved = true;
        S.x = dragInfo.ox + dx; S.y = dragInfo.oy + dy;
        S.tx = S.x; S.ty = S.y;
      });
      window.addEventListener('mouseup', function () {
        if (dragInfo) {
          S.dragging = false;
          if (dragInfo.moved) { Anim.cls('squish', 500); S._didDrag = true; setTimeout(function(){ S._didDrag = false; }, 100); }
          dragInfo = null;
        }
      });

      // Close & restore
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        wrap.style.display = 'none';
        restore.classList.add('show');
        Mem.d.dismiss++; Mem.save();
      });
      restore.addEventListener('click', function () {
        wrap.style.display = '';
        restore.classList.remove('show');
        Anim.cls('bounce', 800); Anim.face('happy', 1200);
      });

      // Keyboard shortcuts: Ctrl/Cmd+K = palette, H+T = TOC, H+S = summary, H+G = tour
      var pressed = {};
      window.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); Helpers.openPalette(); return; }
        pressed[e.key.toLowerCase()] = true;
        if (pressed['h'] && pressed['t']) { Helpers.showTOC(); pressed={}; }
        if (pressed['h'] && pressed['s']) { Helpers.summary(); pressed={}; }
        if (pressed['h'] && pressed['g']) { Tour.start(); pressed={}; }
        if (e.key === 'Escape') { Tour.stop(); Say.hide(); }
      });
      window.addEventListener('keyup', function (e) { pressed[e.key.toLowerCase()] = false; });

      // Selection helper
      Selection.init();

      // React subtly to clicks
      window.addEventListener('click', function () { if (!S.walking && !S.napping) Anim.cls('bounce', 400); }, { passive:true });
    }
  };

  /* ───────────── Greet (no question, just opens) ───────────── */
  function greet() {
    setTimeout(function () { wrap.classList.add('ready'); Morph.to('stand', 0); wrap.classList.add('idle'); Phys.init(); }, 100);

    setTimeout(function () {
      if (Page.d.is404) return; // handled by Auto

      if (Mem.d.visits === 1) {
        Say.say('سلام! من حرفو هستم. می‌خوای سایت رو نشونت بدم؟', { force:true, sticky:true,
          actions: [
            { label:'آره', fn: function () { Tour.start(); } },
            { label:'فعلاً نه', alt:true, fn: function () { Anim.face('wink', 1000); } }
          ]});
        return;
      }

      if (Page.d.isProduct) Say.say('سلام! اگر چیزی خواستی، روم کلیک کن.', { force:true });
      else if (Page.d.isCart) Say.say('سبدت آماده‌ست.', { force:true });
      else if (Page.d.isCheckout) Say.say('پرداختت رو با دقت تموم کن.', { force:true });
      else if (Page.d.isArticle && Page.d.readMin >= 3) {
        Say.say('این مقاله ' + Page.d.readMin + ' دقیقه‌ست. فهرست رو برات باز کنم؟', { force:true, sticky:true,
          actions: [
            { label:'باز کن', fn: Helpers.showTOC },
            { label:'بعداً', alt:true, fn: function () {} }
          ]});
      } else {
        Anim.face('wink', 1000);
      }
    }, 1400);
  }

  /* ───────────── Public API ───────────── */
  window.HarfoAI = {
    say: function (t) { Say.say(t, { force:true }); },
    summary: Helpers.summary,
    toc: Helpers.showTOC,
    tour: function () { Tour.start(); },
    search: Helpers.openPalette,
    dark: Helpers.toggleDark,
    fontUp: Helpers.fontUp, fontDown: Helpers.fontDown,
    pose: function (name) { Morph.to(name, 500); },
    walkTo: function (x, y) { Phys.moveTo(x, y); },
    page: function () { return Page.d; },
    mem: function () { return Mem.d; }
  };

  /* ───────────── Boot ───────────── */
  function init() {
    root = $('#harfo-root'); wrap = $('#harfo-w'); jelly = $('#h-jelly');
    body = $('#h-body'); hl = $('#h-hl'); face = $('#h-face');
    hud = $('#h-hud'); msg = $('#h-msg'); acts = $('#h-acts');
    restore = $('#h-restore'); closeBtn = $('#h-close'); toast = $('#h-toast');
    if (!wrap) return;

    Mem.load();
    Page.analyze();
    Auto.init();
    Reading.init();
    Bind.init();

    Morph.apply(SHAPES.stand);
    requestAnimationFrame(Phys.tick);
    Idle.start();
    greet();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
