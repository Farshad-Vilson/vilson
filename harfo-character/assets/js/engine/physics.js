/**
 * حرفو v7 — engine/physics.js
 * Spring-based movement, zone detection, and the main RAF loop.
 *
 * Depends on:
 *   window.HarfoState   (engine/state.js)
 *   window.HarfoMorph   (engine/morph.js)   — optional, called if present
 *   window.HarfoFX      (external)           — optional, called on zone change
 */
;(function (win) {
  'use strict';

  /* ─── internal refs ─── */
  var _wrapEl   = null;   // the outer .h-wrap DOM element
  var _rafId    = null;   // requestAnimationFrame handle
  var _running  = false;

  /* ─── orbit state ─── */
  var _orbit = {
    active: false,
    radius: 120,
    angle: 0,
    speed: 0.018,   // radians per frame
  };

  /* ─── arrive callback ─── */
  var _onArrive = null;

  /* ─────────────────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────────────────── */
  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function dist(ax, ay, bx, by) {
    var dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* Return the zone name for a given pixel distance from the character
     centre to the mouse cursor. */
  function zoneForDistance(d) {
    var cfg = HarfoState.config;
    if (d < cfg.ZONE_PANIC)  { return 'panic'; }
    if (d < cfg.ZONE_FLEE)   { return 'flee';  }
    if (d < cfg.ZONE_ALERT)  { return 'alert'; }
    if (d < cfg.ZONE_TEASE)  { return 'tease'; }
    if (d < cfg.ZONE_SEEK)   { return 'seek';  }
    return 'far';
  }

  /* Centre of the wrap element in viewport coords */
  function centreX() { return HarfoState.position.x + HarfoState.config.W * 0.5; }
  function centreY() { return HarfoState.position.y + HarfoState.config.H * 0.5; }

  /* viewport dimensions */
  function vpW() { return win.innerWidth  || document.documentElement.clientWidth  || 800; }
  function vpH() { return win.innerHeight || document.documentElement.clientHeight || 600; }

  /* ─────────────────────────────────────────────────────────────
     Input listeners (mouse + touch)
  ───────────────────────────────────────────────────────────── */
  function attachInputListeners() {
    var ms = HarfoState.mouse;

    document.addEventListener('mousemove', function (e) {
      ms.x = e.clientX;
      ms.y = e.clientY;
      // Any mouse movement resets the idle clock
      HarfoState.timing.idleSince = Date.now();
      // Wake up from nap on mouse movement
      if (HarfoState.flags.napping) {
        HarfoState.setFlag('napping', false);
        if (win.HarfoSpeech && win.HarfoPhrases) {
          var pool = win.HarfoPhrases.wake_up;
          if (pool && pool.length) {
            win.HarfoSpeech.say(pool[Math.floor(Math.random() * pool.length)], { force: true });
          }
        }
      }
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches.length > 0) {
        ms.x = e.touches[0].clientX;
        ms.y = e.touches[0].clientY;
        HarfoState.timing.idleSince = Date.now();
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      ms.x = -9999;
      ms.y = -9999;
    });

    document.addEventListener('touchend', function () {
      ms.x = -9999;
      ms.y = -9999;
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────────
     Physics tick — called every animation frame
  ───────────────────────────────────────────────────────────── */
  function tick() {
    if (!_running) { return; }
    _rafId = requestAnimationFrame(tick);

    var st  = HarfoState;
    var pos = st.position;
    var ms  = st.mouse;
    var cfg = st.config;
    var flg = st.flags;

    /* 1. Character centre */
    var cx = centreX();
    var cy = centreY();

    /* 2. Distance and zone (skip if mouse is off-screen) */
    var d = dist(cx, cy, ms.x, ms.y);
    ms.distance = d;

    var newZone = (ms.x < 0) ? 'far' : zoneForDistance(d);
    var zoneChanged = st.setZone(newZone);

    /* 3. Zone change side-effects */
    if (zoneChanged) {
      HarfoPhysics.onZoneChange(ms.prevZone, newZone);
    }

    /* 4. Skip force/target updates while dragging */
    if (!flg.dragging) {

      /* ── Orbit mode overrides everything ── */
      if (_orbit.active && ms.x > 0) {
        _orbit.angle += _orbit.speed;
        pos.tx = ms.x + Math.cos(_orbit.angle) * _orbit.radius - cfg.W * 0.5;
        pos.ty = ms.y + Math.sin(_orbit.angle) * _orbit.radius - cfg.H * 0.5;
        flg.walking = true;
      } else if (!flg.walking) {
        /* ── Autonomous target based on zone ── */
        applyZoneForces(d, cx, cy, ms.x, ms.y, cfg, pos, flg);
      }

      /* 5. Spring toward target */
      var fx = (pos.tx - pos.x) * cfg.SPRING_K;
      var fy = (pos.ty - pos.y) * cfg.SPRING_K;

      pos.vx = (pos.vx + fx) * cfg.SPRING_D;
      pos.vy = (pos.vy + fy) * cfg.SPRING_D;

      /* 6. Cap speed */
      var speed = Math.sqrt(pos.vx * pos.vx + pos.vy * pos.vy);
      if (speed > cfg.MAX_SPEED) {
        var ratio = cfg.MAX_SPEED / speed;
        pos.vx *= ratio;
        pos.vy *= ratio;
      }

      /* 7. Integrate */
      pos.x += pos.vx;
      pos.y += pos.vy;

      /* 8. Clamp to viewport */
      var maxX = vpW() - cfg.W;
      var maxY = vpH() - cfg.H;
      pos.x = clamp(pos.x, 0, maxX);
      pos.y = clamp(pos.y, 0, maxY);

      /* If we hit a wall, kill velocity in that axis */
      if (pos.x <= 0 || pos.x >= maxX) { pos.vx *= -0.3; }
      if (pos.y <= 0 || pos.y >= maxY) { pos.vy *= -0.3; }

      /* 9. Facing direction */
      updateFacing(pos.vx);

      /* 10. Arrive check */
      if (flg.walking) {
        var walkDist = dist(pos.x, pos.y, pos.tx, pos.ty);
        if (walkDist < 6) {
          pos.vx = 0;
          pos.vy = 0;
          flg.walking = false;
          if (_onArrive) {
            var cb = _onArrive;
            _onArrive = null;
            cb();
          }
        }
      }

      /* 11. Nap check */
      if (!flg.napping && !flg.walking && !flg.fleeing && !flg.talking) {
        if (st.idleMs() >= cfg.NAP_AFTER) {
          HarfoPhysics.startNap();
        }
      }
    }

    /* 12. Apply transform */
    if (_wrapEl) {
      _wrapEl.style.transform = 'translate(' + Math.round(pos.x) + 'px,' + Math.round(pos.y) + 'px)';
    }

    /* 13. Delegate to morph engine */
    if (win.HarfoMorph && win.HarfoMorph.tick) {
      win.HarfoMorph.tick();
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Zone-based autonomous force / target calculation
  ───────────────────────────────────────────────────────────── */
  function applyZoneForces(d, cx, cy, mx, my, cfg, pos, flg) {
    var zone = HarfoState.mouse.zone;

    /* Direction from character to mouse */
    var ndx = (mx - cx) / (d || 1);
    var ndy = (my - cy) / (d || 1);

    if (zone === 'panic') {
      /* Strong repulsion — character teleports away */
      /* (HarfoPhysics.onZoneChange handles the immediate teleport) */
      pos.tx = pos.x - ndx * 220;
      pos.ty = pos.y - ndy * 220;
      pos.tx = clamp(pos.tx, 0, vpW() - cfg.W);
      pos.ty = clamp(pos.ty, 0, vpH() - cfg.H);
      flg.fleeing = true;

    } else if (zone === 'flee') {
      /* Run away */
      pos.tx = pos.x - ndx * 160;
      pos.ty = pos.y - ndy * 160;
      pos.tx = clamp(pos.tx, 0, vpW() - cfg.W);
      pos.ty = clamp(pos.ty, 0, vpH() - cfg.H);
      flg.fleeing = true;

    } else if (zone === 'alert') {
      /* Gently back away, keep distance */
      pos.tx = pos.x - ndx * 60;
      pos.ty = pos.y - ndy * 60;
      pos.tx = clamp(pos.tx, 0, vpW() - cfg.W);
      pos.ty = clamp(pos.ty, 0, vpH() - cfg.H);
      flg.fleeing = false;

    } else if (zone === 'tease') {
      /* Medium approach with side oscillation */
      var oscillation = Math.sin(Date.now() * 0.003) * 28;
      var perp_x = -ndy, perp_y = ndx;  // perpendicular to approach vector
      pos.tx = mx - cfg.W * 0.5 + perp_x * oscillation;
      pos.ty = my - cfg.H * 0.5 + perp_y * oscillation;
      pos.tx = clamp(pos.tx, 0, vpW() - cfg.W);
      pos.ty = clamp(pos.ty, 0, vpH() - cfg.H);
      flg.fleeing = false;

    } else if (zone === 'seek') {
      /* Slow drift toward mouse */
      pos.tx = pos.x + (mx - cfg.W * 0.5 - pos.x) * cfg.SEEK_SPEED;
      pos.ty = pos.y + (my - cfg.H * 0.5 - pos.y) * cfg.SEEK_SPEED;
      flg.fleeing = false;

    } else {
      /* Far / any — stop fleeing, no autonomous target */
      flg.fleeing = false;
      /* Keep current target so character idles where it is */
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Facing direction
  ───────────────────────────────────────────────────────────── */
  function updateFacing(vx) {
    if (!_wrapEl) { return; }
    if (Math.abs(vx) < 0.5) { return; }  // dead-zone
    if (vx < 0) {
      _wrapEl.classList.add('hv-flip');
    } else {
      _wrapEl.classList.remove('hv-flip');
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Nap
  ───────────────────────────────────────────────────────────── */
  function startNap() {
    if (HarfoState.flags.napping) { return; }
    HarfoState.setFlag('napping', true);
    HarfoState.timing.napAt = Date.now();
    if (_wrapEl) { _wrapEl.classList.add('hv-nap'); }
    if (win.HarfoMorph) { win.HarfoMorph.to('sit', 600); }
    if (win.HarfoSpeech && win.HarfoPhrases) {
      var pool = win.HarfoPhrases.idle_nap;
      if (pool && pool.length) {
        win.HarfoSpeech.say(pool[Math.floor(Math.random() * pool.length)], { force: true, dur: 3500 });
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Public API
  ───────────────────────────────────────────────────────────── */
  var HarfoPhysics = {

    /* ── init(wrapEl)
       Call after DOM is ready.  Positions character at
       bottom-right and starts the RAF loop. ── */
    init: function (wrapEl) {
      _wrapEl = wrapEl;
      HarfoState.init();
      attachInputListeners();

      /* Start at bottom-right corner */
      var vw = vpW(), vh = vpH();
      var cfg = HarfoState.config;
      HarfoState.position.x  = vw - cfg.W - 24;
      HarfoState.position.y  = vh - cfg.H - 24;
      HarfoState.position.tx = HarfoState.position.x;
      HarfoState.position.ty = HarfoState.position.y;

      _running = true;
      _rafId = requestAnimationFrame(tick);
    },

    /* ── stop() — pause the loop ── */
    stop: function () {
      _running = false;
      if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    },

    /* ── resume() ── */
    resume: function () {
      if (_running) { return; }
      _running = true;
      _rafId = requestAnimationFrame(tick);
    },

    /* ── moveTo(x, y, callback)
       Walk the character to absolute viewport position.
       callback fires when close enough. ── */
    moveTo: function (x, y, callback) {
      var cfg = HarfoState.config;
      HarfoState.position.tx = clamp(x, 0, vpW() - cfg.W);
      HarfoState.position.ty = clamp(y, 0, vpH() - cfg.H);
      HarfoState.setFlag('walking', true);
      _onArrive = callback || null;
    },

    /* ── snapTo(x, y) — instant teleport ── */
    snapTo: function (x, y) {
      var cfg = HarfoState.config;
      var nx = clamp(x, 0, vpW() - cfg.W);
      var ny = clamp(y, 0, vpH() - cfg.H);
      HarfoState.position.x  = nx;
      HarfoState.position.y  = ny;
      HarfoState.position.tx = nx;
      HarfoState.position.ty = ny;
      HarfoState.position.vx = 0;
      HarfoState.position.vy = 0;
      if (_wrapEl) {
        _wrapEl.style.transform = 'translate(' + Math.round(nx) + 'px,' + Math.round(ny) + 'px)';
      }
    },

    /* ── parkHome() — move to bottom-right corner ── */
    parkHome: function () {
      var cfg = HarfoState.config;
      var vw = vpW(), vh = vpH();
      this.moveTo(vw - cfg.W - 24, vh - cfg.H - 24);
    },

    /* ── randomPos() — pick a random safe viewport position ── */
    randomPos: function () {
      var cfg = HarfoState.config;
      var vw = vpW(), vh = vpH();
      return {
        x: Math.random() * (vw - cfg.W - 40) + 20,
        y: Math.random() * (vh - cfg.H - 40) + 20,
      };
    },

    /* ── startOrbit(radius) — orbit the mouse ── */
    startOrbit: function (radius) {
      _orbit.active = true;
      _orbit.radius = radius || 120;
      _orbit.angle  = 0;
    },

    /* ── stopOrbit() ── */
    stopOrbit: function () {
      _orbit.active = false;
    },

    /* ── startNap() — externally trigger nap ── */
    startNap: startNap,

    /* ── onZoneChange(prev, cur)
       Called automatically when zone transitions.
       Notifies HarfoFX and handles panic teleport. ── */
    onZoneChange: function (prev, cur) {
      /* Notify visual FX layer */
      if (win.HarfoFX && win.HarfoFX.onZone) {
        win.HarfoFX.onZone(prev, cur);
      }

      /* Panic → immediately teleport to a safe corner */
      if (cur === 'panic') {
        var pos = HarfoState.position;
        var cfg = HarfoState.config;
        var vw  = vpW(), vh = vpH();

        /* Find the farthest viewport corner from the current mouse */
        var mx = HarfoState.mouse.x, my = HarfoState.mouse.y;
        var corners = [
          { x: 20,          y: 20           },
          { x: vw - cfg.W - 20, y: 20       },
          { x: 20,          y: vh - cfg.H - 20 },
          { x: vw - cfg.W - 20, y: vh - cfg.H - 20 },
        ];
        var best = corners[0], bestD = 0;
        for (var i = 0; i < corners.length; i++) {
          var cd = dist(corners[i].x + cfg.W * 0.5, corners[i].y + cfg.H * 0.5, mx, my);
          if (cd > bestD) { bestD = cd; best = corners[i]; }
        }
        HarfoPhysics.snapTo(best.x, best.y);

        /* Emit particles + sound via FX */
        if (win.HarfoParticles && win.HarfoParticles.burst) {
          win.HarfoParticles.burst(pos.x + cfg.W * 0.5, pos.y + cfg.H * 0.5, 10);
        }
        /* Say a flee phrase */
        if (win.HarfoSpeech && win.HarfoPhrases) {
          var pool = win.HarfoPhrases.flee_caught;
          if (pool && pool.length) {
            win.HarfoSpeech.say(pool[Math.floor(Math.random() * pool.length)], { force: true, dur: 1800 });
          }
        }
        return;
      }

      /* Escaped from flee zone → say escaped phrase */
      if ((prev === 'flee' || prev === 'panic') && HarfoState.isCloserThan('alert', cur) === false) {
        if (win.HarfoSpeech && win.HarfoPhrases) {
          var escPool = win.HarfoPhrases.flee_escaped;
          if (escPool && escPool.length) {
            win.HarfoSpeech.say(escPool[Math.floor(Math.random() * escPool.length)],
              { force: true, dur: 2200 });
          }
        }
      }

      /* Tease zone entered → say tease phrase */
      if (cur === 'tease' && (prev === 'far' || prev === 'seek' || prev === 'any')) {
        if (win.HarfoSpeech && win.HarfoPhrases) {
          var teasePool = win.HarfoPhrases.tease_far;
          if (teasePool && teasePool.length) {
            win.HarfoSpeech.say(teasePool[Math.floor(Math.random() * teasePool.length)],
              { dur: 2000 });
          }
        }
      }
    },

  };

  win.HarfoPhysics = HarfoPhysics;

}(window));
