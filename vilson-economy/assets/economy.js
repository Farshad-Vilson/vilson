/* ════════════════════════════════════════════════════════
   Vilson Economy v2.0
   Brand Tokens + Temporal Site Evolution

   Token types:
     attn   — attention   (time on page, scroll depth)
     know   — knowledge   (pages read, content consumed)
     loyal  — loyalty     (daily returns, streaks)

   Levels (by total XP):
     0  غریبه    Stranger   —    0 XP
     1  آشنا     Familiar   —   80 XP  (+warm glow)
     2  دوست     Friend     —  350 XP  (unlock exclusive content)
     3  همراه    Companion  —  900 XP  (+premium edge)
     4  روح برند Soul       — 2500 XP  (certificate + dark mode)

   Streak multiplier: +8% per consecutive day, max ×1.8
   Anti-idle: time paused when browser tab is hidden
   Daily quest: deterministic per-day mission
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var cfg      = (typeof VEC !== 'undefined') ? VEC : {};
  var SITE_KEY = cfg.siteKey || 'vec-default';
  var STORE_KEY = 'vec_v2';

  /* ── Level definitions ── */
  var LEVELS = [
    { id:0, name:'غریبه',    min:0,    mark:'○', color:'#6B7280', next:'اولین نشانه همراهی' },
    { id:1, name:'آشنا',     min:80,   mark:'◆', color:'#8B5CF6', next:'محتوای اختصاصی باز می‌شود' },
    { id:2, name:'دوست',     min:350,  mark:'◈', color:'#7C3AED', next:'درخشش ویژه صفحه' },
    { id:3, name:'همراه',    min:900,  mark:'✦', color:'#2563EB', next:'نشان وفاداری' },
    { id:4, name:'روح برند', min:2500, mark:'★', color:'#F59E0B', next:'به پایان رسیدی' },
  ];

  /* ── Base earn rates (before streak multiplier) ── */
  var EARN = {
    pageLoad:    1,
    sec30:       3,
    sec60:       5,
    sec180:      7,
    scroll50:    2,
    scroll100:   5,
    pageTwo:     6,
    pageFive:    12,
    dailyReturn: 15,
    streak3:     25,
    streak7:     50,
    contentPage: 4,
    questBonus:  20,
  };

  var MILESTONES = [100, 500, 1000, 2000];

  /* ── Daily quest pool ── */
  var QUEST_POOL = [
    { id:'scroll',  label:'صفحه را تا انتها بخوان',  trigger:'scroll100' },
    { id:'time',    label:'۳ دقیقه روی صفحه بمان',   trigger:'sec180'    },
    { id:'pages',   label:'۳ صفحه مختلف باز کن',     trigger:'pages3'    },
    { id:'content', label:'یک مطلب کامل بخوان',      trigger:'contentPage' },
    { id:'return',  label:'فردا دوباره برگرد',        trigger:'tomorrow'  },
  ];

  /* ─────────────────────────────────────────────────────
     djb2 — hash for integrity + determinism
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

  /* ─────────────────────────────────────────────────────
     STORAGE — localStorage with djb2 integrity
     ───────────────────────────────────────────────────── */
  var Store = {
    _d: null,

    def: function () {
      return {
        attn:0, know:0, loyal:0, total:0,
        visits:0, days:[], streak:0,
        sessionPages:0,
        milestones:[],
        questDate:'', questDone:false,
        _h:null,
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

    earn: function (type, baseAmt) {
      var mult      = streakMultiplier();
      var amt       = Math.round(baseAmt * mult);
      var prevTotal = this._d.total || 0;
      this._d[type] = (this._d[type] || 0) + amt;
      this._d.total = prevTotal + amt;
      this.save();
      checkMilestones(prevTotal, this._d.total);
      afterEarn(type, amt);
    },
  };

  /* ── Streak multiplier: +8% per day, max ×1.8 ── */
  function streakMultiplier() {
    var streak = Store.get('streak') || 1;
    return Math.min(1.8, 1.0 + (streak - 1) * 0.08);
  }

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
    var lv   = currentLevel();
    var t    = Store.get('total') || 0;
    if (lv.id >= LEVELS.length - 1) return 1;
    var next = LEVELS[lv.id + 1];
    return Math.min(1, (t - lv.min) / (next.min - lv.min));
  }

  /* ─────────────────────────────────────────────────────
     DAILY QUEST
     ───────────────────────────────────────────────────── */
  var today = new Date().toISOString().slice(0, 10);

  function getDayQuest() {
    var h = parseInt(djb2(today + SITE_KEY), 36);
    return QUEST_POOL[Math.abs(h) % QUEST_POOL.length];
  }

  function isQuestDone() {
    return Store.get('questDate') === today && Store.get('questDone') === true;
  }

  function completeQuest() {
    if (isQuestDone()) return;
    Store.set('questDate', today);
    Store.set('questDone', true);
    Store.earn('loyal', EARN.questBonus);
    toast('ماموریت روز انجام شد ✦ ۲۰ XP جایزه گرفتی');
    updateQuestUI();
  }

  function checkTomorrowQuest() {
    var q = getDayQuest();
    if (q.trigger !== 'tomorrow') return;
    var lastDate = Store.get('questDate') || '';
    if (lastDate && lastDate !== today && !isQuestDone()) {
      completeQuest();
    }
  }

  /* ─────────────────────────────────────────────────────
     MILESTONES
     ───────────────────────────────────────────────────── */
  function checkMilestones(prev, curr) {
    var done = Store.get('milestones') || [];
    for (var i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      if (prev < m && curr >= m && done.indexOf(m) < 0) {
        done.push(m);
        Store.set('milestones', done);
        (function (ms) {
          setTimeout(function () {
            toast('✨ به ' + toFa(ms) + ' XP رسیدی!');
          }, 400);
        })(m);
      }
    }
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

  function lighten(hex) {
    var r = parseInt(hex.slice(1,3),16);
    var g = parseInt(hex.slice(3,5),16);
    var b = parseInt(hex.slice(5,7),16);
    r = Math.min(255, r + 80);
    g = Math.min(255, g + 80);
    b = Math.min(255, b + 80);
    return '#' + [r,g,b].map(function(x){
      return x.toString(16).padStart(2,'0');
    }).join('');
  }

  function dashUpdate() {
    if (!pill) return;
    var lv     = currentLevel();
    var t      = Store.get('total') || 0;
    var pct    = Math.round(levelProgress() * 100);
    var next   = lv.id < LEVELS.length - 1 ? LEVELS[lv.id + 1] : null;
    var streak = Store.get('streak') || 1;
    var mult   = streakMultiplier();

    /* Pill */
    var markEl = document.getElementById('vec-pill-mark');
    var lblEl  = document.getElementById('vec-pill-label');
    if (markEl) { markEl.textContent = lv.mark; markEl.style.color = lv.color; }
    if (lblEl)  lblEl.textContent = lv.name;
    pill.classList.add('vec-visible');

    /* Card header */
    var bmark = document.getElementById('vec-badge-mark');
    var bname = document.getElementById('vec-badge-name');
    if (bmark) { bmark.textContent = lv.mark; bmark.style.color = lv.color; }
    if (bname) bname.textContent = lv.name;

    /* Progress bar */
    var fill = document.getElementById('vec-progress-fill');
    if (fill) {
      fill.style.width = pct + '%';
      fill.style.background = 'linear-gradient(90deg,' + lv.color + ',' + lighten(lv.color) + ')';
    }
    var plbl = document.getElementById('vec-progress-label');
    if (plbl) plbl.textContent = toFa(t) + ' / ' + toFa(next ? next.min : t) + ' XP';

    /* Streak multiplier badge */
    var multEl = document.getElementById('vec-mult-badge');
    if (multEl) {
      if (streak > 1) {
        multEl.textContent = '×' + mult.toFixed(1) + ' — ضربان وفاداری';
        multEl.style.display = 'flex';
      } else {
        multEl.style.display = 'none';
      }
    }

    setText('vec-t-attn',  '.vec-token-val', toFa(Store.get('attn')  || 0));
    setText('vec-t-know',  '.vec-token-val', toFa(Store.get('know')  || 0));
    setText('vec-t-loyal', '.vec-token-val', toFa(Store.get('loyal') || 0));

    var nl = document.getElementById('vec-next-unlock');
    if (nl) nl.textContent = next ? ('قدم بعدی: ' + lv.next) : 'به عالی‌ترین سطح رسیدی ★';

    var cert = document.getElementById('vec-cert-wrap');
    if (cert) cert.style.display = lv.id >= 4 ? 'block' : 'none';

    updateCalendar();
    updateQuestUI();
  }

  /* 7-day streak calendar */
  function updateCalendar() {
    var wrap = document.getElementById('vec-cal-dots');
    if (!wrap) return;
    var days   = Store.get('days') || [];
    var daySet = {};
    for (var i = 0; i < days.length; i++) daySet[days[i]] = true;

    wrap.innerHTML = '';
    for (var d = 6; d >= 0; d--) {
      var dt = new Date();
      dt.setDate(dt.getDate() - d);
      var key = dt.toISOString().slice(0, 10);
      var dot = document.createElement('span');
      dot.className = 'vec-cal-dot' + (daySet[key] ? ' vec-cal-active' : '');
      dot.setAttribute('title', key);
      wrap.appendChild(dot);
    }
  }

  function updateQuestUI() {
    var wrap     = document.getElementById('vec-quest-wrap');
    if (!wrap) return;
    var q        = getDayQuest();
    var done     = isQuestDone();
    var labelEl  = document.getElementById('vec-quest-label');
    var statusEl = document.getElementById('vec-quest-status');
    if (labelEl)  labelEl.textContent  = q.label;
    if (statusEl) statusEl.textContent = done ? '✓ انجام شد' : 'در انجام...';
    wrap.classList.toggle('vec-quest-done', done);
  }

  function setText(parentId, selector, text) {
    var el = document.getElementById(parentId);
    if (!el) return;
    var t = el.querySelector(selector);
    if (t) t.textContent = text;
  }

  function popToken(type) {
    var map = { attn:'vec-t-attn', know:'vec-t-know', loyal:'vec-t-loyal' };
    var el  = document.getElementById(map[type]);
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
    if (closeBtn) closeBtn.addEventListener('click', function () {
      open = false;
      card.classList.remove('vec-open');
    });

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
     EVOLUTION — temporal visual changes per level
     ───────────────────────────────────────────────────── */
  var prevLevelId = -1;

  function evolve() {
    var lv   = levelIndex();
    var body = document.body;
    for (var i = 0; i < LEVELS.length; i++) body.classList.remove('vec-l' + i);
    for (var i = 1; i <= lv; i++) body.classList.add('vec-l' + i);

    if (lv > prevLevelId && prevLevelId >= 0) {
      var lvDef = LEVELS[lv];
      toast(lvDef.mark + ' سطح جدید: ' + lvDef.name);
      confettiBurst();
    }
    prevLevelId = lv;

    ensureDarkToggle();
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
    var lv     = levelIndex();
    var vis    = Store.get('visits') || 0;
    if (vis <= 1 || lv === 0) return;
    var streak = Store.get('streak') || 1;
    var msgs   = [
      'خوش آمدی دوباره ◆',
      'دوباره اینجایی — خوشحالیم ◈',
      'همراه قدیمی، سلام ✦',
    ];
    var msg = lv >= 4
      ? 'روح برند — جایت اینجاست ★'
      : msgs[Math.min(lv - 1, msgs.length - 1)];

    if (streak >= 3) msg += '  🔥' + toFa(streak) + ' روز پیاپی';
    setTimeout(function () { toast(msg); }, 1800);
  }

  /* ─────────────────────────────────────────────────────
     CERTIFICATE (level 5)
     ───────────────────────────────────────────────────── */
  function generateCert() {
    var d      = new Date();
    var streak = Store.get('streak') || 1;
    var svg    = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">',
      '<defs>',
      '<linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0%" stop-color="#0D0A28"/>',
      '<stop offset="100%" stop-color="#1E1B4B"/>',
      '</linearGradient>',
      '</defs>',
      '<rect width="480" height="300" rx="18" fill="url(#g1)"/>',
      '<rect x="10" y="10" width="460" height="280" rx="12" fill="none" stroke="rgba(245,158,11,.5)" stroke-width="1"/>',
      '<text x="240" y="62" text-anchor="middle" font-size="30" fill="#F59E0B" font-family="serif">★</text>',
      '<text x="240" y="100" text-anchor="middle" font-size="15" fill="#E9D5FF" font-family="sans-serif">نشان وفاداری</text>',
      '<text x="240" y="134" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.5)" font-family="sans-serif">',
      window.location.hostname,
      '</text>',
      '<text x="240" y="174" text-anchor="middle" font-size="22" fill="#fff" font-family="sans-serif">روح برند</text>',
      '<text x="240" y="206" text-anchor="middle" font-size="10" fill="rgba(255,255,255,.35)" font-family="monospace">',
      d.toLocaleDateString('fa-IR') + '   |   ' + streak + ' روز پیاپی',
      '</text>',
      '<text x="240" y="260" text-anchor="middle" font-size="9" fill="rgba(245,158,11,.6)" font-family="monospace">',
      'TOKEN: ' + djb2(String(Store.get('total') || 0) + SITE_KEY).toUpperCase(),
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
     CONFETTI — level-up burst
     ───────────────────────────────────────────────────── */
  function confettiBurst() {
    var colors = ['#7C3AED','#A78BFA','#2563EB','#60A5FA','#F472B6','#F59E0B'];
    for (var i = 0; i < 28; i++) {
      (function () {
        var el = document.createElement('div');
        var c  = colors[Math.floor(Math.random() * colors.length)];
        var x  = 30 + Math.random() * (window.innerWidth - 60);
        el.style.cssText = [
          'position:fixed', 'left:' + x + 'px',
          'top:' + (window.innerHeight * 0.45) + 'px',
          'width:' + (4 + Math.random() * 6) + 'px',
          'height:' + (4 + Math.random() * 6) + 'px',
          'background:' + c, 'border-radius:50%',
          'pointer-events:none', 'z-index:2147483645',
          'transition:transform 1.6s cubic-bezier(.1,.8,.2,1),opacity 1.6s ease',
          'transform:translate(0,0)', 'opacity:1',
        ].join(';');
        document.body.appendChild(el);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var vx = (Math.random() - 0.5) * 340;
            var vy = -(90 + Math.random() * 250);
            el.style.transform = 'translate(' + vx + 'px,' + vy + 'px)';
            el.style.opacity   = '0';
          });
        });
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 1800);
      })();
    }
  }

  /* ─────────────────────────────────────────────────────
     AFTER EARN
     ───────────────────────────────────────────────────── */
  function afterEarn(type, amt) {
    evolve();
    dashUpdate();
    if (open) popToken(type);
  }

  /* ─────────────────────────────────────────────────────
     TRACKING — page events → tokens
     ───────────────────────────────────────────────────── */
  var pageHidden = false;

  function initTracking() {
    /* Anti-idle: pause time counting when tab is not visible */
    document.addEventListener('visibilitychange', function () {
      pageHidden = document.hidden;
    });
    pageHidden = document.hidden;

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

    /* pages3 quest check */
    if (!isQuestDone() && sp >= 3) {
      var qp = getDayQuest();
      if (qp.trigger === 'pages3') completeQuest();
    }

    /* contentPage quest check */
    if (cfg.pageType === 'content' && !isQuestDone()) {
      var qc = getDayQuest();
      if (qc.trigger === 'contentPage') completeQuest();
    }

    /* ── Visit counter & streak ── */
    var days = Store.get('days') || [];
    if (!days.length || days[days.length - 1] !== today) {
      checkTomorrowQuest();
      days.push(today);
      if (days.length > 60) days = days.slice(-60);
      Store.set('days', days);
      Store.set('visits', (Store.get('visits') || 0) + 1);

      if (days.length >= 2) Store.earn('loyal', EARN.dailyReturn);

      var streak = 1;
      for (var i = days.length - 2; i >= 0; i--) {
        var a = new Date(days[i + 1]), b = new Date(days[i]);
        if ((a - b) / 86400000 === 1) streak++;
        else break;
      }
      Store.set('streak', streak);
      if (streak >= 7)      Store.earn('loyal', EARN.streak7);
      else if (streak >= 3) Store.earn('loyal', EARN.streak3);
    }

    /* ── Time on page (paused when hidden) ── */
    var sec30done = false, sec60done = false, sec180done = false;
    var elapsed   = 0;

    var timeInterval = setInterval(function () {
      if (pageHidden) return;
      elapsed += 5;
      if (!sec30done  && elapsed >= 30)  { sec30done  = true; Store.earn('attn', EARN.sec30); }
      if (!sec60done  && elapsed >= 60)  { sec60done  = true; Store.earn('attn', EARN.sec60); }
      if (!sec180done && elapsed >= 180) {
        sec180done = true;
        Store.earn('attn', EARN.sec180);
        clearInterval(timeInterval);
        if (!isQuestDone()) {
          var qt = getDayQuest();
          if (qt.trigger === 'sec180') completeQuest();
        }
      }
    }, 5000);

    /* ── Scroll depth ── */
    var sc50done = false, sc100done = false;
    window.addEventListener('scroll', function () {
      if (sc50done && sc100done) return;
      var docEl = document.documentElement;
      var max   = docEl.scrollHeight - docEl.clientHeight;
      if (max <= 0) return;
      var pct = (window.scrollY || 0) / max;
      if (!sc50done  && pct >= 0.50) {
        sc50done = true;
        Store.earn('know', EARN.scroll50);
      }
      if (!sc100done && pct >= 0.95) {
        sc100done = true;
        Store.earn('know', EARN.scroll100);
        if (!isQuestDone()) {
          var qs = getDayQuest();
          if (qs.trigger === 'scroll100') completeQuest();
        }
      }
    }, { passive: true });

    window.addEventListener('beforeunload', function () { Store.save(); });
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

})();
