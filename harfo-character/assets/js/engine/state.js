/**
 * حرفو v7 — engine/state.js
 * Centralised runtime state for the Harfo character.
 * Every other engine module reads from and writes to this object,
 * keeping mutable data in one predictable place.
 */
;(function (win) {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     Internal defaults — cloned on every reset() call so the
     engine can restart cleanly without reloading the page.
  ───────────────────────────────────────────────────────────── */
  var DEFAULTS = {
    position: {
      x: 0,   // current rendered X (px, left edge of wrap element)
      y: 0,   // current rendered Y (px, top edge of wrap element)
      vx: 0,  // horizontal velocity
      vy: 0,  // vertical velocity
      tx: 0,  // horizontal target (where the character is walking to)
      ty: 0,  // vertical target
    },

    mouse: {
      x: -9999,    // last known mouse X in viewport coordinates
      y: -9999,    // last known mouse Y in viewport coordinates
      distance: Infinity,
      zone: 'any',
      prevZone: 'any',
    },

    flags: {
      dragging: false,  // user is dragging the character
      walking: false,   // character is auto-walking to a target
      napping: false,   // character is asleep
      fleeing: false,   // character is running from the mouse
      touring: false,   // character is in guided-tour mode
      talking: false,   // speech bubble is visible
    },

    timing: {
      idleSince: 0,     // timestamp of last significant user interaction
      lastSpeech: 0,    // timestamp of last speech bubble shown
      lastBehavior: 0,  // timestamp of last behaviour fired
      napAt: 0,         // timestamp when nap animation started
    },
  };

  /* ─────────────────────────────────────────────────────────────
     Deep-clone helper (no external deps, no JSON for perf)
  ───────────────────────────────────────────────────────────── */
  function deepClone(src) {
    var out = {};
    for (var k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) { continue; }
      if (src[k] !== null && typeof src[k] === 'object') {
        out[k] = deepClone(src[k]);
      } else {
        out[k] = src[k];
      }
    }
    return out;
  }

  /* ─────────────────────────────────────────────────────────────
     Zone ordering (smallest index = closest)
  ───────────────────────────────────────────────────────────── */
  var ZONE_ORDER = ['panic', 'flee', 'alert', 'tease', 'seek', 'far', 'any'];

  /* ─────────────────────────────────────────────────────────────
     Public API
  ───────────────────────────────────────────────────────────── */
  var HarfoState = {

    /* ── Tunable physics / behaviour constants ── */
    config: {
      W: 122,               // character wrap width  (px)
      H: 160,               // character wrap height (px)

      SPRING_K: 0.065,      // spring pull strength toward target
      SPRING_D: 0.79,       // velocity damping (0-1, higher = less friction)

      MAX_SPEED: 24,        // maximum pixel/frame velocity

      ZONE_SEEK: 520,       // distance at which character starts seeking mouse
      ZONE_TEASE: 380,      // tease zone boundary
      ZONE_ALERT: 240,      // alert zone boundary
      ZONE_FLEE: 155,       // flee zone boundary
      ZONE_PANIC: 85,       // panic zone boundary

      FLEE_F: 5.2,          // flee repulsion force multiplier
      PANIC_F: 9.5,         // panic repulsion force multiplier

      NAP_AFTER: 42000,     // ms of inactivity before napping (42 s)
      SPEECH_CD: 5200,      // minimum ms between speech bubbles

      SEEK_SPEED: 0.042,    // fractional step toward mouse per frame when far
    },

    /* ── Live state sections (populated by init / reset) ── */
    position: null,
    mouse: null,
    flags: null,
    timing: null,

    /* ─────────────────────────────────────────
       init()
       Call once at plugin boot.  Resets state
       and seeds timing.idleSince to now.
    ───────────────────────────────────────── */
    init: function () {
      this.reset();
      this.timing.idleSince = Date.now();
    },

    /* ─────────────────────────────────────────
       reset()
       Restore all live state to defaults.
       Config is never reset so callers can
       override it before init().
    ───────────────────────────────────────── */
    reset: function () {
      var d = deepClone(DEFAULTS);
      this.position = d.position;
      this.mouse    = d.mouse;
      this.flags    = d.flags;
      this.timing   = d.timing;
    },

    /* ─────────────────────────────────────────
       setZone(zone)
       Update mouse.zone, preserving prevZone.
       Returns true if zone actually changed.
    ───────────────────────────────────────── */
    setZone: function (zone) {
      if (this.mouse.zone === zone) { return false; }
      this.mouse.prevZone = this.mouse.zone;
      this.mouse.zone = zone;
      return true;
    },

    /* ─────────────────────────────────────────
       setFlag(key, val)
       Set a boolean flag and update idleSince
       when relevant flags become active.
    ───────────────────────────────────────── */
    setFlag: function (key, val) {
      if (!Object.prototype.hasOwnProperty.call(this.flags, key)) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[HarfoState] unknown flag:', key);
        }
        return;
      }
      this.flags[key] = !!val;

      // Reset idle clock whenever the character becomes active
      if (val && (key === 'walking' || key === 'fleeing' || key === 'talking')) {
        this.timing.idleSince = Date.now();
      }
    },

    /* ─────────────────────────────────────────
       getZone()
       Returns current zone string.
    ───────────────────────────────────────── */
    getZone: function () {
      return this.mouse.zone;
    },

    /* ─────────────────────────────────────────
       isCloserThan(zoneA, zoneB)
       Returns true if zoneA is closer than
       zoneB in the zone ordering.
    ───────────────────────────────────────── */
    isCloserThan: function (zoneA, zoneB) {
      return ZONE_ORDER.indexOf(zoneA) < ZONE_ORDER.indexOf(zoneB);
    },

    /* ─────────────────────────────────────────
       idleMs()
       Milliseconds since last active event.
    ───────────────────────────────────────── */
    idleMs: function () {
      return Date.now() - this.timing.idleSince;
    },

    /* ─────────────────────────────────────────
       canSpeak()
       Returns true if cooldown has passed since
       the last speech bubble.
    ───────────────────────────────────────── */
    canSpeak: function () {
      return (Date.now() - this.timing.lastSpeech) >= this.config.SPEECH_CD;
    },

    /* ─────────────────────────────────────────
       markSpeech()
       Record that a speech bubble just fired.
    ───────────────────────────────────────── */
    markSpeech: function () {
      this.timing.lastSpeech = Date.now();
    },

    /* ─────────────────────────────────────────
       markBehavior()
       Record that a behaviour just fired.
    ───────────────────────────────────────── */
    markBehavior: function () {
      this.timing.lastBehavior = Date.now();
    },

  };

  win.HarfoState = HarfoState;

}(window));
