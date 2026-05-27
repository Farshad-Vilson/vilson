/**
 * حرفو v7 — engine/morph.js
 * SVG path morphing engine.
 *
 * Depends on:
 *   window.HarfoShapes   (shapes.js) — { poses:{}, faces:{}, faceY:{} }
 *   window.HarfoFins     (shapes.js) — fin path strings indexed by pose
 *   window.HarfoShines   (shapes.js) — shine path strings indexed by pose
 *
 * All path data is expected in standard SVG <path d="..."> format.
 * Numbers are extracted, interpolated, and re-injected, preserving
 * non-numeric tokens (M, C, L, Z, etc.).
 */
;(function (win) {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     Path utilities
  ───────────────────────────────────────────────────────────── */

  /**
   * pathNums(p) → { template: string, nums: number[] }
   * Split an SVG path string into a re-usable template (where every
   * number is replaced by a '{n}' placeholder) and the number array.
   */
  function pathNums(p) {
    var nums = [];
    var template = p.replace(/[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/g, function (match) {
      nums.push(parseFloat(match));
      return '{n}';
    });
    return { template: template, nums: nums };
  }

  /**
   * buildPath(template, nums) → string
   * Reconstruct a path string by substituting numbers back into the
   * template produced by pathNums().
   */
  function buildPath(template, nums) {
    var i = 0;
    return template.replace(/\{n\}/g, function () {
      return nums[i++];
    });
  }

  /**
   * lerp(pathA, pathB, t) → string
   * Linear interpolation between two SVG paths that share the same
   * command structure.  pathA and pathB should be plain path strings.
   * Returns the interpolated path string.
   */
  function lerp(pathA, pathB, t) {
    var a = pathNums(pathA);
    var b = pathNums(pathB);
    var cnt = Math.min(a.nums.length, b.nums.length);
    var out = new Array(cnt);
    for (var i = 0; i < cnt; i++) {
      out[i] = a.nums[i] + (b.nums[i] - a.nums[i]) * t;
    }
    return buildPath(a.template, out);
  }

  /* ─────────────────────────────────────────────────────────────
     Easing
  ───────────────────────────────────────────────────────────── */

  /** Cubic ease-out: feels snappy and natural for a blob character */
  function easeOut(t) {
    var u = 1 - t;
    return 1 - u * u * u;
  }

  /* ─────────────────────────────────────────────────────────────
     Safe shape accessor
     Falls back to 'stand' / 'happy' if the requested key is missing.
  ───────────────────────────────────────────────────────────── */
  function getBodyPath(poseName) {
    var shapes = win.HarfoShapes;
    if (!shapes || !shapes.poses) { return ''; }
    return shapes.poses[poseName] || shapes.poses['stand'] || '';
  }

  function getFacePath(faceName) {
    var shapes = win.HarfoShapes;
    if (!shapes || !shapes.faces) { return ''; }
    return shapes.faces[faceName] || shapes.faces['happy'] || '';
  }

  function getFinPath(poseName) {
    var fins = win.HarfoFins;
    if (!fins) { return ''; }
    return fins[poseName] || fins['stand'] || '';
  }

  function getShinePath(poseName) {
    var shines = win.HarfoShines;
    if (!shines) { return ''; }
    return shines[poseName] || shines['stand'] || '';
  }

  function getFaceY(poseName) {
    var fy = win.HarfoFaceY;
    if (!fy) { return 0; }
    return fy[poseName] || 0;
  }

  /* ─────────────────────────────────────────────────────────────
     Public API
  ───────────────────────────────────────────────────────────── */
  var HarfoMorph = {

    /* ── Element references (set by init) ── */
    bodyEl:  null,
    finLEl:  null,
    finREl:  null,
    shineEl: null,
    faceEl:  null,

    /* ── Current morph state ── */
    fromPose:  'stand',
    toPose:    'stand',
    fromFace:  'happy',
    toFace:    'happy',
    t:         1,          // 0 → 1 progress; 1 = at destination
    duration:  350,        // ms
    startTime: 0,
    onDone:    null,

    /* ── Cached path strings for current from/to ── */
    _fromBodyPath:  '',
    _toBodyPath:    '',
    _fromFinPath:   '',
    _toFinPath:     '',
    _fromShinePath: '',
    _toShinePath:   '',
    _fromFacePath:  '',
    _toFacePath:    '',

    /* ─────────────────────────────────────────
       init(bodyEl, finLEl, finREl, shineEl, faceEl)
       Must be called before any morphs.
    ───────────────────────────────────────── */
    init: function (bodyEl, finLEl, finREl, shineEl, faceEl) {
      this.bodyEl  = bodyEl;
      this.finLEl  = finLEl;
      this.finREl  = finREl;
      this.shineEl = shineEl;
      this.faceEl  = faceEl;

      /* Snap to initial pose immediately */
      this.instant('stand', 'happy');
    },

    /* ─────────────────────────────────────────
       to(poseName, faceName, duration, callback)
       Begin a smooth morph to poseName/faceName.
       poseName and faceName are optional — pass
       null to keep the current value.
    ───────────────────────────────────────── */
    to: function (poseName, faceName, duration, callback) {
      poseName = poseName || this.toPose;
      faceName = faceName || this.toFace;

      /* If we're already heading there and not done, just update callback */
      if (poseName === this.toPose && faceName === this.toFace && this.t < 1) {
        this.onDone = callback || null;
        return;
      }

      /* Snapshot current interpolated state as new 'from' */
      var curT = easeOut(Math.min(this.t, 1));
      this._fromBodyPath  = this.t >= 1 ? getBodyPath(this.toPose)  : lerp(this._fromBodyPath,  this._toBodyPath,  curT);
      this._fromFinPath   = this.t >= 1 ? getFinPath(this.toPose)   : lerp(this._fromFinPath,   this._toFinPath,   curT);
      this._fromShinePath = this.t >= 1 ? getShinePath(this.toPose) : lerp(this._fromShinePath, this._toShinePath, curT);
      this._fromFacePath  = this.t >= 1 ? getFacePath(this.toFace)  : lerp(this._fromFacePath,  this._toFacePath,  curT);

      this.fromPose = this.toPose;
      this.fromFace = this.toFace;
      this.toPose   = poseName;
      this.toFace   = faceName;

      this._toBodyPath  = getBodyPath(poseName);
      this._toFinPath   = getFinPath(poseName);
      this._toShinePath = getShinePath(poseName);
      this._toFacePath  = getFacePath(faceName);

      this.t         = 0;
      this.duration  = (duration != null) ? duration : 350;
      this.startTime = performance.now();
      this.onDone    = callback || null;
    },

    /* ─────────────────────────────────────────
       instant(poseName, faceName)
       Jump immediately to pose/face with no
       animation.
    ───────────────────────────────────────── */
    instant: function (poseName, faceName) {
      poseName = poseName || 'stand';
      faceName = faceName || 'happy';

      this.fromPose = poseName;
      this.toPose   = poseName;
      this.fromFace = faceName;
      this.toFace   = faceName;

      this._fromBodyPath  = this._toBodyPath  = getBodyPath(poseName);
      this._fromFinPath   = this._toFinPath   = getFinPath(poseName);
      this._fromShinePath = this._toShinePath = getShinePath(poseName);
      this._fromFacePath  = this._toFacePath  = getFacePath(faceName);

      this.t = 1;
      this.onDone = null;

      this.apply(1);
    },

    /* ─────────────────────────────────────────
       curPose() — return the target pose name
    ───────────────────────────────────────── */
    curPose: function () {
      return this.toPose;
    },

    /* ─────────────────────────────────────────
       curFace() — return the target face name
    ───────────────────────────────────────── */
    curFace: function () {
      return this.toFace;
    },

    /* ─────────────────────────────────────────
       tick()
       Called every animation frame by physics.js.
       Advances t and calls apply().
    ───────────────────────────────────────── */
    tick: function () {
      if (this.t >= 1) { return; }

      var elapsed = performance.now() - this.startTime;
      this.t = this.duration > 0 ? Math.min(elapsed / this.duration, 1) : 1;

      this.apply(easeOut(this.t));

      if (this.t >= 1) {
        this.t = 1;
        if (this.onDone) {
          var cb = this.onDone;
          this.onDone = null;
          cb();
        }
      }
    },

    /* ─────────────────────────────────────────
       apply(easedT)
       Write the interpolated paths to the SVG
       elements.  easedT is already eased.
    ───────────────────────────────────────── */
    apply: function (easedT) {
      var t = easedT;

      /* Body */
      if (this.bodyEl && this._fromBodyPath && this._toBodyPath) {
        this.bodyEl.setAttribute('d', lerp(this._fromBodyPath, this._toBodyPath, t));
      }

      /* Left fin (mirrored via CSS transform on the SVG group) */
      if (this.finLEl && this._fromFinPath && this._toFinPath) {
        this.finLEl.setAttribute('d', lerp(this._fromFinPath, this._toFinPath, t));
      }

      /* Right fin */
      if (this.finREl && this._fromFinPath && this._toFinPath) {
        this.finREl.setAttribute('d', lerp(this._fromFinPath, this._toFinPath, t));
      }

      /* Shine */
      if (this.shineEl && this._fromShinePath && this._toShinePath) {
        this.shineEl.setAttribute('d', lerp(this._fromShinePath, this._toShinePath, t));
      }

      /* Face (eyes/mouth composite path) */
      if (this.faceEl && this._fromFacePath && this._toFacePath) {
        this.faceEl.setAttribute('d', lerp(this._fromFacePath, this._toFacePath, t));
      }

      /* Translate face group to match pose's vertical offset */
      if (this.faceEl) {
        var fromY = getFaceY(this.fromPose);
        var toY   = getFaceY(this.toPose);
        var faceOffsetY = fromY + (toY - fromY) * t;
        /* The face SVG group is expected to have a data-base-y attribute
           that stores its neutral Y.  We offset from there. */
        if (this.faceEl.parentNode) {
          var baseY = parseFloat(this.faceEl.parentNode.getAttribute('data-face-base-y') || 0);
          this.faceEl.setAttribute('transform', 'translate(0,' + (baseY + faceOffsetY) + ')');
        }
      }
    },

    /* ─────────────────────────────────────────
       Convenience shortcuts used by behaviour engine
    ───────────────────────────────────────── */
    setPose: function (poseName, dur, cb) {
      this.to(poseName, this.toFace, dur, cb);
    },

    setFace: function (faceName, dur, cb) {
      this.to(this.toPose, faceName, dur, cb);
    },

  };

  /* Expose helpers for external use */
  HarfoMorph.pathNums  = pathNums;
  HarfoMorph.buildPath = buildPath;
  HarfoMorph.lerp      = lerp;

  win.HarfoMorph = HarfoMorph;

}(window));
