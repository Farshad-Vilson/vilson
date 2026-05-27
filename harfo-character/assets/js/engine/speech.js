/**
 * حرفو v7 — engine/speech.js
 * Speech bubble and toast notification engines.
 *
 * HarfoSpeech — the character's chat bubble
 * HarfoToast  — small non-intrusive overlay toast
 *
 * Expected DOM structure (created by the plugin PHP or existing markup):
 *
 *   .h-wrap
 *     .h-bubble          ← the speech bubble container
 *       .h-msg           ← message text element     (msgEl)
 *       .h-typing        ← typing indicator dots    (typingEl)
 *       .h-acts          ← action buttons container (actsEl)
 *
 * CSS classes toggled by this module:
 *   .hv-talk     on .h-wrap  — makes bubble visible
 *   .hv-typing   on .h-wrap  — shows typing indicator
 *   .hv-sticky   on .h-wrap  — keeps bubble open
 *   .hv-acts     on .h-wrap  — shows action buttons
 *
 * Window dependency:
 *   window.HarfoState  (engine/state.js)  — cooldown tracking
 */
;(function (win) {
  'use strict';

  /* ─── typing indicator delay ─── */
  var TYPING_DELAY = 550;   // ms of fake "thinking" before text appears

  /* ─── auto-hide default duration ─── */
  var DEFAULT_DUR = 4800;   // ms

  /* ─── internal ─── */
  var _wrapEl   = null;
  var _msgEl    = null;
  var _actsEl   = null;
  var _typingEl = null;

  var _hideTimer   = null;
  var _typingTimer = null;
  var _isOpen      = false;

  /* ─────────────────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────────────────── */
  function clearTimer(id) {
    if (id) { clearTimeout(id); }
    return null;
  }

  function addCls(cls)    { if (_wrapEl) { _wrapEl.classList.add(cls);    } }
  function removeCls(cls) { if (_wrapEl) { _wrapEl.classList.remove(cls); } }

  /** Remove all child nodes from an element */
  function clearEl(el) {
    if (!el) { return; }
    while (el.firstChild) { el.removeChild(el.firstChild); }
  }

  /* ─────────────────────────────────────────────────────────────
     Public API — HarfoSpeech
  ───────────────────────────────────────────────────────────── */
  var HarfoSpeech = {

    lastSaid: 0,

    /* ─────────────────────────────────────────
       init(wrapEl, msgEl, actsEl, typingEl)
    ───────────────────────────────────────── */
    init: function (wrapEl, msgEl, actsEl, typingEl) {
      _wrapEl   = wrapEl;
      _msgEl    = msgEl;
      _actsEl   = actsEl;
      _typingEl = typingEl;
    },

    /* ─────────────────────────────────────────
       say(text, opts)
       Show the speech bubble with text.

       opts = {
         force:   boolean  — bypass cooldown check
         sticky:  boolean  — don't auto-hide
         dur:     number   — auto-hide after this ms
         actions: [ { label, fn, alt } ]  — buttons
       }
    ───────────────────────────────────────── */
    say: function (text, opts) {
      if (!_wrapEl || !_msgEl) { return; }
      opts = opts || {};

      /* Cooldown gate */
      var state = win.HarfoState;
      if (!opts.force && state && !state.canSpeak()) { return; }

      /* Record timestamp */
      this.lastSaid = Date.now();
      if (state) { state.markSpeech(); }
      if (state) { state.setFlag('talking', true); }

      /* Clear any pending hide / typing timers */
      _hideTimer   = clearTimer(_hideTimer);
      _typingTimer = clearTimer(_typingTimer);

      /* Clear previous content */
      clearEl(_actsEl);
      removeCls('hv-acts');
      removeCls('hv-sticky');

      /* Show typing indicator */
      addCls('hv-talk');
      addCls('hv-typing');
      _isOpen = true;

      var self = this;

      _typingTimer = setTimeout(function () {
        /* Remove typing indicator */
        removeCls('hv-typing');

        /* Set message text (support simple HTML or plain text) */
        if (_msgEl) {
          if (/<[a-z]/i.test(text)) {
            _msgEl.innerHTML = text;
          } else {
            _msgEl.textContent = text;
          }
        }

        /* Action buttons */
        if (opts.actions && opts.actions.length && _actsEl) {
          opts.actions.forEach(function (act) {
            var btn = document.createElement('button');
            btn.className = 'h-act-btn';
            btn.textContent = act.label || '';
            if (act.alt) { btn.setAttribute('aria-label', act.alt); }
            btn.addEventListener('click', function () {
              if (act.fn) { act.fn(); }
              self.hide();
            });
            _actsEl.appendChild(btn);
          });
          addCls('hv-acts');
        }

        /* Sticky mode */
        if (opts.sticky) {
          addCls('hv-sticky');
          return; /* no auto-hide */
        }

        /* Auto-hide */
        var dur = (opts.dur != null) ? opts.dur : DEFAULT_DUR;
        _hideTimer = setTimeout(function () { self.hide(); }, dur);

      }, TYPING_DELAY);
    },

    /* ─────────────────────────────────────────
       hide()
       Remove bubble visibility.
    ───────────────────────────────────────── */
    hide: function () {
      _hideTimer   = clearTimer(_hideTimer);
      _typingTimer = clearTimer(_typingTimer);

      removeCls('hv-talk');
      removeCls('hv-typing');
      removeCls('hv-sticky');
      removeCls('hv-acts');

      if (_msgEl)  { _msgEl.textContent = ''; }
      clearEl(_actsEl);

      _isOpen = false;

      if (win.HarfoState) { win.HarfoState.setFlag('talking', false); }
    },

    /* ─────────────────────────────────────────
       isTalking()
       Returns true if speech bubble is visible.
    ───────────────────────────────────────── */
    isTalking: function () {
      return _isOpen;
    },

    /* ─────────────────────────────────────────
       sayRandom(pool, opts)
       Pick a random phrase from an array and say it.
    ───────────────────────────────────────── */
    sayRandom: function (pool, opts) {
      if (!pool || !pool.length) { return; }
      var txt = pool[Math.floor(Math.random() * pool.length)];
      this.say(txt, opts);
    },

    /* ─────────────────────────────────────────
       queue(items)
       Show phrases one after another.
       items: [ { text, dur, face, pose }, ... ]
    ───────────────────────────────────────── */
    queue: function (items) {
      if (!items || !items.length) { return; }
      var self  = this;
      var index = 0;

      function next() {
        if (index >= items.length) { return; }
        var item = items[index++];
        self.say(item.text, {
          force: true,
          dur:   item.dur || DEFAULT_DUR,
        });
        /* Morph pose/face if requested */
        if (win.HarfoMorph) {
          if (item.pose || item.face) {
            win.HarfoMorph.to(
              item.pose || null,
              item.face || null,
              350
            );
          }
        }
        /* Chain next item after dur + TYPING_DELAY */
        setTimeout(next, (item.dur || DEFAULT_DUR) + TYPING_DELAY + 200);
      }

      next();
    },

  };

  /* ─────────────────────────────────────────────────────────────
     HarfoToast — small overlay notification (separate from bubble)
  ───────────────────────────────────────────────────────────── */

  var _toastEl     = null;
  var _toastTimer  = null;

  var HarfoToast = {

    /* ─────────────────────────────────────────
       init(el)
       el: the .h-toast element
    ───────────────────────────────────────── */
    init: function (el) {
      _toastEl = el;
    },

    /* ─────────────────────────────────────────
       show(msg, dur)
       Display a brief toast message.
       dur defaults to 3000 ms.
    ───────────────────────────────────────── */
    show: function (msg, dur) {
      if (!_toastEl) { return; }
      dur = dur || 3000;

      if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }

      if (/<[a-z]/i.test(msg)) {
        _toastEl.innerHTML = msg;
      } else {
        _toastEl.textContent = msg;
      }

      _toastEl.classList.add('hv-show');
      _toastEl.setAttribute('aria-live', 'polite');

      _toastTimer = setTimeout(function () {
        if (_toastEl) {
          _toastEl.classList.remove('hv-show');
          _toastEl.textContent = '';
        }
        _toastTimer = null;
      }, dur);
    },

    /* ─────────────────────────────────────────
       hide()
    ───────────────────────────────────────── */
    hide: function () {
      if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
      if (_toastEl) {
        _toastEl.classList.remove('hv-show');
        _toastEl.textContent = '';
      }
    },

  };

  win.HarfoSpeech = HarfoSpeech;
  win.HarfoToast  = HarfoToast;

}(window));
