/* ================================================================
   حرفو v7 — Tease & Flee Engine  (THE STAR MODULE)
   ─────────────────────────────────────────────────────────────────
   FAR   → character seeks mouse, teases, craves attention
   TEASE → playful approach; backs off if mouse moves in
   ALERT → nervous; sweat; starting to back away
   FLEE  → active fast flee; panic expression; speed lines
   PANIC → maximum flee; dizzy; funny text
   GONE  → mouse left viewport; celebration
   ================================================================ */
(function (W) {
  'use strict';

  /* ── shortcuts ── */
  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function $id(id)  { return document.getElementById(id); }

  /* ── Anim helpers (set by init) ── */
  var _wrap, _Phys, _State, _Morph, _Part, _Speech, _Toast;

  /* ── Inner state ── */
  var T = {
    zone:      'far',
    prevZone:  'far',
    seekTO:    null,
    teaseTO:   null,
    victoryDone: false,
    panicText:  ['نزن!','آخ!','کمک!','برو!','رفتم!','وای!','مرگم رسید!','نه نه نه!','پناه ببر!','داری میای؟!'],
    escapedText:['نجات!','آخیش!','فرار کردم!','پیروز شدم!','ایمن شدم!','برنده منم!','هی هی!','رفتی؟','داشتم غش می‌کردم!']
  };

  /* ── Face state helper ── */
  function face(state, dur) {
    if (!_wrap) return;
    var toRemove = [];
    _wrap.classList.forEach(function (c) { if (/^hs-/.test(c)) toRemove.push(c); });
    toRemove.forEach(function (c) { _wrap.classList.remove(c); });
    if (state) {
      _wrap.classList.add('hs-' + state);
      if (dur) setTimeout(function () { _wrap.classList.remove('hs-' + state); }, dur);
    }
  }

  function anim(cls, dur) {
    if (!_wrap) return;
    _wrap.classList.add(cls);
    if (dur) setTimeout(function () { _wrap.classList.remove(cls); }, dur);
  }

  /* ── Zone change reactor ── */
  function onZoneChange(prev, cur) {
    T.prevZone = prev;
    T.zone     = cur;
    clearTimeout(T.seekTO);
    clearTimeout(T.teaseTO);

    switch (cur) {

      /* ─── Mouse just entered tease range: get excited ─── */
      case 'tease':
        if (prev === 'far') {
          if (Math.random() < 0.65) {
            face('happy', 1000);
            anim('hv-bounce', 800);
          } else {
            face('wink', 900);
          }
          if (_Part && Math.random() < 0.4) _Part.sparks(3);
        }
        /* Start active tease loop */
        T.teaseTO = setTimeout(doTeaseAction, 600 + Math.random() * 1200);
        break;

      /* ─── Getting too close: nervous ─── */
      case 'alert':
        face('scared', 0);
        anim('hv-wiggle', 700);
        /* sweat drop */
        if (_Part) _Part.emit('sweat', 1);
        break;

      /* ─── Actively fleeing ─── */
      case 'flee':
        face('scared', 0);
        anim('hv-panic', 1000);
        if (_wrap) _wrap.classList.add('hv-flee');
        setTimeout(function () { if (_wrap) _wrap.classList.remove('hv-flee'); }, 1400);
        if (_Part && Math.random() < 0.55) {
          var t = rnd(T.panicText);
          _Part.text(t);
        }
        if (_Morph) _Morph.to('crouch', 300);
        T.victoryDone = false;
        break;

      /* ─── Maximum panic ─── */
      case 'panic':
        face('dizzy', 0);
        anim('hv-panic', 0);
        if (_wrap) _wrap.classList.add('hv-flee');
        if (_Part) {
          _Part.text(rnd(T.panicText));
          _Part.emit('sweat', 2);
        }
        T.victoryDone = false;
        break;

      /* ─── Mouse retreated — CELEBRATE ─── */
      case 'far':
        if (_wrap) _wrap.classList.remove('hv-flee');
        if (prev === 'flee' || prev === 'panic' || prev === 'alert') {
          if (!T.victoryDone) {
            T.victoryDone = true;
            setTimeout(function () {
              face('happy', 2000);
              anim('hv-bounce', 900);
              if (_Part) {
                _Part.sparks(6);
                _Part.text(rnd(T.escapedText));
              }
              if (_Morph) _Morph.to('stand', 500);
              /* Return home */
              if (_Phys) _Phys.parkHome();
            }, 400);
          }
        }
        /* Begin seeking/teasing from far */
        T.seekTO = setTimeout(startSeek, 3500 + Math.random() * 3000);
        break;
    }
  }

  /* ─── Tease Action (called repeatedly while in tease zone) ─── */
  function doTeaseAction() {
    if (T.zone !== 'tease' || !_wrap) return;

    var cfg = W.HarfoState ? W.HarfoState.cfg : {};
    var actions = [
      function () { /* wink */
        face('wink', 900);
        anim('hv-nod', 800);
      },
      function () { /* tongue out */
        face('tease', 1400);
        anim('hv-tease', 1400);
        if (_Part) _Part.text('😝');
      },
      function () { /* love eyes */
        face('love', 1500);
        if (_Part) _Part.hearts(3);
        anim('hv-bounce', 700);
      },
      function () { /* happy bounce */
        face('happy', 1200);
        anim('hv-bounce', 900);
        if (_Part) _Part.sparks(4);
      },
      function () { /* spin */
        face('happy', 1000);
        anim('hv-spin', 1000);
        if (_Part) _Part.sparks(5);
      },
      function () { /* creep approach then back off */
        if (!_Phys || !_State) return;
        var S = _State;
        var origTx = S.pos.tx, origTy = S.pos.ty;
        var mx = S.mouse.x, my = S.mouse.y;
        if (mx < 0) return;
        face('tease', 1800);
        anim('hv-tease', 1800);
        var midX = S.pos.x + (mx - S.pos.x) * 0.3 - 61;
        var midY = S.pos.y + (my - S.pos.y) * 0.3 - 80;
        _Phys.moveTo(midX, midY, function () {
          face('wow', 600);
          _Phys.moveTo(origTx, origTy);
        });
      },
      function () { /* peek pose */
        if (_Morph) {
          _Morph.to('peek', 400);
          setTimeout(function () { _Morph.to('stand', 400); }, 1600);
        }
        face('wink', 900);
      },
      function () { /* text attention */
        if (_Part) _Part.text(rnd(['هی!', 'اینجام!', 'یه نگاه!', 'بیا بازی!', 'می‌بینمت!']));
        anim('hv-wiggle', 800);
        face('tease', 1000);
      }
    ];

    rnd(actions)();

    /* Schedule next tease if still in zone */
    T.teaseTO = setTimeout(doTeaseAction, 2200 + Math.random() * 2800);
  }

  /* ─── Seek behavior: approach mouse from far ─── */
  function startSeek() {
    if (T.zone !== 'far' || !_Phys || !_State) return;
    var S = _State;
    var mx = S.mouse.x, my = S.mouse.y;
    if (mx < 0) return;

    var dist = Math.hypot(mx - (S.pos.x + 61), my - (S.pos.y + 80));
    if (dist < 300) { /* already close enough, no need to seek */
      T.seekTO = setTimeout(startSeek, 5000);
      return;
    }

    /* Move toward mouse but stop at safe distance */
    var safeD = 340;
    var ang   = Math.atan2((S.pos.y + 80) - my, (S.pos.x + 61) - mx);
    var destX = mx + Math.cos(ang) * safeD - 61;
    var destY = my + Math.sin(ang) * safeD - 80;

    /* Do an attention-getting animation before moving */
    var preActions = [
      function () { anim('hv-bounce', 700); face('happy', 800); },
      function () { if (_Part) _Part.text(rnd(['هی!','اینجام!','یه نگاه!'])); anim('hv-wiggle', 700); },
      function () { if (_Part) _Part.sparks(4); face('tease', 900); }
    ];
    rnd(preActions)();

    setTimeout(function () {
      if (T.zone !== 'far') return;
      _Phys.moveTo(destX, destY);
    }, 600);
  }

  /* ─── React to idle (user not moving mouse) ─── */
  function onUserIdle(idleMs) {
    if (T.zone !== 'far' || !_wrap) return;

    if (idleMs > 6000 && idleMs < 8000) {
      /* First nudge: approach */
      startSeek();
    } else if (idleMs > 15000 && idleMs < 17000) {
      /* Second nudge: say something */
      if (_Speech) {
        var phrase = W.HarfoPhrases && W.HarfoPhrases.tease_far
          ? rnd(W.HarfoPhrases.tease_far) : 'هی! منم اینجام!';
        _Speech.say(phrase, { force: true });
      }
      face('tease', 1500);
      anim('hv-tease', 1500);
    } else if (idleMs > 30000 && idleMs < 32000) {
      /* Third nudge: exclamation + dance */
      if (_wrap) {
        _wrap.classList.add('hv-exclaim');
        setTimeout(function () { _wrap && _wrap.classList.remove('hv-exclaim'); }, 900);
      }
      anim('hv-dance', 1800);
      face('happy', 1800);
      if (_Part) { _Part.sparks(5); _Part.hearts(2); }
    }
  }

  /* ── Public API ── */
  var Tease = {
    init: function (wrapEl, phys, state, morph, part, speech, toast) {
      _wrap    = wrapEl;
      _Phys    = phys;
      _State   = state;
      _Morph   = morph;
      _Part    = part;
      _Speech  = speech;
      _Toast   = toast;
    },
    onZoneChange: onZoneChange,
    onUserIdle:   onUserIdle,
    face:  face,
    anim:  anim
  };

  /* Expose zone-change handler globally for physics engine */
  W.HarfoFX = W.HarfoFX || {};
  W.HarfoFX.onZoneChange = onZoneChange;

  W.HarfoTease = Tease;

}(window));
