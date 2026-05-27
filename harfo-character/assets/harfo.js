/* ════════════════════════════════════════════════════════════════
   حرفو v9.1 — Galaxy Jelly Ball · Physics + Intelligence Engine
   Zero external dependencies. Self-contained.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Config ── */
  var C = {
    WRAP: 120, BALL: 80, BOFF: 20,  /* wrapper / ball / ball-offset */

    /* Spring */
    SK: 0.055, SD: 0.80, MSP: 20,

    /* Squish spring */
    SQK: 0.18, SQD: 0.65, SQA: 0.32,

    /* Mouse zones (px from ball center) */
    ZN: 440, ZT: 280, ZA: 175, ZF: 118, ZP: 65,

    /* Forces */
    FF: 6.2, PF: 11.0,

    /* Wander timing (ms) */
    WLO: 3000, WHI: 7500,

    /* Sleep */
    SLP: 55000,
  };

  /* ── State ── */
  var S = {
    x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
    sx: 1, sy: 1, sxv: 0, syv: 0,
    mx: -9999, my: -9999,
    plx: 0, ply: 0, prx: 0, pry: 0,
    zone: 'far', mood: 'normal',
    drag: false, dox: 0, doy: 0,
    rain: false, shelter: false,
    sleeping: false,
    idleAt: Date.now(),
    lastWander: 0, nextWander: 1500,
    lastZzz: 0,
    ux: 0, uy: 0,  /* umbrella position */
    udrag: false, udox: 0, udoy: 0,
    onArrive: null,
  };

  /* ── DOM refs ── */
  var W, BALL, PL, PR, RAIN, UMB, FX, ARM_W, STARS;

  /* ── Utils ── */
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lr(a, b, t) { return a + (b - a) * t; }
  function rn(a, b)    { return a + Math.random() * (b - a); }

  function bCenter() {
    return { x: S.x + C.WRAP / 2, y: S.y + C.WRAP / 2 };
  }
  function dMouse() {
    if (S.mx < 0) return 1e9;
    var c = bCenter();
    return Math.hypot(S.mx - c.x, S.my - c.y);
  }
  function toZone(d) {
    if (d < C.ZP) return 'panic';
    if (d < C.ZF) return 'flee';
    if (d < C.ZA) return 'alert';
    if (d < C.ZT) return 'tease';
    if (d < C.ZN) return 'notice';
    return 'far';
  }
  function maxX() { return window.innerWidth  - C.WRAP - 4; }
  function maxY() { return window.innerHeight - C.WRAP - 4; }

  /* ── Mood ── */
  function mood(m) {
    if (!BALL || S.mood === m) return;
    S.mood = m;
    BALL.setAttribute('data-mood', m);
  }

  /* ── Movement ── */
  function goTo(x, y, cb) {
    S.tx = cl(x, 4, maxX());
    S.ty = cl(y, 4, maxY());
    S.onArrive = cb || null;
  }
  function parkHome() {
    goTo(window.innerWidth - C.WRAP - 28, window.innerHeight - C.WRAP - 28);
  }
  function wander() {
    if (S.drag) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    goTo(rn(vw * 0.1, vw * 0.85) - C.WRAP / 2,
         rn(vh * 0.1, vh * 0.82) - C.WRAP / 2);
    S.lastWander  = Date.now();
    S.nextWander  = rn(C.WLO, C.WHI);
  }

  /* ── Repulsion ── */
  function repulse() {
    var c = bCenter();
    var dx = c.x - S.mx, dy = c.y - S.my;
    var d = Math.hypot(dx, dy) || 1;
    var nx = dx / d, ny = dy / d;
    if (d < C.ZP) {
      var t = Math.pow((C.ZP - d) / C.ZP, 1.2);
      S.vx += nx * t * C.PF; S.vy += ny * t * C.PF * 0.6;
    } else {
      var t2 = Math.pow((C.ZF - d) / C.ZF, 1.5);
      S.vx += nx * t2 * C.FF; S.vy += ny * t2 * C.FF * 0.55;
    }
    S.sxv += ny * 0.6; S.syv += nx * 0.6;
  }

  /* ── Squish physics ── */
  function tickSquish(sp) {
    var ux = sp > 0.2 ? S.vx / sp : 0;
    var uy = sp > 0.2 ? S.vy / sp : 0;
    var k  = cl(sp * 0.025, 0, C.SQA);
    var tx = 1 + (ux * ux - uy * uy * 0.5) * k;
    var ty = 1 + (uy * uy - ux * ux * 0.5) * k;
    S.sxv = S.sxv * C.SQD + (tx - S.sx) * C.SQK;
    S.syv = S.syv * C.SQD + (ty - S.sy) * C.SQK;
    S.sx  = cl(S.sx + S.sxv, 0.60, 1.55);
    S.sy  = cl(S.sy + S.syv, 0.60, 1.55);
  }

  /* ── Pupil tracking ── */
  function tickPupils() {
    var tx = 0, ty = 0;
    if (S.mx > 0 && S.mood !== 'sleeping') {
      var c = bCenter();
      var dx = S.mx - c.x, dy = S.my - c.y;
      var d  = Math.hypot(dx, dy) || 1;
      var r  = cl(d / 90, 0, 1) * 5;
      tx = (dx / d) * r; ty = (dy / d) * r;
    }
    S.plx = lr(S.plx, tx, 0.14); S.ply = lr(S.ply, ty, 0.14);
    S.prx = lr(S.prx, tx, 0.14); S.pry = lr(S.pry, ty, 0.14);
  }

  /* ── Zone reactions ── */
  function onZone(prev, cur) {
    if (cur === 'panic' || cur === 'flee') {
      mood('scared');
      if (cur === 'panic') { S.sxv = -1.1; S.syv = 1.1; }
    } else if (cur === 'tease' || cur === 'notice') {
      mood('curious');
    } else if (cur === 'far') {
      if (prev === 'flee' || prev === 'panic') {
        mood('happy');
        spark(7); hearts(2);
        S.sxv = -0.9; S.syv = 0.9;
        setTimeout(function () { mood('normal'); }, 2200);
      } else { mood('normal'); }
    }
  }

  /* ── Time of day ── */
  function applyTime() {
    if (!BALL) return;
    var h = new Date().getHours();
    var t = h >= 6 && h < 12 ? 'morning' :
            h >= 12 && h < 18 ? 'afternoon' :
            h >= 18 && h < 22 ? 'evening'   : 'night';
    BALL.setAttribute('data-time', t);
    C.MSP  = t === 'night' ? 11 : t === 'morning' ? 24 : 20;
    C.WLO  = t === 'night' ? 6000 : t === 'morning' ? 2200 : 3000;
    C.WHI  = t === 'night' ? 14000 : t === 'morning' ? 4500 : 7500;
  }

  /* ── Particles ── */
  var pts = [];
  function mkPt(ch, cls, x, y) {
    if (!FX) return;
    var e = document.createElement('div');
    e.className = 'h-pt ' + cls;
    e.textContent = ch;
    e.style.left  = x + 'px';
    e.style.top   = y + 'px';
    e._vx = rn(-2.5, 2.5);
    e._vy = rn(-3.5, -1.2);
    e._life = rn(600, 1100);
    e._born = Date.now();
    FX.appendChild(e);
    pts.push(e);
  }
  function spark(n)  { var b = bCenter(); for (var i=0;i<n;i++) mkPt(['✦','✧','⋆','·'][0|rn(0,4)], 'h-pt-sp',  b.x-7, b.y-7); }
  function hearts(n) { var b = bCenter(); for (var i=0;i<n;i++) mkPt('♥', 'h-pt-hrt', b.x-6, b.y-6); }
  function zzz()     { var b = bCenter(); mkPt(['z','Z','ᶻ'][0|rn(0,3)], 'h-pt-zzz', b.x + rn(-10,10), b.y - 40); }

  function tickPts() {
    var now = Date.now();
    pts = pts.filter(function (p) {
      var age = now - p._born;
      if (age > p._life) { p.remove(); return false; }
      p._vy += 0.065;
      p.style.left = (parseFloat(p.style.left) + p._vx) + 'px';
      p.style.top  = (parseFloat(p.style.top)  + p._vy) + 'px';
      var t = age / p._life;
      p.style.opacity   = (1 - t * t).toFixed(2);
      p.style.transform = 'scale(' + (1 - t * 0.45).toFixed(2) + ')';
      return true;
    });
  }

  /* ── Rain ── */
  var rdrops = [], rInt = null;

  function startRain() {
    if (S.rain) return;
    S.rain = true;
    mood('sad');
    rInt = setInterval(mkRDrop, 55);
    setTimeout(showUmb, 2200);
    setTimeout(stopRain, 20000);
  }
  function stopRain() {
    if (!S.rain) return;
    S.rain = false;
    clearInterval(rInt); rInt = null;
    rdrops.forEach(function(d){ try { d.remove(); } catch(e){} });
    rdrops = [];
    hideUmb();
    if (S.mood === 'sad' || S.mood === 'sheltered') {
      mood('happy'); spark(5);
      setTimeout(function(){ mood('normal'); }, 1800);
    }
  }
  function mkRDrop() {
    if (!RAIN || S.shelter) return;
    var d = document.createElement('div');
    d.className = 'h-rdrop';
    var h = rn(8, 17);
    d.style.height = h + 'px';
    d.style.left   = rn(2, 75) + 'px';
    d.style.top    = '-5px';
    d._vy = rn(4, 7);
    RAIN.appendChild(d);
    rdrops.push(d);
  }
  function tickRain() {
    rdrops = rdrops.filter(function (d) {
      var y = parseFloat(d.style.top) + d._vy;
      if (y > 82) { try { d.remove(); } catch(e){} return false; }
      d.style.top = y + 'px';
      return true;
    });
  }
  function schedRain() {
    setTimeout(function(){ startRain(); schedRain(); }, rn(4*60000, 13*60000));
  }

  /* ── Umbrella ── */
  function showUmb() {
    if (!UMB) return;
    var c = bCenter();
    S.ux = cl(c.x + 130, 10, window.innerWidth  - 80);
    S.uy = cl(c.y - 40,  10, window.innerHeight - 60);
    UMB.style.left    = S.ux + 'px';
    UMB.style.top     = S.uy + 'px';
    UMB.style.display = 'block';
    UMB.style.opacity = '0';
    setTimeout(function(){ UMB.classList.add('h-umb-show'); }, 30);
  }
  function hideUmb() {
    if (!UMB) return;
    UMB.classList.remove('h-umb-show', 'h-umb-cover');
    setTimeout(function(){
      if (!S.rain) UMB.style.display = 'none';
    }, 420);
    S.shelter = false;
  }
  function chkShelter() {
    if (!S.rain || !UMB || UMB.style.display === 'none') { return; }
    var c = bCenter();
    var d = Math.hypot((S.ux + 36) - c.x, (S.uy + 26) - (c.y - 18));
    if (d < 56) {
      if (!S.shelter) {
        S.shelter = true;
        UMB.classList.add('h-umb-cover');
        mood('sheltered');
        hearts(4);
        rdrops.forEach(function(dr){ try{dr.remove();}catch(e){} });
        rdrops = [];
      }
    } else if (S.shelter) {
      S.shelter = false;
      UMB.classList.remove('h-umb-cover');
      if (S.rain) mood('sad');
    }
  }

  /* ── Apply DOM each frame ── */
  function applyDOM() {
    if (!W) return;
    var sp2 = Math.hypot(S.vx, S.vy);
    var fy  = (!S.drag && sp2 < 0.5) ? Math.sin(Date.now() / 1320) * 3.5 : 0;

    W.style.transform =
      'translate(' + (S.x | 0) + 'px,' + ((S.y | 0) + fy).toFixed(1) + 'px)';

    if (BALL)
      BALL.style.transform =
        'scaleX(' + S.sx.toFixed(3) + ') scaleY(' + S.sy.toFixed(3) + ')';

    if (PL) PL.style.transform = 'translate(' + S.plx.toFixed(1) + 'px,' + S.ply.toFixed(1) + 'px)';
    if (PR) PR.style.transform = 'translate(' + S.prx.toFixed(1) + 'px,' + S.pry.toFixed(1) + 'px)';
  }

  /* ── Main RAF loop ── */
  function tick() {
    try {
      if (!S.drag) {
        var d = dMouse();
        var z = toZone(d);

        if (z !== S.zone) { onZone(S.zone, z); S.zone = z; }

        /* zone forces */
        if (z === 'flee' || z === 'panic') {
          repulse();
        } else if (z === 'notice' || z === 'tease') {
          var c = bCenter();
          var dx = S.mx - c.x, dy = S.my - c.y;
          var dd = Math.hypot(dx, dy) || 1;
          S.vx += (dx/dd) * 0.055; S.vy += (dy/dd) * 0.032;
        } else if (z === 'alert') {
          var c2 = bCenter();
          var ax = c2.x - S.mx, ay = c2.y - S.my;
          var ad = Math.hypot(ax, ay) || 1;
          S.vx += (ax/ad) * 0.65; S.vy += (ay/ad) * 0.45;
        }

        /* autonomous wander */
        if ((z === 'far' || z === 'notice') &&
            Date.now() - S.lastWander > S.nextWander) {
          wander();
        }

        /* spring */
        S.vx = S.vx * C.SD + (S.tx - S.x) * C.SK;
        S.vy = S.vy * C.SD + (S.ty - S.y) * C.SK;

        /* speed cap */
        var sp = Math.hypot(S.vx, S.vy);
        if (sp > C.MSP) { S.vx = (S.vx/sp)*C.MSP; S.vy = (S.vy/sp)*C.MSP; }

        /* move + wall bounce */
        var nx = S.x + S.vx, ny = S.y + S.vy;
        var mxv = maxX(), myv = maxY();
        if (nx < 4)   { S.vx *= -0.52; nx = 4;   S.sxv = -0.75; }
        if (nx > mxv) { S.vx *= -0.52; nx = mxv; S.sxv = -0.75; }
        if (ny < 4)   { S.vy *= -0.52; ny = 4;   S.syv = -0.75; }
        if (ny > myv) { S.vy *= -0.52; ny = myv; S.syv = -0.75; }
        S.x = nx; S.y = ny;

        tickSquish(sp);

        /* arrive callback */
        if (S.onArrive && sp < 0.5 &&
            Math.hypot(S.tx - S.x, S.ty - S.y) < 6) {
          var fn = S.onArrive; S.onArrive = null; fn();
        }
      }

      /* sleeping zzz */
      if (S.sleeping && Date.now() - S.lastZzz > 2400) {
        S.lastZzz = Date.now();
        zzz();
      }

      applyDOM();
      tickPupils();
      tickPts();
      if (S.rain) tickRain();
      chkShelter();
    } catch (e) {
      /* swallow errors to keep RAF alive */
    }
    requestAnimationFrame(tick);
  }

  /* ── Drag ── */
  function initDrag() {
    function ds(mx, my) {
      S.drag = true;
      S.dox  = mx - S.x;
      S.doy  = my - S.y;
      W.style.cursor = 'grabbing';
      S.sxv = -0.7; S.syv = 0.7;
    }
    function dm(mx, my) {
      if (!S.drag) return;
      S.x  = cl(mx - S.dox, 4, maxX());
      S.y  = cl(my - S.doy, 4, maxY());
      S.tx = S.x; S.ty = S.y;
      S.vx = 0; S.vy = 0;
    }
    function de() {
      if (!S.drag) return;
      S.drag = false;
      W.style.cursor = 'pointer';
      S.vy -= 3;
      S.sxv = 0.6; S.syv = -0.6;
    }
    W.addEventListener('mousedown',  function(e){ if (!e.target.closest('button,a')) { e.preventDefault(); ds(e.clientX, e.clientY); } });
    W.addEventListener('touchstart', function(e){ e.preventDefault(); ds(e.touches[0].clientX, e.touches[0].clientY); }, { passive:false });
    document.addEventListener('mousemove',  function(e){ dm(e.clientX, e.clientY); });
    document.addEventListener('touchmove',  function(e){ if(S.drag) dm(e.touches[0].clientX, e.touches[0].clientY); }, { passive:true });
    document.addEventListener('mouseup',  de);
    document.addEventListener('touchend', de);
  }

  /* ── Umbrella drag ── */
  function initUmbDrag() {
    if (!UMB) return;
    UMB.addEventListener('mousedown', function(e){
      e.preventDefault(); e.stopPropagation();
      S.udrag = true; S.udox = e.clientX - S.ux; S.udoy = e.clientY - S.uy;
      UMB.style.cursor = 'grabbing';
    });
    UMB.addEventListener('touchstart', function(e){
      e.stopPropagation();
      S.udrag = true;
      S.udox = e.touches[0].clientX - S.ux;
      S.udoy = e.touches[0].clientY - S.uy;
    }, { passive:true });
    document.addEventListener('mousemove', function(e){
      if (!S.udrag) return;
      S.ux = e.clientX - S.udox; S.uy = e.clientY - S.udoy;
      UMB.style.left = S.ux + 'px'; UMB.style.top = S.uy + 'px';
    });
    document.addEventListener('touchmove', function(e){
      if (!S.udrag) return;
      S.ux = e.touches[0].clientX - S.udox; S.uy = e.touches[0].clientY - S.udoy;
      UMB.style.left = S.ux + 'px'; UMB.style.top = S.uy + 'px';
    }, { passive:true });
    document.addEventListener('mouseup',  function(){ if(S.udrag){ S.udrag=false; UMB.style.cursor='grab'; }});
    document.addEventListener('touchend', function(){ S.udrag = false; });
  }

  /* ── Stars ── */
  function buildStars() {
    if (!STARS) return;
    for (var i = 0; i < 26; i++) {
      var s  = document.createElement('div');
      s.className = 'h-star';
      var sz = rn(0.8, 2.6);
      s.style.cssText =
        'width:'+ sz +'px;height:'+ sz +'px;' +
        'left:'+ rn(5,92) +'%;top:'+ rn(5,92) +'%;' +
        'animation-delay:'+ rn(0,4) +'s;' +
        'animation-duration:'+ rn(1.4,3.8) +'s;';
      STARS.appendChild(s);
    }
  }

  /* ── Events ── */
  function initEvents() {
    /* mouse tracking */
    window.addEventListener('mousemove', function(e){
      S.mx = e.clientX; S.my = e.clientY;
      S.idleAt = Date.now();
      if (S.sleeping) { S.sleeping = false; mood('curious'); spark(3); }
    }, { passive:true });
    window.addEventListener('mouseleave', function(){ S.mx = -9999; S.my = -9999; });
    window.addEventListener('touchmove',  function(e){
      S.mx = e.touches[0].clientX; S.my = e.touches[0].clientY; S.idleAt = Date.now();
    }, { passive:true });

    /* exit intent */
    document.addEventListener('mouseleave', function(e){
      if (e.clientY < 15 && ARM_W) {
        mood('sad'); hearts(4);
        ARM_W.classList.remove('h-wave');
        void ARM_W.offsetWidth;
        ARM_W.classList.add('h-wave');
        setTimeout(function(){ ARM_W.classList.remove('h-wave'); mood('normal'); }, 2000);
      }
    });

    /* click ball */
    W.addEventListener('click', function(e){
      if (S.drag) return;
      e.stopPropagation();
      spark(7); hearts(2);
      S.sxv = -1.0; S.syv = 1.0;
      mood('happy');
      setTimeout(function(){ mood('normal'); }, 1500);
    });

    /* scroll jiggle */
    var lastSY = 0;
    window.addEventListener('scroll', function(){
      var sy = window.scrollY || 0;
      if (Math.abs(sy - lastSY) > 110) {
        S.sxv += (Math.random() - 0.5) * 0.9;
        S.syv += (Math.random() - 0.5) * 0.9;
      }
      lastSY = sy;
    }, { passive:true });

    /* resize */
    window.addEventListener('resize', function(){
      S.tx = cl(S.tx, 4, maxX()); S.ty = cl(S.ty, 4, maxY());
    });

    /* idle sleep check */
    setInterval(function(){
      if (S.drag || S.rain || S.udrag) return;
      if (Date.now() - S.idleAt > C.SLP && !S.sleeping) {
        S.sleeping = true; mood('sleeping');
      }
    }, 5000);

    /* page-specific reactions (key moments only) */
    if (window.HC && window.HC.page) {
      var pg = window.HC.page;
      if (pg.is404) {
        setTimeout(function(){ mood('sad'); S.sxv = -0.8; S.syv = 0.8; }, 1800);
      } else if (pg.isProduct) {
        setTimeout(function(){ mood('curious'); }, 2200);
      }
    }

    /* hourly time refresh */
    setInterval(applyTime, 3600000);
  }

  /* ── Boot ── */
  function boot() {
    W     = document.getElementById('h-w');
    BALL  = document.getElementById('h-ball');
    PL    = document.getElementById('h-pl');
    PR    = document.getElementById('h-pr');
    RAIN  = document.getElementById('h-rain');
    UMB   = document.getElementById('h-umb');
    FX    = document.getElementById('h-fx');
    ARM_W = document.getElementById('h-arm-w');
    STARS = document.getElementById('h-stars');

    if (!W || !BALL) return;  /* safety: DOM not ready */

    /* Set initial position BEFORE making visible */
    S.x  = window.innerWidth  - C.WRAP - 28;
    S.y  = window.innerHeight - C.WRAP - 28;
    S.tx = S.x; S.ty = S.y;
    W.style.transform = 'translate(' + S.x + 'px,' + S.y + 'px)';

    /* Now reveal */
    W.classList.add('h-ready');

    buildStars();
    applyTime();
    initDrag();
    initUmbDrag();
    initEvents();
    schedRain();

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ── Public API ── */
  window.HarfoAI = { rain: startRain, park: parkHome, happy: function(){ spark(9); mood('happy'); } };

})();
