/* ======================================================
   حرفو v6 — Morph Engine
   SVG body shape library + smooth interpolation
   ====================================================== */
(function (root) {
  'use strict';

  /* ─── Shape Library ─────────────────────────────────
     All paths MUST have identical command structure.
     Template: M x,y C x,y x,y x,y C x,y x,y x,y C x,y x,y x,y C x,y x,y x,y Z
     = 2 + 4×6 = 26 numbers per path.
     viewBox: 0 0 200 240
  ─────────────────────────────────────────────────── */
  var SHAPES = {
    /* Upright jelly — default */
    stand:  "M100,18 C148,18 166,58 157,114 C148,170 130,194 130,228 C130,248 70,248 70,228 C70,194 52,170 43,114 C34,58 52,18 100,18 Z",
    /* Sitting — base wider, shorter body */
    sit:    "M100,44 C158,44 174,80 166,126 C158,166 150,186 150,222 C150,248 50,248 50,222 C50,186 42,166 34,126 C26,80 42,44 100,44 Z",
    /* Puddle / sleeping flat */
    puddle: "M100,164 C174,164 194,186 184,214 C174,238 158,250 148,254 C138,258 62,258 52,254 C42,250 26,238 16,214 C6,186 26,164 100,164 Z",
    /* Drape over horizontal bar */
    drape:  "M100,82 C190,82 196,130 188,168 C180,204 166,236 148,246 C130,254 70,254 52,246 C34,236 20,204 12,168 C4,130 10,82 100,82 Z",
    /* Peeking up (tall and narrow) */
    peek:   "M100,10 C140,10 155,50 150,110 C144,170 128,210 122,230 C116,248 84,248 78,230 C72,210 56,170 50,110 C45,50 60,10 100,10 Z",
    /* Crouching — scared/alert */
    crouch: "M100,58 C160,58 176,90 168,134 C160,172 154,196 154,226 C154,250 46,250 46,226 C46,196 40,172 32,134 C24,90 40,58 100,58 Z",
    /* Stretch up — fast movement */
    tall:   "M100,4  C145,4  162,48 154,106 C146,164 128,192 128,232 C128,252 72,252 72,232 C72,192 54,164 46,106 C38,48 55,4  100,4  Z",
    /* Squish wide — landing */
    wide:   "M100,60 C172,60 188,92 178,134 C168,170 154,188 154,224 C154,252 46,252 46,224 C46,188 32,170 22,134 C12,92 28,60 100,60 Z",
    /* Coiled up small — tease pose */
    coil:   "M100,72 C148,72 164,100 156,138 C148,172 140,192 140,220 C140,248 60,248 60,220 C60,192 52,172 44,138 C36,100 52,72 100,72 Z",
    /* Leaning — walk step */
    lean:   "M106,20 C152,16 170,56 162,112 C154,168 136,192 136,228 C136,250 70,252 64,228 C58,204 50,170 40,116 C30,62 60,24 106,20 Z"
  };

  /* ── Fin shapes per pose ── */
  var FINS = {
    stand:  { L: "M44,122 C28,114 14,130 20,148 C26,162 44,158 52,138 Z",
               R: "M156,122 C172,114 186,130 180,148 C174,162 156,158 148,138 Z" },
    sit:    { L: "M36,118 C20,110 10,128 18,146 C24,160 42,154 48,132 Z",
               R: "M164,118 C180,110 190,128 182,146 C176,160 158,154 152,132 Z" },
    puddle: { L: "M22,182 C8,178  4,192  12,204 C18,214 32,210 36,194 Z",
               R: "M178,182 C192,178 196,192 188,204 C182,214 168,210 164,194 Z" },
    drape:  { L: "M18,142 C4,134  -2,150  8,164 C16,176 34,168 38,148 Z",
               R: "M182,142 C196,134 202,150 192,164 C184,176 166,168 162,148 Z" },
    peek:   { L: "M44,126 C30,118 18,136 26,152 C32,164 50,158 54,140 Z",
               R: "M156,126 C170,118 182,136 174,152 C168,164 150,158 146,140 Z" },
    crouch: { L: "M36,128 C22,122 14,138 22,154 C28,166 46,162 50,144 Z",
               R: "M164,128 C178,122 186,138 178,154 C172,166 154,162 150,144 Z" },
    tall:   { L: "M46,118 C32,112 20,130 28,146 C34,160 52,154 56,136 Z",
               R: "M154,118 C168,112 180,130 172,146 C166,160 148,154 144,136 Z" },
    wide:   { L: "M28,124 C14,118 6,136 14,152 C20,164 38,158 42,140 Z",
               R: "M172,124 C186,118 194,136 186,152 C180,164 162,158 158,140 Z" },
    coil:   { L: "M40,120 C26,114 18,132 26,148 C32,160 50,154 54,136 Z",
               R: "M160,120 C174,114 182,132 174,148 C168,160 150,154 146,136 Z" },
    lean:   { L: "M44,124 C30,116 18,134 26,150 C32,162 50,158 54,138 Z",
               R: "M162,120 C176,112 188,130 180,146 C174,158 158,152 152,134 Z" }
  };

  /* ── Shine / highlight shapes ── */
  var SHINES = {
    stand:  "M74,44 C90,34 114,36 122,52 C128,76 115,92 100,96 C85,92 72,78 74,44 Z",
    sit:    "M76,60 C92,52 116,54 122,68 C128,90 115,104 100,108 C86,104 72,88 76,60 Z",
    puddle: "M76,172 C90,165 114,167 120,178 C124,194 114,204 100,208 C86,204 74,192 76,172 Z",
    drape:  "M76,92 C90,84 114,86 120,98 C126,116 114,126 100,130 C86,126 74,114 76,92 Z",
    peek:   "M76,26 C90,18 114,20 120,34 C126,54 114,66 100,70 C86,66 74,52 76,26 Z",
    crouch: "M76,70 C90,62 114,64 120,76 C126,96 114,108 100,112 C86,108 74,94 76,70 Z",
    tall:   "M76,20 C90,12 114,14 120,28 C126,48 114,60 100,64 C86,60 74,46 76,20 Z",
    wide:   "M76,72 C90,64 114,66 120,78 C126,96 114,108 100,112 C86,108 74,94 76,72 Z",
    coil:   "M76,82 C90,74 114,76 120,88 C126,106 114,118 100,122 C86,118 74,104 76,82 Z",
    lean:   "M80,36 C94,26 118,28 124,44 C130,64 118,76 104,80 C90,76 74,62 80,36 Z"
  };

  /* ── Face center Y per pose (for morphing face group) ── */
  var FACE_Y = {
    stand: 0,  sit: 18, puddle: 114, drape: 52,
    peek: -8, crouch: 28, tall: -12, wide: 22, coil: 40, lean: 2
  };

  /* ── Path number extraction ── */
  function nums(p) { return p.match(/-?[\d.]+/g).map(Number); }
  function tpl(p)  { return p.split(/-?[\d.]+/); }

  /* Verify all shapes have 26 numbers */
  var BASE_NUMS = nums(SHAPES.stand);
  for (var k in SHAPES) {
    if (nums(SHAPES[k]).length !== BASE_NUMS.length) {
      console.warn('[Harfo] Shape mismatch:', k, nums(SHAPES[k]).length, 'vs', BASE_NUMS.length);
    }
  }

  var STAND_TPL   = tpl(SHAPES.stand);
  var FIN_TPL_L   = tpl(FINS.stand.L);
  var FIN_TPL_R   = tpl(FINS.stand.R);
  var SHINE_TPL   = tpl(SHINES.stand);

  /* ── Interpolate two paths ── */
  function lerp(a, b, t) {
    var an = nums(a), bn = nums(b);
    return STAND_TPL.reduce(function (out, chunk, i) {
      return out + chunk + (i < an.length ? (an[i] + (bn[i] - an[i]) * t).toFixed(2) : '');
    }, '');
  }

  /* ── Interpolate fin paths (L or R) ── */
  function lerpFin(fa, fb, t, finTpl) {
    var an = nums(fa), bn = nums(fb);
    return finTpl.reduce(function (out, chunk, i) {
      return out + chunk + (i < an.length ? (an[i] + (bn[i] - an[i]) * t).toFixed(2) : '');
    }, '');
  }
  function lerpShine(sa, sb, t) {
    var an = nums(sa), bn = nums(sb);
    return SHINE_TPL.reduce(function (out, chunk, i) {
      return out + chunk + (i < an.length ? (an[i] + (bn[i] - an[i]) * t).toFixed(2) : '');
    }, '');
  }

  /* ── Main Morph Controller ── */
  var Morph = {
    fromPose: 'stand',
    toPose:   'stand',
    t: 1,             // interpolation progress (0→1)
    dur: 0,
    startAt: 0,
    onDone: null,

    bodyEl: null, finL: null, finR: null, shineEl: null, faceEl: null,

    init: function (bodyEl, finLEl, finREl, shineEl, faceEl) {
      this.bodyEl  = bodyEl;
      this.finL    = finLEl;
      this.finR    = finREl;
      this.shineEl = shineEl;
      this.faceEl  = faceEl;
      this.apply(1);
    },

    to: function (poseName, dur, onDone) {
      if (!SHAPES[poseName]) return;
      if (this.toPose === poseName && this.t >= 1) return;
      this.fromPose = this.curPose();
      this.toPose   = poseName;
      this.dur      = dur || 450;
      this.startAt  = performance.now();
      this.t        = 0;
      this.onDone   = onDone || null;
    },

    instant: function (poseName) {
      this.fromPose = poseName;
      this.toPose   = poseName;
      this.t        = 1;
      this.apply(1);
    },

    curPose: function () {
      return this.t >= 1 ? this.toPose : this.fromPose;
    },

    tick: function () {
      if (this.t >= 1 || !this.bodyEl) return;
      var elapsed = performance.now() - this.startAt;
      this.t = Math.min(1, elapsed / this.dur);
      // Ease out cubic
      var e = 1 - Math.pow(1 - this.t, 3);
      this.apply(e);
      if (this.t >= 1 && this.onDone) { var fn = this.onDone; this.onDone = null; fn(); }
    },

    apply: function (e) {
      var fa = SHAPES[this.fromPose] || SHAPES.stand;
      var fb = SHAPES[this.toPose]   || SHAPES.stand;
      var finA = FINS[this.fromPose]  || FINS.stand;
      var finB = FINS[this.toPose]    || FINS.stand;
      var shA  = SHINES[this.fromPose] || SHINES.stand;
      var shB  = SHINES[this.toPose]   || SHINES.stand;

      if (this.bodyEl)  this.bodyEl.setAttribute('d', lerp(fa, fb, e));
      if (this.finL)    this.finL.setAttribute('d',  lerpFin(finA.L, finB.L, e, FIN_TPL_L));
      if (this.finR)    this.finR.setAttribute('d',  lerpFin(finA.R, finB.R, e, FIN_TPL_R));
      if (this.shineEl) this.shineEl.setAttribute('d', lerpShine(shA, shB, e));

      // Move face group
      if (this.faceEl) {
        var ya = FACE_Y[this.fromPose] || 0;
        var yb = FACE_Y[this.toPose]   || 0;
        var ty = ya + (yb - ya) * e;
        this.faceEl.setAttribute('transform', 'translate(0,' + ty.toFixed(2) + ')');
      }
    }
  };

  /* ── Export ── */
  root.HarfoMorph = Morph;
  root.HarfoShapes = SHAPES;

}(window));
