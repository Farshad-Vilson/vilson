/* ════════════════════════════════════════════════════════════════
   حرفو v9 — Galaxy Jelly Ball · Intelligence Engine
   Physics + Squish + Pupil tracking + Rain + Umbrella + Behaviors
   Zero external dependencies.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────────── */
  var C = {
    WRAP:     120,   /* wrapper px                        */
    BALL:      80,   /* ball diameter                     */
    BALL_OFF:  20,   /* ball top/left offset in wrapper   */

    /* Spring physics */
    SK:  0.058,   /* spring stiffness  */
    SD:  0.80,    /* spring damping    */
    MSP: 20,      /* max speed         */

    /* Squish spring */
    SQK: 0.16,   /* squish stiffness  */
    SQD: 0.68,   /* squish damping    */
    SQA: 0.30,   /* max squish amount */

    /* Mouse zones (distance from ball CENTER) */
    Z_NOTICE: 420,
    Z_TEASE:  280,
    Z_ALERT:  180,
    Z_FLEE:   120,
    Z_PANIC:   68,

    /* Forces */
    FF: 6.0,    /* flee force   */
    PF: 10.5,   /* panic force  */

    /* Wander */
    WI_MIN: 3500,   /* min ms between wanders */
    WI_MAX: 7000,   /* max ms between wanders */

    /* Sleep */
    SLEEP_AFTER: 50000,  /* ms idle → sleep */

    /* Rain */
    RAIN_MIN:  4 * 60 * 1000,
    RAIN_MAX: 12 * 60 * 1000,
    RAIN_DUR:  18000,
  };

  /* ── State ──────────────────────────────────────────────────── */
  var S = {
    /* position of wrapper top-left */
    x: 0, y: 0,
    vx: 0, vy: 0,
    tx: 0, ty: 0,

    /* squish scale */
    sx: 1, sy: 1,
    sxv: 0, syv: 0,

    /* mouse */
    mx: -9999, my: -9999,

    /* pupils (offset from center of eye) */
    plx: 0, ply: 0,
    prx: 0, pry: 0,

    /* state */
    zone:  'far',
    mood:  'normal',

    /* flags */
    dragging:   false,
    raining:    false,
    sheltered:  false,
    sleeping:   false,

    /* timers */
    idleSince:    Date.now(),
    lastWander:   0,
    wanderNext:   1200,  /* first wander after 1.2s */
    lastPt:       0,
    onArrive:     null,

    /* umbrella */
    umbX: 0, umbY: 0,
    umbDragging: false,
    umbDOX: 0, umbDOY: 0,
  };

  /* ── DOM ─────────────────────────────────────────────────────── */
  var D = {};

  /* ── Helpers ─────────────────────────────────────────────────── */
  function cl(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lr(a, b, t)   { return a + (b - a) * t; }
  function rn(lo, hi)    { return lo + Math.random() * (hi - lo); }
  function ri(arr)       { return arr[Math.floor(Math.random() * arr.length)]; }

  function ballCenter() {
    return {
      x: S.x + C.WRAP / 2,
      y: S.y + C.WRAP / 2
    };
  }

  function distMouse() {
    if (S.mx < 0) return Infinity;
    var b = ballCenter();
    return Math.hypot(S.mx - b.x, S.my - b.y);
  }

  function getZone(d) {
    if (d < C.Z_PANIC)  return 'panic';
    if (d < C.Z_FLEE)   return 'flee';
    if (d < C.Z_ALERT)  return 'alert';
    if (d < C.Z_TEASE)  return 'tease';
    if (d < C.Z_NOTICE) return 'notice';
    return 'far';
  }

  /* ── Movement ───────────────────────────────────────────────── */
  function moveTo(x, y, cb) {
    var maxX = window.innerWidth  - C.WRAP - 4;
    var maxY = window.innerHeight - C.WRAP - 4;
    S.tx = cl(x, 4, maxX);
    S.ty = cl(y, 4, maxY);
    S.onArrive = cb || null;
  }

  function parkHome(cb) {
    moveTo(
      window.innerWidth  - C.WRAP - 28,
      window.innerHeight - C.WRAP - 28,
      cb
    );
  }

  /* Autonomous wander — picks a random screen position */
  function wander() {
    if (S.dragging || S.zone === 'flee' || S.zone === 'panic') return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var x = rn(vw * 0.12, vw * 0.82) - C.WRAP / 2;
    var y = rn(vh * 0.12, vh * 0.82) - C.WRAP / 2;
    moveTo(x, y);
    S.lastWander = Date.now();  /* reset timer */
  }

  /* ── Repulsion forces ────────────────────────────────────────── */
  function repulse() {
    var b  = ballCenter();
    var dx = b.x - S.mx, dy = b.y - S.my;
    var d  = Math.hypot(dx, dy) || 1;
    var nx = dx / d, ny = dy / d;

    if (d < C.Z_PANIC) {
      var t = Math.pow((C.Z_PANIC - d) / C.Z_PANIC, 1.2);
      S.vx += nx * t * C.PF;
      S.vy += ny * t * C.PF * 0.65;
    } else {
      var t2 = Math.pow((C.Z_FLEE - d) / C.Z_FLEE, 1.5);
      S.vx += nx * t2 * C.FF;
      S.vy += ny * t2 * C.FF * 0.55;
    }
    /* Squish burst on flee */
    S.sxv += ny * 0.7;
    S.syv += nx * 0.7;
  }

  /* ── Squish physics ─────────────────────────────────────────── */
  function tickSquish(sp, vx, vy) {
    var ux = sp > 0.2 ? vx / sp : 0;
    var uy = sp > 0.2 ? vy / sp : 0;
    var k  = cl(sp * 0.024, 0, C.SQA);

    /* elongate in direction of motion, compress perpendicular */
    var txs = 1 + (ux * ux - uy * uy * 0.55) * k;
    var tys = 1 + (uy * uy - ux * ux * 0.55) * k;

    S.sxv = S.sxv * C.SQD + (txs - S.sx) * C.SQK;
    S.syv = S.syv * C.SQD + (tys - S.sy) * C.SQK;
    S.sx += S.sxv;
    S.sy += S.syv;
    S.sx = cl(S.sx, 0.62, 1.52);
    S.sy = cl(S.sy, 0.62, 1.52);
  }

  /* ── Pupil tracking ─────────────────────────────────────────── */
  function tickPupils() {
    if (S.mood === 'sleeping' || S.mx < 0) {
      S.plx = lr(S.plx, 0, 0.1);
      S.ply = lr(S.ply, 0, 0.1);
      S.prx = lr(S.prx, 0, 0.1);
      S.pry = lr(S.pry, 0, 0.1);
      return;
    }
    var b  = ballCenter();
    var dx = S.mx - b.x, dy = S.my - b.y;
    var d  = Math.hypot(dx, dy) || 1;
    var r  = Math.min(d / 100, 1) * 5;
    var tx = (dx / d) * r;
    var ty = (dy / d) * r;

    S.plx = lr(S.plx, tx, 0.13);
    S.ply = lr(S.ply, ty, 0.13);
    S.prx = lr(S.prx, tx, 0.13);
    S.pry = lr(S.pry, ty, 0.13);
  }

  /* ── Mood / expression ──────────────────────────────────────── */
  function setMood(m) {
    if (S.mood === m) return;
    S.mood = m;
    if (D.ball) D.ball.setAttribute('data-mood', m);
  }

  /* ── Zone change reactions ──────────────────────────────────── */
  function onZoneChange(prev, cur) {
    if (cur === 'panic' || cur === 'flee') {
      setMood('scared');
      if (cur === 'panic') { S.sxv = -1.0; S.syv = 1.0; } /* panic squish */
    } else if (cur === 'tease' || cur === 'notice') {
      setMood('curious');
    } else if (cur === 'alert') {
      setMood('curious');
    } else if (cur === 'far') {
      if (prev === 'flee' || prev === 'panic') {
        /* escaped! celebrate */
        setMood('happy');
        spawnPt('sp', 7);
        spawnPt('hrt', 2);
        S.sxv = -0.9; S.syv = 0.9;
        setTimeout(function () { setMood('normal'); }, 2500);
      } else {
        setMood('normal');
      }
    }
  }

  /* ── Time of day ─────────────────────────────────────────────── */
  function timeState() {
    var h = new Date().getHours();
    if (h >= 6  && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'afternoon';
    if (h >= 18 && h < 22) return 'evening';
    return 'night';
  }

  function applyTimeStyle() {
    var ts = timeState();
    if (D.ball) D.ball.setAttribute('data-time', ts);
    /* night: slower, dreamier */
    if (ts === 'night') {
      C.MSP      = 12;
      C.WI_MIN   = 7000;
      C.WI_MAX   = 14000;
    } else if (ts === 'morning') {
      C.MSP      = 24;
      C.WI_MIN   = 2500;
      C.WI_MAX   = 5000;
    } else {
      C.MSP      = 20;
      C.WI_MIN   = 3500;
      C.WI_MAX   = 7000;
    }
  }

  /* ── Particles ───────────────────────────────────────────────── */
  var pts = [];

  var PT_MAP = {
    sp:  { chars: ['✦','✧','⋆','·'], cls: 'h-pt-sp' },
    hrt: { chars: ['♥','♡'],         cls: 'h-pt-hrt' },
    zzz: { chars: ['z','Z','ᶻ'],      cls: 'h-pt-zzz' },
    str: { chars: ['·','*'],          cls: 'h-pt-str' },
    drp: { chars: ['💧','·'],         cls: 'h-pt-drp' },
  };

  function spawnPt(type, count) {
    if (!D.fx) return;
    var b  = ballCenter();
    var pm = PT_MAP[type] || PT_MAP.sp;
    for (var i = 0; i < count; i++) {
      var el = document.createElement('div');
      el.className = 'h-pt ' + pm.cls;
      el.textContent = ri(pm.chars);
      var angle = rn(0, Math.PI * 2);
      var spd   = rn(1.2, 3.5);
      var life  = rn(500, 1100);
      el.style.left = (b.x - 6) + 'px';
      el.style.top  = (b.y - 6) + 'px';
      el._vx = Math.cos(angle) * spd;
      el._vy = Math.sin(angle) * spd - 1.5;
      el._life = life;
      el._born = Date.now();
      D.fx.appendChild(el);
      pts.push(el);
    }
  }

  function tickPts() {
    var now = Date.now();
    pts = pts.filter(function (p) {
      var age = now - p._born;
      if (age > p._life) { p.remove(); return false; }
      var t = age / p._life;
      p._vy += 0.07;  /* gravity */
      p.style.left    = (parseFloat(p.style.left) + p._vx) + 'px';
      p.style.top     = (parseFloat(p.style.top)  + p._vy) + 'px';
      p.style.opacity = (1 - t * t).toFixed(2);
      p.style.transform = 'scale(' + (1 - t * 0.5).toFixed(2) + ')';
      return true;
    });
  }

  /* ── Rain system ─────────────────────────────────────────────── */
  var rainDrops  = [];
  var rainIntId  = null;

  function startRain() {
    if (S.raining) return;
    S.raining = true;
    if (S.mood !== 'scared') setMood('sad');

    rainIntId = setInterval(spawnRainDrop, 55);

    /* Show umbrella 2s after rain starts */
    setTimeout(function () {
      if (S.raining) showUmbrella();
    }, 2000);

    /* Auto stop */
    setTimeout(stopRain, C.RAIN_DUR);
  }

  function stopRain() {
    if (!S.raining) return;
    S.raining = false;
    clearInterval(rainIntId);
    rainIntId = null;
    rainDrops.forEach(function (d) { d.remove(); });
    rainDrops = [];
    hideUmbrella();
    if (S.mood === 'sad' || S.mood === 'sheltered') {
      setMood('happy');
      spawnPt('sp', 5);
      setTimeout(function () { setMood('normal'); }, 2000);
    }
  }

  function spawnRainDrop() {
    if (!D.rain || S.sheltered) return;
    var drop = document.createElement('div');
    drop.className = 'h-rdrop';
    var h  = rn(8, 16);
    drop.style.height = h + 'px';
    drop.style.left   = rn(0, 78) + 'px';
    drop.style.top    = '0px';
    drop._vy = rn(4, 7);
    D.rain.appendChild(drop);
    rainDrops.push(drop);
  }

  function tickRain() {
    rainDrops = rainDrops.filter(function (d) {
      var y = parseFloat(d.style.top) + d._vy;
      if (y > 80) { d.remove(); return false; }
      d.style.top = y + 'px';
      return true;
    });
  }

  /* ── Umbrella ─────────────────────────────────────────────────── */
  function showUmbrella() {
    if (!D.umb) return;
    var b = ballCenter();
    /* Place umbrella ~130px to the right of ball */
    S.umbX = cl(b.x + 130, 10, window.innerWidth  - 80);
    S.umbY = cl(b.y - 40,  10, window.innerHeight - 60);
    D.umb.style.left    = S.umbX + 'px';
    D.umb.style.top     = S.umbY + 'px';
    D.umb.style.display = 'block';
    D.umb.style.opacity = '0';
    D.umb.style.transition = 'opacity .4s';
    setTimeout(function () { D.umb.style.opacity = '1'; }, 30);
  }

  function hideUmbrella() {
    if (!D.umb) return;
    D.umb.style.opacity = '0';
    setTimeout(function () {
      if (!S.raining) D.umb.style.display = 'none';
    }, 400);
    S.sheltered = false;
  }

  function checkShelter() {
    if (!S.raining || !D.umb || D.umb.style.display === 'none') return;
    var b  = ballCenter();
    /* umbrella center is roughly (umbX+36, umbY+26) */
    var ux = S.umbX + 36;
    var uy = S.umbY + 26;
    var d  = Math.hypot(ux - b.x, uy - b.y);
    if (d < 58) {
      if (!S.sheltered) {
        S.sheltered = true;
        D.umb.classList.add('sheltering');
        setMood('sheltered');
        spawnPt('hrt', 3);
        /* stop rain drops */
        rainDrops.forEach(function(d){ d.remove(); });
        rainDrops = [];
      }
    } else {
      if (S.sheltered) {
        S.sheltered = false;
        D.umb.classList.remove('sheltering');
        if (S.raining) setMood('sad');
      }
    }
  }

  function initUmbrellaDrag() {
    if (!D.umb) return;

    D.umb.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      S.umbDragging = true;
      S.umbDOX = e.clientX - S.umbX;
      S.umbDOY = e.clientY - S.umbY;
      D.umb.style.cursor = 'grabbing';
    });

    D.umb.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      var t = e.touches[0];
      S.umbDragging = true;
      S.umbDOX = t.clientX - S.umbX;
      S.umbDOY = t.clientY - S.umbY;
    }, { passive: true });

    document.addEventListener('mousemove', function (e) {
      if (!S.umbDragging) return;
      S.umbX = e.clientX - S.umbDOX;
      S.umbY = e.clientY - S.umbDOY;
      D.umb.style.left = S.umbX + 'px';
      D.umb.style.top  = S.umbY + 'px';
    });

    document.addEventListener('touchmove', function (e) {
      if (!S.umbDragging) return;
      var t = e.touches[0];
      S.umbX = t.clientX - S.umbDOX;
      S.umbY = t.clientY - S.umbDOY;
      D.umb.style.left = S.umbX + 'px';
      D.umb.style.top  = S.umbY + 'px';
    }, { passive: true });

    document.addEventListener('mouseup', function () {
      if (S.umbDragging) { S.umbDragging = false; D.umb.style.cursor = 'grab'; }
    });

    document.addEventListener('touchend', function () {
      S.umbDragging = false;
    });
  }

  /* ── Schedule rain ───────────────────────────────────────────── */
  function scheduleRain() {
    var delay = rn(C.RAIN_MIN, C.RAIN_MAX);
    setTimeout(function () {
      startRain();
      scheduleRain(); /* reschedule */
    }, delay);
  }

  /* ── Sleep management ────────────────────────────────────────── */
  var sleepCheckId = setInterval(function () {
    if (S.dragging || S.raining || S.umbDragging) return;
    var idle = Date.now() - S.idleSince;
    if (idle > C.SLEEP_AFTER && !S.sleeping) {
      S.sleeping = true;
      setMood('sleeping');
    }
  }, 5000);

  /* ── Apply DOM updates each frame ───────────────────────────── */
  function applyDOM() {
    if (!D.w) return;

    /* Idle float on wrapper (doesn't conflict with ball squish transform) */
    var sp2    = Math.hypot(S.vx, S.vy);
    var floatY = (sp2 < 0.6 && !S.dragging)
      ? Math.sin(Date.now() / 1350) * 3.5
      : 0;

    D.w.style.transform =
      'translate(' + Math.round(S.x) + 'px,' +
      (Math.round(S.y) + floatY).toFixed(1) + 'px)';

    /* Ball squish */
    if (D.ball) {
      D.ball.style.transform =
        'scaleX(' + S.sx.toFixed(3) + ') scaleY(' + S.sy.toFixed(3) + ')';
    }

    /* Pupils */
    if (D.pl) D.pl.style.transform = 'translate(' + S.plx.toFixed(1) + 'px,' + S.ply.toFixed(1) + 'px)';
    if (D.pr) D.pr.style.transform = 'translate(' + S.prx.toFixed(1) + 'px,' + S.pry.toFixed(1) + 'px)';
  }

  /* ── Main RAF tick ───────────────────────────────────────────── */
  function tick() {
    if (!S.dragging) {
      var d  = distMouse();
      var z  = getZone(d);

      /* Zone change */
      if (z !== S.zone) {
        onZoneChange(S.zone, z);
        S.zone = z;
      }

      /* Forces by zone */
      if (z === 'flee' || z === 'panic') {
        repulse();
      } else if (z === 'notice' || z === 'tease') {
        /* gently lean toward mouse */
        var b  = ballCenter();
        var dx = S.mx - b.x, dy = S.my - b.y;
        var dd = Math.hypot(dx, dy) || 1;
        S.vx += (dx / dd) * 0.055;
        S.vy += (dy / dd) * 0.035;
      } else if (z === 'alert') {
        /* back off */
        var ba  = ballCenter();
        var adx = ba.x - S.mx, ady = ba.y - S.my;
        var ad  = Math.hypot(adx, ady) || 1;
        S.vx += (adx / ad) * 0.65;
        S.vy += (ady / ad) * 0.45;
      }

      /* Autonomous wander when calm */
      if ((z === 'far' || z === 'notice') &&
          Date.now() - S.lastWander > S.wanderNext) {
        S.wanderNext = rn(C.WI_MIN, C.WI_MAX); /* set NEXT interval now */
        wander();
      }

      /* Spring to target */
      S.vx = S.vx * C.SD + (S.tx - S.x) * C.SK;
      S.vy = S.vy * C.SD + (S.ty - S.y) * C.SK;

      /* Speed cap */
      var sp = Math.hypot(S.vx, S.vy);
      if (sp > C.MSP) {
        S.vx = (S.vx / sp) * C.MSP;
        S.vy = (S.vy / sp) * C.MSP;
      }

      /* Move */
      var nx = S.x + S.vx;
      var ny = S.y + S.vy;
      var maxX = window.innerWidth  - C.WRAP - 4;
      var maxY = window.innerHeight - C.WRAP - 4;

      /* Wall bounce with squish */
      if (nx < 4)    { S.vx *= -0.55; nx = 4;    S.sxv = -0.8; }
      if (nx > maxX) { S.vx *= -0.55; nx = maxX; S.sxv = -0.8; }
      if (ny < 4)    { S.vy *= -0.55; ny = 4;    S.syv = -0.8; }
      if (ny > maxY) { S.vy *= -0.55; ny = maxY; S.syv = -0.8; }

      S.x = nx; S.y = ny;

      /* Squish based on velocity */
      tickSquish(sp, S.vx, S.vy);

      /* Arrive callback */
      if (S.onArrive && sp < 0.5 && Math.hypot(S.tx - S.x, S.ty - S.y) < 6) {
        var fn = S.onArrive; S.onArrive = null; fn();
      }
    }

    /* Sleeping zzz particles */
    if (S.mood === 'sleeping' && Date.now() - S.lastPt > 2200) {
      S.lastPt = Date.now();
      spawnPt('zzz', 1);
    }

    applyDOM();
    tickPupils();
    tickPts();
    if (S.raining) tickRain();
    checkShelter();

    requestAnimationFrame(tick);
  }

  /* ── Drag ────────────────────────────────────────────────────── */
  function initDrag() {
    var dox, doy;

    function dStart(mx, my) {
      S.dragging = true;
      dox = mx - S.x;
      doy = my - S.y;
      D.w.style.cursor = 'grabbing';
      S.sxv = -0.7; S.syv = 0.7;
    }
    function dMove(mx, my) {
      if (!S.dragging) return;
      var maxX = window.innerWidth  - C.WRAP - 4;
      var maxY = window.innerHeight - C.WRAP - 4;
      S.x  = cl(mx - dox, 4, maxX);
      S.y  = cl(my - doy, 4, maxY);
      S.tx = S.x; S.ty = S.y;
      S.vx = 0; S.vy = 0;
    }
    function dEnd() {
      if (!S.dragging) return;
      S.dragging = false;
      D.w.style.cursor = 'pointer';
      /* small bounce on release */
      S.vy = -3;
      S.sxv = 0.5; S.syv = -0.5;
    }

    D.w.addEventListener('mousedown', function (e) { e.preventDefault(); dStart(e.clientX, e.clientY); });
    D.w.addEventListener('touchstart', function (e) {
      e.preventDefault();
      dStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    document.addEventListener('mousemove', function (e) { dMove(e.clientX, e.clientY); });
    document.addEventListener('touchmove', function (e) {
      dMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    document.addEventListener('mouseup',  dEnd);
    document.addEventListener('touchend', dEnd);
  }

  /* ── Events ─────────────────────────────────────────────────── */
  window.addEventListener('mousemove', function (e) {
    S.mx = e.clientX;
    S.my = e.clientY;
    S.idleSince = Date.now();
    if (S.sleeping) {
      S.sleeping = false;
      setMood('curious');
      spawnPt('sp', 3);
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

  /* Exit intent — mouse leaving through top of page */
  document.addEventListener('mouseleave', function (e) {
    if (e.clientY < 15) {
      setMood('sad');
      spawnPt('hrt', 4);
      /* Wave arm */
      if (D.ball) {
        var arm = document.getElementById('h-wave-arm');
        if (!arm) {
          arm = document.createElement('div');
          arm.id = 'h-wave-arm';
          D.w.appendChild(arm);
        }
        arm.classList.remove('waving');
        void arm.offsetWidth; /* reflow */
        arm.classList.add('waving');
        setTimeout(function () {
          arm.classList.remove('waving');
          setMood('normal');
        }, 1800);
      }
    }
  });

  /* Scroll reaction */
  var lastSY = 0;
  window.addEventListener('scroll', function () {
    var sy = window.scrollY || document.documentElement.scrollTop;
    var spd = Math.abs(sy - lastSY);
    lastSY = sy;
    if (spd > 100) {
      S.sxv += (Math.random() - 0.5) * 0.8;
      S.syv += (Math.random() - 0.5) * 0.8;
    }
  }, { passive: true });

  /* Click on ball */
  window.addEventListener('click', function (e) {
    if (!D.w || !D.w.contains(e.target)) return;
    if (S.dragging) return;
    spawnPt('sp', 6);
    spawnPt('hrt', 2);
    S.sxv = -1.0; S.syv = 1.0;
    setMood('happy');
    setTimeout(function () { setMood('normal'); }, 1600);
  });

  /* Resize: clamp target */
  window.addEventListener('resize', function () {
    var maxX = window.innerWidth  - C.WRAP - 4;
    var maxY = window.innerHeight - C.WRAP - 4;
    S.tx = cl(S.tx, 4, maxX);
    S.ty = cl(S.ty, 4, maxY);
  });

  /* Page-specific behaviors (key moments only, no speech) */
  function pageReact() {
    if (!window.HC) return;
    var pg = window.HC.page;
    if (pg.is404) {
      /* confused squish loop on 404 */
      setTimeout(function () {
        S.sxv = -0.8; S.syv = 0.8;
        setMood('sad');
      }, 1500);
    } else if (pg.isProduct) {
      /* curious on product pages */
      setTimeout(function () { setMood('curious'); }, 2000);
    }
  }

  /* ── Star generation ─────────────────────────────────────────── */
  function buildStars() {
    if (!D.stars) return;
    for (var i = 0; i < 24; i++) {
      var s = document.createElement('div');
      s.className = 'h-star';
      var sz = rn(0.8, 2.5);
      s.style.cssText =
        'width:'     + sz       + 'px;' +
        'height:'    + sz       + 'px;' +
        'left:'      + rn(5,95) + '%;' +
        'top:'       + rn(5,95) + '%;' +
        'animation-delay:'    + rn(0, 4) + 's;' +
        'animation-duration:' + rn(1.2, 3.5) + 's;';
      D.stars.appendChild(s);
    }
  }

  /* ── Boot ────────────────────────────────────────────────────── */
  function boot() {
    D.w     = document.getElementById('h-w');
    D.ball  = document.getElementById('h-ball');
    D.pl    = document.getElementById('h-pl');
    D.pr    = document.getElementById('h-pr');
    D.stars = document.getElementById('h-stars');
    D.rain  = document.getElementById('h-rain');
    D.umb   = document.getElementById('h-umb');
    D.fx    = document.getElementById('h-fx');

    if (!D.w) return;

    /* ── Position: bottom-right corner to start ── */
    S.x = window.innerWidth  - C.WRAP - 28;
    S.y = window.innerHeight - C.WRAP - 28;
    S.tx = S.x; S.ty = S.y;
    D.w.style.transform = 'translate(' + S.x + 'px,' + S.y + 'px)';

    buildStars();
    applyTimeStyle();
    initDrag();
    initUmbrellaDrag();
    pageReact();
    scheduleRain();

    /* Hourly time-style refresh */
    setInterval(applyTimeStyle, 3600000);

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ── Public API ──────────────────────────────────────────────── */
  window.HarfoAI = {
    rain:  startRain,
    park:  parkHome,
    happy: function () { spawnPt('sp', 8); setMood('happy'); },
    go:    moveTo,
  };

})();
