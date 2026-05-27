/* ================================================================
   حرفو v7 — Page Intelligence Engine
   Page type detection · Content extraction · Summarizer · Anchors
   ================================================================ */
(function (W) {
  'use strict';

  function $(s, c)  { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ════════════════════ PAGE AI ════════════════════ */
  var PageAI = {
    d: {},

    run: function () {
      var d = this.d;
      d.url   = location.href;
      d.path  = location.pathname;
      d.title = document.title || '';

      /* WooCommerce */
      d.isWoo      = !!$('.woocommerce,.woocommerce-page');
      d.isProduct  = !!$('.single-product,.woocommerce-product-gallery,.product .price');
      d.isCart     = /cart/i.test(d.path) || !!$('.woocommerce-cart-form');
      d.isCheckout = /checkout/i.test(d.path) || !!$('.woocommerce-checkout');
      d.isShop     = /shop|store|products/i.test(d.path) || !!$('.woocommerce-products-header');

      /* Content type */
      d.isArticle  = !!$('article,.single,.post,[itemprop=articleBody],.entry-content');
      d.isHome     = d.path === '/' || /^\/?(home|index)/i.test(d.path);
      d.is404      = /404/i.test(d.title) || !!$('body.error404,.error-404');
      d.isContact  = /contact|تماس/i.test(d.title + d.path);
      d.isAbout    = /about|درباره/i.test(d.title + d.path);

      /* Style */
      try {
        var bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255,255,255];
        d.dark = (0.299*+bg[0] + 0.587*+bg[1] + 0.114*+bg[2]) / 255 < 0.5;
      } catch(e) { d.dark = false; }

      /* Content */
      var pNodes = $$('article p,.entry-content p,[itemprop=articleBody] p,main p,.post-content p');
      if (!pNodes.length) pNodes = $$('p');
      var paras = [];
      for (var i = 0; i < pNodes.length && i < 100; i++) {
        var t = (pNodes[i].innerText || '').trim();
        if (t.length > 40) paras.push(t);
      }
      d.text     = paras.join(' ');
      d.words    = d.text.split(/\s+/).filter(Boolean).length;
      d.readMin  = Math.max(1, Math.round(d.words / 220));

      d.headings = $$('article h2,article h3,.entry-content h2,.entry-content h3,main h2,main h3')
        .filter(function (h) { var t=(h.innerText||'').trim(); return t.length>2&&t.length<140; })
        .map(function (h) { return { t: h.innerText.trim(), el: h, level: +h.tagName[1] }; });

      d.hasForm     = !!$('form input:not([type=hidden])');
      d.errorFields = $$('.woocommerce-error li,input.error,input[aria-invalid=true],.has-error input');
      d.hasVideo    = !!$('video,iframe[src*="youtu"],iframe[src*="aparat"]');
      d.isProduct && (d.productTitle = (($('h1.product_title') || $('h1') || {}).innerText || '').trim().slice(0, 70));
      d.isProduct && (d.productPrice = (($('.price') || {}).innerText || '').trim().slice(0, 20));

      d.navLinks = $$('header nav a,.main-navigation a,#site-navigation a').slice(0, 20)
        .map(function (a) { return { t:(a.innerText||'').trim(), href:a.href }; })
        .filter(function (x) { return x.t.length > 1 && x.t.length < 40 && /^https?:/.test(x.href); });

      d.allLinks = $$('a[href]')
        .filter(function (a) { var t=(a.innerText||'').trim(); return t.length>2&&t.length<80&&/^https?:/.test(a.href); })
        .slice(0, 260)
        .map(function (a) { return { t:(a.innerText||'').trim(), href:a.href }; });
    },

    summarize: function (n) {
      n = n || 3;
      var text = this.d.text || '';
      if (!text) return '';
      var sents = text.replace(/\n+/g,' ')
        .split(/(?<=[\.\?\!؟])\s+(?=[^\s])/)
        .filter(function (s) { return s.length>25 && s.length<380; });
      if (sents.length <= n) return sents.join(' ');

      var stop = 'و در از به که این آن یک با را برای های می شد است بود تا یا اما نیز هم گفت کرد'.split(' ');
      var freq = {};
      sents.forEach(function (s) {
        s.toLowerCase().replace(/[^؀-ۿa-z0-9\s]/g,'').split(/\s+/).forEach(function (w) {
          if (w.length>2 && stop.indexOf(w)===-1) freq[w]=(freq[w]||0)+1;
        });
      });
      var scored = sents.map(function (s,i) {
        var sc=0;
        s.toLowerCase().replace(/[^؀-ۿa-z0-9\s]/g,'').split(/\s+/).forEach(function(w){if(freq[w])sc+=freq[w];});
        if (i===0) sc*=1.6;
        return {s:s, sc:sc/Math.sqrt(s.length+1), i:i};
      });
      scored.sort(function(a,b){return b.sc-a.sc;});
      return scored.slice(0,n).sort(function(a,b){return a.i-b.i;}).map(function(x){return x.s;}).join(' ');
    }
  };

  /* ════════════════════ MEMORY ════════════════════ */
  var STORE = 'harfo_v7_mem';
  var Memory = {
    d: { visits:0, lastAt:0, dismiss:0, helps:0, toured:{}, prefs:{}, scroll:{} },

    load: function () {
      try { var r=localStorage.getItem(STORE); if(r) this.d=Object.assign({},this.d,JSON.parse(r)); } catch(e){}
      this.d.visits=(this.d.visits||0)+1;
      this.d.lastAt=Date.now();
      this.save();
    },
    save: function () { try { localStorage.setItem(STORE,JSON.stringify(this.d)); } catch(e){} },
    hasToured: function (p) { return !!this.d.toured[p]; },
    markToured: function (p) { this.d.toured[p]=Date.now(); this.save(); },
    pref: function (k,v) {
      if (arguments.length===2) { this.d.prefs[k]=v; this.save(); }
      return this.d.prefs[k];
    },
    markScroll: function (pct) {
      var k=location.pathname;
      this.d.scroll[k]=Math.max(this.d.scroll[k]||0,pct);
      this.save();
    }
  };

  /* ════════════════════ ANCHOR SCANNER ════════════════════ */
  var Anchors = {
    scan: function () {
      var specs = [
        {s:'header,.site-header,#masthead',         k:'header'},
        {s:'.main-navigation,header nav,#site-navigation', k:'nav'},
        {s:'.site-logo,.custom-logo,header .logo',  k:'logo'},
        {s:'h1',                                    k:'h1'},
        {s:'article h2,.entry-content h2,main h2',  k:'heading'},
        {s:'.single_add_to_cart_button,.add_to_cart_button', k:'add-cart'},
        {s:'.checkout-button,a[href*="checkout"]',  k:'checkout'},
        {s:'.elementor-button,.wp-block-button__link,a.button,.cta-button', k:'cta'},
        {s:'.price,.amount',                        k:'price'},
        {s:'footer,.site-footer',                   k:'footer'}
      ];
      var found=[], seen=[];
      specs.forEach(function(spec){
        try {
          var els=document.querySelectorAll(spec.s);
          for(var i=0;i<els.length;i++){
            var el=els[i];
            if(seen.indexOf(el)>=0) continue;
            seen.push(el);
            var r=el.getBoundingClientRect();
            if(r.width<20||r.height<10) continue;
            found.push({el:el,rect:r,kind:spec.k});
          }
        }catch(e){}
      });
      return found;
    },

    spotOn: function (anchor) {
      var r=anchor.rect, cx=r.left+r.width/2-61;
      var cy = (anchor.kind==='header'||anchor.kind==='nav'||r.width>320)
        ? r.top-115 : r.top-145;
      return {
        x: Math.max(6,Math.min(window.innerWidth-128,cx)),
        y: Math.max(6,Math.min(window.innerHeight-165,cy))
      };
    },

    poseFor: function (anchor) {
      if (anchor.kind==='header'||anchor.kind==='nav'||(anchor.rect&&anchor.rect.width>320)) return 'drape';
      if (anchor.kind==='logo'||anchor.kind==='price'||anchor.kind==='heading') return 'peek';
      if (anchor.kind==='cta'||anchor.kind==='add-cart'||anchor.kind==='checkout') return 'sit';
      return 'sit';
    }
  };

  /* ════════════════════ HELPERS ════════════════════ */
  var Helpers = {
    _progEl: null,
    _tocEl:  null,

    showProgress: function () {
      if (this._progEl) return;
      var el=document.createElement('div');
      el.id='h-prog'; el.title='برگشت به بالا';
      el.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};
      document.body.appendChild(el);
      this._progEl=el;
      var update=function(){
        var max=Math.max(1,document.body.scrollHeight-window.innerHeight);
        var p=Math.min(100,Math.round((window.scrollY/max)*100));
        el.style.setProperty('--pp',p+'%'); el.dataset.p=p;
        el.classList.toggle('show',window.scrollY>220);
        Memory.markScroll(p);
      };
      window.addEventListener('scroll',update,{passive:true});
      update();
    },

    buildTOC: function () {
      var hs=PageAI.d.headings||[];
      if(hs.length<2){if(W.HarfoToast)W.HarfoToast.show('این صفحه فهرستی نداره');return;}
      var toc=document.getElementById('h-toc');
      if(!toc) return;
      toc.innerHTML='';
      var hdr=document.createElement('div');
      hdr.id='h-toc-header';
      hdr.innerHTML='<span>فهرست مطالب</span><button id="h-toc-close">×</button>';
      toc.appendChild(hdr);
      hdr.querySelector('#h-toc-close').onclick=function(){toc.classList.remove('show');};
      hs.slice(0,22).forEach(function(h){
        var a=document.createElement('a');
        a.href='#'; a.textContent=h.t;
        if(h.level===3) a.className='h3';
        a.onclick=function(e){e.preventDefault();h.el.scrollIntoView({behavior:'smooth',block:'start'});};
        toc.appendChild(a);
      });
      this._tocEl=toc;
      setTimeout(function(){toc.classList.add('show');},40);
      var upd=function(){
        var sy=window.scrollY+100,best=0;
        hs.forEach(function(h,i){if(h.el.offsetTop<=sy)best=i;});
        toc.querySelectorAll('a').forEach(function(a,i){a.classList.toggle('active',i===best);});
      };
      window.addEventListener('scroll',upd,{passive:true});
      upd();
    },

    toggleTOC: function () {
      var toc=document.getElementById('h-toc');
      if(!toc) return;
      if(!this._tocEl||!toc.children.length) { this.buildTOC(); return; }
      toc.classList.toggle('show');
    },

    summary: function () {
      var s=PageAI.summarize(3);
      if(!s){if(W.HarfoToast)W.HarfoToast.show('متن کافی پیدا نشد');return;}
      if(W.HarfoTease) W.HarfoTease.face('read',4000);
      if(W.HarfoSpeech) W.HarfoSpeech.say(s,{force:true,sticky:true,
        actions:[{label:'ممنون',fn:function(){}}]});
    },

    fontUp: function () {
      var h=document.documentElement,c=parseFloat(h.style.fontSize||getComputedStyle(h).fontSize);
      h.style.fontSize=Math.min(24,c+1.5)+'px';
      Memory.pref('font',h.style.fontSize);
      if(W.HarfoToast)W.HarfoToast.show('متن بزرگ‌تر شد');
    },
    fontDown: function () {
      var h=document.documentElement,c=parseFloat(h.style.fontSize||getComputedStyle(h).fontSize);
      h.style.fontSize=Math.max(11,c-1.5)+'px';
      Memory.pref('font',h.style.fontSize);
      if(W.HarfoToast)W.HarfoToast.show('متن کوچک‌تر شد');
    },

    toggleDark: function () {
      var html=document.documentElement;
      var on=html.classList.toggle('harfo-night');
      if(!document.getElementById('harfo-night-css')){
        var s=document.createElement('style'); s.id='harfo-night-css';
        s.textContent='html.harfo-night{filter:invert(0.92) hue-rotate(180deg)}'
          +'html.harfo-night img,html.harfo-night video,html.harfo-night canvas,'
          +'html.harfo-night #harfo-root{filter:invert(0.92) hue-rotate(180deg)}';
        document.head.appendChild(s);
      }
      Memory.pref('dark',on);
      if(W.HarfoToast)W.HarfoToast.show(on?'حالت شب روشن شد 🌙':'حالت روز روشن شد ☀️');
    },

    pointToError: function () {
      var err=document.querySelector('input.error,input[aria-invalid=true],.woocommerce-error li,.has-error input');
      if(!err){if(W.HarfoToast)W.HarfoToast.show('خطایی پیدا نشد');return;}
      var r=err.getBoundingClientRect();
      if(r.top<60||r.top>window.innerHeight-80)
        window.scrollTo({top:window.scrollY+r.top-120,behavior:'smooth'});
      setTimeout(function(){
        r=err.getBoundingClientRect();
        err.classList.add('harfo-hl');
        if(W.HarfoPhysics) W.HarfoPhysics.moveTo(r.left+r.width/2-61,r.top-148,function(){
          if(W.HarfoSpeech)W.HarfoSpeech.say('اینجا یه مشکل داره — لطفاً بررسی کن.',{force:true});
          setTimeout(function(){err.classList.remove('harfo-hl');},5000);
        });
      },500);
    },

    restorePrefs: function () {
      var f=Memory.pref('font'); if(f) document.documentElement.style.fontSize=f;
      if(Memory.pref('dark')&&!document.documentElement.classList.contains('harfo-night'))
        this.toggleDark();
    }
  };

  W.HarfoPageAI  = PageAI;
  W.HarfoMemory  = Memory;
  W.HarfoAnchors = Anchors;
  W.HarfoHelpers = Helpers;

}(window));
