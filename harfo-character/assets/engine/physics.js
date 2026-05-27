/* ======================================================
   حرفو v6 — Physics Engine
   Spring movement, mouse distance states, tease/flee
   ====================================================== */
(function (root) {
  'use strict';

  var CFG = {
    W: 120, H: 156,
    SPRING_K:  0.06,
    SPRING_D:  0.78,
    MAX_SPEED: 22,
    /* Mouse interaction zones (px from center of character) */
    ZONE_TEASE: 480,   // within this → start teasing
    ZONE_ALERT: 260,   // getting close
    ZONE_FLEE:  165,   // actively fleeing
    ZONE_PANIC: 90,    // max panic
    /* Flee/Panic force */
    FLEE_F:  4.8,
    PANIC_F: 8.5
  };

  /* ── Shared State ── */
  var S = {
    x: -300, y: 600,        // current position
    vx: 0,   vy: 0,          // velocity
    tx: 0,   ty: 0,          // spring target
    mx: -9999, my: -9999,   // mouse position
    zone: 'far',             // 'far' | 'tease' | 'alert' | 'flee' | 'panic'
    fleeing: false,
    dragging: false,
    walking: false,
    onArrive: null,
    lastZone: 'far',
    facing: 1,               // 1 = right, -1 = left
    idleSince: Date.now(),
    napping: false,
    orbiting: false,
    orbitAngle: 0,
    orbitR: 200,
    teaseTimer: 0,
    zonesEnabled: true
  };

  /* ── Mouse tracking ── */
  window.addEventListener('mousemove', function (e) {
    S.mx = e.clientX;
    S.my = e.clientY;
    S.idleSince = Date.now();
    if (S.napping) {
      S.napping = false;
      if (root.HarfoFX) root.HarfoFX.wakeup();
    }
  }, { passive: true });
  window.addEventListener('mouseleave', function () { S.mx = -9999; S.my = -9999; });
  window.addEventListener('touchmove', function (e) {
    S.mx = e.touches[0].clientX;
    S.my = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('resize', function () {
    Phys.clampTarget();
  });

  /* ── Helpers ── */
  function charCenter() {
    return { x: S.x + CFG.W / 2, y: S.y + CFG.H / 2 };
  }

  function distToMouse() {
    if (S.mx < 0) return Infinity;
    var c = charCenter();
    return Math.hypot(S.mx - c.x, S.my - c.y);
  }

  function calcZone(d) {
    if (d < CFG.ZONE_PANIC)  return 'panic';
    if (d < CFG.ZONE_FLEE)   return 'flee';
    if (d < CFG.ZONE_ALERT)  return 'alert';
    if (d < CFG.ZONE_TEASE)  return 'tease';
    return 'far';
  }

  /* ── Flee force ── */
  function applyRepulsion() {
    var c = charCenter();
    var dx = c.x - S.mx, dy = c.y - S.my;
    var d = Math.hypot(dx, dy);
    if (d < 1) return;

    if (d < CFG.ZONE_PANIC) {
      var t = Math.pow((CFG.ZONE_PANIC - d) / CFG.ZONE_PANIC, 1.2);
      S.vx += (dx / d) * t * CFG.PANIC_F;
      S.vy += (dy / d) * t * CFG.PANIC_F * 0.65;
    } else if (d < CFG.ZONE_FLEE) {
      var t2 = Math.pow((CFG.ZONE_FLEE - d) / CFG.ZONE_FLEE, 1.5);
      S.vx += (dx / d) * t2 * CFG.FLEE_F;
      S.vy += (dy / d) * t2 * CFG.FLEE_F * 0.55;
    }
  }

  /* ── Orbit logic ── */
  function applyOrbit() {
    if (!S.orbiting || S.mx < 0) return;
    S.orbitAngle += 0.025;
    S.tx = S.mx + Math.cos(S.orbitAngle) * S.orbitR - CFG.W / 2;
    S.ty = S.my + Math.sin(S.orbitAngle) * S.orbitR - CFG.H / 2;
  }

  /* ── Main physics tick ── */
  var Phys = {
    _wrap: null,

    init: function (wrap) {
      this._wrap = wrap;
      S.x = window.innerWidth - CFG.W - 32;
      S.y = window.innerHeight - CFG.H - 32;
      S.tx = S.x; S.ty = S.y;
      requestAnimationFrame(Phys.tick);
    },

    tick: function () {
      if (!S.dragging) {
        var d = distToMouse();
        var zone = S.zonesEnabled ? calcZone(d) : 'far';

        // Zone change events
        if (zone !== S.zone) {
          var prev = S.zone;
          S.zone = zone;
          if (root.HarfoFX) root.HarfoFX.onZoneChange(prev, zone);
        }

        // Apply repulsion
        if (zone === 'flee' || zone === 'panic') {
          applyRepulsion();
        }

        // Tease behavior: approach slowly from far
        if (zone === 'far' && S.mx > 0 && !S.orbiting && !S.napping) {
          var c = charCenter();
          var dx = S.mx - c.x, dy = S.my - c.y;
          var td = Math.hypot(dx, dy);
          if (td > CFG.ZONE_TEASE + 120 || Math.random() > 0.03) {
            // Do nothing — stay put
          } else {
            // Slowly creep toward mouse
            S.vx += (dx / td) * 0.045;
            S.vy += (dy / td) * 0.03;
          }
        }

        // Alert zone: slight backing up
        if (zone === 'alert') {
          var c2 = charCenter();
          var adx = c2.x - S.mx, ady = c2.y - S.my;
          var ad = Math.hypot(adx, ady) || 1;
          S.vx += (adx / ad) * 0.6;
          S.vy += (ady / ad) * 0.4;
        }

        applyOrbit();

        // Spring toward target
        S.vx = S.vx * CFG.SPRING_D + (S.tx - S.x) * CFG.SPRING_K;
        S.vy = S.vy * CFG.SPRING_D + (S.ty - S.y) * CFG.SPRING_K;

        // Cap speed
        var sp = Math.hypot(S.vx, S.vy);
        if (sp > CFG.MAX_SPEED) {
          S.vx = S.vx / sp * CFG.MAX_SPEED;
          S.vy = S.vy / sp * CFG.MAX_SPEED;
        }

        S.x += S.vx;
        S.y += S.vy;

        // Clamp in viewport
        S.x = Math.max(4, Math.min(window.innerWidth - CFG.W - 4, S.x));
        S.y = Math.max(4, Math.min(window.innerHeight - CFG.H - 4, S.y));

        // Facing direction
        if (Math.abs(S.vx) > 0.55) {
          var f = S.vx > 0 ? 1 : -1;
          if (f !== S.facing) {
            S.facing = f;
            if (Phys._wrap) {
              Phys._wrap.classList.toggle('hv-walk-l', f === -1 && S.walking);
              Phys._wrap.classList.toggle('hv-walk-r', f === 1  && S.walking);
            }
          }
        }

        // Arrived at target?
        if (S.walking && !S.orbiting &&
            Math.hypot(S.tx - S.x, S.ty - S.y) < 5 &&
            sp < 0.8) {
          S.walking = false;
          if (Phys._wrap) {
            Phys._wrap.classList.remove('hv-walk-r', 'hv-walk-l');
            Phys._wrap.classList.add('hv-idle');
          }
          if (S.onArrive) { var fn = S.onArrive; S.onArrive = null; fn(); }
        }
      }

      // Apply transform
      if (Phys._wrap) {
        Phys._wrap.style.transform =
          'translate(' + Math.round(S.x) + 'px,' + Math.round(S.y) + 'px)';
      }

      if (root.HarfoMorph) root.HarfoMorph.tick();

      requestAnimationFrame(Phys.tick);
    },

    clampTarget: function () {
      S.tx = Math.max(4, Math.min(window.innerWidth - CFG.W - 4, S.tx));
      S.ty = Math.max(4, Math.min(window.innerHeight - CFG.H - 4, S.ty));
    },

    moveTo: function (x, y, onArrive) {
      S.tx = Math.max(4, Math.min(window.innerWidth - CFG.W - 4, x));
      S.ty = Math.max(4, Math.min(window.innerHeight - CFG.H - 4, y));
      S.walking = true;
      S.onArrive = onArrive || null;
      S.orbiting = false;
      if (Phys._wrap) {
        Phys._wrap.classList.remove('hv-idle', 'hv-tease');
        Phys._wrap.classList.add(S.facing === 1 ? 'hv-walk-r' : 'hv-walk-l');
      }
    },

    parkHome: function () {
      S.orbiting = false;
      Phys.moveTo(
        window.innerWidth - CFG.W - 32,
        window.innerHeight - CFG.H - 32,
        function () { if (root.HarfoMorph) root.HarfoMorph.to('stand', 400); }
      );
    },

    stopWalk: function () {
      S.walking = false;
      S.onArrive = null;
      S.orbiting = false;
      if (Phys._wrap) Phys._wrap.classList.remove('hv-walk-r', 'hv-walk-l');
    },

    snapTo: function (x, y) {
      S.x = x; S.y = y;
      S.vx = 0; S.vy = 0;
      S.tx = x; S.ty = y;
    },

    orbit: function (r) {
      S.orbiting = true;
      S.orbitR = r || 220;
      S.orbitAngle = Math.random() * Math.PI * 2;
    },

    stopOrbit: function () {
      S.orbiting = false;
    },

    getCFG: function () { return CFG; },
    getState: function () { return S; }
  };

  root.HarfoPhys = Phys;
  root.HarfoS    = S;

}(window));
