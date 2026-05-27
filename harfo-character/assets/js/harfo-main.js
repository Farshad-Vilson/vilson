/* ================================================================
   حرفو v7 — Main Coordinator
   Boot order · Anim helpers · Drag · Keyboard · Greet · Context menu
   ================================================================ */
(function (W) {
  'use strict';
  if (W.HarfoLoaded) return;
  W.HarfoLoaded = true;

  function $id(id) { return document.getElementById(id); }

  /* ── element refs ── */
  var wrap, charSvg, bodyEl, finL, finR, shineEl, faceEl, eyesEl;

  /* ════════════════════ ANIM HELPERS ════════════════════ */
  var Anim = {
    cls: function (c, dur) {
      if (!wrap) return;
      wrap.classList.add(c);
      if (dur) setTimeout(function () { wrap && wrap.classList.remove(c); }, dur);
    },
    face: function (state, dur) {
      if (!wrap) return;
      var toRemove = [];
      wrap.classList.forEach(function (cl) { if (/^hs-/.test(cl)) toRemove.push(cl); });
      toRemove.forEach(function (cl) { wrap.classList.remove(cl); });
      if (state) {
        wrap.classList.add('hs-' + state);
        if (dur) setTimeout(function () { wrap && wrap.classList.remove('hs-' + state); }, dur);
      }
    },
    eyesFollow: function () {
      var S = W.HarfoState;
      if (!S || S.mouse.x < 0 || !eyesEl) return;
      var cx = S.pos.x + 61, cy = S.pos.y + 56;
      var dx = Math.max(-3.5, Math.min(3.5, (S.mouse.x - cx) * 0.017));
      var dy = Math.max(-2.5, Math.min(2.5, (S.mouse.y - cy) * 0.017));
      eyesEl.setAttribute('transform', 'translate(' + dx.toFixed(2) + ',' + dy.toFixed(2) + ')');
    }
  };

  /* Expose globally for tease.js / behaviors */
  W.HarfoAnim = Anim;

  /* ════════════════════ BLINK ════════════════════ */
  var Blink = {
    start: function () {
      var loop = function () {
        if (wrap && !wrap.classList.contains('hs-sleep')) Anim.face('blink', 130);
        setTimeout(loop, 3200 + Math.random() * 5800);
      };
      setTimeout(loop, 2800);
    }
  };

  /* ════════════════════ IDLE WATCHER ════════════════════ */
  var Idle = {
    _last: Date.now(),
    _napping: false,

    init: function () {
      ['mousemove','scroll','keydown','click','touchstart'].forEach(function (e) {
        window.addEventListener(e, function () {
          Idle._last = Date.now();
          if (Idle._napping) {
            Idle._napping = false;
            if (wrap) wrap.classList.remove('hs-sleep');
            if (W.HarfoMorph) W.HarfoMorph.to('stand', 400);
            Anim.face('wow', 700);
            if (W.HarfoPhysics) W.HarfoPhysics.parkHome();
          }
        }, { passive: true });
      });
      setInterval(Idle._check, 4500);
    },

    _check: function () {
      if (Idle._napping || !wrap) return;
      var idle = Date.now() - Idle._last;

      /* Tell tease system how long user has been idle */
      if (W.HarfoTease) W.HarfoTease.onUserIdle(idle);

      if (idle > 42000 && !W.HarfoTour.isRunning()) {
        Idle._napping = true;
        /* Find element to nap on */
        var anchors = W.HarfoAnchors ? W.HarfoAnchors.scan() : [];
        var wide = anchors.filter(function (a) { return a.kind==='header'||a.kind==='nav'||(a.rect&&a.rect.width>280); });
        var pick = wide.length ? wide[0] : (anchors.length ? anchors[0] : null);
        var napFn = function () {
          if (W.HarfoMorph) W.HarfoMorph.to('puddle', 700);
          Anim.face('sleep', 0);
          if (wrap) wrap.classList.add('hs-sleep');
        };
        if (pick && W.HarfoPhysics) {
          var spot = W.HarfoAnchors.spotOn(pick);
          var pose = W.HarfoAnchors.poseFor(pick);
          W.HarfoPhysics.moveTo(spot.x, spot.y, function () {
            if (W.HarfoMorph) W.HarfoMorph.to(pose, 500);
            setTimeout(napFn, 900);
          });
        } else {
          napFn();
        }
      }
    }
  };

  /* ════════════════════ DRAG ════════════════════ */
  var Drag = {
    active: false, moved: false, _didDrag: false,
    sx: 0, sy: 0, ox: 0, oy: 0,

    down: function (e) {
      if (e.target === $id('h-close') || e.button !== 0) return;
      var S = W.HarfoState; if (!S) return;
      Drag.active=true; Drag.moved=false;
      Drag.sx=e.clientX; Drag.sy=e.clientY;
      Drag.ox=S.pos.x; Drag.oy=S.pos.y;
      S.flags.dragging=true;
      e.preventDefault();
      /* Wake if napping */
      if (Idle._napping) {
        Idle._napping=false;
        if(wrap)wrap.classList.remove('hs-sleep');
        if(W.HarfoMorph)W.HarfoMorph.to('stand',300);
        Anim.face('wow',600);
      }
    },
    move: function (e) {
      if (!Drag.active) return;
      var S=W.HarfoState; if(!S)return;
      var dx=e.clientX-Drag.sx, dy=e.clientY-Drag.sy;
      if (Math.abs(dx)+Math.abs(dy)>5) Drag.moved=true;
      S.pos.x=Drag.ox+dx; S.pos.y=Drag.oy+dy;
      S.pos.tx=S.pos.x; S.pos.ty=S.pos.y;
    },
    up: function () {
      if (!Drag.active) return;
      var S=W.HarfoState; if(S)S.flags.dragging=false;
      if (Drag.moved) Anim.cls('hv-squish',500);
      Drag._didDrag=Drag.moved;
      Drag.active=false;
      setTimeout(function(){Drag._didDrag=false;},80);
    }
  };

  /* ════════════════════ CONTEXT MENU ════════════════════ */
  function contextMenu() {
    var ai  = W.HarfoPageAI  ? W.HarfoPageAI.d  : {};
    var Hl  = W.HarfoHelpers;
    var Sp  = W.HarfoSpeech;
    if (!Sp) return;

    var actions = [];
    if (ai.isArticle) {
      actions.push({label:'خلاصه مقاله', fn:function(){Hl&&Hl.summary();}});
      if (ai.headings&&ai.headings.length>=2)
        actions.push({label:'فهرست مطالب',fn:function(){Hl&&Hl.toggleTOC();}});
    }
    if (window.scrollY > 300)
      actions.push({label:'برو بالا',fn:function(){window.scrollTo({top:0,behavior:'smooth'});}});
    actions.push({label:'گردش سایت',   fn:function(){W.HarfoTour&&W.HarfoTour.start();}});
    actions.push({label:'جستجو ⌘K',    fn:function(){W.HarfoPalette&&W.HarfoPalette.open();}});
    actions.push({label:'+ بزرگ‌تر',   fn:function(){Hl&&Hl.fontUp();}});
    actions.push({label:'− کوچک‌تر',   alt:true, fn:function(){Hl&&Hl.fontDown();}});
    actions.push({label:'شب / روز',    alt:true, fn:function(){Hl&&Hl.toggleDark();}});

    Sp.say('چیکار کنم؟', {force:true, sticky:true, actions:actions});
  }

  /* ════════════════════ GREETER ════════════════════ */
  function greet() {
    var ai  = W.HarfoPageAI  ? W.HarfoPageAI.d  : {};
    var mem = W.HarfoMemory  ? W.HarfoMemory.d   : {};
    var Sp  = W.HarfoSpeech;
    var Hl  = W.HarfoHelpers;
    if (!Sp) return;

    setTimeout(function () {
      if (ai.is404) {
        Anim.face('wow', 2000);
        Anim.cls('hv-shake', 700);
        var navA = (ai.navLinks||[]).slice(0,5).map(function(l){
          return {label:l.t.slice(0,18), fn:function(){location.href=l.href;}};
        });
        Sp.say('اوه! این صفحه پیدا نشد. بریم جای دیگه؟',{force:true,sticky:true,actions:navA});
        return;
      }
      if (ai.isCart)     { Sp.say('سبدت آماده‌ست. حاضری برای پرداخت؟',{force:true}); return; }
      if (ai.isCheckout) { Sp.say('اطلاعات رو با دقت وارد کن.',{force:true}); return; }
      if (ai.isProduct&&ai.productTitle) {
        Sp.say('«'+ai.productTitle+'»'+(ai.productPrice?'\nقیمت: '+ai.productPrice:''),{force:true});
        return;
      }
      if (ai.isArticle&&ai.readMin>=3) {
        Sp.say('این مقاله ~'+ai.readMin+' دقیقه‌ست.\nفهرستش رو بیارم؟',{force:true,sticky:true,
          actions:[{label:'آره',fn:function(){Hl&&Hl.buildTOC();}},{label:'نه',alt:true,fn:function(){}}]});
        return;
      }
      if (ai.errorFields&&ai.errorFields.length) { Hl&&Hl.pointToError(); return; }
      if (mem.visits===1) {
        Anim.face('happy',0);
        Anim.cls('hv-bounce',800);
        Sp.say('سلام! من حرفوام — دستیار زنده حرف اول 👋\nمی‌خوای سایت رو باهم بگردیم؟',{
          force:true,sticky:true,
          actions:[
            {label:'آره بگرد',fn:function(){W.HarfoTour&&W.HarfoTour.start();}},
            {label:'بعداً',alt:true,fn:function(){Anim.face('wink',900);}}
          ]});
        return;
      }
      if (mem.visits>5) { Anim.face('wink',900); return; }
      Sp.say('خوش اومدی! روم کلیک کن.',{force:true});
    }, 1600);
  }

  /* ════════════════════ SCROLL WATCHER ════════════════════ */
  var _scrollOffered = false;
  function watchScroll() {
    window.addEventListener('scroll', function () {
      var max=Math.max(1,document.body.scrollHeight-window.innerHeight);
      var pct=Math.min(100,Math.round((window.scrollY/max)*100));
      if(W.HarfoMemory) W.HarfoMemory.markScroll(pct);
      if (pct>=90&&!_scrollOffered) {
        _scrollOffered=true;
        var ai=W.HarfoPageAI?W.HarfoPageAI.d:{};
        if (ai.isArticle) {
          var next=document.querySelector('.nav-next a,a[rel=next],.next a');
          if (next&&W.HarfoSpeech) W.HarfoSpeech.say('تموم شد! مقاله بعدی؟',{force:true,
            actions:[{label:'بعدی',fn:function(){location.href=next.href;}},
                     {label:'برو بالا',fn:function(){window.scrollTo({top:0,behavior:'smooth'});}}]});
        }
      }
    }, {passive:true});
  }

  /* ════════════════════ AUTO SILENT ACTIONS ════════════════════ */
  function autoActions() {
    var ai = W.HarfoPageAI?W.HarfoPageAI.d:{};
    var Hl = W.HarfoHelpers;
    var Tk = W.HarfoToast;

    if (document.body.scrollHeight>window.innerHeight*1.8) Hl&&Hl.showProgress();
    if (ai.isArticle&&ai.readMin>=2)
      setTimeout(function(){Tk&&Tk.show('زمان مطالعه: ~'+ai.readMin+' دقیقه');},2400);
    if (ai.isArticle&&ai.headings&&ai.headings.length>=4)
      setTimeout(function(){Tk&&Tk.show('فهرست مطالب آماده — H+T یا کلیک روی حرفو');},9000);

    Hl&&Hl.restorePrefs();

    /* Form error observer */
    try {
      var mo=new MutationObserver(function(){
        var err=document.querySelector('input.error,input[aria-invalid=true],.woocommerce-error');
        if(err) Hl&&Hl.pointToError();
      });
      mo.observe(document.body,{childList:true,subtree:true,attributeFilter:['class','aria-invalid']});
    }catch(e){}
  }

  /* ════════════════════ INIT ════════════════════ */
  function init() {
    wrap    = $id('harfo-w');
    charSvg = $id('h-char');
    bodyEl  = $id('h-body');
    finL    = $id('h-fin-l');
    finR    = $id('h-fin-r');
    shineEl = $id('h-shine');
    faceEl  = $id('h-face');
    eyesEl  = $id('h-eyes');

    if (!wrap||!bodyEl) return;

    /* ── Boot all engines ── */
    W.HarfoMemory   && W.HarfoMemory.load();
    W.HarfoPageAI   && W.HarfoPageAI.run();
    W.HarfoState    && W.HarfoState.init();
    W.HarfoMorph    && W.HarfoMorph.init(bodyEl, finL, finR, shineEl, faceEl);
    W.HarfoMorph    && W.HarfoMorph.instant('stand');
    W.HarfoPhysics  && W.HarfoPhysics.init(wrap);
    W.HarfoParticles&& W.HarfoParticles.init($id('h-particles'));
    W.HarfoSpeech   && W.HarfoSpeech.init(wrap,$id('h-msg'),$id('h-acts'),$id('h-typing'));
    W.HarfoToast    && W.HarfoToast.init($id('h-toast'));
    W.HarfoPalette  && W.HarfoPalette.init();
    W.HarfoSelection&& W.HarfoSelection.init();
    W.HarfoTease    && W.HarfoTease.init(wrap,W.HarfoPhysics,W.HarfoState,W.HarfoMorph,W.HarfoParticles,W.HarfoSpeech,W.HarfoToast);

    /* ── Start loops ── */
    setInterval(Anim.eyesFollow, 70);
    Blink.start();
    Idle.init();
    watchScroll();
    autoActions();

    /* ── Drag ── */
    wrap.addEventListener('mousedown', Drag.down);
    window.addEventListener('mousemove', Drag.move);
    window.addEventListener('mouseup',   Drag.up);

    /* ── Click on character ── */
    wrap.addEventListener('click', function (e) {
      if (e.target===$id('h-close')) return;
      if (Drag._didDrag) return;
      Anim.cls('hv-bounce',700);
      contextMenu();
    });

    /* ── Close & restore ── */
    var closeBtn=$id('h-close');
    if (closeBtn) closeBtn.addEventListener('click', function(e){
      e.stopPropagation();
      wrap.style.display='none';
      var r=$id('h-restore'); if(r)r.classList.add('show');
      if(W.HarfoMemory)W.HarfoMemory.d.dismiss++;
      W.HarfoMemory&&W.HarfoMemory.save();
    });
    var restoreEl=$id('h-restore');
    if (restoreEl) restoreEl.addEventListener('click',function(){
      wrap.style.display='';
      restoreEl.classList.remove('show');
      Anim.face('happy',1200);
      Anim.cls('hv-bounce',800);
      W.HarfoParticles&&W.HarfoParticles.sparks(6);
    });

    /* ── Keyboard shortcuts ── */
    var pressed={};
    window.addEventListener('keydown',function(e){
      pressed[e.key.toLowerCase()]=true;
      if(pressed['h']&&pressed['t']){W.HarfoHelpers&&W.HarfoHelpers.toggleTOC();pressed={};}
      if(pressed['h']&&pressed['s']){W.HarfoHelpers&&W.HarfoHelpers.summary();pressed={};}
      if(pressed['h']&&pressed['g']){W.HarfoTour&&W.HarfoTour.start();pressed={};}
      if(e.key==='Escape'){
        W.HarfoTour&&W.HarfoTour.stop();
        W.HarfoSpeech&&W.HarfoSpeech.hide();
        W.HarfoPalette&&W.HarfoPalette.close();
      }
    });
    window.addEventListener('keyup',function(e){delete pressed[e.key.toLowerCase()];});

    /* ── Show character ── */
    setTimeout(function(){ wrap && wrap.classList.add('hv-ready'); }, 100);

    greet();
  }

  /* ════════════════════ PUBLIC API ════════════════════ */
  W.HarfoAI = {
    say:      function(t)    { W.HarfoSpeech&&W.HarfoSpeech.say(t,{force:true}); },
    tour:     function()     { W.HarfoTour&&W.HarfoTour.start(); },
    search:   function()     { W.HarfoPalette&&W.HarfoPalette.open(); },
    toc:      function()     { W.HarfoHelpers&&W.HarfoHelpers.toggleTOC(); },
    summary:  function()     { W.HarfoHelpers&&W.HarfoHelpers.summary(); },
    dark:     function()     { W.HarfoHelpers&&W.HarfoHelpers.toggleDark(); },
    fontUp:   function()     { W.HarfoHelpers&&W.HarfoHelpers.fontUp(); },
    fontDown: function()     { W.HarfoHelpers&&W.HarfoHelpers.fontDown(); },
    sparks:   function(n)    { W.HarfoParticles&&W.HarfoParticles.sparks(n||8); },
    hearts:   function(n)    { W.HarfoParticles&&W.HarfoParticles.hearts(n||5); },
    pose:     function(p)    { W.HarfoMorph&&W.HarfoMorph.to(p,500); },
    face:     function(f,d)  { Anim.face(f,d||1500); },
    walk:     function(x,y)  { W.HarfoPhysics&&W.HarfoPhysics.moveTo(x,y); },
    park:     function()     { W.HarfoPhysics&&W.HarfoPhysics.parkHome(); },
    page:     function()     { return W.HarfoPageAI?W.HarfoPageAI.d:{}; },
    mem:      function()     { return W.HarfoMemory?W.HarfoMemory.d:{}; }
  };

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

}(window));
