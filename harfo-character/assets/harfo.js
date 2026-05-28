/* ════════════════════════════════════════════════════════
   حرفو v12 — Star Hunter (Galaxy Explorer Scenario)

   The mascot is a tiny explorer. Each page = a mission with
   hidden stars on Elementor elements. It travels between them,
   captures them, occasionally writes a journal note.

   Quiet by default. No popups. No interruptions.
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Physics constants ── */
  var SPRING_K   = 0.045;
  var SPRING_D   = 0.84;
  var MAX_SPEED  = 16;
  var SQUISH_K   = 0.18;
  var SQUISH_D   = 0.66;
  var IDLE_SLEEP = 35000;
  var FLOAT_AMP  = 3.2;
  var FLOAT_FRQ  = 0.0008;

  /* ── Scenario constants ── */
  var STARS_PER_PAGE_MIN = 3;
  var STARS_PER_PAGE_MAX = 6;
  var CAPTURE_DISTANCE   = 70;   /* mascot must come this close */
  var TRAVEL_DELAY_MIN   = 2200; /* wait between captures */
  var TRAVEL_DELAY_MAX   = 4800;
  var NOTE_CHANCE        = 0.32; /* chance per capture to show note */
  var NOTE_DURATION      = 4200;
  var REFRESH_MARKS_MS   = 1200; /* rescan visible stars after scroll */

  var STORAGE_KEY = 'harfo_journal_v1';

  /* ── State ── */
  var S = {
    x:0, y:0, vx:0, vy:0, tx:0, ty:0,
    sqx:1, sqy:1, sqvx:0, sqvy:0,
    mx:-999, my:-999, lastMouseTime:0,
    idle:0, sleeping:false,
    dragging:false, dragOx:0, dragOy:0,
    mood:'normal',
    pupLx:4, pupLy:4, pupRx:4, pupRy:4,
    lastTick:0,
    /* Scenario state */
    stars: [],            /* {el, x, y, captured, node} */
    target: null,         /* current star being hunted */
    nextTravel: 0,
    missionDone: false,
    captured: 0,
    total: 0,
    dayStars: 0,
    dayNum: 1,
    noteHideTime: 0,
    lastScrollTime: 0,
    needsRescan: false,
  };

  /* ── DOM refs ── */
  var ROOT, W, BALL, FX, MARKS, CHIP, CHIP_TEXT, NOTE, NOTE_DAY, NOTE_TEXT,
      PL, PR, ARMW, STARS;

  function grab() {
    ROOT      = document.getElementById('harfo-root');
    W         = document.getElementById('harfo-w');
    BALL      = document.getElementById('harfo-ball');
    FX        = document.getElementById('harfo-fx');
    MARKS     = document.getElementById('harfo-marks');
    CHIP      = document.getElementById('harfo-chip');
    CHIP_TEXT = document.getElementById('harfo-chip-text');
    NOTE      = document.getElementById('harfo-note');
    NOTE_DAY  = document.getElementById('harfo-note-day');
    NOTE_TEXT = document.getElementById('harfo-note-text');
    PL        = document.getElementById('harfo-pl');
    PR        = document.getElementById('harfo-pr');
    ARMW      = document.getElementById('harfo-armw');
    STARS     = document.getElementById('harfo-stars');
    return !!(W && BALL && MARKS && CHIP);
  }

  /* ── Helpers ── */
  function lerp(a,b,t){ return a+(b-a)*t; }
  function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
  function rn(a,b){ return a+Math.random()*(b-a); }
  function pickOne(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function setMood(m){
    if (S.mood === m) return;
    S.mood = m;
    BALL.dataset.mood = m;
  }

  function toFaDigits(n){
    var fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(n).replace(/\d/g, function(d){ return fa[+d]; });
  }

  function getHour(){ return new Date().getHours(); }
  function setTimeOfDay(){
    var h = getHour();
    BALL.dataset.time = (h>=5 && h<12) ? 'morning' : (h>=18 || h<5) ? 'night' : 'day';
  }

  /* ── Background micro-stars in ball ── */
  function buildBackgroundStars(){
    if (!STARS) return;
    STARS.innerHTML = '';
    for (var i=0; i<18; i++){
      var s = document.createElement('div');
      s.className = 'harfo-bstar';
      var sz = rn(1.2, 2.6);
      s.style.cssText = 'width:'+sz+'px;height:'+sz+'px;top:'+rn(8,88)+'%;left:'+rn(8,88)+'%;animation-delay:'+rn(0,2.2)+'s';
      STARS.appendChild(s);
    }
  }

  /* ════════════════════════════════════════════════════════
     JOURNAL — persistent notebook (localStorage)
     ════════════════════════════════════════════════════════ */
  var Journal = (function(){
    var data = { dayNum:1, lastDate:'', totalStars:0, pagesVisited:0 };

    function load(){
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) data = JSON.parse(raw);
      } catch(e){}
      var today = new Date().toISOString().slice(0,10);
      if (data.lastDate !== today){
        data.dayNum = (data.dayNum || 0) + 1;
        data.lastDate = today;
        save();
      }
      S.dayNum = data.dayNum;
      S.dayStars = data.totalStars || 0;
    }

    function save(){
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e){}
    }

    function addStar(){
      data.totalStars = (data.totalStars || 0) + 1;
      S.dayStars = data.totalStars;
      save();
    }

    function addPage(){
      data.pagesVisited = (data.pagesVisited || 0) + 1;
      save();
    }

    function get(){ return data; }
    load();
    return { addStar, addPage, get };
  })();

  /* ════════════════════════════════════════════════════════
     NOTES — journal entries that appear briefly
     ════════════════════════════════════════════════════════ */
  var NOTES = {
    discovery: [
      'یه ستاره دیگه پیدا کردم ✨',
      'این یکی روی یه چیز قشنگ بود',
      'باز هم درخشید — گرفتمش',
      'این محتوا انرژی داره',
      'این بخش جالبه، اینجا می‌مونم یه لحظه',
    ],
    mission_done: [
      'ماموریت این صفحه تموم شد!',
      'همه ستاره‌ها جمع شد ⭐',
      'این سیاره کاوش شد. می‌خوابم یکم.',
    ],
    arrival: [
      'سیاره جدید کشف کردم',
      'این صفحه چندتا ستاره داره... ببینم',
      'بوی ستاره میاد از اینجا',
    ],
    morning: [ 'صبح بخیر — ماموریت امروز شروع شد ☀️' ],
    night:   [ 'شب آرومیه برای کاوش 🌙' ],
    return:  [ 'برگشتی! روز ', /* + dayNum */ ],
  };

  function showNote(type){
    if (!NOTE) return;
    var pool = NOTES[type];
    if (!pool || !pool.length) return;
    var text;
    if (type === 'return') text = NOTES.return[0] + toFaDigits(S.dayNum);
    else text = pickOne(pool);

    NOTE_DAY.textContent = 'روز ' + toFaDigits(S.dayNum);
    NOTE_TEXT.textContent = text;
    NOTE.classList.add('harfo-note-show');
    S.noteHideTime = Date.now() + NOTE_DURATION;
  }

  function tickNote(){
    if (S.noteHideTime && Date.now() > S.noteHideTime){
      NOTE.classList.remove('harfo-note-show');
      S.noteHideTime = 0;
    }
  }

  /* ════════════════════════════════════════════════════════
     COUNTER CHIP
     ════════════════════════════════════════════════════════ */
  function updateChip(pop){
    if (!CHIP_TEXT) return;
    CHIP_TEXT.textContent = toFaDigits(S.captured) + ' / ' + toFaDigits(S.total);
    CHIP.classList.add('harfo-chip-show');
    if (pop){
      CHIP.classList.remove('harfo-chip-pop');
      void CHIP.offsetWidth;
      CHIP.classList.add('harfo-chip-pop');
    }
  }

  /* ════════════════════════════════════════════════════════
     STAR HUNTER — places markers, picks targets, captures
     ════════════════════════════════════════════════════════ */
  var STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L22 9.3l-5.4 4.7L18 22l-6-3.7L6 22l1.4-8 -5.4-4.7 7.4-.7z"/></svg>';

  /* Score candidate elements — bigger, more visible = better */
  function scoreElement(el){
    var r = el.getBoundingClientRect();
    if (r.width < 60 || r.height < 30) return 0;
    var vh = window.innerHeight, vw = window.innerWidth;
    /* Must be at least partially in viewport */
    if (r.bottom < -200 || r.top > vh + 800) return 0;
    var area = Math.min(r.width * r.height, 80000);
    var score = area / 5000;
    /* Prefer near document top sections of importance */
    if (el.tagName === 'H1') score *= 1.8;
    if (el.tagName === 'H2') score *= 1.4;
    if (el.classList && el.classList.contains('elementor-button')) score *= 1.5;
    return score;
  }

  function findCandidates(){
    var selectors = [
      '.elementor-widget-heading',
      '.elementor-widget-image',
      '.elementor-widget-button',
      '.elementor-button',
      '.elementor-widget-icon-box',
      '.elementor-widget-image-box',
      '.elementor-widget-call-to-action',
      '.elementor-widget-testimonial',
      '.elementor-widget-counter',
      '.elementor-widget-video',
      '.woocommerce-loop-product__title',
      '.product .woocommerce-LoopProduct-link',
      'h1','h2','h3',
      'article figure',
      'article img',
    ];
    var seen = new Set();
    var candidates = [];
    selectors.forEach(function(sel){
      try {
        document.querySelectorAll(sel).forEach(function(el){
          if (seen.has(el)) return;
          /* Skip if inside another candidate */
          var parent = el.parentElement;
          var skip = false;
          while (parent && parent !== document.body){
            if (seen.has(parent)) { skip = true; break; }
            parent = parent.parentElement;
          }
          if (skip) return;
          var s = scoreElement(el);
          if (s > 0){
            seen.add(el);
            candidates.push({ el:el, score:s });
          }
        });
      } catch(e){}
    });
    candidates.sort(function(a,b){ return b.score - a.score; });
    return candidates;
  }

  function planMission(){
    var candidates = findCandidates();
    if (candidates.length === 0) {
      S.total = 0;
      S.captured = 0;
      S.missionDone = true;
      updateChip(false);
      return;
    }
    var n = Math.min(candidates.length, Math.floor(rn(STARS_PER_PAGE_MIN, STARS_PER_PAGE_MAX+1)));
    /* Take top-scored candidates, but shuffle a bit so it's not always identical order */
    var pool = candidates.slice(0, Math.min(candidates.length, n*2));
    /* Fisher–Yates light shuffle */
    for (var i = pool.length-1; i > 0; i--){
      var j = Math.floor(Math.random() * (i+1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var chosen = pool.slice(0, n);

    /* Clear old markers */
    MARKS.innerHTML = '';
    S.stars = [];
    chosen.forEach(function(c){
      var node = document.createElement('div');
      node.className = 'harfo-mark';
      node.innerHTML = STAR_SVG;
      MARKS.appendChild(node);
      S.stars.push({ el: c.el, node: node, captured: false });
    });
    S.total = S.stars.length;
    S.captured = 0;
    S.missionDone = false;
    positionMarkers();
    /* Reveal markers after a beat */
    setTimeout(function(){
      S.stars.forEach(function(st, i){
        setTimeout(function(){ if (st.node && !st.captured) st.node.classList.add('harfo-mark-show'); }, i * 180);
      });
    }, 600);
    updateChip(false);
    pickNextTarget();
  }

  function positionMarkers(){
    S.stars.forEach(function(st){
      if (st.captured) return;
      var r = st.el.getBoundingClientRect();
      /* Pin star to top-right corner of element (slightly inset) */
      var x = r.right - 18;
      var y = r.top + 6;
      /* Keep star within viewport so it's discoverable */
      x = clamp(x, 12, window.innerWidth - 30);
      y = clamp(y, 12, window.innerHeight - 30);
      st.x = x; st.y = y;
      st.node.style.left = x + 'px';
      st.node.style.top  = y + 'px';
    });
  }

  function pickNextTarget(){
    if (S.missionDone) return;
    /* Prefer stars currently in viewport */
    var visible = S.stars.filter(function(st){
      if (st.captured) return false;
      var r = st.el.getBoundingClientRect();
      return r.bottom > 40 && r.top < window.innerHeight - 40;
    });
    var pool = visible.length ? visible : S.stars.filter(function(s){ return !s.captured; });
    if (pool.length === 0){
      S.missionDone = true;
      onMissionDone();
      return;
    }
    /* Pick nearest in pool */
    var bx = S.x + 50, by = S.y + 50;
    var nearest = pool[0];
    var nd = Infinity;
    pool.forEach(function(st){
      var dx = st.x - bx, dy = st.y - by;
      var d = dx*dx + dy*dy;
      if (d < nd){ nd = d; nearest = st; }
    });
    S.target = nearest;
    S.nextTravel = Date.now() + rn(TRAVEL_DELAY_MIN, TRAVEL_DELAY_MAX);
    /* Set travel target with a small offset so mascot perches beside star */
    var offsetX = nearest.x < window.innerWidth/2 ? 30 : -100;
    S.tx = clamp(nearest.x + offsetX, 10, window.innerWidth - 110);
    S.ty = clamp(nearest.y - 30, 10, window.innerHeight - 110);
    setMood('seeking');
  }

  function tryCapture(){
    if (!S.target || S.target.captured) return;
    var bx = S.x + 50, by = S.y + 50;
    var dx = S.target.x - bx, dy = S.target.y - by;
    var d = Math.sqrt(dx*dx + dy*dy);
    if (d < CAPTURE_DISTANCE){
      captureStar(S.target);
    }
  }

  function captureStar(st){
    st.captured = true;
    st.node.classList.add('harfo-mark-caught');
    setTimeout(function(){ if (st.node && st.node.parentNode) st.node.parentNode.removeChild(st.node); }, 700);
    S.captured++;
    Journal.addStar();
    updateChip(true);
    burstSparkle(st.x, st.y);
    setMood('excited');
    setTimeout(function(){ if (S.mood === 'excited') setMood('normal'); }, 1500);

    if (Math.random() < NOTE_CHANCE) {
      setTimeout(function(){ showNote('discovery'); }, 800);
    }

    setTimeout(pickNextTarget, rn(1500, 2800));
  }

  function onMissionDone(){
    setMood('sleeping');
    showNote('mission_done');
    /* After mission, hang out near bottom-right then sleep */
    S.tx = window.innerWidth - 130;
    S.ty = window.innerHeight - 130;
  }

  /* ════════════════════════════════════════════════════════
     PARTICLES
     ════════════════════════════════════════════════════════ */
  function spawn(type, x, y){
    if (!FX) return;
    var el = document.createElement('div');
    el.className = 'harfo-pt harfo-pt-' + type;
    el.textContent = type === 'hrt' ? '♥' : '✦';
    el.style.cssText = 'position:absolute;left:'+x+'px;top:'+y+'px;';
    FX.appendChild(el);
    var t0 = null;
    var vx = rn(-50, 50), vy = rn(-100, -30);
    (function anim(ts){
      if (!t0) t0 = ts;
      var dt = (ts - t0) / 1000;
      var op = Math.max(0, 1 - dt * 1.3);
      el.style.left = (x + vx*dt) + 'px';
      el.style.top  = (y + vy*dt + 70*dt*dt) + 'px';
      el.style.opacity = op;
      if (op > 0) requestAnimationFrame(anim);
      else if (el.parentNode) el.parentNode.removeChild(el);
    })(performance.now());
  }

  function burstSparkle(x, y){
    for (var i=0; i<6; i++){
      setTimeout(function(){ spawn('spk', x, y); }, i * 60);
    }
    spawn('hrt', x, y);
  }

  /* ════════════════════════════════════════════════════════
     INTERACTIONS
     ════════════════════════════════════════════════════════ */
  /* Mouse tracking */
  document.addEventListener('mousemove', function(e){
    S.mx = e.clientX; S.my = e.clientY;
    S.lastMouseTime = Date.now();
    if (S.sleeping) S.idle = Date.now();
  }, {passive:true});

  document.addEventListener('touchmove', function(e){
    if (e.touches.length){
      S.mx = e.touches[0].clientX;
      S.my = e.touches[0].clientY;
    }
  }, {passive:true});

  /* Scroll — rescan visible stars, retarget */
  var scrollThrottle = 0;
  window.addEventListener('scroll', function(){
    var now = Date.now();
    S.lastScrollTime = now;
    S.needsRescan = true;
    if (now - scrollThrottle > 250){
      scrollThrottle = now;
      positionMarkers();
      /* If mission not done and target is now far off-screen, repick */
      if (S.target && !S.target.captured){
        var r = S.target.el.getBoundingClientRect();
        if (r.bottom < -300 || r.top > window.innerHeight + 600){
          pickNextTarget();
        }
      }
    }
  }, {passive:true});

  /* Resize */
  window.addEventListener('resize', function(){
    positionMarkers();
  }, {passive:true});

  /* Drag mascot */
  function initDrag(){
    function onDown(e){
      e.preventDefault();
      S.dragging = true;
      var pt = e.touches ? e.touches[0] : e;
      S.dragOx = pt.clientX - S.x;
      S.dragOy = pt.clientY - S.y;
      spawn('spk', S.x+50, S.y+50);
    }
    function onMove(e){
      if (!S.dragging) return;
      var pt = e.touches ? e.touches[0] : e;
      S.tx = pt.clientX - S.dragOx;
      S.ty = pt.clientY - S.dragOy;
    }
    function onUp(){
      if (!S.dragging) return;
      S.dragging = false;
      spawn('hrt', S.x+50, S.y+50);
      /* Resume hunt */
      if (!S.missionDone) setTimeout(pickNextTarget, 600);
    }
    W.addEventListener('mousedown', onDown);
    W.addEventListener('touchstart', onDown, {passive:false});
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  /* Click — friendly reaction */
  function initClick(){
    W.addEventListener('click', function(){
      spawn('hrt', S.x+50, S.y+50);
      setMood('excited');
      setTimeout(function(){
        if (S.mood === 'excited') {
          setMood(S.missionDone ? 'sleeping' : 'seeking');
        }
      }, 1200);
    });
  }

  /* Exit intent — wave goodbye */
  var exitFired = false;
  document.addEventListener('mouseleave', function(e){
    if (e.clientY < 5 && !exitFired && ARMW){
      exitFired = true;
      ARMW.classList.add('harfo-wave');
      setTimeout(function(){
        if (ARMW) ARMW.classList.remove('harfo-wave');
        exitFired = false;
      }, 2200);
    }
  });

  /* ════════════════════════════════════════════════════════
     PUPILS — track mouse OR current target
     ════════════════════════════════════════════════════════ */
  function updatePupils(){
    if (!PL || !PR) return;
    var lookX, lookY;
    /* Priority: look at target if hunting, else mouse */
    if (S.target && !S.target.captured && !S.missionDone){
      lookX = S.target.x; lookY = S.target.y;
    } else if (S.mx !== -999) {
      lookX = S.mx; lookY = S.my;
    } else {
      lookX = S.x + 50; lookY = S.y + 50;
    }
    var cx = S.x + 50, cy = S.y + 50;
    var dx = lookX - cx, dy = lookY - cy;
    var dist = Math.sqrt(dx*dx + dy*dy) || 1;
    var maxR = 4;
    var tx = 4 + (dx/dist) * Math.min(dist*0.18, maxR);
    var ty = 4 + (dy/dist) * Math.min(dist*0.18, maxR);
    S.pupLx = lerp(S.pupLx, tx, 0.14);
    S.pupLy = lerp(S.pupLy, ty, 0.14);
    S.pupRx = lerp(S.pupRx, tx, 0.14);
    S.pupRy = lerp(S.pupRy, ty, 0.14);
    PL.style.transform = 'translate('+(S.pupLx-4)+'px,'+(S.pupLy-4)+'px)';
    PR.style.transform = 'translate('+(S.pupRx-4)+'px,'+(S.pupRy-4)+'px)';
  }

  /* ════════════════════════════════════════════════════════
     MOUSE FLEE — gentle, only if hovering very close
     ════════════════════════════════════════════════════════ */
  function reactToCursor(){
    if (S.dragging || S.sleeping) return;
    if (S.mx === -999) return;
    var cx = S.x + 50, cy = S.y + 50;
    var dx = S.mx - cx, dy = S.my - cy;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 65) {
      /* Gently nudge away from cursor */
      var ang = Math.atan2(dy, dx);
      var pushX = -Math.cos(ang) * 80;
      var pushY = -Math.sin(ang) * 80;
      S.tx = clamp(S.x + pushX, 10, window.innerWidth - 110);
      S.ty = clamp(S.y + pushY, 10, window.innerHeight - 110);
      if (S.mood !== 'scared'){
        setMood('scared');
        setTimeout(function(){ if (S.mood==='scared' && !S.missionDone) setMood('seeking'); }, 1200);
      }
    }
  }

  /* ════════════════════════════════════════════════════════
     MAIN TICK
     ════════════════════════════════════════════════════════ */
  function tick(ts){
    try {
      var dt = Math.min((ts - (S.lastTick || ts)) / 1000, 0.05);
      S.lastTick = ts;
      var now = Date.now();

      /* Pick next target if mission ongoing and time elapsed */
      if (!S.dragging && !S.missionDone && S.target && S.target.captured === false){
        tryCapture();
      }

      /* Cursor avoidance (gentle) */
      reactToCursor();

      /* Spring physics */
      var ax = (S.tx - S.x) * SPRING_K;
      var ay = (S.ty - S.y) * SPRING_K;
      S.vx = (S.vx + ax) * SPRING_D;
      S.vy = (S.vy + ay) * SPRING_D;
      S.vx = clamp(S.vx, -MAX_SPEED, MAX_SPEED);
      S.vy = clamp(S.vy, -MAX_SPEED, MAX_SPEED);
      S.x += S.vx;
      S.y += S.vy;

      /* Boundary */
      var maxX = window.innerWidth  - ((W && W.offsetWidth)  || 100);
      var maxY = window.innerHeight - ((W && W.offsetHeight) || 100);
      if (S.x < 0)    { S.x = 0;    S.vx *= -0.4; }
      if (S.y < 0)    { S.y = 0;    S.vy *= -0.4; }
      if (S.x > maxX) { S.x = maxX; S.vx *= -0.4; }
      if (S.y > maxY) { S.y = maxY; S.vy *= -0.4; }

      /* Squish */
      var speed = Math.sqrt(S.vx*S.vx + S.vy*S.vy);
      var sqTx = 1 + speed * 0.025;
      var sqTy = 1 - speed * 0.018;
      S.sqvx = (S.sqvx + (sqTx - S.sqx) * SQUISH_K) * SQUISH_D;
      S.sqvy = (S.sqvy + (sqTy - S.sqy) * SQUISH_K) * SQUISH_D;
      S.sqx = clamp(S.sqx + S.sqvx, 0.7, 1.4);
      S.sqy = clamp(S.sqy + S.sqvy, 0.7, 1.4);

      /* Pupils */
      updatePupils();

      /* Idle / sleep */
      if (speed > 0.8 || S.dragging) S.idle = now;
      if (!S.sleeping && (now - S.idle) > IDLE_SLEEP){
        S.sleeping = true;
        if (S.missionDone) setMood('sleeping');
      }
      if (S.sleeping && (speed > 1.5 || S.dragging)){
        S.sleeping = false;
        if (!S.missionDone) setMood('seeking');
      }

      /* Note timing */
      tickNote();

      /* Apply DOM */
      var floatY = S.sleeping ? 0 : Math.sin(now * FLOAT_FRQ) * FLOAT_AMP;
      W.style.transform = 'translate('+(S.x|0)+'px,'+((S.y + floatY)|0)+'px)';
      BALL.style.transform = 'scale('+S.sqx.toFixed(3)+','+S.sqy.toFixed(3)+')';

    } catch(e){}
    requestAnimationFrame(tick);
  }

  /* ════════════════════════════════════════════════════════
     BOOT
     ════════════════════════════════════════════════════════ */
  function boot(){
    if (!grab()){ setTimeout(boot, 80); return; }

    /* Capture CSS-rendered position */
    var rect = W.getBoundingClientRect();
    S.x = rect.left; S.y = rect.top;
    S.tx = S.x; S.ty = S.y;
    S.idle = Date.now();

    /* Switch to JS physics positioning */
    W.classList.add('harfo-phys');
    W.style.transform = 'translate('+S.x+'px,'+S.y+'px)';

    buildBackgroundStars();
    setTimeOfDay();

    initDrag();
    initClick();

    Journal.addPage();

    /* Greet user appropriately */
    setTimeout(function(){
      var d = Journal.get();
      if (d.pagesVisited === 1){
        var h = getHour();
        if (h >= 5 && h < 12) showNote('morning');
        else if (h >= 18 || h < 5) showNote('night');
        else showNote('arrival');
      } else if (d.pagesVisited % 5 === 0){
        showNote('return');
      } else {
        showNote('arrival');
      }
    }, 1800);

    /* Plan mission after page settles (give Elementor a chance to render) */
    setTimeout(planMission, 1500);

    /* Re-plan if Elementor's frontend init fires later */
    document.addEventListener('elementor/frontend/init', function(){
      setTimeout(planMission, 800);
    });

    /* Watch for DOM changes (lazy loaded content) — rescan once */
    var rescanned = false;
    var observer = new MutationObserver(function(){
      if (rescanned) return;
      rescanned = true;
      setTimeout(function(){
        if (!S.missionDone && S.captured === 0) planMission();
        rescanned = false;
      }, 2000);
    });
    try { observer.observe(document.body, { childList:true, subtree:true }); } catch(e){}

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 50); });
  } else {
    setTimeout(boot, 50);
  }

})();
