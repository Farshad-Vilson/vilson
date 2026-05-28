/* ════════════════════════════════════════════════════════
   Vilson Economy v1.0
   Brand Tokens + Temporal Site Evolution
   ════════════════════════════════════════════════════════

   Token types:
     attn   — attention   (time on page, scroll depth)
     know   — knowledge   (pages read, content consumed)
     loyal  — loyalty     (daily returns, streaks)

   Levels (by total tokens):
     0  غریبه    Stranger   —   0 XP
     1  آشنا     Familiar   —  40 XP  (+warm glow)
     2  دوست     Friend     — 150 XP  (unlock exclusive content)
     3  همراه    Companion  — 400 XP  (+premium edge)
     4  روح برند Soul       — 900 XP  (certificate + dark mode)
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var cfg = (typeof VEC !== 'undefined') ? VEC : {};
  var SITE_KEY    = cfg.siteKey || 'vec-default';
  var STORE_KEY   = 'vec_v1';

  /* ── Level definitions ── */
  var LEVELS = [
    { id:0, name:'غریبه',    min:0,   mark:'○', next:'اولین نشانه همراهی' },
    { id:1, name:'آشنا',     min:40,  mark:'◆', next:'محتوای اختصاصی باز می‌شود' },
    { id:2, name:'دوست',     min:150, mark:'◈', next:'درخشش ویژه صفحه' },
    { id:3, name:'همراه',    min:400, mark:'✦', next:'نشان وفاداری' },
    { id:4, name:'روح برند', min:900, mark:'★', next:'به پایان رسیدی' },
  ];

  /* ── Token earning rules ── */
  var EARN = {
    pageLoad:     2,    /* attn — every page */
    sec30:        5,    /* attn — 30s on page */
    sec60:        8,    /* attn — 60s */
    sec180:       12,   /* attn — 3 min */
    scroll50:     4,    /* know — scrolled to 50% */
    scroll100:    8,    /* know — read full page */
    pageTwo:      10,   /* know — visited 2+ pages this session */
    pageFive:     20,   /* know — 5+ pages */
    dailyReturn:  25,   /* loyal — came back next day */
    streak3:      40,   /* loyal — 3-day streak */
    streak7:      80,   /* loyal — 7-day streak */
    contentPage:  6,    /* know — single post / article */
  };

  /* ─────────────────────────────────────────────────────
     STORAGE  — localStorage with djb2 integrity hash
     ───────────────────────────────────────────────────── */
  function djb2(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++)
      h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function sign(d) {
    var copy = JSON.parse(JSON.stringify(d));
    copy._h = null;
    return djb2(JSON.stringify(copy) + SITE_KEY);
  }

  var Store = {
    _d: null,

    def: function () {
      return {
        attn:0, know:0, loyal:0, total:0,
        visits:0, days:[], streak:0,
        sessionPages:0, _h:null,
      };
    },

    load: function () {
      try {
        var raw = localStorage.getItem(STORE_KEY);
        if (!raw) { this._d = this.def(); return; }
        var d = JSON.parse(raw);
        var h = d._h; d._h = null;
        if (sign(d) !== h) { this._d = this.def(); return; }
        d._h = h;
        this._d = d;
      } catch(e) { this._d = this.def(); }
    },

    save: function () {
      this._d._h = sign(this._d);
      try { localStorage.setItem(STORE_KEY, JSON.stringify(this._d)); } catch(e) {}
    },

    get: function (k) { return this._d[k]; },
    set: function (k, v) { this._d[k] = v; this.save(); },

    earn: function (type, amt) {
      this._d[type]  = (this._d[type]  || 0) + amt;
      this._d.total  = (this._d.total  || 0) + amt;
      this.save();
      afterEarn(type, amt);
    },
  };

  /* ─────────────────────────────────────────────────────
     LEVEL
     ───────────────────────────────────────────────────── */
  function currentLevel() {
    var t = Store.get('total') || 0;
    var lv = LEVELS[0];
    for (var i = 0; i < LEVELS.length; i++) {
      if (t >= LEVELS[i].min) lv = LEVELS[i];
    }
    return lv;
  }

  function levelIndex() { return currentLevel().id; }

  function levelProgress() {
    var lv = currentLevel();
    var t  = Store.get('total') || 0;
    if (lv.id >= LEVELS.length - 1) return 1;
    var next = LEVELS[lv.id + 1];
    return Math.min(1, (t - lv.min) / (next.min - lv.min));
  }

  /* ─────────────────────────────────────────────────────
     DASHBOARD
     ───────────────────────────────────────────────────── */
  var pill, card, open = false;

  function toFa(n) {
    return String(Math.floor(n)).replace(/\d/g, function(d) {
      return '۰۱۲۳۴۵۶۷۸۹'[+d];
    });
  }

  function dashUpdate() {
    if (!pill) return;
    var lv  = currentLevel();
    var t   = Store.get('total') || 0;
    var pct = Math.round(levelProgress() * 100);
    var next = lv.id < LEVELS.length - 1 ? LEVELS[lv.id + 1] : null;

    /* Pill */
    document.getElementById('vec-pill-mark').textContent  = lv.mark;
    document.getElementById('vec-pill-label').textContent = lv.name;
    pill.classList.add('vec-visible');

    /* Card */
    document.getElementById('vec-badge-mark').textContent = lv.mark;
    document.getElementById('vec-badge-name').textContent = lv.name;

    var fill = document.getElementById('vec-progress-fill');
    if (fill) fill.style.width = pct + '%';
    var plbl = document.getElementById('vec-progress-label');
    if (plbl) plbl.textContent = toFa(t) + ' / ' + toFa(next ? next.min : t) + ' XP';

    setText('vec-t-attn',  '.vec-token-val', toFa(Store.get('attn')  || 0));
    setText('vec-t-know',  '.vec-token-val', toFa(Store.get('know')  || 0));
    setText('vec-t-loyal', '.vec-token-val', toFa(Store.get('loyal') || 0));

    var nl = document.getElementById('vec-next-unlock');
    if (nl) nl.textContent = next ? ('قدم بعدی: ' + lv.next) : 'به عالی‌ترین سطح رسیدی ★';

    var cert = document.getElementById('vec-cert-wrap');
    if (cert) cert.style.display = lv.id >= 4 ? 'block' : 'none';
  }

  function setText(parentId, selector, text) {
    var el = document.getElementById(parentId);
    if (!el) return;
    var t = el.querySelector(selector);
    if (t) t.textContent = text;
  }

  function popToken(type) {
    var map = { attn:'vec-t-attn', know:'vec-t-know', loyal:'vec-t-loyal' };
    var el = document.getElementById(map[type]);
    if (!el) return;
    el.classList.remove('vec-pop');
    void el.offsetWidth;
    el.classList.add('vec-pop');
  }

  function initDash() {
    pill = document.getElementById('vec-pill');
    card = document.getElementById('vec-card');
    if (!pill || !card) return;

    pill.addEventListener('click', function () {
      open = !open;
      card.classList.toggle('vec-open', open);
    });

    var closeBtn = document.getElementById('vec-card-close');
    if (closeBtn) closeBtn.addEventListener('click', function() {
      open = false;
      card.classList.remove('vec-open');
    });

    /* Certificate */
    var certBtn = document.getElementById('vec-cert-btn');
    if (certBtn) certBtn.addEventListener('click', generateCert);

    dashUpdate();
  }

  /* ─────────────────────────────────────────────────────
     TOAST
     ───────────────────────────────────────────────────── */
  var toastTimeout;
  function toast(msg) {
    var el = document.getElementById('vec-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('vec-toast-show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      el.classList.remove('vec-toast-show');
    }, 3800);
  }

  /* ─────────────────────────────────────────────────────
     EVOLUTION — apply temporal visual changes per level
     ───────────────────────────────────────────────────── */
  var prevLevelId = -1;

  function evolve() {
    var lv = levelIndex();

    /* Remove all level classes then re-add up to current */
    var body = document.body;
    for (var i = 0; i < LEVELS.length; i++) {
      body.classList.remove('vec-l' + i);
    }
    for (var i = 1; i <= lv; i++) {
      body.classList.add('vec-l' + i);
    }

    /* Level-up notification */
    if (lv > prevLevelId && prevLevelId >= 0) {
      var lvDef = LEVELS[lv];
      toast(lvDef.mark + ' سطح جدید: ' + lvDef.name);
      confettiBurst();
    }
    prevLevelId = lv;

    /* Dark mode toggle (level 5) */
    ensureDarkToggle();

    /* Unlock exclusive content */
    unlockContent(lv);
  }

  function ensureDarkToggle() {
    if (levelIndex() < 4) return;
    var el = document.getElementById('vec-dark-toggle');
    if (!el) {
      el = document.createElement('button');
      el.id = 'vec-dark-toggle';
      el.setAttribute('aria-label', 'تغییر حالت روشنایی');
      el.textContent = '◑';
      el.addEventListener('click', function () {
        document.body.classList.toggle('vec-dark');
        el.textContent = document.body.classList.contains('vec-dark') ? '◐' : '◑';
      });
      document.body.appendChild(el);
    }
  }

  function unlockContent(lv) {
    document.querySelectorAll('.vfx-exclusive').forEach(function (el) {
      var req = parseInt(el.dataset.level || 2, 10);
      if (lv + 1 >= req) el.classList.add('vfx-unlocked');
    });
  }

  /* ─────────────────────────────────────────────────────
     WELCOME BACK — temporal greeting
     ───────────────────────────────────────────────────── */
  function greet() {
    var lv  = levelIndex();
    var vis = Store.get('visits') || 0;
    if (vis <= 1 || lv === 0) return;
    var msgs = [
      'خوش آمدی دوباره ◆',
      'دوباره اینجایی — خوشحالیم ◈',
      'همراه قدیمی، سلام ✦',
    ];
    var msg = lv >= 4
      ? 'روح برند — جایت اینجاست ★'
      : msgs[Math.min(lv - 1, msgs.length - 1)];

    setTimeout(function () { toast(msg); }, 1800);
  }

  /* ─────────────────────────────────────────────────────
     CERTIFICATE (level 5)
     ───────────────────────────────────────────────────── */
  function generateCert() {
    var d   = new Date();
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="280" viewBox="0 0 480 280">',
      '<defs>',
      '<linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0%" stop-color="#0D0A28"/>',
      '<stop offset="100%" stop-color="#1E1B4B"/>',
      '</linearGradient>',
      '</defs>',
      '<rect width="480" height="280" rx="18" fill="url(#g1)"/>',
      '<rect x="10" y="10" width="460" height="260" rx="12" fill="none" stroke="rgba(124,58,237,.5)" stroke-width="1"/>',
      '<text x="240" y="58" text-anchor="middle" font-size="28" fill="#A78BFA" font-family="serif">★</text>',
      '<text x="240" y="95" text-anchor="middle" font-size="15" fill="#E9D5FF" font-family="sans-serif">نشان وفاداری</text>',
      '<text x="240" y="128" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.5)" font-family="sans-serif">',
      window.location.hostname,
      '</text>',
      '<text x="240" y="168" text-anchor="middle" font-size="22" fill="#fff" font-family="sans-serif">روح برند</text>',
      '<text x="240" y="200" text-anchor="middle" font-size="10" fill="rgba(255,255,255,.35)" font-family="monospace">',
      d.toLocaleDateString('fa-IR'),
      '</text>',
      '<text x="240" y="248" text-anchor="middle" font-size="9" fill="rgba(124,58,237,.6)" font-family="monospace">',
      'TOKEN: ' + djb2((Store.get('total') || 0) + SITE_KEY).toUpperCase(),
      '</text>',
      '</svg>',
    ].join('');

    var blob = new Blob([svg], { type: 'image/svg+xml' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'brand-soul-certificate.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('نشان وفاداری دانلود شد ★');
  }

  /* ─────────────────────────────────────────────────────
     CONFETTI — level-up burst (CSS-only, no canvas)
     ───────────────────────────────────────────────────── */
  function confettiBurst() {
    var colors = ['#7C3AED','#A78BFA','#2563EB','#60A5FA','#F472B6','#FBBF24'];
    for (var i = 0; i < 22; i++) {
      (function () {
        var el = document.createElement('div');
        var c  = colors[Math.floor(Math.random() * colors.length)];
        var x  = 30 + Math.random() * (window.innerWidth - 60);
        el.style.cssText = [
          'position:fixed',
          'left:' + x + 'px',
          'top:' + (window.innerHeight * 0.45) + 'px',
          'width:' + (4 + Math.random() * 5) + 'px',
          'height:' + (4 + Math.random() * 5) + 'px',
          'background:' + c,
          'border-radius:50%',
          'pointer-events:none',
          'z-index:2147483645',
          'transition:transform 1.4s cubic-bezier(.1,.8,.2,1),opacity 1.4s ease',
          'transform:translate(0,0)',
          'opacity:1',
        ].join(';');
        document.body.appendChild(el);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var vx = (Math.random() - 0.5) * 300;
            var vy = -(80 + Math.random() * 220);
            el.style.transform  = 'translate(' + vx + 'px,' + vy + 'px)';
            el.style.opacity    = '0';
          });
        });
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 1600);
      })();
    }
  }

  /* ─────────────────────────────────────────────────────
     AFTER EARN — update UI without rebuild
     ───────────────────────────────────────────────────── */
  function afterEarn(type, amt) {
    evolve();
    dashUpdate();
    if (open) popToken(type);
  }

  /* ─────────────────────────────────────────────────────
     TRACKING — page events → tokens
     ───────────────────────────────────────────────────── */
  function initTracking() {
    /* ── Page load ── */
    var sess = sessionStorage.getItem('vec_sess');
    if (!sess) {
      sessionStorage.setItem('vec_sess', '1');
      Store.set('sessionPages', 0);
    }
    var sp = (Store.get('sessionPages') || 0) + 1;
    Store.set('sessionPages', sp);

    Store.earn('attn', EARN.pageLoad);
    if (sp === 2) Store.earn('know', EARN.pageTwo);
    if (sp === 5) Store.earn('know', EARN.pageFive);
    if (cfg.pageType === 'content') Store.earn('know', EARN.contentPage);

    /* ── Visit counter & streak ── */
    var today = new Date().toISOString().slice(0, 10);
    var days  = Store.get('days') || [];
    if (!days.length || days[days.length - 1] !== today) {
      days.push(today);
      if (days.length > 30) days = days.slice(-30);
      Store.set('days', days);
      Store.set('visits', (Store.get('visits') || 0) + 1);

      if (days.length >= 2) {
        Store.earn('loyal', EARN.dailyReturn);
      }

      var streak = 1;
      for (var i = days.length - 2; i >= 0; i--) {
        var a = new Date(days[i+1]), b = new Date(days[i]);
        if ((a - b) / 86400000 === 1) streak++;
        else break;
      }
      Store.set('streak', streak);
      if (streak >= 7) Store.earn('loyal', EARN.streak7);
      else if (streak >= 3) Store.earn('loyal', EARN.streak3);
    }

    /* ── Time on page ── */
    var sec30done = false, sec60done = false, sec180done = false;
    var pageStart = Date.now();

    var timeInterval = setInterval(function () {
      var elapsed = (Date.now() - pageStart) / 1000;
      if (!sec30done  && elapsed >= 30)  { sec30done  = true; Store.earn('attn', EARN.sec30); }
      if (!sec60done  && elapsed >= 60)  { sec60done  = true; Store.earn('attn', EARN.sec60); }
      if (!sec180done && elapsed >= 180) { sec180done = true; Store.earn('attn', EARN.sec180); clearInterval(timeInterval); }
    }, 5000);

    /* ── Scroll depth ── */
    var sc50done = false, sc100done = false;
    window.addEventListener('scroll', function () {
      if (sc50done && sc100done) return;
      var el  = document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      var pct = (window.scrollY || 0) / max;
      if (!sc50done  && pct >= 0.50) { sc50done  = true; Store.earn('know', EARN.scroll50); }
      if (!sc100done && pct >= 0.95) { sc100done = true; Store.earn('know', EARN.scroll100); }
    }, { passive: true });

    /* ── Beforeunload: save session page count ── */
    window.addEventListener('beforeunload', function () {
      Store.save();
    });
  }

  /* ─────────────────────────────────────────────────────
     BOOT
     ───────────────────────────────────────────────────── */
  function boot() {
    Store.load();
    initTracking();

    var dashEl = document.getElementById('vec-dash');
    if (!dashEl) return;

    initDash();
    evolve();
    greet();

    /* Show pill after a brief delay (not intrusive) */
    setTimeout(function () {
      var p = document.getElementById('vec-pill');
      if (p) p.classList.add('vec-visible');
    }, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* simple djb2 export for cert */
  function djb2(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++)
      h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

})();
