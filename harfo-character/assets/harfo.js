/* ════════════════════════════════════════════════════════
   حرفو v11 — Autonomous Galaxy Mascot
   Modules: BrainAI · TextAnalyzer · CTAGaze · Memory
            · PageAI · ThemeSense · AnchorTracker · ShapeMorph
            · Physics · Squish · PupilTrack · Rain · Umbrella · FX
   Zero external dependencies. Full autonomy.
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Constants ── */
  var C = {
    SK: 0.052, SD: 0.82, MSP: 18,
    SQK: 0.18, SQD: 0.66, SQA: 0.30,
    WI_MIN: 4000, WI_MAX: 9000,
    NOTICE: 400, TEASE: 260, ALERT: 165, FLEE: 110, PANIC: 62,
    IDLE_SLEEP: 28000,
    CTA_IDLE_TRIGGER: 8000,   /* ms idle before CTA gaze */
    BRAIN_TICK: 42000,        /* ms between autonomous decisions */
    RAIN_DROPS: 14, RAIN_SPD_MIN: 280, RAIN_SPD_MAX: 520,
    RAIN_HOURS: [6,7,8,17,18,19,20,21],
    FLOAT_AMP: 3.2, FLOAT_FREQ: 0.0008,
    MEM_KEY: 'harfo_brain_v1',
    MEM_MAX_PAGES: 40,
  };

  /* ── Physics state ── */
  var S = {
    x:0, y:0, vx:0, vy:0, tx:0, ty:0,
    sqx:1, sqy:1, sqvx:0, sqvy:0,
    mx:-999, my:-999,
    idle:0, sleeping:false, nextWander:0,
    dragging:false, dragOx:0, dragOy:0,
    mood:'normal', shape:'ball',
    raining:false, umbDrag:false, umbX:0, umbY:0,
    sheltered:false, lastTick:0,
    pupLx:4, pupLy:4, pupRx:4, pupRy:4, ptId:0,
    /* Brain state */
    gazingAt:null, gazeUntil:0,
    gazeAngle:0,              /* current pupil gaze angle toward CTA */
    lastScroll:0, scrollDepth:0,
    lastCtaTime:0,
    brainNextTick:0,
    sessionScrolled:false,
    ctaClickPending:null,
  };

  /* ── DOM refs ── */
  var ROOT,W,BALL,GLOW,FACE,EL,ER,PL,PR,MO,ARM,STARS,NEB,ICON,FX,RAIN,UMB,ARMW;

  function grab() {
    ROOT=document.getElementById('harfo-root');
    W=document.getElementById('harfo-w');
    BALL=document.getElementById('harfo-ball');
    GLOW=document.getElementById('harfo-glow');
    FACE=document.getElementById('harfo-face');
    EL=document.getElementById('harfo-el');
    ER=document.getElementById('harfo-er');
    PL=document.getElementById('harfo-pl');
    PR=document.getElementById('harfo-pr');
    MO=document.getElementById('harfo-mo');
    ARM=document.getElementById('harfo-arm');
    STARS=document.getElementById('harfo-stars');
    NEB=document.getElementById('harfo-neb');
    ICON=document.getElementById('harfo-icon');
    FX=document.getElementById('harfo-fx');
    RAIN=document.getElementById('harfo-rain');
    UMB=document.getElementById('harfo-umb');
    ARMW=document.getElementById('harfo-armw');
    return !!(W&&BALL&&FX);
  }

  /* ════════════════════════════════════════════════════════
     MEMORY — localStorage persistence (no server needed)
     ════════════════════════════════════════════════════════ */
  var Memory = (function() {
    var data = {
      pages: {},          /* url → {visits,maxScroll,avgTime,lastSeen} */
      ctaSuccess: {},     /* ctaText → {gazes,clicks,rate} */
      totalSessions: 0,
      totalGazes: 0,
      preferredHours: {}, /* hour → engagement score */
      globalCta: null,    /* best performing CTA selector globally */
    };

    function load() {
      try {
        var raw = localStorage.getItem(C.MEM_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          data = parsed;
        }
      } catch(e) {}
    }

    function save() {
      try {
        /* Trim oldest pages if too many */
        var keys = Object.keys(data.pages);
        if (keys.length > C.MEM_MAX_PAGES) {
          keys.sort(function(a,b){ return data.pages[a].lastSeen - data.pages[b].lastSeen; });
          for (var i = 0; i < keys.length - C.MEM_MAX_PAGES; i++) {
            delete data.pages[keys[i]];
          }
        }
        localStorage.setItem(C.MEM_KEY, JSON.stringify(data));
      } catch(e) {}
    }

    function pageKey() {
      return window.location.pathname;
    }

    function onPageLoad() {
      var k = pageKey();
      if (!data.pages[k]) data.pages[k] = {visits:0, maxScroll:0, avgTime:0, lastSeen:0, times:[]};
      data.pages[k].visits++;
      data.pages[k].lastSeen = Date.now();
      data.totalSessions = (data.totalSessions||0) + 1;
      var h = new Date().getHours();
      data.preferredHours[h] = (data.preferredHours[h]||0) + 1;
      save();
    }

    function onScroll(depth) {
      var k = pageKey();
      if (!data.pages[k]) return;
      if (depth > data.pages[k].maxScroll) {
        data.pages[k].maxScroll = depth;
        save();
      }
    }

    function onTimeSpent(ms) {
      var k = pageKey();
      if (!data.pages[k]) return;
      var p = data.pages[k];
      p.avgTime = p.avgTime ? (p.avgTime * 0.7 + ms * 0.3) : ms;
      save();
    }

    function onCtaGaze(ctaText) {
      if (!data.ctaSuccess[ctaText]) data.ctaSuccess[ctaText] = {gazes:0, clicks:0, rate:0};
      data.ctaSuccess[ctaText].gazes++;
      data.totalGazes = (data.totalGazes||0) + 1;
      save();
    }

    function onCtaClick(ctaText) {
      if (!data.ctaSuccess[ctaText]) return;
      data.ctaSuccess[ctaText].clicks++;
      var d = data.ctaSuccess[ctaText];
      d.rate = d.gazes > 0 ? d.clicks / d.gazes : 0;
      /* Update global best CTA */
      var best = null, bestRate = 0;
      Object.keys(data.ctaSuccess).forEach(function(k) {
        if (data.ctaSuccess[k].rate > bestRate && data.ctaSuccess[k].gazes > 2) {
          bestRate = data.ctaSuccess[k].rate;
          best = k;
        }
      });
      data.globalCta = best;
      save();
    }

    function getPageData() { return data.pages[pageKey()] || null; }
    function get() { return data; }

    load();
    return { onPageLoad, onScroll, onTimeSpent, onCtaGaze, onCtaClick, getPageData, get };
  })();

  /* ════════════════════════════════════════════════════════
     TEXT ANALYZER — reads page content, extracts intent
     ════════════════════════════════════════════════════════ */
  var TextAnalyzer = (function() {

    var URGENCY_FA = ['محدود','فوری','همین حالا','آخرین','موجودیت محدود','فرصت','تخفیف ویژه','امروز'];
    var URGENCY_EN = ['limited','urgent','now','last','sale','offer','today','hurry'];
    var ECOM_FA    = ['خرید','قیمت','محصول','سبد','پرداخت','ارسال','تومان','رال'];
    var ECOM_EN    = ['buy','price','product','cart','checkout','order','shop','add to'];
    var LEAD_FA    = ['تماس','مشاوره','ثبت نام','فرم','ارسال','عضویت','درخواست'];
    var LEAD_EN    = ['contact','consult','register','form','submit','subscribe','request'];
    var CONTENT_FA = ['مقاله','آموزش','راهنما','بلاگ','دانلود','ویدیو'];
    var CONTENT_EN = ['article','tutorial','guide','blog','download','video','read'];

    function countKeywords(text, list) {
      var t = text.toLowerCase(); var n = 0;
      list.forEach(function(k){ if (t.indexOf(k) !== -1) n++; });
      return n;
    }

    function extract() {
      /* Gather all visible text */
      var bodyText = (document.body && document.body.innerText) || '';
      var headings = [];
      document.querySelectorAll('h1,h2,h3,.elementor-heading-title').forEach(function(el){
        headings.push((el.textContent||'').trim());
      });
      var allText = bodyText.toLowerCase();

      /* Detect page purpose */
      var ecomScore    = countKeywords(allText, ECOM_FA) + countKeywords(allText, ECOM_EN);
      var leadScore    = countKeywords(allText, LEAD_FA) + countKeywords(allText, LEAD_EN);
      var contentScore = countKeywords(allText, CONTENT_FA) + countKeywords(allText, CONTENT_EN);
      var urgency      = countKeywords(allText, URGENCY_FA) + countKeywords(allText, URGENCY_EN);

      var purpose = 'generic';
      var maxScore = Math.max(ecomScore, leadScore, contentScore);
      if (maxScore > 0) {
        if (ecomScore === maxScore)    purpose = 'ecommerce';
        else if (leadScore === maxScore) purpose = 'lead';
        else                           purpose = 'content';
      }

      /* Find all CTAs with importance scoring */
      var ctas = [];
      var ctaSelectors = [
        '.elementor-button',
        '.elementor-widget-button a',
        '.woocommerce-button',
        '.wp-block-button__link',
        'a[class*="btn"]',
        'button[type="submit"]',
        '.checkout-button',
        'a[href*="cart"]',
        'a[href*="checkout"]',
        '.add_to_cart_button',
      ];
      ctaSelectors.forEach(function(sel) {
        document.querySelectorAll(sel).forEach(function(el) {
          var r = el.getBoundingClientRect();
          /* Skip invisible or too small */
          if (r.width < 30 || r.height < 10) return;
          var text = (el.textContent||'').trim().substring(0,60);
          if (!text) return;
          /* Score: size × visibility × urgency-match */
          var area = r.width * r.height;
          var inView = r.top >= 0 && r.top < window.innerHeight ? 1 : 0.2;
          var urgBonus = countKeywords(text, URGENCY_FA.concat(URGENCY_EN)) * 2;
          var score = (area / 10000) * inView + urgBonus;
          /* Check memory: prefer historically effective CTAs */
          var memData = Memory.get().ctaSuccess[text];
          if (memData && memData.rate > 0.1) score *= (1 + memData.rate * 3);
          ctas.push({ el:el, text:text, score:score, rect:r });
        });
      });
      ctas.sort(function(a,b){ return b.score - a.score; });

      /* Word count */
      var words = allText.split(/\s+/).length;

      /* Sentiment: very rough — positive - negative word count */
      var posWords = ['عالی','خوب','بهترین','محبوب','رایگان','هدیه','موفق','great','best','free','gift','love'];
      var negWords = ['مشکل','خطا','اشتباه','بد','ضعیف','error','problem','fail','bad','issue'];
      var sentiment = countKeywords(allText, posWords) - countKeywords(allText, negWords);

      return {
        purpose: purpose,
        urgency: urgency,
        ctas: ctas,
        headings: headings,
        wordCount: words,
        sentiment: sentiment,
        ecomScore: ecomScore,
        leadScore: leadScore,
      };
    }

    return { extract: extract };
  })();

  /* ════════════════════════════════════════════════════════
     CTA GAZE — mascot looks toward important button
     ════════════════════════════════════════════════════════ */
  var CTAGaze = (function() {
    var active = false;
    var targetEl = null;
    var gazeEnd = 0;
    var leanX = 0;  /* subtle body lean */

    function activate(el, text, durationMs) {
      if (!el) return;
      active = true;
      targetEl = el;
      gazeEnd = Date.now() + (durationMs || 4500);
      Memory.onCtaGaze(text);

      /* Track click after gaze — was our look effective? */
      S.ctaClickPending = { el:el, text:text, until: Date.now() + 12000 };
    }

    function tick() {
      if (!active) { leanX = leanX * 0.88; return leanX; }
      if (Date.now() > gazeEnd) {
        active = false;
        targetEl = null;
        leanX = leanX * 0.92;
        return leanX;
      }
      if (!targetEl) { active = false; return 0; }

      /* Direction from mascot center to CTA center */
      var r = targetEl.getBoundingClientRect();
      var ctaCx = r.left + r.width/2;
      var ctaCy = r.top  + r.height/2;
      var mascCx = S.x + 50;
      var mascCy = S.y + 50;
      var dx = ctaCx - mascCx;
      var dy = ctaCy - mascCy;
      var dist = Math.sqrt(dx*dx+dy*dy) || 1;
      var ang = Math.atan2(dy, dx);

      /* Store angle for pupil targeting */
      S.gazeAngle = ang;
      S.gazingAt = targetEl;

      /* Subtle body lean (max 6px) */
      leanX = lerp(leanX, Math.sign(dx) * Math.min(Math.abs(dx)/60, 6), 0.04);
      return leanX;
    }

    function isActive() { return active; }
    function getTarget() { return targetEl; }
    return { activate, tick, isActive, getTarget };
  })();

  /* ════════════════════════════════════════════════════════
     BRAIN AI — autonomous decision engine
     ════════════════════════════════════════════════════════ */
  var BrainAI = (function() {
    var analysis = null;
    var pageProfile = null;
    var actionWeights = {
      gaze_cta:     1.0,
      perch_content: 0.7,
      celebrate:    0.3,
      wander:       0.5,
      react_scroll: 0.6,
      shape_morph:  0.4,
    };
    var lastAction = null;
    var lastActionTime = 0;
    var idleThreshold = C.CTA_IDLE_TRIGGER;

    function analyzeNow() {
      analysis = TextAnalyzer.extract();
      pageProfile = PageAI.analyze();

      /* Adjust weights based on page type */
      if (analysis.purpose === 'ecommerce') {
        actionWeights.gaze_cta = 1.5;
        actionWeights.celebrate = 0.5;
      } else if (analysis.purpose === 'content') {
        actionWeights.perch_content = 1.2;
        actionWeights.shape_morph = 0.8;
        actionWeights.gaze_cta = 0.5;
      } else if (analysis.purpose === 'lead') {
        actionWeights.gaze_cta = 1.3;
        actionWeights.perch_content = 0.8;
      }
      if (analysis.urgency > 2) actionWeights.gaze_cta *= 1.4;

      /* Learn from memory */
      var mem = Memory.get();
      if (mem.globalCta) actionWeights.gaze_cta *= 1.2;

      return analysis;
    }

    /* Pick a weighted random action */
    function pickAction(available) {
      var total = 0;
      available.forEach(function(a){ total += (actionWeights[a] || 0.5); });
      var r = Math.random() * total;
      var acc = 0;
      for (var i=0; i<available.length; i++) {
        acc += (actionWeights[available[i]] || 0.5);
        if (r <= acc) return available[i];
      }
      return available[available.length-1];
    }

    function executeAction(action) {
      if (!analysis) return;
      lastAction = action;
      lastActionTime = Date.now();

      if (action === 'gaze_cta') {
        if (analysis.ctas.length === 0) return;
        var cta = analysis.ctas[0]; /* highest scored */
        CTAGaze.activate(cta.el, cta.text, 5000 + analysis.urgency * 800);
        return;
      }

      if (action === 'perch_content') {
        AnchorTracker.update(true);
        return;
      }

      if (action === 'celebrate') {
        spawnParticle('sp');
        spawnParticle('hrt');
        setMood('happy');
        setTimeout(function(){ PageAI.reactToPage(); }, 2500);
        return;
      }

      if (action === 'wander') {
        wander();
        return;
      }

      if (action === 'react_scroll') {
        var depth = S.scrollDepth;
        if (depth > 0.7) {
          setMood('happy'); /* they read it all! */
          spawnParticle('hrt');
        } else if (depth > 0.3) {
          setMood('curious');
        }
        return;
      }

      if (action === 'shape_morph') {
        if (!analysis) return;
        if (analysis.purpose === 'ecommerce') ShapeMorph.to('cart');
        else if (analysis.purpose === 'content') ShapeMorph.to('reader');
        else if (analysis.purpose === 'lead') ShapeMorph.to('heart');
        else ShapeMorph.to('ball');
        setTimeout(function(){ ShapeMorph.to('ball'); }, 4000);
        return;
      }
    }

    /* CTA idle trigger — separate from main brain tick */
    function checkCtaIdle() {
      if (S.sleeping || S.dragging || CTAGaze.isActive()) return;
      if (!analysis || analysis.ctas.length === 0) return;
      var idleMs = Date.now() - Math.max(S.idle, S.lastScroll||0);
      if (idleMs > idleThreshold && Date.now() - S.lastCtaTime > 15000) {
        S.lastCtaTime = Date.now();
        /* Only gaze if user isn't actively mousing */
        var mouseIdleMs = Date.now() - (S.lastMoveTime||0);
        if (mouseIdleMs > 3000) {
          executeAction('gaze_cta');
        }
      }
    }

    /* Main autonomous tick — runs every ~42s */
    function autonomousTick() {
      if (S.sleeping || S.dragging) return;
      analyzeNow();

      var available = ['gaze_cta','perch_content','wander','react_scroll','shape_morph'];
      if (analysis.sentiment > 3) available.push('celebrate');

      /* Don't repeat same action twice in a row */
      var filtered = available.filter(function(a){ return a !== lastAction; });
      if (filtered.length === 0) filtered = available;

      var chosen = pickAction(filtered);
      executeAction(chosen);
    }

    function init() {
      setTimeout(analyzeNow, 1500);
      /* First autonomous decision after 15s */
      S.brainNextTick = Date.now() + 15000;
    }

    function tick() {
      checkCtaIdle();
      if (Date.now() > S.brainNextTick) {
        S.brainNextTick = Date.now() + C.BRAIN_TICK + rn(-8000, 8000);
        autonomousTick();
      }
    }

    function getAnalysis() { return analysis; }
    function learnCtaClick(text) {
      Memory.onCtaClick(text);
      /* Boost gaze weight if this CTA worked */
      actionWeights.gaze_cta = Math.min(actionWeights.gaze_cta * 1.15, 3.0);
    }

    return { init, tick, analyzeNow, getAnalysis, learnCtaClick };
  })();

  /* ════════════════════════════════════════════════════════
     MODULE — ThemeSense
     ════════════════════════════════════════════════════════ */
  var ThemeSense = (function() {
    function hexToRgb(h) {
      h = h.replace('#','');
      if (h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      var n=parseInt(h,16);
      return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
    }
    function lum(r,g,b){ return 0.2126*r+0.7152*g+0.0722*b; }
    function sampleDOM() {
      var c=[];
      document.querySelectorAll('.elementor-widget-container,header,nav,.elementor-section').forEach(function(el){
        var bg=window.getComputedStyle(el).backgroundColor;
        var m=bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if(m){var r=+m[1],g=+m[2],b=+m[3];if(r+g+b>30&&!(r>230&&g>230&&b>230))c.push({r,g,b});}
      });
      return c;
    }
    function apply() {
      var colors=[];
      if(typeof HC!=='undefined'&&HC.elementor&&HC.elementor.kit){
        HC.elementor.kit.forEach(function(h){colors.push(hexToRgb(h));});
      }
      if(colors.length<2) colors=colors.concat(sampleDOM());
      if(!colors.length) return;
      colors.sort(function(a,b){return lum(a.r,a.g,a.b)-lum(b.r,b.g,b.b);});
      var p=colors[0];
      if(lum(p.r,p.g,p.b)<5) p={r:124,g:58,b:237};
      ROOT.style.setProperty('--hc-a','rgb('+p.r+','+p.g+','+p.b+')');
      ROOT.style.setProperty('--hc-b','rgb('+Math.round(p.r*.45)+','+Math.round(p.g*.35)+','+Math.round(p.b*.55)+')');
      ROOT.style.setProperty('--hc-c','rgb('+Math.round(p.r*.1)+','+Math.round(p.g*.08)+','+Math.round(p.b*.16)+')');
      ROOT.style.setProperty('--hc-glow','rgba('+p.r+','+p.g+','+p.b+',.58)');
    }
    return {apply};
  })();

  /* ════════════════════════════════════════════════════════
     MODULE — PageAI
     ════════════════════════════════════════════════════════ */
  var PageAI = (function() {
    var info={type:'generic',widgets:[],headings:[],images:[],buttons:[],hasHero:false,hasProducts:false,wordCount:0,elementorTemplate:''};
    function analyze() {
      var hc=(typeof HC!=='undefined')?HC:{};
      if(hc.is404)         info.type='404';
      else if(hc.isSearch) info.type='search';
      else if(hc.isProduct)info.type='product';
      else if(hc.isShop)   info.type='shop';
      else if(hc.isSingle) info.type='article';
      else if(hc.isHome)   info.type='home';
      else info.type=hc.postType||'generic';
      info.widgets=[];
      document.querySelectorAll('[class*="elementor-widget-"]').forEach(function(el){
        var m=el.className.match(/elementor-widget-([\w-]+)/);
        if(m) info.widgets.push(m[1]);
      });
      info.hasHero=!!(document.querySelector('.elementor-section.elementor-section-height-full')||document.querySelector('[class*="hero-section"]'));
      info.hasProducts=!!(document.querySelector('.products')||document.querySelector('.woocommerce-loop-product__title'));
      var wc=0;
      document.querySelectorAll('.elementor-widget-text-editor p,article p').forEach(function(el){wc+=(el.textContent||'').split(/\s+/).length;});
      info.wordCount=wc;
      info.elementorTemplate=(hc.elementor)?(hc.elementor.template||''):'';
      return info;
    }
    function get(){return info;}
    function reactToPage() {
      var i=info;
      if(i.type==='404')                      setMood('sad');
      else if(i.type==='product'||i.hasProducts) setMood('curious');
      else if(i.type==='home'&&i.hasHero)     setMood('happy');
      else if(i.wordCount>800)                setMood('reading');
      else                                    setMood('normal');
    }
    return {analyze,get,reactToPage};
  })();

  /* ════════════════════════════════════════════════════════
     MODULE — ShapeMorph
     ════════════════════════════════════════════════════════ */
  var ShapeMorph = (function() {
    var ICONS={
      magnify:'<circle cx="26" cy="26" r="16" stroke="white" stroke-width="5" fill="none"/><line x1="37" y1="37" x2="54" y2="54" stroke="white" stroke-width="5" stroke-linecap="round"/>',
      cart:'<path d="M8 12h48l-6 24H20L8 12z" stroke="white" stroke-width="4" fill="none"/><circle cx="24" cy="44" r="4" fill="white"/><circle cx="42" cy="44" r="4" fill="white"/>',
      heart:'<path d="M32 50 C18 40 8 32 8 22 C8 14 14 10 20 10 C25 10 30 14 32 18 C34 14 39 10 44 10 C50 10 56 14 56 22 C56 32 46 40 32 50Z" fill="rgba(244,114,182,.9)"/>',
      bulb:'<circle cx="32" cy="28" r="14" stroke="#FBBF24" stroke-width="4" fill="none"/><path d="M26 44h12M28 50h8" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>',
      arrow:'<path d="M16 32h32M36 20l12 12-12 12" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
      reader:'',
    };
    var current='ball';
    function to(shape){
      if(current===shape) return;
      current=shape;
      BALL.dataset.shape=(shape==='ball')?'':shape;
      if(ICONS[shape]!==undefined&&ICONS[shape]!==''){
        ICON.innerHTML=ICONS[shape];
        ICON.style.opacity='1';
      } else {
        ICON.style.opacity='0';
        setTimeout(function(){ICON.innerHTML='';},400);
      }
    }
    function get(){return current;}
    return {to,get};
  })();

  /* ════════════════════════════════════════════════════════
     MODULE — AnchorTracker
     ════════════════════════════════════════════════════════ */
  var AnchorTracker = (function() {
    var SELS=['.elementor-heading-title','.elementor-widget-image img','.elementor-button','.elementor-widget-text-editor p','.woocommerce-loop-product__title','.wp-post-image','h1','h2','figure img'];
    var perchTimer=0, perchActive=false;
    function scoreEl(el){
      var r=el.getBoundingClientRect(),vh=window.innerHeight,vw=window.innerWidth;
      if(r.bottom<0||r.top>vh||!r.height||!r.width) return 0;
      var vis=Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0))/r.height;
      var dist=Math.sqrt(Math.pow(r.left+r.width/2-vw/2,2)+Math.pow(r.top+r.height/2-vh/2,2));
      return vis*0.6+(1-Math.min(dist/(vw*.8),1))*0.4;
    }
    function pick(){
      var best=null,bs=0.25;
      SELS.forEach(function(s){
        document.querySelectorAll(s).forEach(function(el){var sc=scoreEl(el);if(sc>bs){bs=sc;best=el;}});
      });
      return best;
    }
    function perchFor(el){
      if(!el) return;
      var r=el.getBoundingClientRect(),tw=(W&&W.offsetWidth)||100;
      var tx=r.right+12;
      if(tx+tw>window.innerWidth-20) tx=r.left-tw-12;
      var ty=clamp(r.top+r.height/2-tw/2,10,window.innerHeight-tw-10);
      S.tx=tx; S.ty=ty; perchActive=true;
    }
    function update(force){
      if(S.dragging) return;
      var now=Date.now();
      if(!force&&now-perchTimer<4000) return;
      perchTimer=now;
      var el=pick();
      if(el) perchFor(el); else perchActive=false;
    }
    function isActive(){return perchActive;}
    function release(){perchActive=false;}
    return {update,isActive,release};
  })();

  /* ════════════════════════════════════════════════════════
     HELPERS
     ════════════════════════════════════════════════════════ */
  function setMood(m){ if(S.mood===m) return; S.mood=m; BALL.dataset.mood=m; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
  function rn(a,b){ return a+Math.random()*(b-a); }
  function getHour(){ return new Date().getHours(); }

  function setTimeOfDay(){
    var h=getHour();
    BALL.dataset.time=(h>=5&&h<12)?'morning':(h>=18||h<5)?'night':'day';
  }

  function buildStars(){
    if(!STARS) return;
    STARS.innerHTML='';
    for(var i=0;i<18;i++){
      var s=document.createElement('div');
      s.className='harfo-star';
      var sz=rn(1.2,2.8);
      s.style.cssText='width:'+sz+'px;height:'+sz+'px;top:'+rn(8,88)+'%;left:'+rn(8,88)+'%;animation-delay:'+rn(0,2.2)+'s;animation-duration:'+rn(1.6,3.2)+'s;';
      STARS.appendChild(s);
    }
  }

  /* ── Particles ── */
  function spawnParticle(type){
    if(!FX) return;
    var el=document.createElement('div');
    el.className='harfo-pt harfo-pt-'+(type||'sp');
    el.textContent={sp:'✦',hrt:'♥',zzz:'z'}[type]||'✦';
    var wx=S.x+50,wy=S.y+50;
    el.style.cssText='position:absolute;left:'+wx+'px;top:'+wy+'px;';
    FX.appendChild(el);
    var t0=null,vx=rn(-40,40),vy=rn(-80,-20);
    (function anim(ts){
      if(!t0) t0=ts;
      var dt=(ts-t0)/1000,op=Math.max(0,1-dt*1.4);
      el.style.left=(wx+vx*dt)+'px';
      el.style.top=(wy+vy*dt+60*dt*dt)+'px';
      el.style.opacity=op;
      if(op>0) requestAnimationFrame(anim);
      else if(el.parentNode) el.parentNode.removeChild(el);
    })(performance.now());
  }

  var zzzInterval=null;
  function startZzz(){ if(zzzInterval) return; zzzInterval=setInterval(function(){if(S.sleeping)spawnParticle('zzz');else stopZzz();},1100); }
  function stopZzz(){ clearInterval(zzzInterval); zzzInterval=null; }

  /* ── Rain ── */
  var rainDrops=[],rainActive=false;
  function shouldRain(){ var h=getHour(); return C.RAIN_HOURS.indexOf(h)!==-1||(Math.random()<0.12); }
  function startRain(){
    if(rainActive||!RAIN||!UMB) return;
    rainActive=true; S.raining=true; RAIN.innerHTML=''; rainDrops=[];
    for(var i=0;i<C.RAIN_DROPS;i++){
      var d=document.createElement('div'); d.className='harfo-rdrop';
      var h=rn(8,18);
      d.style.cssText='height:'+h+'px;left:'+rn(4,56)+'%;top:'+(-h)+'px;';
      RAIN.appendChild(d); rainDrops.push({el:d,y:-h,spd:rn(280,520),h:h});
    }
    UMB.style.display='block';
    setTimeout(function(){
      UMB.classList.add('harfo-umb-show');
      S.umbX=clamp(S.x+rn(80,160),0,window.innerWidth-80);
      S.umbY=clamp(S.y+rn(20,60),20,window.innerHeight-80);
      UMB.style.left=S.umbX+'px'; UMB.style.top=S.umbY+'px';
    },200);
  }
  function stopRain(){
    if(!rainActive||!UMB) return;
    rainActive=false; S.raining=false; RAIN.innerHTML=''; rainDrops=[];
    UMB.classList.remove('harfo-umb-show','harfo-umb-cover');
    setTimeout(function(){if(UMB)UMB.style.display='none';},450);
    if(S.sheltered){S.sheltered=false;BALL.dataset.mood=S.mood;}
  }
  function tickRain(dt){
    if(!rainActive||!RAIN||!UMB) return;
    for(var i=0;i<rainDrops.length;i++){var d=rainDrops[i];d.y+=d.spd*dt;if(d.y>64+d.h)d.y=-d.h;d.el.style.top=d.y+'px';}
    var ur=UMB.getBoundingClientRect(),br=W.getBoundingClientRect();
    var covered=(br.top>ur.top&&br.bottom<ur.bottom+20&&br.left>ur.left-10&&br.right<ur.right+10);
    if(covered!==S.sheltered){
      S.sheltered=covered;
      if(covered){BALL.dataset.mood='sheltered';UMB.classList.add('harfo-umb-cover');spawnParticle('hrt');}
      else{BALL.dataset.mood=S.mood;UMB.classList.remove('harfo-umb-cover');}
    }
  }

  function initUmbDrag(){
    if(!UMB) return;
    function onDown(e){e.preventDefault();S.umbDrag=true;var pt=e.touches?e.touches[0]:e,r=UMB.getBoundingClientRect();S.umbOx=pt.clientX-r.left;S.umbOy=pt.clientY-r.top;}
    function onMove(e){if(!S.umbDrag) return;e.preventDefault();var pt=e.touches?e.touches[0]:e;S.umbX=pt.clientX-S.umbOx;S.umbY=pt.clientY-S.umbOy;UMB.style.left=S.umbX+'px';UMB.style.top=S.umbY+'px';}
    function onUp(){S.umbDrag=false;}
    UMB.addEventListener('mousedown',onDown);
    UMB.addEventListener('touchstart',onDown,{passive:false});
    document.addEventListener('mousemove',onMove);
    document.addEventListener('touchmove',onMove,{passive:false});
    document.addEventListener('mouseup',onUp);
    document.addEventListener('touchend',onUp);
  }

  /* ── Wander ── */
  function wander(){
    if(S.dragging) return;
    AnchorTracker.release();
    var m=60,vw=window.innerWidth,vh=window.innerHeight;
    S.tx=rn(m,vw-m-100); S.ty=rn(m,vh-m-100);
    S.nextWander=Date.now()+rn(C.WI_MIN,C.WI_MAX);
  }

  /* ── Exit intent ── */
  var exitFired=false;
  document.addEventListener('mouseleave',function(e){
    if(e.clientY<5&&!exitFired&&ARMW){
      exitFired=true;
      ARMW.classList.add('harfo-wave');
      setTimeout(function(){if(ARMW)ARMW.classList.remove('harfo-wave');exitFired=false;},2200);
    }
  });

  /* ── Drag ── */
  function initDrag(){
    if(!W) return;
    function onDown(e){
      if(UMB&&(e.target===UMB||UMB.contains(e.target))) return;
      e.preventDefault();S.dragging=true;AnchorTracker.release();
      var pt=e.touches?e.touches[0]:e;S.dragOx=pt.clientX-S.x;S.dragOy=pt.clientY-S.y;
      spawnParticle('sp');
    }
    function onMove(e){if(!S.dragging)return;var pt=e.touches?e.touches[0]:e;S.tx=pt.clientX-S.dragOx;S.ty=pt.clientY-S.dragOy;}
    function onUp(){if(!S.dragging)return;S.dragging=false;spawnParticle('hrt');}
    W.addEventListener('mousedown',onDown);
    W.addEventListener('touchstart',onDown,{passive:false});
    document.addEventListener('mousemove',onMove);
    document.addEventListener('touchmove',onMove,{passive:false});
    document.addEventListener('mouseup',onUp);
    document.addEventListener('touchend',onUp);
  }

  /* ── CTA click tracking ── */
  function initCtaClickTracking(){
    document.addEventListener('click',function(e){
      if(!S.ctaClickPending) return;
      if(Date.now()>S.ctaClickPending.until){S.ctaClickPending=null;return;}
      var p=S.ctaClickPending;
      /* Did they click something near where we were gazing? */
      if(p.el&&(e.target===p.el||p.el.contains(e.target))){
        BrainAI.learnCtaClick(p.text);
        spawnParticle('hrt');
        S.ctaClickPending=null;
      }
    });
  }

  /* ── Pupils (gaze-aware) ── */
  function updatePupils(){
    if(!PL||!PR) return;
    var tx,ty;
    if(CTAGaze.isActive()){
      /* Gaze toward CTA */
      var ang=S.gazeAngle;
      var maxR=5;
      tx=4+Math.cos(ang)*maxR;
      ty=4+Math.sin(ang)*maxR;
    } else {
      /* Track mouse */
      var cx=S.x+50,cy=S.y+50;
      var dx=S.mx-cx,dy=S.my-cy;
      var dist=Math.sqrt(dx*dx+dy*dy)||1;
      tx=4+(dx/dist)*Math.min(dist*.18,4);
      ty=4+(dy/dist)*Math.min(dist*.18,4);
    }
    S.pupLx=lerp(S.pupLx,tx,CTAGaze.isActive()?0.06:0.14);
    S.pupLy=lerp(S.pupLy,ty,CTAGaze.isActive()?0.06:0.14);
    S.pupRx=lerp(S.pupRx,tx,CTAGaze.isActive()?0.06:0.14);
    S.pupRy=lerp(S.pupRy,ty,CTAGaze.isActive()?0.06:0.14);
    PL.style.transform='translate('+(S.pupLx-4)+'px,'+(S.pupLy-4)+'px)';
    PR.style.transform='translate('+(S.pupRx-4)+'px,'+(S.pupRy-4)+'px)';
  }

  /* ── Zone reactions ── */
  function reactToMouse(){
    if(S.sleeping||S.dragging||CTAGaze.isActive()) return;
    var cx=S.x+50,cy=S.y+50,dx=S.mx-cx,dy=S.my-cy;
    var dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<C.PANIC){
      var ang=Math.atan2(dy,dx);
      S.tx=clamp(S.x-Math.cos(ang)*180,20,window.innerWidth-120);
      S.ty=clamp(S.y-Math.sin(ang)*180,20,window.innerHeight-120);
      setMood('scared');AnchorTracker.release();
    } else if(dist<C.FLEE){
      var ang2=Math.atan2(dy,dx);
      S.tx=clamp(S.x-Math.cos(ang2)*90,20,window.innerWidth-120);
      S.ty=clamp(S.y-Math.sin(ang2)*90,20,window.innerHeight-120);
      setMood('scared');
    } else if(dist<C.ALERT){
      setMood('curious');
    } else if(dist>=C.NOTICE){
      if(S.mood==='scared'||S.mood==='curious') setMood('normal');
    }
  }

  /* ── Scroll depth tracking ── */
  function updateScrollDepth(){
    var el=document.documentElement;
    var max=el.scrollHeight-el.clientHeight;
    if(max<=0) return;
    var depth=(window.scrollY||0)/max;
    S.scrollDepth=depth;
    S.lastScroll=Date.now();
    S.sessionScrolled=true;
    Memory.onScroll(Math.round(depth*100));
  }

  /* ════════════════════════════════════════════════════════
     MAIN TICK
     ════════════════════════════════════════════════════════ */
  function applyDOM(leanX){
    var floatY=S.sleeping?0:Math.sin(Date.now()*C.FLOAT_FREQ)*C.FLOAT_AMP;
    var lean=leanX||0;
    W.style.transform='translate('+((S.x+lean)|0)+'px,'+((S.y+floatY)|0)+'px)';
    BALL.style.transform='scale('+S.sqx.toFixed(3)+','+S.sqy.toFixed(3)+')';
  }

  var lastScrollY=window.scrollY||0,scrollMoodTime=0;

  function tick(ts){
    try{
      var dt=Math.min((ts-(S.lastTick||ts))/1000,0.05);
      S.lastTick=ts;
      var now=Date.now();

      /* Brain tick */
      BrainAI.tick();

      /* CTA gaze body lean */
      var leanX=CTAGaze.tick();

      /* Wander */
      if(!S.dragging&&!AnchorTracker.isActive()&&!CTAGaze.isActive()&&now>S.nextWander) wander();

      /* Perch */
      AnchorTracker.update(false);

      /* Zone */
      reactToMouse();

      /* Spring */
      var ax=(S.tx-S.x)*C.SK,ay=(S.ty-S.y)*C.SK;
      S.vx=(S.vx+ax)*C.SD; S.vy=(S.vy+ay)*C.SD;
      S.vx=clamp(S.vx,-C.MSP,C.MSP); S.vy=clamp(S.vy,-C.MSP,C.MSP);
      S.x+=S.vx; S.y+=S.vy;

      /* Boundary */
      var mX=window.innerWidth-((W&&W.offsetWidth)||100);
      var mY=window.innerHeight-((W&&W.offsetHeight)||100);
      if(S.x<0){S.x=0;S.vx*=-0.4;} if(S.y<0){S.y=0;S.vy*=-0.4;}
      if(S.x>mX){S.x=mX;S.vx*=-0.4;} if(S.y>mY){S.y=mY;S.vy*=-0.4;}

      /* Squish */
      var spd=Math.sqrt(S.vx*S.vx+S.vy*S.vy);
      S.sqvx=(S.sqvx+(1+spd*C.SQA*.025-S.sqx)*C.SQK)*C.SQD;
      S.sqvy=(S.sqvy+(1-spd*C.SQA*.018-S.sqy)*C.SQK)*C.SQD;
      S.sqx=clamp(S.sqx+S.sqvx,0.7,1.45); S.sqy=clamp(S.sqy+S.sqvy,0.7,1.45);

      /* Pupils */
      updatePupils();

      /* Idle/sleep */
      if(spd>0.8||S.dragging) S.idle=now;
      if(!S.sleeping&&(now-S.idle)>C.IDLE_SLEEP){S.sleeping=true;setMood('sleeping');startZzz();}
      if(S.sleeping&&(spd>1.5||S.dragging)){S.sleeping=false;stopZzz();PageAI.reactToPage();}

      /* Scroll shape morph */
      var sy=window.scrollY||0;
      if(Math.abs(sy-lastScrollY)>60){
        var an=BrainAI.getAnalysis();
        if(an){
          if(an.purpose==='ecommerce') ShapeMorph.to('cart');
          else if(an.purpose==='content') ShapeMorph.to('reader');
          else ShapeMorph.to('ball');
        }
        scrollMoodTime=now;
      }
      if(now-scrollMoodTime>3000&&ShapeMorph.get()!=='ball'&&!S.dragging) ShapeMorph.to('ball');
      lastScrollY=sy;

      /* Rain */
      tickRain(dt);

      applyDOM(leanX);
    }catch(e){}
    requestAnimationFrame(tick);
  }

  /* ════════════════════════════════════════════════════════
     EVENTS
     ════════════════════════════════════════════════════════ */
  document.addEventListener('mousemove',function(e){
    S.mx=e.clientX; S.my=e.clientY;
    S.lastMoveTime=Date.now();
    if(S.sleeping) S.idle=Date.now();
  },{passive:true});

  document.addEventListener('touchmove',function(e){
    if(e.touches.length){S.mx=e.touches[0].clientX;S.my=e.touches[0].clientY;}
  },{passive:true});

  var scrollThrottle=0;
  window.addEventListener('scroll',function(){
    var now=Date.now();
    if(now-scrollThrottle>400){scrollThrottle=now;updateScrollDepth();AnchorTracker.update(true);}
  },{passive:true});

  /* Rain schedule */
  function checkRainSchedule(){
    if(!rainActive&&shouldRain()){startRain();setTimeout(stopRain,rn(25000,55000));}
    setTimeout(checkRainSchedule,rn(90000,180000));
  }

  /* Page time tracking */
  var pageLoadTime=Date.now();
  window.addEventListener('beforeunload',function(){
    Memory.onTimeSpent(Date.now()-pageLoadTime);
  });

  /* ════════════════════════════════════════════════════════
     BOOT
     ════════════════════════════════════════════════════════ */
  function boot(){
    if(!grab()){setTimeout(boot,80);return;}

    var rect=W.getBoundingClientRect();
    S.x=rect.left; S.y=rect.top;
    S.tx=S.x; S.ty=S.y;
    S.idle=Date.now();
    S.nextWander=Date.now()+rn(C.WI_MIN,C.WI_MAX);

    W.classList.add('harfo-phys');
    W.style.transform='translate('+S.x+'px,'+S.y+'px)';

    buildStars();
    setTimeOfDay();

    W.addEventListener('click',function(){spawnParticle('sp');spawnParticle('hrt');});

    PageAI.analyze();
    PageAI.reactToPage();
    ThemeSense.apply();
    AnchorTracker.update(true);
    Memory.onPageLoad();
    BrainAI.init();

    initDrag();
    initUmbDrag();
    initCtaClickTracking();

    setTimeout(function(){
      if(shouldRain()){startRain();setTimeout(stopRain,rn(25000,55000));}
      setTimeout(checkRainSchedule,rn(90000,180000));
    },4000);

    requestAnimationFrame(tick);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,50);});
  } else {
    setTimeout(boot,50);
  }

  document.addEventListener('elementor/frontend/init',function(){
    setTimeout(function(){ThemeSense.apply();PageAI.analyze();PageAI.reactToPage();BrainAI.analyzeNow();},600);
  });

})();
